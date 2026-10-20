// pdfjs-dist (6.x) при загрузке модуля безусловно выполняет
// `if (typeof Iterator.prototype.join !== "function")` — на движках без поддержки
// предложения Iterator Helpers (глобального `Iterator` нет вообще, например старые
// Safari/Chrome и многие WebView) это падает с `ReferenceError: Iterator is not defined`
// ещё до того, как typeof успевает сработать (обращение к `.prototype` неопределённого
// идентификатора кидает исключение раньше, чем typeof его перехватит). Ошибка ловится на
// этапе импорта модуля — до рендера React, поэтому всё приложение оставалось пустым экраном.
// Подставляем no-op заглушку ДО импорта pdfjs-dist, чтобы её внутренний feature-detect
// не падал; реальная поддержка Iterator Helpers самому pdf.js для рендеринга не нужна.
if (typeof (globalThis as { Iterator?: unknown }).Iterator === "undefined") {
    (globalThis as { Iterator?: unknown }).Iterator = class IteratorStub {};
}

// pdf.js (getTextContent, см. schemePdfParse.ts) читает поток командой `for await (const value
// of readableStream)`, что требует ReadableStream.prototype[Symbol.asyncIterator] — в той же
// Safari, где отсутствовал глобальный Iterator, отсутствует и он (ошибка в проде 2026-09-14:
// "undefined is not a function (near '...value of readableStream...')"). Реализуем через
// стандартный getReader(), которым ReadableStream поддерживается везде.
// pdf.js (6.x) использует `Promise.withResolvers()` (ES2024) в собственном внутреннем
// PromiseCapability — метод отсутствует в браузерах старее ~2024 года (например, некоторых
// сборках Yandex Browser), падает с `Promise.withResolvers is not a function` прямо при
// импорте модуля модалки импорта. Полифил — стандартная реализация из спецификации.
if (typeof (Promise as unknown as { withResolvers?: unknown }).withResolvers !== "function") {
    (Promise as unknown as { withResolvers: <T>() => { promise: Promise<T>; resolve: (value: T | PromiseLike<T>) => void; reject: (reason?: unknown) => void } }).withResolvers = function <T>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: unknown) => void;
        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

if (typeof ReadableStream !== "undefined" && !(ReadableStream.prototype as unknown as Record<symbol, unknown>)[Symbol.asyncIterator]) {
    (ReadableStream.prototype as unknown as Record<symbol, unknown>)[Symbol.asyncIterator] = function (this: ReadableStream) {
        const reader = this.getReader();
        return {
            next: () => reader.read(),
            return: (value?: unknown) => {
                reader.releaseLock();
                return Promise.resolve({ done: true, value });
            },
            [Symbol.asyncIterator]() {
                return this;
            },
        };
    };
}
