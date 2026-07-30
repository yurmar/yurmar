export default function Brand({ className = '' }: { className?: string }) {
    return (
        <span className={`font-bold tracking-tight ${className}`}>
            Плюс
            <span className="text-sky-400">
                у
                <span className="relative inline-block">
                    и
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[0.55em] leading-none">+</span>
                </span>
            </span>
        </span>
    )
}
