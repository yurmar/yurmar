const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2

export function smoothScrollTo(target: number | Element, duration = 900) {
    const start = window.scrollY
    const end =
        typeof target === 'number'
            ? target
            : target.getBoundingClientRect().top + window.scrollY
    const distance = end - start
    if (Math.abs(distance) < 1) return

    const startTime = performance.now()

    const step = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        window.scrollTo(0, start + distance * easeInOutCubic(t))
        if (t < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
}
