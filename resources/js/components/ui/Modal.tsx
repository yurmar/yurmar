import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import client from '@/api/client'

interface FieldDef {
    key: string
    label: string
    type?: 'text' | 'textarea' | 'url' | 'email' | 'date' | 'json-array' | 'image'
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

function ImageUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setError('')
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('image', file)
            const r = await client.post<{ url: string }>('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            onChange(r.data.url)
        } catch {
            setError('Ошибка загрузки. Попробуйте ещё раз.')
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    return (
        <div className="space-y-2">
            {value ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                    <img src={value} alt="" className="w-full h-36 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/30 transition-colors"
                        >
                            <Upload size={12} /> Заменить
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/70 backdrop-blur-sm text-white text-xs font-medium hover:bg-red-500 transition-colors"
                        >
                            <X size={12} /> Удалить
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-28 rounded-xl border-2 border-dashed border-white/15 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all flex flex-col items-center justify-center gap-2 text-white/40 hover:text-sky-400 disabled:opacity-50"
                >
                    {uploading ? (
                        <div className="w-6 h-6 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
                    ) : (
                        <>
                            <ImageIcon size={22} />
                            <span className="text-xs font-medium">Нажмите, чтобы добавить картинку</span>
                            <span className="text-[10px]">JPG, PNG, GIF, WebP · до 8 МБ</span>
                        </>
                    )}
                </button>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFile}
            />
        </div>
    )
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

                        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                            {fields.map((field) => (
                                <div key={field.key}>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        {field.label}
                                    </label>
                                    {field.type === 'image' ? (
                                        <ImageUploadField
                                            value={values[field.key] ?? ''}
                                            onChange={(url) => onChange(field.key, url)}
                                        />
                                    ) : field.type === 'textarea' || field.type === 'json-array' ? (
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
