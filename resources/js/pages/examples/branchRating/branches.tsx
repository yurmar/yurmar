import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ORG_NAME, REPORT_DATE, SOURCE_FILE, SECTIONS, INDICATORS, BRANCHES, fmtUnit } from './data'
import { ACCENT, useRatingFonts, RatingNav, RatingHero, ReportMeta, MONO_FONT } from './ui'

export default function BranchesPage() {
    useRatingFonts()
    const navigate = useNavigate()
    const [sectionId, setSectionId] = useState<number>(SECTIONS[0].id)
    const [branchIdx, setBranchIdx] = useState<number>(0)

    const sectionIndicators = useMemo(() => INDICATORS.filter(i => i.sectionId === sectionId), [sectionId])
    const cards = useMemo(() => sectionIndicators.map(ind => ({
        indicatorId: ind.id,
        name: ind.name,
        value: ind.values[branchIdx],
        unit: ind.unit,
    })), [sectionIndicators, branchIdx])

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <RatingHero
                eyebrow="Карточки филиала"
                title="Филиалы"
                subtitle={`${ORG_NAME}: выберите филиал, чтобы увидеть все его показатели по разделу.`}
            />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <RatingNav />
                <ReportMeta date={REPORT_DATE} file={SOURCE_FILE} />

                <div className="card-block rounded-2xl p-4 mb-6 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-48">
                        <label htmlFor="br-section" className="block text-xs text-muted-foreground mb-1">Раздел</label>
                        <select id="br-section" name="section" value={sectionId} onChange={e => setSectionId(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer">
                            {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-48">
                        <label htmlFor="br-branch" className="block text-xs text-muted-foreground mb-1">Филиал</label>
                        <select id="br-branch" name="branch" value={branchIdx} onChange={e => setBranchIdx(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer">
                            {BRANCHES.map((b, i) => <option key={b} value={i}>{b}</option>)}
                        </select>
                    </div>
                </div>

                {cards.length === 0 ? (
                    <div className="card-block rounded-2xl text-center py-16 text-muted-foreground">Нет данных</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cards.map(card => (
                            <button
                                key={card.indicatorId}
                                onClick={() => navigate(`/examples/branch-rating/comparison?sectionId=${sectionId}&indicatorId=${card.indicatorId}`)}
                                className="card-block rounded-2xl p-5 text-left flex flex-col gap-3 hover:ring-1 hover:ring-[var(--rank-amber)]/40 hover:shadow-[0_0_18px_2px_rgba(255,157,46,0.1)] transition-all cursor-pointer group"
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                                    Мероприятие
                                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--rank-amber)]" />
                                </p>
                                <p className="text-sm leading-snug flex-1 text-foreground">{card.name}</p>
                                <p className="text-3xl font-bold text-foreground" style={MONO_FONT}>{fmtUnit(card.value, card.unit)}</p>
                            </button>
                        ))}
                    </div>
                )}

                <p className="text-center text-xs text-muted-foreground pt-6 pb-4">
                    * Организация, филиалы и все показатели вымышлены — интерактивный пример вёрстки для портфолио.
                </p>
            </div>
        </div>
    )
}
