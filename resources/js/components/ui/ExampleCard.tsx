import { motion } from 'framer-motion'
import { ArrowRight, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import type { ExampleFolder } from '@/api/examples'

// ── Gradient palette ───────────────────────────────────────────────────────────

export const GRADIENTS: Record<string, { rgba: string; accent: string }> = {
    sky:     { rgba: '14,165,233',  accent: 'text-sky-300' },
    purple:  { rgba: '168,85,247',  accent: 'text-purple-300' },
    emerald: { rgba: '16,185,129',  accent: 'text-emerald-300' },
    amber:   { rgba: '245,158,11',  accent: 'text-amber-300' },
    rose:    { rgba: '244,63,94',   accent: 'text-rose-300' },
    indigo:  { rgba: '99,102,241',  accent: 'text-indigo-300' },
}

const COLOR_CYCLE = ['sky', 'purple', 'emerald', 'amber', 'rose', 'indigo']

export function getGradient(color: string | null, index: number) {
    const key = color && GRADIENTS[color] ? color : COLOR_CYCLE[index % COLOR_CYCLE.length]
    return GRADIENTS[key]
}

export function isExternal(url: string) {
    return url.startsWith('http')
}

// ── CSS masks (shared constants) ───────────────────────────────────────────────

const IMG_MASK  = 'linear-gradient(135deg, black 0%, black 33%, transparent 65%)'
const DARK_MASK = 'linear-gradient(135deg, black 0%, black 33%, transparent 62%)'

// ── Props ──────────────────────────────────────────────────────────────────────

interface ExampleCardProps {
    folder: ExampleFolder
    index: number
    isAuth: boolean
    /** Pass false to skip entrance animation (e.g. when parent controls visibility) */
    animate?: boolean
    isInView?: boolean
    onClick: (folder: ExampleFolder) => void
    onEdit: (folder: ExampleFolder, e: React.MouseEvent) => void
    onDelete: (id: number, e: React.MouseEvent) => void
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ExampleCard({
    folder,
    index,
    isAuth,
    isInView = true,
    onClick,
    onEdit,
    onDelete,
}: ExampleCardProps) {
    const g          = getGradient(folder.color, index)
    const screenshot = folder.screenshot_path
    const url        = folder.url

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -6, transition: { duration: 0.22 } }}
            className="relative group cursor-pointer"
            onClick={() => onClick(folder)}
        >
            {/* ── Visual card ── */}
            <div className="relative overflow-hidden rounded-2xl h-52 shadow-lg group-hover:shadow-xl group-hover:shadow-black/30 transition-shadow duration-300">

                {/* Accent gradient — starts from transparent, fills bottom-right */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(135deg, transparent 0%, transparent 30%, rgba(${g.rgba},0.45) 60%, rgba(${g.rgba},0.75) 100%)`,
                    }}
                />

                {/* Screenshot — fully opaque on the left, fades diagonally */}
                {screenshot && (
                    <img
                        src={screenshot}
                        alt={folder.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                            WebkitMaskImage: IMG_MASK,
                            maskImage: IMG_MASK,
                        }}
                    />
                )}

                {/* Subtle uniform darkening over image area only */}
                <div
                    className="absolute inset-0 bg-black/50"
                    style={{
                        WebkitMaskImage: DARK_MASK,
                        maskImage: DARK_MASK,
                    }}
                />

                {/* Title — centered */}
                <div className="absolute inset-0 flex items-center justify-center px-6">
                    <h3 className="text-white font-bold text-lg text-center leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                        {folder.name}
                    </h3>
                </div>

                {/* Description — bottom-right colored corner */}
                {folder.description && (
                    <div className="absolute bottom-4 right-4 max-w-[58%]">
                        <p className={`text-xs text-right leading-relaxed drop-shadow ${g.accent} opacity-90 line-clamp-2`}>
                            {folder.description}
                        </p>
                    </div>
                )}

                {/* Hover arrow */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                    {url && isExternal(url)
                        ? <ExternalLink size={15} className="text-white/70" />
                        : <ArrowRight size={15} className="text-white/70" />
                    }
                </div>

                {/* Shine on hover */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 rounded-2xl" />
            </div>

            {/* Admin controls */}
            {isAuth && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                        onClick={e => onEdit(folder, e)}
                        className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-lg"
                    >
                        <Pencil size={11} />
                    </button>
                    <button
                        onClick={e => onDelete(folder.id, e)}
                        className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white shadow-lg"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            )}
        </motion.div>
    )
}
