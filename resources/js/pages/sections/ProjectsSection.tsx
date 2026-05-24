import { useEffect, useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ExternalLink, Plus, Trash2, Pencil } from 'lucide-react'
import { apiGetProjects, apiCreateProject, apiUpdateProject, apiDeleteProject, ProjectItem } from '@/api/projects'
import Modal from '@/components/ui/Modal'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

const FIELDS = [
    { key: 'title', label: 'Название проекта', type: 'text' as const },
    { key: 'stack', label: 'Стек', type: 'text' as const, placeholder: 'React, Laravel, MySQL' },
    { key: 'description', label: 'Описание', type: 'textarea' as const },
    { key: 'screenshot_path', label: 'Путь к скриншоту', type: 'text' as const, placeholder: '/images/project.jpg' },
    { key: 'url', label: 'URL проекта', type: 'url' as const },
    { key: 'sort_order', label: 'Порядок', type: 'text' as const },
]

export default function ProjectsSection({ limit }: { limit?: number }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-60px' })
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const [items, setItems] = useState<ProjectItem[]>([])
    const [modal, setModal] = useState(false)
    const [editing, setEditing] = useState<ProjectItem | null>(null)
    const [form, setForm] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        apiGetProjects().then(r => setItems(r.data)).catch(() => {})
    }, [])

    const displayed = limit ? items.slice(0, limit) : items

    const openCreate = () => {
        setEditing(null)
        setForm({ title: '', stack: '', description: '', screenshot_path: '', url: '', sort_order: String(items.length) })
        setModal(true)
    }

    const openEdit = (item: ProjectItem) => {
        setEditing(item)
        setForm({
            title: item.title,
            stack: item.stack ?? '',
            description: item.description ?? '',
            screenshot_path: item.screenshot_path ?? '',
            url: item.url ?? '',
            sort_order: String(item.sort_order),
        })
        setModal(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = {
                ...form,
                sort_order: Number(form.sort_order),
                is_featured: editing?.is_featured ?? false,
            }
            if (editing) {
                const r = await apiUpdateProject(editing.id, payload)
                setItems(prev => prev.map(p => p.id === editing.id ? r.data : p))
            } else {
                const r = await apiCreateProject(payload as any)
                setItems(prev => [...prev, r.data])
            }
            setModal(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        await apiDeleteProject(id)
        setItems(prev => prev.filter(p => p.id !== id))
    }

    return (
        <section id="projects" ref={ref} className="py-24 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="flex items-center justify-between mb-12"
                >
                    <div>
                        <p className="text-sky-400 text-sm font-medium tracking-widest uppercase mb-2">Портфолио</p>
                        <h2 className="text-4xl md:text-5xl font-bold">Последние проекты</h2>
                    </div>
                    {isAuth && (
                        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors">
                            <Plus size={12} /> Добавить
                        </button>
                    )}
                </motion.div>

                {displayed.length === 0 ? (
                    <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} className="text-muted-foreground text-center py-16">
                        Скоро будет информация
                    </motion.p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {displayed.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                    className="relative group card-block rounded-2xl overflow-hidden"
                                >
                                    {/* Screenshot */}
                                    <div className="relative h-44 bg-gradient-to-br from-sky-900/30 to-purple-900/30 overflow-hidden">
                                        {item.screenshot_path ? (
                                            <img src={item.screenshot_path} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-4xl font-bold text-white/10">{item.title[0]}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                        {/* Auth controls */}
                                        {isAuth && (
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(item)} className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white"><Pencil size={12} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white"><Trash2 size={12} /></button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                                        {item.stack && (
                                            <p className="text-sky-400 text-xs font-medium mb-2">{item.stack}</p>
                                        )}
                                        {item.description ? (
                                            <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">{item.description}</p>
                                        ) : (
                                            <p className="text-muted-foreground text-sm mb-4 italic">Скоро будет информация</p>
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
            </div>

            <Modal open={modal} title={editing ? 'Редактировать проект' : 'Добавить проект'} fields={FIELDS} values={form} onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))} onSave={handleSave} onClose={() => setModal(false)} saving={saving} />
        </section>
    )
}
