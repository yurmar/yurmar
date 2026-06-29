import { useEffect, useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Folder, FolderOpen, Plus, Pencil, Trash2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiGetFolders, apiCreateFolder, apiUpdateFolder, apiDeleteFolder, ExampleFolder } from '@/api/examples'
import Modal from '@/components/ui/Modal'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

const FOLDER_FIELDS = [
    { key: 'name', label: 'Название', type: 'text' as const },
    { key: 'description', label: 'Описание', type: 'text' as const },
    { key: 'icon', label: 'Иконка (эмодзи)', type: 'text' as const, placeholder: '🎨' },
    { key: 'color', label: 'Цвет (Tailwind-класс)', type: 'text' as const, placeholder: 'sky' },
    { key: 'sort_order', label: 'Порядок', type: 'text' as const },
]

const COLOR_MAP: Record<string, string> = {
    sky:    'from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    emerald:'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    amber:  'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    rose:   'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
    indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400',
}

function folderColors(color: string | null) {
    return COLOR_MAP[color ?? ''] ?? COLOR_MAP['sky']
}

export default function ExamplesSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.2 })
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const [folders, setFolders] = useState<ExampleFolder[]>([])
    const [modal, setModal] = useState(false)
    const [editing, setEditing] = useState<ExampleFolder | null>(null)
    const [form, setForm] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [hovered, setHovered] = useState<number | null>(null)

    useEffect(() => {
        apiGetFolders().then(r => setFolders(r.data)).catch(() => {})
    }, [])

    const openCreate = () => {
        setEditing(null)
        setForm({ name: '', description: '', icon: '', color: 'sky', sort_order: String(folders.length) })
        setModal(true)
    }

    const openEdit = (folder: ExampleFolder) => {
        setEditing(folder)
        setForm({
            name: folder.name,
            description: folder.description ?? '',
            icon: folder.icon ?? '',
            color: folder.color ?? 'sky',
            sort_order: String(folder.sort_order),
        })
        setModal(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = { ...form, sort_order: Number(form.sort_order) }
            if (editing) {
                const r = await apiUpdateFolder(editing.id, payload)
                setFolders(prev => prev.map(f => f.id === editing.id ? r.data : f))
            } else {
                const r = await apiCreateFolder(payload as any)
                setFolders(prev => [...prev, r.data])
            }
            setModal(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        await apiDeleteFolder(id)
        setFolders(prev => prev.filter(f => f.id !== id))
    }

    return (
        <section id="examples" ref={ref} className="py-24 px-4 section-alt">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="flex items-center justify-between mb-12"
                >
                    <div>
                        <p className="text-sky-400 text-sm font-medium tracking-widest uppercase mb-2">Работы</p>
                        <h2 className="text-4xl md:text-5xl font-bold">Примеры</h2>
                    </div>
                    {isAuth && (
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                        >
                            <Plus size={12} /> Добавить папку
                        </button>
                    )}
                </motion.div>

                {folders.length === 0 ? (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : {}}
                        className="text-muted-foreground text-center py-16"
                    >
                        Скоро будет информация
                    </motion.p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            {folders.map((folder, i) => {
                                const colors = folderColors(folder.color)
                                const isHovered = hovered === folder.id
                                return (
                                    <motion.div
                                        key={folder.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.08, duration: 0.45 }}
                                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                        className="relative group"
                                        onMouseEnter={() => setHovered(folder.id)}
                                        onMouseLeave={() => setHovered(null)}
                                    >
                                        <Link
                                            to={`/examples/${folder.id}`}
                                            className={`flex flex-col gap-3 p-5 rounded-2xl bg-gradient-to-br border card-block transition-all duration-300 ${colors}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="text-3xl">
                                                    {isHovered
                                                        ? <FolderOpen size={36} className="opacity-90" />
                                                        : <Folder size={36} className="opacity-70" />
                                                    }
                                                    {folder.icon && (
                                                        <span className="absolute top-4 left-12 text-2xl">{folder.icon}</span>
                                                    )}
                                                </div>
                                                <ArrowRight
                                                    size={16}
                                                    className={`mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isHovered ? 'translate-x-0' : '-translate-x-2'}`}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-base">{folder.name}</h3>
                                                {folder.description && (
                                                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed line-clamp-2">
                                                        {folder.description}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>

                                        {isAuth && (
                                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button
                                                    onClick={e => { e.preventDefault(); openEdit(folder) }}
                                                    className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white"
                                                >
                                                    <Pencil size={11} />
                                                </button>
                                                <button
                                                    onClick={e => { e.preventDefault(); handleDelete(folder.id) }}
                                                    className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white"
                                                >
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

                {folders.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.5 }}
                        className="mt-10 text-center"
                    >
                        <Link
                            to="/examples"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-sky-400 hover:text-sky-300 border border-sky-500/20 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all"
                        >
                            Все примеры <ArrowRight size={15} />
                        </Link>
                    </motion.div>
                )}
            </div>

            <Modal
                open={modal}
                title={editing ? 'Редактировать папку' : 'Новая папка'}
                fields={FOLDER_FIELDS}
                values={form}
                onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))}
                onSave={handleSave}
                onClose={() => setModal(false)}
                saving={saving}
            />
        </section>
    )
}
