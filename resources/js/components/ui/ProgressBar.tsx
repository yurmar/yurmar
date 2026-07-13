export default function ProgressBar({ percent, color }: { percent: number; color: string }) {
    return (
        <div className="w-full h-1.5 rounded-full bg-foreground/10 overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, percent))}%`, background: color }}
            />
        </div>
    )
}
