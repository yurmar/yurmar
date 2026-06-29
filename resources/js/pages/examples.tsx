import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, FolderOpen, ArrowLeft, ExternalLink, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import {
    apiGetFolders, apiGetExamples,
    apiCreateFolder, apiUpdateFolder, apiDeleteFolder,
    apiCreateExample, apiUpdateExample, apiDeleteExample,
    ExampleFolder, ExampleItem,
} from '@/api/examples'
import Modal from '@/components/ui/Modal'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

const FOLDER_FIELDS = [
    { key: 'name', label: 'Название', type: 'text' as const },
    { key: 'description', label: 'Описание', type: 'text' as const },
    { key: 'icon', label: 'Иконка (эмодзи)', type: 'text' as const, placeholder: '🎨' },
    { key: 'color', label: 'Цвет (sky/purple/emerald/amber/rose/indigo)', type: 'text' as const, placeholder: 'sky' },
    { key: 'sort_order', label: 'Порядок', type: 'text' as const },
]

const EXAMPLE_FIELDS = [
    { key: 'title', label: 'Название', type: 'text' as const },
    { key: 'tags', label: 'Теги / стек', type: 'text' as const, placeholder: 'React, Laravel' },
    { key: 'description', label: 'Описание', type: 'textarea' as const },
    { key: 'screenshot_path', label: 'Путь к скриншоту', type: 'text' as const, placeholder: '/images/example.jpg' },
    { key: 'url', label: 'URL', type: 'url' as const },
    { key: 'sort_order', label: 'Порядок', type: 'text' as const },
]

