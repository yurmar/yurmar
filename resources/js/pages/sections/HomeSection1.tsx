import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

export default function HomeSection1() {
    const ref = useRef(null)

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    })

    // Параллакс-сдвиг фона
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])

    return (
        <section
            ref={ref}
            className="relative h-screen md:h-[600px] w-full overflow-hidden"
        >
            {/* Background image with parallax */}
            <motion.div
                style={{ y }}
                className="absolute inset-0 -z-10"
            >
                <img
                    src="/images/bgi_s1.jpg"
                    alt="YurMar"
                    className="w-full h-full object-cover"
                />
            </motion.div>

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/70 -z-10" />

            {/* Content */}
            <div className="relative z-10 flex h-full items-center justify-center text-white text-center">
                <div>
                    <h1 className="text-5xl font-bold mb-4">Привет! Я веб-разработчик</h1>
                    <p className="text-xl opacity-80">
                        Создаю современные цифровые решения с аккуратным кодом и продуманным интерфейсом
                    </p>
                </div>
            </div>
        </section>
    )
}