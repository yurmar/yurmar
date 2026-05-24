import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldDef {
    key: string
    label: string
    type?: 'text' | 'textarea' | 'url' | 'email' | 'json-array'
    placeholder?: string
}

interface ModalProps {
    open: boolean
    title: string
    fields: FieldDef[]
    values: Record<string, string>
    onChange: (key: string, value: string) => void
    onSave: () => void
    onClose: () => void
    saving?: boolean
}

export default function Modal({ open, title, fields, values, onChange, onSave, onClose, saving }: ModalProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose])

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        className={cn(
                            'relative z-10 w-full max-w-lg rounded-2xl border border-white/10',
                            'bg-[#0d1a30] dark:bg-[#0d1a30] shadow-2xl p-6',
                            'light:bg-white light:border-gray-200'
                        )}
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-white">{title}</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                            {fields.map((field) => (
                                <div key={field.key}>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        {field.label}
                                    </label>
                                    {field.type === 'textarea' || field.type === 'json-array' ? (
                                        <textarea
                                            value={values[field.key] ?? ''}
                                            onChange={(e) => onChange(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            rows={field.type === 'json-array' ? 3 : 4}
                                            className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                                        />
                                    ) : (
                                        <input
                                            type={field.type ?? 'text'}
                                            value={values[field.key] ?? ''}
                                            onChange={(e) => onChange(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                        />
                                    )}
                                    {field.type === 'json-array' && (
                                        <p className="text-xs text-gray-500 mt-1">Через запятую</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-6 justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={onSave}
                                disabled={saving}
                                className="px-4 py-2 rounded-lg text-sm bg-sky-500 hover:bg-sky-400 text-white font-medium transition-colors disabled:opacity-60"
                            >
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
