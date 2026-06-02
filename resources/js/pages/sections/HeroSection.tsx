import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { smoothScrollTo } from '@/utils/scroll'
import { Download, Mail, FolderOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiGetHero, apiUpdateHero, HeroData } from '@/api/hero'
import EditButton from '@/components/ui/EditButton'
import Modal from '@/components/ui/Modal'

const DEFAULT: HeroData = {
    photo_path: null,
    name: 'Юрий Марчук',
    specialization: 'Fullstack Web Developer',
    offer_text: 'Fullstack Web Developer • Bitrix / Laravel / React\nБолее 12 лет в разработке веб-систем и корпоративных решений',
    resume_path: null,
    btn_portfolio: 'Смотреть портфолио',
    btn_contact: 'Связаться',
    btn_resume: 'Скачать резюме PDF',
}

const FIELDS = [
    { key: 'name', label: 'Имя', type: 'text' as const },
    { key: 'specialization', label: 'Специализация', type: 'text' as const },
    { key: 'offer_text', label: 'Краткий оффер', type: 'textarea' as const },
    { key: 'photo_path', label: 'Путь к фото', type: 'text' as const, placeholder: '/images/photo.jpg' },
    { key: 'resume_path', label: 'Путь к резюме PDF', type: 'text' as const, placeholder: '/files/resume.pdf' },
    { key: 'btn_portfolio', label: 'Кнопка "Портфолио"', type: 'text' as const },
    { key: 'btn_contact', label: 'Кнопка "Связаться"', type: 'text' as const },
    { key: 'btn_resume', label: 'Кнопка "Резюме"', type: 'text' as const },
]

export default function HeroSection() {
    const ref = useRef(null)
    const [data, setData] = useState<HeroData>(DEFAULT)
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
    const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

    useEffect(() => {
        apiGetHero().then(r => { if (r.data) setData(r.data) }).catch(() => {})
    }, [])

    const openModal = () => {
        setForm(Object.fromEntries(FIELDS.map(f => [f.key, (data as any)[f.key] ?? ''])))
        setModal(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const r = await apiUpdateHero(form)
            setData(r.data)
            setModal(false)
        } finally {
            setSaving(false)
        }
    }

    const lines = (data.offer_text ?? DEFAULT.offer_text!).split('\n')

    return (
        <section id="hero" ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Parallax BG */}
            <motion.div style={{ y }} className="absolute inset-0 -z-10">
                {data.photo_path ? (
                    <img src={data.photo_path} alt="bg" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full hero-gradient" />
                )}
            </motion.div>
            <div className="absolute inset-0 bg-black/55 -z-10" />

            {/* Grid lines decoration */}
            <div className="absolute inset-0 -z-10 opacity-5" style={{
                backgroundImage: 'linear-gradient(rgba(56,189,248,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.5) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
            }} />

            <motion.div
                style={{ opacity }}
                className="relative z-10 text-center px-4 max-w-4xl mx-auto"
            >
                {/* Avatar */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mx-auto mb-6 w-24 h-24 rounded-full overflow-hidden border-2 border-sky-400/50 shadow-lg shadow-sky-500/20"
                >
                    <img
                        src={data.photo_path ?? '/images/logo.png'}
                        alt={data.name}
                        className="w-full h-full object-cover"
                    />
                </motion.div>

                {/* Name */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-5xl md:text-7xl font-bold text-white mb-3 tracking-tight"
                >
                    {data.name}
                </motion.h1>

                {/* Specialization badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.35 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/40 bg-sky-500/10 mb-5"
                >
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span className="text-sky-300 text-sm font-medium tracking-wide">{data.specialization}</span>
                </motion.div>

                {/* Offer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45 }}
                    className="text-gray-300 text-base md:text-lg mb-8 space-y-1"
                >
                    {lines.map((line, i) => <p key={i}>{line}</p>)}
                </motion.div>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.55 }}
                    className="flex flex-wrap items-center justify-center gap-3"
                >
                    {/* <Link to="/portfolio">
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/30 transition-colors"
                        >
                            <FolderOpen size={16} />
                            {data.btn_portfolio}
                        </motion.button>
                    </Link> */}
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { const el = document.getElementById('contacts'); if (el) smoothScrollTo(el) }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:border-sky-400/50 text-white font-semibold text-sm hover:bg-white/5 transition-all"
                    >
                        <Mail size={16} />
                        {data.btn_contact}
                    </motion.button>
                    {data.resume_path && (
                        <a href={data.resume_path} download>
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white text-sm transition-colors"
                            >
                                <Download size={16} />
                                {data.btn_resume}
                            </motion.button>
                        </a>
                    )}
                </motion.div>

                {/* Edit */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6"
                >
                    <EditButton onClick={openModal} />
                </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-5 h-8 rounded-full border-2 border-white/30 flex justify-center pt-1.5"
                >
                    <div className="w-1 h-2 rounded-full bg-white/60" />
                </motion.div>
            </motion.div>

            <Modal
                open={modal}
                title="Редактировать Hero-блок"
                fields={FIELDS}
                values={form}
                onChange={(k, v) => setForm(prev => ({ ...prev, [k]: v }))}
                onSave={handleSave}
                onClose={() => setModal(false)}
                saving={saving}
            />
        </section>
    )
}
