import "@/pages/examples/realEstate/lib/iteratorShim";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker, PSM, type Page } from "tesseract.js";

// Воркер pdf.js подключается в основной поток (globalThis.pdfjsWorker): в dev страница (Laravel :8000) и Vite (:5173)
// на разных origin, и браузер запрещает создавать Worker со скриптом с чужого origin. Для небольших PDF этого достаточно.
import "pdfjs-dist/legacy/build/pdf.worker.mjs";

export interface EgrnPoint {
    num: string;
    x: number;
    y: number;
}

export interface EgrnContour {
    // Кадастровый номер участка либо учётный номер части ("38:06:100101:4580/1").
    cadastralNumber: string | null;
    points: EgrnPoint[];
}

export interface ParsedEgrn {
    cadastralNumber: string | null;
    zone: number | null;
    points: EgrnPoint[];
    // Основной контур + части участка (отдельные листы выписки со своей таблицей координат).
    contours: EgrnContour[];
    rawText: string;
}

// Выписки ЕГРН, выгружаемые с ЭП Росреестра, зачастую представляют собой отрисованный
// в PDF образ страницы без текстового слоя (проверено 2026-09-14: pdftotext/pdffonts на
// реальном файле не находят ни одного шрифта) — поэтому текст можно получить только через OCR,
// а не прямым извлечением текстового слоя pdf.js.
// scale=4 ≈ 300dpi (страница PDF рендерится в 72dpi при scale=1) — на этом разрешении
// распознавание таблицы координат протестировано вручную (2026-09-14) и даёт точное совпадение
// со всеми точками реального файла выписки ЕГРН.
export async function renderPdfPageToCanvas(file: File, pageNumber = 1, scale = 4): Promise<HTMLCanvasElement> {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Не удалось получить контекст canvas");

    await page.render({ canvasContext: context, viewport, canvas }).promise;
    binarizeCanvas(canvas);
    return canvas;
}

// pdf.js рисует текст сглаженным (цветной antialiasing), из-за чего тонкие штрихи цифр
// выходят серыми полутонами — Tesseract на таком изображении иногда полностью теряет
// отдельные строки таблицы (проверено на реальном файле 2026-09-14: пропадала случайная
// строка координат). Жёсткая чёрно-белая бинаризация по порогу яркости убирает серый ореол
// вокруг символов и заметно повышает устойчивость распознавания на подобных сканах.
function binarizeCanvas(canvas: HTMLCanvasElement, threshold = 180): void {
    const context = canvas.getContext("2d");
    if (!context) return;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const value = gray < threshold ? 0 : 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
    }
    context.putImageData(imageData, 0, 0);
}

export async function ocrPage(canvas: HTMLCanvasElement, onProgress?: (progress: number) => void): Promise<Page> {
    const worker = await createWorker("rus", 1, {
        logger: (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text" && onProgress) onProgress(m.progress);
        },
    });
    try {
        // Одна плоская таблица без сложной многоколоночной вёрстки — принудительный режим
        // сегментации "единый блок текста" надёжнее автоматического (PSM.AUTO), который иногда
        // ошибочно классифицирует часть строки как графику из-за рамок таблицы и теряет её.
        await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
        // Запрашиваем результат вместе с координатами (bbox) каждого слова: разбор по позиции
        // слова на строке (см. extractCoordinateRows) намного устойчивее к точечным ошибкам OCR
        // внутри чисел, чем разбор одного сплошного текста регулярками.
        const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true });
        return data;
    } finally {
        await worker.terminate();
    }
}

interface WordBox {
    text: string;
    x0: number;
    x1: number;
}

function collectLines(page: Page): { words: WordBox[] }[] {
    const lines: { words: WordBox[] }[] = [];
    for (const block of page.blocks ?? []) {
        for (const paragraph of block.paragraphs ?? []) {
            for (const line of paragraph.lines ?? []) {
                lines.push({ words: line.words.map((w) => ({ text: w.text, x0: w.bbox.x0, x1: w.bbox.x1 })) });
            }
        }
    }
    return lines;
}

// OCR иногда рвёт одно число лишним пробелом на два "слова" (3350931.8 -> "335093" + "1.8") —
// разрыв между ними по X на порядок меньше, чем настоящий промежуток между столбцами таблицы
// (проверено на реальном файле 2026-09-14: ~8px против ~55-120px при рендере scale=4). Поэтому
// слова строки группируются в ячейки таблицы по физическому разрыву между ними, а не по смыслу —
// это восстанавливает и такие разорванные числа, и обычные слипшиеся (без десятичной точки).
function groupWordsIntoCells(words: WordBox[], gapThreshold = 35): string[] {
    const sorted = [...words].sort((a, b) => a.x0 - b.x0);
    const cells: string[] = [];
    let current = "";
    let prevX1: number | null = null;
    for (const w of sorted) {
        if (prevX1 !== null && w.x0 - prevX1 > gapThreshold && current) {
            cells.push(current);
            current = "";
        }
        current += w.text;
        prevX1 = w.x1;
    }
    if (current) cells.push(current);
    return cells;
}

