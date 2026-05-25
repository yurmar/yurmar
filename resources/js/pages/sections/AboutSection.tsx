import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { apiGetAbout, apiUpdateAbout, AboutData } from '@/api/about'
import EditButton from '@/components/ui/EditButton'
import Modal from '@/components/ui/Modal'

const DEFAULT: AboutData = {
    description: 'Разрабатываю сайты и веб-приложения с 2012 года.',
    short_facts: ['12+ лет опыта', 'Fullstack-разработка', 'Гос. проекты', 'CRM / корпоративные системы', 'Frontend + Backend + DevOps'],
    skills_frontend: ['React', 'Redux', 'MUI', 'Bootstrap', 'Tailwind', 'Framer Motion', 'Chart.js', 'HTML / CSS / SASS / JS'],
    skills_backend: ['PHP', 'Laravel', 'Bitrix', 'WordPress', 'MySQL', 'REST API'],
    skills_devops: ['LAMP', 'SSH', 'Git', 'Linux', 'Docker'],
    skills_design: ['Figma', 'Photoshop', 'UI/UX'],
}

const FIELDS = [
    { key: 'description', label: 'Описание', type: 'textarea' as const },
    { key: 'short_facts', label: 'Факты (через запятую)', type: 'json-array' as const },
    { key: 'skills_frontend', label: 'Frontend (через запятую)', type: 'json-array' as const },
    { key: 'skills_backend', label: 'Backend (через запятую)', type: 'json-array' as const },
    { key: 'skills_devops', label: 'DevOps (через запятую)', type: 'json-array' as const },
    { key: 'skills_design', label: 'Дизайн (через запятую)', type: 'json-array' as const },
]

const SKILL_GROUPS = [
    { key: 'skills_frontend', label: 'Frontend', color: '#38bdf8' },
    { key: 'skills_backend', label: 'Backend', color: '#a78bfa' },
    { key: 'skills_devops', label: 'DevOps', color: '#34d399' },
    { key: 'skills_design', label: 'Дизайн', color: '#fb923c' },
]

function SkillTag({ name, color }: { name: string; color: string }) {
    return (
        <motion.span
            whileHover={{ scale: 1.05 }}
            className="px-3 py-1 rounded-lg text-xs font-medium border"
            style={{ borderColor: color + '40', color, background: color + '15' }}
        >
            {name}
        </motion.span>
    )
}

export default function AboutSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.3 })
    const [data, setData] = useState<AboutData>(DEFAULT)
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        apiGetAbout().then(r => { if (r.data) setData(r.data) }).catch(() => {})
    }, [])

    const openModal = () => {
        setForm({
            description: data.description ?? '',
            short_facts: (data.short_facts ?? []).join(', '),
            skills_frontend: (data.skills_frontend ?? []).join(', '),
            skills_backend: (data.skills_backend ?? []).join(', '),
            skills_devops: (data.skills_devops ?? []).join(', '),
            skills_design: (data.skills_design ?? []).join(', '),
        })
        setModal(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = {
                description: form.description,
                short_facts: form.short_facts.split(',').map(s => s.trim()).filter(Boolean),
                skills_frontend: form.skills_frontend.split(',').map(s => s.trim()).filter(Boolean),
                skills_backend: form.skills_backend.split(',').map(s => s.trim()).filter(Boolean),
                skills_devops: form.skills_devops.split(',').map(s => s.trim()).filter(Boolean),
                skills_design: form.skills_design.split(',').map(s => s.trim()).filter(Boolean),
            }
            const r = await apiUpdateAbout(payload)
            setData(r.data)
            setModal(false)
        } finally {
            setSaving(false)
        }
    }

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

    return (
        <section id="about" ref={ref} className="py-24 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="flex items-center justify-between mb-12"
                >
                    <div>
                        <p className="text-sky-400 text-sm font-medium tracking-widest uppercase mb-2">Обо мне</p>
                        <h2 className="text-4xl md:text-5xl font-bold">Кто я такой</h2>
                    </div>
                    <EditButton onClick={openModal} />
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left: description + facts */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.15 }}
                    >
                        <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                            {data.description ?? DEFAULT.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(data.short_facts ?? DEFAULT.short_facts ?? []).map((fact, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.35 + i * 0.1, duration: 0.5 }}
                                    className="flex items-center gap-3 p-3 rounded-xl card-block"
                                >
                                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                                    <span className="text-sm">{fact}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: skills */}
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate={isInView ? 'show' : 'hidden'}
                        className="space-y-6"
                    >
                        {SKILL_GROUPS.map(group => {
                            const skills = (data as any)[group.key] as string[] | null
                            return (
                                <motion.div key={group.key} variants={item}>
                                    <p className="text-sm font-semibold mb-3" style={{ color: group.color }}>
                                        {group.label}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {(skills ?? []).map(skill => (
                                            <SkillTag key={skill} name={skill} color={group.color} />
                                        ))}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                </div>
            </div>

            <Modal
                open={modal}
                title="Редактировать блок «Обо мне»"
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
