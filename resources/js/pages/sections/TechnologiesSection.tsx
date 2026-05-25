import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { apiGetTechnologies, apiCreateTechnology, apiUpdateTechnology, apiDeleteTechnology, TechItem } from '@/api/technologies'
import Modal from '@/components/ui/Modal'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

const FIELDS = [
    { key: 'name', label: 'Название', type: 'text' as const },
    { key: 'color', label: 'Цвет (HEX)', type: 'text' as const, placeholder: '#38bdf8' },
    { key: 'category', label: 'Категория (frontend/backend/devops/design)', type: 'text' as const },
    { key: 'sort_order', label: 'Порядок', type: 'text' as const },
]

function TechBadge({ item, isAuth, onEdit, onDelete }: { item: TechItem; isAuth: boolean; onEdit: () => void; onDelete: () => void }) {
    return (
        <motion.div
            whileHover={{ scale: 1.08, y: -2 }}
            className="relative group flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
            style={{ borderColor: item.color + '40', background: item.color + '12', color: item.color }}
        >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
            {item.name}
            {isAuth && (
                <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                    <button onClick={onEdit} className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-white shadow"><Pencil size={9} /></button>
                    <button onClick={onDelete} className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white shadow"><Trash2 size={9} /></button>
                </div>
            )}
        </motion.div>
    )
}

export default function TechnologiesSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.3 })
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const [items, setItems] = useState<TechItem[]>([])
    const [modal, setModal] = useState(false)
    const [editing, setEditing] = useState<TechItem | null>(null)
    const [form, setForm] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        apiGetTechnologies().then(r => setItems(r.data)).catch(() => {})
    }, [])

    const openCreate = () => {
        setEditing(null)
        setForm({ name: '', color: '#38bdf8', category: 'frontend', sort_order: String(items.length) })
        setModal(true)
    }

    const openEdit = (item: TechItem) => {
        setEditing(item)
        setForm({ name: item.name, color: item.color, category: item.category, sort_order: String(item.sort_order) })
        setModal(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = { ...form, sort_order: Number(form.sort_order) }
            if (editing) {
                const r = await apiUpdateTechnology(editing.id, payload)
                setItems(prev => prev.map(t => t.id === editing.id ? r.data : t))
            } else {
                const r = await apiCreateTechnology(payload as any)
                setItems(prev => [...prev, r.data])
            }
            setModal(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        await apiDeleteTechnology(id)
        setItems(prev => prev.filter(t => t.id !== id))
    }

    // Duplicate array for seamless loop
    const marqueItems = [...items, ...items]

    return (
        <section id="technologies" ref={ref} className="py-24 section-alt overflow-hidden">
            <div className="max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="flex items-center justify-between mb-12"
                >
                    <div>
                        <p className="text-sky-400 text-sm font-medium tracking-widest uppercase mb-2">Технологии</p>
                        <h2 className="text-4xl md:text-5xl font-bold">Мой стек</h2>
                    </div>
                    {isAuth && (
                        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors">
                            <Plus size={12} /> Добавить
                        </button>
                    )}
                </motion.div>
            </div>

            {items.length === 0 ? (
                <p className="text-muted-foreground text-center py-16">Скоро будет информация</p>
            ) : (
                <div className="relative">
                    {/* Fade edges */}
                    <div className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, var(--section-alt-bg), transparent)' }} />
                    <div className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, var(--section-alt-bg), transparent)' }} />

                    <motion.div
                        className="flex gap-3 w-max"
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
                    >
                        {marqueItems.map((item, i) => (
                            <TechBadge
                                key={`${item.id}-${i}`}
                                item={item}
                                isAuth={isAuth && i < items.length}
                                onEdit={() => openEdit(item)}
                                onDelete={() => handleDelete(item.id)}
                            />
                        ))}
                    </motion.div>
                </div>
            )}

            <Modal open={modal} title={editing ? 'Редактировать технологию' : 'Добавить технологию'} fields={FIELDS} values={form} onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))} onSave={handleSave} onClose={() => setModal(false)} saving={saving} />
        </section>
    )
}
