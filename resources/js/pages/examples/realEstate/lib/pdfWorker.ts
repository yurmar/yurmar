// Воркер pdf.js стартует в отдельном глобальном контексте — полифилы из основного потока
// (iteratorShim) до него не доходят, а сам воркер использует Promise.withResolvers и др.
// Поэтому подставляем полифилы здесь, до загрузки pdf.worker.
import "@/pages/examples/realEstate/lib/iteratorShim";
import "pdfjs-dist/legacy/build/pdf.worker.mjs";
