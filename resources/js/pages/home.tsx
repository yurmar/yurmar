import { Check, ExternalLink } from "lucide-react";
import HomeSection1 from "@/pages/sections/HomeSection1";

export default function Home() {
    return (
        <div>
            <HomeSection1 />

            <section className="section-2 px-5 flex items-center justify-between my-15">
                <div className="w-full px-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 md:justify-center">
                        <Check className="check border-1 w-10 h-10 p-1 rounded-4xl" /> Разрабатываю сайты и веб-приложения
                    </div>
                    <div className="flex items-center gap-3 md:justify-center">
                        <Check className="check border-1 w-10 h-10 p-1 rounded-4xl" /> Работаю с Bitrix, WordPress, React
                    </div>
                    <div className="flex items-center gap-3 md:justify-center">
                        <Check className="check border-1 w-10 h-10 p-1 rounded-4xl" /> Создаю frontend и backend решения
                    </div>
                    <div className="flex items-center gap-3 md:justify-center">
                        <Check className="check border-1 w-10 h-10 p-1 rounded-4xl" /> Оптимизация, доработка, интеграции
                    </div>
                </div>
            </section>

            <section className="section-3 px-5 my-15">
                <h1 className="text-5xl font-bold mb-4">Мои работы</h1>
                <div className="flex items-center justify-between mt-10">
                    <div className="w-full px-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Card */}
                        <div className="relative h-[300px] w-full overflow-hidden rounded-2xl shadow-2xl">
                            {/* Background Card */}
                            <div className="absolute inset-0 -z-10">
                                <img
                                    src="/images/bgi_card.jpg"
                                    alt="YurMar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* Dark overlay */}
                            <div className="absolute inset-0 bg-black/40 -z-10" />
                            {/* Logo */}
                            <div className="p-5">
                                <img
                                    src="/images/bitrix_logo.png"
                                    alt="YurMar"
                                    className="w-8 h-8 object-cover"
                                />
                            </div>
                            {/* Img */}
                            <div className="">
                                <img
                                    src="/images/img_op.jpg"
                                    alt="YurMar"
                                    className="h-[200px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                />
                            </div>
                            {/* Title hover */}
                            <div className="text-white w-full absolute bottom-0 p-4 flex justify-between gap-3">
                                <h3 className="text-[21px]">
                                    ИАС "Открытое Правительство ИО"
                                </h3>
                                <a href="">
                                    <ExternalLink />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}