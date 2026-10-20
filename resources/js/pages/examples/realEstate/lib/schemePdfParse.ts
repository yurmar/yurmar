import "@/pages/examples/realEstate/lib/iteratorShim";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { EgrnPoint } from "@/pages/examples/realEstate/lib/egrnPdfParse";

// Воркер pdf.js подключается в основной поток (globalThis.pdfjsWorker): в dev страница (Laravel :8000) и Vite (:5173)
// на разных origin, и браузер запрещает создавать Worker со скриптом с чужого origin. Для небольших PDF этого достаточно.
import "pdfjs-dist/legacy/build/pdf.worker.mjs";

export interface ParsedScheme {
    conditionalNumber: string | null;
    area: number | null;
    zone: number | null;
    points: EgrnPoint[];
    rawText: string;
}

// pdf.js поднимает разбор PDF в отдельном Web Worker и ждёт от него handshake-сообщение;
// у самого pdf.js таймаута на этот handshake нет. Если сетевой запрос за скриптом воркера
// молча зависает (не рвётся ошибкой — так ведут себя некоторые антивирусы/прокси с
// SSL-инспекцией на part-сетях), promise getDocument() виснет навсегда без единой ошибки —
// поэтому оборачиваем в таймаут сами, чтобы UI не зависал бесконечно на "Разбираем PDF…".
async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(timer!);
    }
}

// В отличие от выписки ЕГРН (см. egrnPdfParse.ts), "Схема расположения земельного участка на
// КПТ" формируется на портале Росреестра сразу с текстовым слоем (проверено вручную 2026-09-14
// на реальном файле) — поэтому координаты читаются прямым извлечением текста через pdf.js,
// без OCR.
async function extractTextLines(file: File): Promise<string[]> {
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await withTimeout(
        loadingTask.promise,
        20000,
        "Не удалось загрузить обработчик PDF за 20 секунд — похоже, сеть блокирует загрузку служебного скрипта. Проверьте подключение (VPN/прокси) и попробуйте снова."
    ).catch((e) => {
        loadingTask.destroy();
        throw e;
    });
    const lines: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        // pdf.js отдаёт текст постатейно (каждое "слово"/фрагмент — отдельный item со своими
        // координатами), а не готовыми строками — строки таблицы координат восстанавливаются
        // группировкой items по Y (с допуском в 2pt на погрешности округления шрифта) и
        // сортировкой внутри строки по X.
        const rows: { y: number; cells: { text: string; x: number }[] }[] = [];
        for (const item of content.items) {
            if (!("str" in item) || !item.str.trim()) continue;
            const y = item.transform[5];
            let row = rows.find((r) => Math.abs(r.y - y) <= 2);
            if (!row) {
                row = { y, cells: [] };
                rows.push(row);
            }
            row.cells.push({ text: item.str, x: item.transform[4] });
        }

        // В координатах PDF Y растёт снизу вверх — сортируем по убыванию, чтобы строки шли
        // в порядке чтения (сверху вниз), как на странице.
        rows.sort((a, b) => b.y - a.y);
        for (const row of rows) {
            row.cells.sort((a, b) => a.x - b.x);
            lines.push(row.cells.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim());
        }
    }

    return lines.filter(Boolean);
}

// Строка таблицы координат: "<№ точки> <X> <Y>". Строка нумерации столбцов ("1 2 3") и другие
// служебные строки естественным образом не проходят по длине чисел (X и Y — координаты в метрах
// с дробной частью, минимум 4 значащих цифры), поэтому отдельный список "стоп-слов" не нужен.
const ROW_RE = /^(\d{1,3})\s+(\d{4,6}(?:[.,]\d{1,2})?)\s+(\d{6,7}(?:[.,]\d{1,2})?)$/;

export async function parseSchemePdf(file: File): Promise<ParsedScheme> {
    const lines = await extractTextLines(file);
    const fullText = lines.join("\n");

    const condMatch = fullText.match(/Условный номер[^:]*:\s*(\S+)/i);
    const conditionalNumber = condMatch
        ? condMatch[1].replace(/[.,;]+$/, "")
        : fullText.match(/\d{2}:\d{2}:\d{6,7}:(?:ЗУ)?\d{1,10}/)?.[0] ?? null;

    const areaMatch = fullText.match(/Площадь земельного участка:\s*([\d\s]+(?:[.,]\d+)?)\s*кв/i);
    const area = areaMatch ? parseFloat(areaMatch[1].replace(/\s/g, "").replace(",", ".")) : null;

    const zoneMatch = fullText.match(/зон[аы]\D{0,10}(\d{1,2})/i);
    const parsedZone = zoneMatch ? parseInt(zoneMatch[1], 10) : null;
    const zone = parsedZone && parsedZone >= 1 && parsedZone <= 8 ? parsedZone : 3;

    const yMin = zone * 1_000_000;
    const yMax = yMin + 1_000_000;

    const points: EgrnPoint[] = [];
    for (const line of lines) {
        const m = line.match(ROW_RE);
        if (!m) continue;
        const x = parseFloat(m[2].replace(",", "."));
        const y = parseFloat(m[3].replace(",", "."));
        if (y < yMin || y >= yMax) continue;
        points.push({ num: m[1], x, y });
    }

    // Схема, как и выписка ЕГРН, замыкает контур повтором первой точки последней строкой —
    // сохраняем этой точке номер первой, а не сквозной порядковый.
    if (points.length > 1) {
        const first = points[0];
        const last = points[points.length - 1];
        if (Math.abs(last.x - first.x) < 0.05 && Math.abs(last.y - first.y) < 0.05) {
            last.num = first.num;
        }
    }

    return { conditionalNumber, area, zone, points, rawText: fullText };
}