const COLOR_MAP: Record<string, { card: string; badge: string; text: string }> = {
    sky:    { card: 'from-sky-500/15 to-sky-600/5 border-sky-500/25',    badge: 'bg-sky-500/15 text-sky-400',    text: 'text-sky-400' },
    purple: { card: 'from-purple-500/15 to-purple-600/5 border-purple-500/25', badge: 'bg-purple-500/15 text-purple-400', text: 'text-purple-400' },
    emerald:{ card: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/25', badge: 'bg-emerald-500/15 text-emerald-400', text: 'text-emerald-400' },
    amber:  { card: 'from-amber-500/15 to-amber-600/5 border-amber-500/25',  badge: 'bg-amber-500/15 text-amber-400',  text: 'text-amber-400' },
    rose:   { card: 'from-rose-500/15 to-rose-600/5 border-rose-500/25',    badge: 'bg-rose-500/15 text-rose-400',    text: 'text-rose-400' },
    indigo: { card: 'from-indigo-500/15 to-indigo-600/5 border-indigo-500/25', badge: 'bg-indigo-500/15 text-indigo-400', text: 'text-indigo-400' },
}

function folderTheme(color: string | null) {
    return COLOR_MAP[color ?? ''] ?? COLOR_MAP['sky']
}

export default function Examples() {
    const { folderId } = useParams<{ folderId?: string }>()
    const navigate = useNavigate()
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)

    const [folders, setFolders] = useState<ExampleFolder[]>([])
    const [examples, setExamples] = useState<ExampleItem[]>([])
    const [activeFolder, setActiveFolder] = useState<ExampleFolder | null>(null)

    const [folderModal, setFolderModal] = useState(false)
    const [editingFolder, setEditingFolder] = useState<ExampleFolder | null>(null)
    const [folderForm, setFolderForm] = useState<Record<string, string>>({})

    const [exampleModal, setExampleModal] = useState(false)
    const [editingExample, setEditingExample] = useState<ExampleItem | null>(null)
    const [exampleForm, setExampleForm] = useState<Record<string, string>>({})

    const [saving, setSaving] = useState(false)

    useEffect(() => {
        apiGetFolders().then(r => {
            setFolders(r.data)
            if (folderId) {
                const found = r.data.find(f => f.id === Number(folderId))
                if (found) setActiveFolder(found)
            }
        }).catch(() => {})
    }, [])

    useEffect(() => {
        if (folderId) {
            const found = folders.find(f => f.id === Number(folderId))
            setActiveFolder(found ?? null)
            if (found) {
                apiGetExamples(found.id).then(r => setExamples(r.data)).catch(() => {})
            }
        } else {
            setActiveFolder(null)
            setExamples([])
        }
    }, [folderId, folders])

    const selectFolder = (folder: ExampleFolder) => {
        navigate(`/examples/${folder.id}`)
    }

    // Folder CRUD
    const openCreateFolder = () => {
        setEditingFolder(null)
        setFolderForm({ name: '', description: '', icon: '', color: 'sky', sort_order: String(folders.length) })
        setFolderModal(true)
    }

    const openEditFolder = (folder: ExampleFolder, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingFolder(folder)
        setFolderForm({
            name: folder.name,
            description: folder.description ?? '',
            icon: folder.icon ?? '',
            color: folder.color ?? 'sky',
            sort_order: String(folder.sort_order),
        })
        setFolderModal(true)
    }

    const handleSaveFolder = async () => {
        setSaving(true)
        try {
            const payload = { ...folderForm, sort_order: Number(folderForm.sort_order) }
            if (editingFolder) {
                const r = await apiUpdateFolder(editingFolder.id, payload)
                setFolders(prev => prev.map(f => f.id === editingFolder.id ? r.data : f))
                if (activeFolder?.id === editingFolder.id) setActiveFolder(r.data)
            } else {
                const r = await apiCreateFolder(payload as any)
                setFolders(prev => [...prev, r.data])
            }
            setFolderModal(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteFolder = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation()
        await apiDeleteFolder(id)
        setFolders(prev => prev.filter(f => f.id !== id))
        if (activeFolder?.id === id) navigate('/examples')
    }

    // Example CRUD
    const openCreateExample = () => {
        setEditingExample(null)
        setExampleForm({ title: '', tags: '', description: '', screenshot_path: '', url: '', sort_order: String(examples.length) })
        setExampleModal(true)
    }

    const openEditExample = (item: ExampleItem) => {
        setEditingExample(item)
        setExampleForm({
            title: item.title,
            tags: item.tags ?? '',
            description: item.description ?? '',
            screenshot_path: item.screenshot_path ?? '',
            url: item.url ?? '',
            sort_order: String(item.sort_order),
        })
        setExampleModal(true)
    }

    const handleSaveExample = async () => {
        if (!activeFolder) return
        setSaving(true)
        try {
            const payload = { ...exampleForm, sort_order: Number(exampleForm.sort_order) }
            if (editingExample) {
                const r = await apiUpdateExample(activeFolder.id, editingExample.id, payload)
                setExamples(prev => prev.map(e => e.id === editingExample.id ? r.data : e))
            } else {
                const r = await apiCreateExample(activeFolder.id, payload as any)
                setExamples(prev => [...prev, r.data])
            }
            setExampleModal(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteExample = async (id: number) => {
        if (!activeFolder) return
        await apiDeleteExample(activeFolder.id, id)
        setExamples(prev => prev.filter(e => e.id !== id))
    }

    const theme = folderTheme(activeFolder?.color ?? null)

    return (
        <div className="pt-20 min-h-screen">
            <div className="max-w-6xl mx-auto px-4 py-12">

                {/* Breadcrumb */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
                >
                    <Link to="/#examples" className="hover:text-foreground transition-colors">Главная</Link>
                    <ChevronRight size={14} />
                    <Link to="/examples" className={`transition-colors ${!activeFolder ? 'text-foreground font-medium' : 'hover:text-foreground'}`}>
                        Примеры
                    </Link>
                    {activeFolder && (
                        <>
                            <ChevronRight size={14} />
                            <span className={`font-medium ${theme.text}`}>{activeFolder.name}</span>
                        </>
                    )}
                </motion.div>

                {!activeFolder ? (
                    /* ── Список папок ── */
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-end justify-between mb-10"
                        >
                            <div>
                                <p className="text-sky-400 text-sm font-medium tracking-widest uppercase mb-2">Портфолио</p>
                                <h1 className="text-4xl md:text-5xl font-bold">Примеры работ</h1>
                                <p className="text-muted-foreground mt-3">Выберите категорию</p>
                            </div>
                            {isAuth && (
                                <button
                                    onClick={openCreateFolder}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                                >
                                    <Plus size={12} /> Папка
                                </button>
                            )}
                        </motion.div>

                        {folders.length === 0 ? (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-center py-24">
                                Скоро будет информация
                            </motion.p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                <AnimatePresence>
                                    {folders.map((folder, i) => {
                                        const t = folderTheme(folder.color)
                                        return (
                                            <motion.div
                                                key={folder.id}
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: i * 0.07, duration: 0.4 }}
                                                whileHover={{ y: -4 }}
                                                className="relative group cursor-pointer"
                                                onClick={() => selectFolder(folder)}
                                            >
                                                <div className={`flex flex-col gap-3 p-5 rounded-2xl bg-gradient-to-br border card-block transition-all ${t.card}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${t.badge}`}>
                                                            {folder.icon || <Folder size={20} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-sm truncate">{folder.name}</h3>
                                                        </div>
                                                        <ChevronRight size={15} className="opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
                                                    </div>
                                                    {folder.description && (
                                                        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{folder.description}</p>
                                                    )}
                                                </div>

                                                {isAuth && (
                                                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                        <button onClick={e => openEditFolder(folder, e)} className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white">
                                                            <Pencil size={11} />
                                                        </button>
                                                        <button onClick={e => handleDeleteFolder(folder.id, e)} className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white">
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                ) : (
                    /* ── Содержимое папки ── */
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between mb-10"
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/examples')}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                                    aria-label="Назад"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        {activeFolder.icon && <span className="text-2xl">{activeFolder.icon}</span>}
                                        <h1 className="text-3xl md:text-4xl font-bold">{activeFolder.name}</h1>
                                    </div>
                                    {activeFolder.description && (
                                        <p className="text-muted-foreground text-sm mt-1">{activeFolder.description}</p>
                                    )}
                                </div>
                            </div>
                            {isAuth && (
                                <button
                                    onClick={openCreateExample}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                                >
                                    <Plus size={12} /> Добавить
                                </button>
                            )}
                        </motion.div>

                        {examples.length === 0 ? (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-center py-24">
                                В этой папке пока нет примеров
                            </motion.p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {examples.map((item, i) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.07, duration: 0.4 }}
                                            whileHover={{ y: -5 }}
                                            className="relative group card-block rounded-2xl overflow-hidden"
                                        >
                                            <div className="relative h-44 bg-gradient-to-br from-sky-900/20 to-purple-900/20 overflow-hidden">
                                                {item.screenshot_path ? (
                                                    <img src={item.screenshot_path} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-5xl font-bold text-white/10">{item.title[0]}</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                {isAuth && (
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEditExample(item)} className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white"><Pencil size={12} /></button>
                                                        <button onClick={() => handleDeleteExample(item.id)} className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white"><Trash2 size={12} /></button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-5">
                                                <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                                                {item.tags && (
                                                    <p className={`text-xs font-medium mb-2 ${theme.text}`}>{item.tags}</p>
                                                )}
                                                {item.description && (
                                                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">{item.description}</p>
                                                )}
                                                {item.url && (
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
                                                    >
                                                        Подробнее <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Modal open={folderModal} title={editingFolder ? 'Редактировать папку' : 'Новая папка'} fields={FOLDER_FIELDS} values={folderForm} onChange={(k, v) => setFolderForm(p => ({ ...p, [k]: v }))} onSave={handleSaveFolder} onClose={() => setFolderModal(false)} saving={saving} />
            <Modal open={exampleModal} title={editingExample ? 'Редактировать пример' : 'Добавить пример'} fields={EXAMPLE_FIELDS} values={exampleForm} onChange={(k, v) => setExampleForm(p => ({ ...p, [k]: v }))} onSave={handleSaveExample} onClose={() => setExampleModal(false)} saving={saving} />
        </div>
    )
}
