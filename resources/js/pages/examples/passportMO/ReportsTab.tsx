import { useRef, useState } from 'react'
import { Download, FileText, Search, Trash2, Upload, X } from 'lucide-react'
import type { Passport, ReportFile } from './data'
import { BTN_DANGER_ICON, BTN_ICON, CardBlock, DataTable, FIELD, fileExt, fmtSize, type Column } from './ui'

export default function ReportsTab({ p, setP, notify }: { p: Passport; setP: (f: (p: Passport) => Passport) => void; notify: (t: string) => void }) {
    const [query, setQuery] = useState('')
    const [drag, setDrag] = useState(false)
    const input = useRef<HTMLInputElement>(null)
    const visible = p.reports.filter(r => r.name.toLowerCase().includes(query.trim().toLowerCase()))

    const add = (files: File[]): void => {
        if (files.length === 0) return
        setP(prev => ({ ...prev, reports: [...files.map((f, i): ReportFile => ({ file_id: Date.now() + i, name: f.name, size: f.size })), ...prev.reports] }))
        notify(`Добавлено файлов: ${files.length} (демо — файлы никуда не отправляются)`)
    }

    const columns: Column<ReportFile>[] = [
        { key: 'name', header: 'Документ', sortValue: r => r.name, render: r => (
            <span className="flex min-w-0 max-w-[28rem] items-center gap-2"><FileText size={16} className="flex-shrink-0 text-sky-500" aria-hidden /><span className="truncate font-medium">{r.name}</span></span>
        ) },
        { key: 'type', header: 'Тип', sortValue: r => fileExt(r.name), render: r => <span className="rounded-md border border-border bg-foreground/5 px-2 py-0.5 text-xs font-semibold">{fileExt(r.name)}</span> },
        { key: 'size', header: 'Размер', align: 'right', sortValue: r => r.size, render: r => fmtSize(r.size) },
        { key: 'actions', header: 'Действия', align: 'right', render: r => (
            <div className="flex items-center justify-end gap-2">
                <button type="button" className={BTN_ICON} title="Скачать" aria-label="Скачать" onClick={() => notify(`Демо: «${r.name}» не скачивается — реальных файлов в примере нет`)}><Download size={15} /></button>
                <button type="button" className={BTN_DANGER_ICON} title="Удалить" aria-label="Удалить" onClick={() => { setP(prev => ({ ...prev, reports: prev.reports.filter(x => x.file_id !== r.file_id) })); notify('Отчёт удалён') }}><Trash2 size={15} /></button>
            </div>
        ) },
    ]

    return (
        <CardBlock title="Отчёты руководителей" icon={FileText} bg>
            <div
                className={`mb-4 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${drag ? 'border-sky-500 bg-sky-500/5' : 'border-border hover:border-sky-500/50'}`}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); add(Array.from(e.dataTransfer.files)) }}
                onClick={() => input.current?.click()}
            >
                <Upload size={28} className={`mx-auto mb-2 ${drag ? 'text-sky-500' : 'text-muted-foreground'}`} aria-hidden />
                <p className="text-sm">Перетащите файлы сюда или <span className="text-sky-500">выберите на компьютере</span></p>
                <p className="mt-1 text-xs text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG · в демо файлы остаются в браузере</p>
                <input ref={input} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={e => { add(Array.from(e.target.files ?? [])); e.target.value = '' }} />
            </div>

            {p.reports.length > 0 && (
                <div className="relative mb-4 max-w-md">
                    <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по названию документа..." className={`${FIELD} pl-10 pr-10`} />
                    {query && <button type="button" aria-label="Очистить поиск" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-foreground/10"><X size={14} /></button>}
                </div>
            )}
            <DataTable rows={visible} columns={columns} rowKey={r => r.file_id} defaultSort={{ key: 'name', dir: 'asc' }} empty={p.reports.length === 0 ? 'Нет загруженных отчётов' : 'По запросу ничего не найдено'} />
        </CardBlock>
    )
}
