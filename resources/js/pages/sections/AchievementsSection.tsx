import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { apiGetAchievements, apiCreateAchievement, apiUpdateAchievement, apiDeleteAchievement, AchievementItem } from '@/api/achievements'
import Modal from '@/components/ui/Modal'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

const FIELDS = [
    { key: 'count', label: 'Цифра (например 40+)', type: 'text' as const },
    { key: 'label', label: 'Подпись', type: 'text' as const },
    { key: 'sort_order', label: 'Порядок', type: 'text' as const },
]

function CountUp({ value, inView }: { value: string; inView: boolean }) {
    const num = parseInt(value.replace(/\D/g, '')) || 0
    const suffix = value.replace(/[\d]/g, '')
    const mv = useMotionValue(0)
    const rounded = useTransform(mv, v => Math.round(v))
    const [display, setDisplay] = useState('0')

    useEffect(() => {
        if (!inView) return
        const ctrl = animate(mv, num, { duration: 1.8, ease: 'easeOut' })
        const unsub = rounded.on('change', v => setDisplay(v + suffix))
        return () => { ctrl.stop(); unsub() }
    }, [inView, num, suffix])

    return <span>{display}</span>
}

export default function AchievementsSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.3 })
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const [items, setItems] = useState<AchievementItem[]>([])
    const [modal, setModal] = useState(false)
    const [editing, setEditing] = useState<AchievementItem | null>(null)
    const [form, setForm] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        apiGetAchievements().then(r => setItems(r.data)).catch(() => {})
    }, [])

    const openCreate = () => {
        setEditing(null)
        setForm({ count: '', label: '', sort_order: String(items.length) })
        setModal(true)
    }

    const openEdit = (item: AchievementItem) => {
        setEditing(item)
        setForm({ count: item.count, label: item.label, sort_order: String(item.sort_order) })
        setModal(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = { ...form, sort_order: Number(form.sort_order) }
            if (editing) {
                const r = await apiUpdateAchievement(editing.id, payload)
                setItems(prev => prev.map(a => a.id === editing.id ? r.data : a))
            } else {
                const r = await apiCreateAchievement(payload as any)
                setItems(prev => [...prev, r.data])
            }
            setModal(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        await apiDeleteAchievement(id)
        setItems(prev => prev.filter(a => a.id !== id))
    }

    return (
        <section id="achievements" ref={ref} className="py-24 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="flex items-center justify-between mb-12"
                >
                    <div>
                        <p className="text-sky-400 text-sm font-medium tracking-widest uppercase mb-2">Достижения</p>
                        <h2 className="text-4xl md:text-5xl font-bold">В цифрах</h2>
                    </div>
                    {isAuth && (
                        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors">
                            <Plus size={12} /> Добавить
                        </button>
                    )}
                </motion.div>

                {items.length === 0 ? (
                    <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} className="text-muted-foreground text-center py-16">
                        Скоро будет информация
                    </motion.p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <AnimatePresence>
                            {items.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: 0.15 + i * 0.12, duration: 0.5 }}
                                    className="relative group card-block rounded-2xl p-6 text-center"
                                >
                                    <div className="text-4xl font-bold text-sky-400 mb-2">
                                        <CountUp value={item.count} inView={isInView} />
                                    </div>
                                    <p className="text-muted-foreground text-xs leading-snug">{item.label}</p>

                                    {isAuth && (
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(item)} className="p-1 rounded hover:bg-sky-500/20 text-sky-400"><Pencil size={10} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-500/20 text-red-400"><Trash2 size={10} /></button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <Modal open={modal} title={editing ? 'Редактировать достижение' : 'Добавить достижение'} fields={FIELDS} values={form} onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))} onSave={handleSave} onClose={() => setModal(false)} saving={saving} />
        </section>
    )
}