// Ячейка может прийти уже с десятичным разделителем (413971.13) либо слипшейся в одну цифровую
// последовательность без него (4139439 вместо 413943.9) — во втором случае пробуем восстановить
// дробную часть (1 или 2 знака) и принимаем результат, только если он попал в ожидаемый диапазон.
function parseCoordinateCell(cellText: string, min: number, max: number): number | null {
    const cleaned = cellText.replace(/,/g, ".").replace(/[^\d.]/g, "");
    const direct = parseFloat(cleaned);
    if (!Number.isNaN(direct) && direct >= min && direct < max) return direct;

    const digitsOnly = cleaned.replace(/\./g, "");
    for (const fracLen of [1, 2]) {
        if (digitsOnly.length <= fracLen) continue;
        const candidate = parseFloat(`${digitsOnly.slice(0, -fracLen)}.${digitsOnly.slice(-fracLen)}`);
        if (candidate >= min && candidate < max) return candidate;
    }
    return null;
}

// Строкой таблицы координат считается любая строка, где после группировки слов в ячейки нашлась
// хотя бы одна ячейка с достаточным количеством цифр (номер точки и колонка погрешности всегда
// короче и в кандидаты не попадают). Из таких ячеек первые две слева направо — это X и Y: порядок
// столбцов в выписке ЕГРН фиксирован, а колонка "Номер точки" на практике то распознаётся, то нет,
// поэтому опираться на неё как на якорь ненадёжно. X и Y всегда добавляются парой за одну строку,
// даже если одна из сторон не распозналась (тогда она остаётся 0 для ручной правки) — иначе
// рассинхронизация по длине сдвинула бы пары для всех последующих строк.
function extractCoordinateRows(page: Page, yMin: number, yMax: number): { x: number; y: number }[] {
    const rows: { x: number; y: number }[] = [];

    for (const line of collectLines(page)) {
        const cells = groupWordsIntoCells(line.words);
        const numericCells = cells.filter((c) => (c.match(/\d/g) ?? []).length >= 4);
        if (numericCells.length === 0) continue;

        const x = numericCells[0] !== undefined ? parseCoordinateCell(numericCells[0], 1000, yMin) : null;
        const y = numericCells[1] !== undefined ? parseCoordinateCell(numericCells[1], yMin, yMax) : null;
        if (x === null && y === null) continue;

        rows.push({ x: x ?? 0, y: y ?? 0 });
    }

    return rows;
}

function detectZone(text: string): number {
    const zoneMatch = text.match(/зон[аы]\D{0,6}(\d{1,2})/i);
    const parsedZone = zoneMatch ? parseInt(zoneMatch[1], 10) : null;
    return parsedZone && parsedZone >= 1 && parsedZone <= 8 ? parsedZone : 3;
}

function findCadastralNumber(text: string): string | null {
    const m = text.match(/\d{2}[:.]\d{2}[:.]\d{6,7}[:.]\d{1,10}/);
    return m ? m[0].replace(/\./g, ":") : null;
}

// Выписка ЕГРН всегда замыкает контур повтором первой точки последней строкой — у неё в
// файле стоит тот же номер, что и у первой (не следующий по порядку), сохраняем это же
// соответствие, а не сквозную нумерацию.
function rowsToPoints(rows: { x: number; y: number }[]): EgrnPoint[] {
    const points: EgrnPoint[] = rows.map((r, i) => ({ num: String(i + 1), x: r.x, y: r.y }));
    if (points.length > 1) {
        const first = points[0];
        const last = points[points.length - 1];
        if (Math.abs(last.x - first.x) < 0.05 && Math.abs(last.y - first.y) < 0.05) {
            last.num = first.num;
        }
    }
    return points;
}

// Разбирает результат OCR листа "Описание местоположения земельного участка —
// Сведения о характерных точках границы" выписки ЕГРН.
export function parseEgrnOcrText(page: Page): ParsedEgrn {
    const text = page.text;
    const zone = detectZone(text);
    const yMin = zone * 1_000_000;
    const rows = extractCoordinateRows(page, yMin, yMin + 1_000_000);
    const points = rowsToPoints(rows);
    const cadastralNumber = findCadastralNumber(text);
    return { cadastralNumber, zone, points, contours: [{ cadastralNumber, points }], rawText: text };
}

