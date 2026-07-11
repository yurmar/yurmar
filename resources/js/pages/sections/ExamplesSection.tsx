import { useEffect, useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Plus, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { apiGetFolders, apiCreateFolder, apiUpdateFolder, apiDeleteFolder, ExampleFolder } from '@/api/examples'
import Modal from '@/components/ui/Modal'
import ExampleCard, { isExternal } from '@/components/ui/ExampleCard'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

const FOLDER_FIELDS = [
    { key: 'name',            label: 'Название',                                      type: 'text'  as const },
    { key: 'description',     label: 'Краткое описание (1 предложение)',               type: 'text'  as const },
    { key: 'color',           label: 'Цвет (sky/purple/emerald/amber/rose/indigo)',    type: 'text'  as const, placeholder: 'sky' },
    { key: 'screenshot_path', label: 'Картинка',                                       type: 'image' as const },
    { key: 'url',             label: 'Ссылка на демо (внутренняя или внешняя)',        type: 'text'  as const, placeholder: '/examples/phone-book' },
    { key: 'sort_order',      label: 'Порядок',                                        type: 'text'  as const },
]

export default function ExamplesSection() {
    const ref     = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.2 })
    const isAuth  = useSelector((s: RootState) => s.auth.isAuthenticated)
    const navigate = useNavigate()

    const [folders, setFolders] = useState<ExampleFolder[]>([])
    const [modal,   setModal]   = useState(false)
    const [editing, setEditing] = useState<ExampleFolder | null>(null)
    const [form,    setForm]    = useState<Record<string, string>>({})
    const [saving,  setSaving]  = useState(false)

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
            name:            folder.name,
            description:     folder.description     ?? '',
            color:           folder.color           ?? 'sky',
            screenshot_path: folder.screenshot_path ?? '',
            url:             folder.url             ?? '',
            sort_order:      String(folder.sort_order),
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
            if (isExternal(url)) window.open(url, '_blank', 'noopener,noreferrer')
            else navigate(url)
        } else {
            navigate(`/examples/${folder.id}`)
        }
    }

    const visibleFolders = folders.slice(0, 3)

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

                {visibleFolders.length === 0 ? (
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
                            {visibleFolders.map((folder, i) => (
                                <ExampleCard
                                    key={folder.id}
                                    folder={folder}
                                    index={i}
                                    isAuth={isAuth}
                                    isInView={isInView}
                                    onClick={handleCardClick}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
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
