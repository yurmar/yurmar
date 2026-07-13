import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmModalProps {
    open: boolean
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    confirming?: boolean
    onConfirm: () => void
    onClose: () => void
}

export default function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = 'Удалить',
    cancelLabel = 'Отмена',
    danger = true,
    confirming,
    onConfirm,
    onClose,
}: ConfirmModalProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose])

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    data-no-ptr
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
                            'relative z-10 w-full max-w-sm rounded-2xl border border-white/10',
                            'bg-[#0d1a30] dark:bg-[#0d1a30] shadow-2xl p-6',
                            'light:bg-white light:border-gray-200'
                        )}
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white">{title}</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {message && <p className="text-sm text-gray-400">{message}</p>}

                        <div className="flex gap-3 mt-6 justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={confirming}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60',
                                    danger ? 'bg-red-500 hover:bg-red-400' : 'bg-sky-500 hover:bg-sky-400'
                                )}
                            >
                                {confirming ? 'Удаление...' : confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