// Выписки, скачанные с ЭП Росреестра как полный документ (несколько листов), содержат текстовый
// слой. Тогда кадастровый номер берётся с 1-го листа, а координаты — с листа "Сведения о
// характерных точках границы земельного участка" (раздел 4), который может стоять где угодно;
// листы про границы ЧАСТЕЙ участка ("...границы части (частей)...") пропускаются.
// Возвращает null, если текстового слоя нет (скан) — тогда работает OCR первого листа.
export async function parseEgrnTextLayer(file: File): Promise<ParsedEgrn | null> {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    const pageTexts: string[] = [];
    const pageLines: string[][][] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
        const content = await (await pdf.getPage(n)).getTextContent();
        const items = content.items
            .filter((it): it is Extract<typeof it, { str: string }> => "str" in it && it.str.trim() !== "")
            .map((it) => ({ str: it.str.trim(), x: it.transform[4] as number, y: it.transform[5] as number }));
        items.sort((a, b) => b.y - a.y || a.x - b.x);
        const lines: { y: number; cells: { str: string; x: number }[] }[] = [];
        for (const it of items) {
            const line = lines.find((l) => Math.abs(l.y - it.y) < 3);
            if (line) line.cells.push(it);
            else lines.push({ y: it.y, cells: [it] });
        }
        const sortedLines = lines.map((l) => l.cells.sort((a, b) => a.x - b.x).map((c) => c.str));
        pageLines.push(sortedLines);
        pageTexts.push(sortedLines.map((l) => l.join(" ")).join("\n"));
    }

    const fullText = pageTexts.join("\n");
    if (fullText.replace(/\s/g, "").length < 200) return null;

    const cadastralNumber = findCadastralNumber(pageTexts[0] ?? fullText);
    const mainIdx = pageTexts.findIndex((t) => /характерных\s+точках\s+границы\s+земельного\s+участка/i.test(t));
    if (mainIdx < 0) return { cadastralNumber, zone: 3, points: [], contours: [], rawText: fullText };

    const zone = detectZone(pageTexts[mainIdx]);
    const yMin = zone * 1_000_000;
    const readPoints = (cellsByLine: string[][]): EgrnPoint[] => {
        const rows: { x: number; y: number }[] = [];
        for (const cells of cellsByLine) {
            const numeric = cells.filter((c) => /^\d+[.,]?\d*$/.test(c) && (c.match(/\d/g) ?? []).length >= 4);
            if (numeric.length < 2) continue;
            const x = parseCoordinateCell(numeric[0], 1000, yMin);
            const y = parseCoordinateCell(numeric[1], yMin, yMin + 1_000_000);
            if (x !== null && y !== null) rows.push({ x, y });
        }
        return rowsToPoints(rows);
    };

    const contours: EgrnContour[] = [{ cadastralNumber, points: readPoints(pageLines[mainIdx]) }];
    // Листы "Сведения о характерных точках границы части (частей) земельного участка" — у каждой
    // части свой учётный номер и своя таблица; зона на таком листе не указана, берём основную.
    pageTexts.forEach((t, i) => {
        if (!/характерных\s+точках\s+границы\s+части/i.test(t)) return;
        const partNumber = t.match(/Учетный\s+номер\s+части\s*:\s*(\S+)/i)?.[1] ?? null;
        const points = readPoints(pageLines[i]);
        if (points.length > 0) contours.push({ cadastralNumber: partNumber, points });
    });

    return { cadastralNumber, zone, points: contours[0].points, contours, rawText: pageTexts[mainIdx] };
}

// Черновой текстовый формат — до получения от пользователя точной спецификации .met для
// ГИС Панорама. Формат: заголовок-комментарии (#) + строки "Номер;X;Y".
export function buildMetContent(points: EgrnPoint[]): string {
    const first = points[0];
    const last = points[points.length - 1];
    const closed = first && last && (first.x !== last.x || first.y !== last.y) ? [...points, first] : points;
    const lines = [
        "MET",
        "BEGIN",
        "X Y",
        "#",
        ...closed.map((p) => `${p.x} ${p.y}`),
        "END",
    ];
    return lines.join("\r\n") + "\r\n";
}

export function metFileName(cadastralNumber: string | null): string {
    const base = (cadastralNumber || "uchastok").replace(/[^0-9A-Za-zА-Яа-яЁё]/g, "-");
    return `${base}.met`;
}

export function downloadTextFile(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
