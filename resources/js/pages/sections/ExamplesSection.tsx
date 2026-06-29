import { useEffect, useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, ArrowRight, ExternalLink } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { apiGetFolders, apiCreateFolder, apiUpdateFolder, apiDeleteFolder, ExampleFolder } from '@/api/examples'
import Modal from '@/components/ui/Modal'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

const FOLDER_FIELDS = [
    { key: 'name', label: 'Название', type: 'text' as const },
    { key: 'description', label: 'Краткое описание (1 предложение)', type: 'text' as const },
    { key: 'color', label: 'Цвет (sky/purple/emerald/amber/rose/indigo)', type: 'text' as const, placeholder: 'sky' },
    { key: 'screenshot_path', label: 'Картинка', type: 'image' as const },
    { key: 'url', label: 'Ссылка на демо (внутренняя или внешняя)', type: 'text' as const, placeholder: '/examples/phone-book' },
    { key: 'sort_order', label: 'Порядок', type: 'text' as const },
]

const GRADIENTS: Record<string, { from: string; to: string; accent: string }> = {
    sky:     { from: 'from-sky-950',     to: 'to-sky-600',     accent: 'text-sky-300' },
    purple:  { from: 'from-purple-950',  to: 'to-purple-600',  accent: 'text-purple-300' },
    emerald: { from: 'from-emerald-950', to: 'to-emerald-600', accent: 'text-emerald-300' },
    amber:   { from: 'from-amber-950',   to: 'to-amber-600',   accent: 'text-amber-300' },
    rose:    { from: 'from-rose-950',    to: 'to-rose-600',    accent: 'text-rose-300' },
    indigo:  { from: 'from-indigo-950',  to: 'to-indigo-600',  accent: 'text-indigo-300' },
}

const COLOR_CYCLE = ['sky', 'purple', 'emerald', 'amber', 'rose', 'indigo']

function getGradient(color: string | null, index: number) {
    const key = color && GRADIENTS[color] ? color : COLOR_CYCLE[index % COLOR_CYCLE.length]
    return GRADIENTS[key]
}

function isExternal(url: string) {
    return url.startsWith('http')
}

export default function ExamplesSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.2 })
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const navigate = useNavigate()

    const [folders, setFolders] = useState<ExampleFolder[]>([])
    const [modal, setModal] = useState(false)
    const [editing, setEditing] = useState<ExampleFolder | null>(null)
    const [form, setForm] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        apiGetFolders().then(r => setFolders(r.data)).catch(() => {})
    }, [])

    const openCreate = () => {
        setEditing(null)
        setForm({ name: '', description: '', color: 'sky', screenshot_path: '', url: '', sort_order: String(folders.length) })
        setModal(true)
    }

    const openEdit = (folder: ExampleFolder, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setEditing(folder)
        setForm({
            name: folder.name,
            description: folder.description ?? '',
            color: folder.color ?? 'sky',
            screenshot_path: folder.screenshot_path ?? '',
            url: folder.url ?? '',
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
                const r = await apiCreateFolder(payload)
                setFolders(prev => [...prev, r.data])
            }
            setModal(false)
        } catch (e) {
            console.error('Ошибка сохранения:', e)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        await apiDeleteFolder(id)
        setFolders(prev => prev.filter(f => f.id !== id))
    }

    const handleCardClick = (folder: ExampleFolder) => {
        const url = folder.url
        if (url) {
            if (isExternal(url)) {
                window.open(url, '_blank', 'noopener,noreferrer')
            } else {
                navigate(url)
            }
        } else {
            navigate(`/examples/${folder.id}`)
        }
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
                            <Plus size={12} /> Добавить
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {folders.map((folder, i) => {
                                const g = getGradient(folder.color, i)
                                const screenshot = folder.screenshot_path
                                const url = folder.url

                                return (
                                    <motion.div
                                        key={folder.id}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        whileHover={{ y: -6, transition: { duration: 0.22 } }}
                                        className="relative group cursor-pointer"
                                        onClick={() => handleCardClick(folder)}
                                    >
                                        {/* Card */}
                                        <div className={`relative overflow-hidden rounded-2xl h-52 bg-gradient-to-br ${g.from} ${g.to} shadow-lg group-hover:shadow-xl group-hover:shadow-black/30 transition-shadow duration-300`}>

                                            {/* Screenshot with diagonal mask */}
                                            {screenshot && (
                                                <img
                                                    src={screenshot}
                                                    alt={folder.name}
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                    style={{
                                                        WebkitMaskImage: 'linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 38%, rgba(0,0,0,0) 65%)',
                                                        maskImage: 'linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 38%, rgba(0,0,0,0) 65%)',
                                                    }}
                                                />
                                            )}

                                            {/* Depth overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/50" />

                                            {/* Title — centered */}
                                            <div className="absolute inset-0 flex items-center justify-center px-6">
                                                <h3 className="text-white font-bold text-lg text-center leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                                    {folder.name}
                                                </h3>
                                            </div>

                                            {/* Description — bottom-right (colored corner) */}
                                            {folder.description && (
                                                <div className="absolute bottom-4 right-4 max-w-[58%]">
                                                    <p className={`text-xs text-right leading-relaxed drop-shadow ${g.accent} opacity-90 line-clamp-2`}>
                                                        {folder.description}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Hover arrow */}
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                                                {url && isExternal(url)
                                                    ? <ExternalLink size={15} className="text-white/70" />
                                                    : <ArrowRight size={15} className="text-white/70" />
                                                }
                                            </div>

                                            {/* Shine on hover */}
                                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 rounded-2xl" />
                                        </div>

                                        {/* Admin controls */}
                                        {isAuth && (
                                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button
                                                    onClick={e => openEdit(folder, e)}
                                                    className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-lg"
                                                >
                                                    <Pencil size={11} />
                                                </button>
                                                <button
                                                    onClick={e => handleDelete(folder.id, e)}
                                                    className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white shadow-lg"
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
                title={editing ? 'Редактировать карточку' : 'Новая карточка'}
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
