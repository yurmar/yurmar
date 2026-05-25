import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Send, Mail, MessageCircle, Bot, FileText } from 'lucide-react'
import { apiGetContacts, apiUpdateContacts, ContactData } from '@/api/contacts'
import EditButton from '@/components/ui/EditButton'
import Modal from '@/components/ui/Modal'
import BriefOrderModal from '@/components/BriefOrderModal'

const DEFAULT: ContactData = {
    description: 'Готов обсудить проект любой сложности',
    telegram_url: 'https://t.me/yurmar',
    max_url: null,
    email: 'yurmarchuk@gmail.com',
    form_title: 'Связаться',
}

const FIELDS = [
    { key: 'description', label: 'Текст заголовка', type: 'text' as const },
    { key: 'telegram_url', label: 'Telegram URL', type: 'url' as const },
    { key: 'max_url', label: 'Макс URL', type: 'url' as const },
    { key: 'email', label: 'Email', type: 'email' as const },
    { key: 'form_title', label: 'Заголовок формы', type: 'text' as const },
]

export default function ContactsSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.3 })
    const [data, setData] = useState<ContactData>(DEFAULT)
    const [modal, setModal] = useState(false)
    const [briefModal, setBriefModal] = useState(false)
    const [form, setForm] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        apiGetContacts().then(r => { if (r.data) setData(r.data) }).catch(() => {})
    }, [])

    const openModal = () => {
        setForm(Object.fromEntries(FIELDS.map(f => [f.key, (data as any)[f.key] ?? ''])))
        setModal(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const r = await apiUpdateContacts(form)
            setData(r.data)
            setModal(false)
        } finally {
            setSaving(false)
        }
    }

    const buttons = [
        { label: 'Telegram', href: data.telegram_url, icon: <Send size={16} />, color: 'bg-sky-500 hover:bg-sky-400 shadow-sky-500/30' },
        { label: 'Макс', href: data.max_url, icon: <Bot size={16} />, color: 'bg-violet-500 hover:bg-violet-400 shadow-violet-500/30' },
        { label: data.email ?? 'Email', href: data.email ? `mailto:${data.email}` : null, icon: <Mail size={16} />, color: 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30' },
    ].filter(b => b.href)

    return (
        <section id="contacts" ref={ref} className="py-24 px-4 section-alt">
            <div className="max-w-4xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="mb-4 flex items-center justify-center gap-3"
                >
                    <p className="text-sky-400 text-sm font-medium tracking-widest uppercase">Контакты</p>
                    <EditButton onClick={openModal} />
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl md:text-5xl font-bold mb-4"
                >
                    {data.description ?? DEFAULT.description}
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.2 }}
                    className="text-muted-foreground text-lg mb-10"
                >
                    Напишите мне — обсудим детали и сроки
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center justify-center gap-4"
                >
                    {buttons.map((btn, i) => (
                        <motion.a
                            key={i}
                            href={btn.href!}
                            target={btn.href?.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-colors ${btn.color}`}
                        >
                            {btn.icon}
                            {btn.label}
                        </motion.a>
                    ))}
                    <motion.button
                        onClick={() => setBriefModal(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl border border-sky-400/40 text-sky-400 hover:bg-sky-500/10 font-semibold text-sm transition-colors"
                    >
                        <FileText size={16} />
                        Запросить стоимость
                    </motion.button>
                </motion.div>

                {/* Decorative grid */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mt-16 relative mx-auto w-48 h-48 opacity-20"
                >
                    <div className="absolute inset-0 rounded-full border border-sky-400/50 animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-6 rounded-full border border-sky-400/40" />
                    <div className="absolute inset-12 rounded-full border border-sky-400/30" />
                    <div className="absolute inset-[50%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-sky-400" />
                </motion.div>
            </div>

            <Modal open={modal} title="Редактировать контакты" fields={FIELDS} values={form} onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))} onSave={handleSave} onClose={() => setModal(false)} saving={saving} />
            <BriefOrderModal open={briefModal} onClose={() => setBriefModal(false)} />
        </section>
    )
}
