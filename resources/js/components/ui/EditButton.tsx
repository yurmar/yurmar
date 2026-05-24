import { Pencil } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

interface Props {
    onClick: () => void
    className?: string
}

export default function EditButton({ onClick, className = '' }: Props) {
    const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
    if (!isAuthenticated) return null

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-sky-500/20 hover:bg-sky-500/40 text-sky-400 border border-sky-500/30
                transition-colors backdrop-blur-sm ${className}`}
        >
            <Pencil size={12} />
            Редактировать
        </motion.button>
    )
}
