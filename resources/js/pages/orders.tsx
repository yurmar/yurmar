import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, X, Printer, ChevronRight, Calendar, Building2, AlertCircle } from 'lucide-react'
import { apiGetBriefOrders, apiGetBriefOrder, BriefOrder } from '@/api/briefOrders'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { Navigate } from 'react-router-dom'

function formatDate(str: string) {
    return new Date(str).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function tags(items: string[] | null | undefined): string {
    if (!items || items.length === 0) return '—'
    return items.join(', ')
}

function buildPrintHTML(order: BriefOrder): string {
    const row = (label: string, value: string | null | undefined) =>
        value ? `<p><b>${label}:</b> ${String(value).replace(/\n/g, '<br>')}</p>` : ''

    return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<title>Бриф #${order.id} — ${order.company_name}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; background: #f8fafc; }
  .wrap { max-width: 720px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #0ea5e9, #0369a1); color: white; padding: 28px 32px; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
  .body { padding: 28px 32px; }
  .section { margin-bottom: 24px; border-left: 3px solid #0ea5e9; padding-left: 16px; }
  .section h2 { margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #0ea5e9; }
  p { margin: 6px 0; font-size: 14px; }
  b { color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 8px; }
  .tag { background: #e0f2fe; color: #0369a1; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .footer { background: #f1f5f9; padding: 14px 32px; font-size: 12px; color: #64748b; text-align: center; }
  @media print { body { background: #fff; } .wrap { box-shadow: none; margin: 0; border-radius: 0; } }
</style></head><body>
<div class="wrap">
  <div class="header">
    <h1>Бриф на разработку сайта</h1>
    <p>Заявка #${order.id} · Получена ${formatDate(order.created_at)}</p>
  </div>
  <div class="body">
    <div class="section">
      <h2>1. Информация о компании</h2>
      ${row('Контактное лицо', order.contact_person)}
      ${row('Компания', order.company_name)}
      ${row('Направления деятельности', order.company_activity)}
      ${row('Товары / услуги', order.products_info)}
      ${row('Разделы сайта', order.site_sections)}
      ${row('Фирменный стиль', order.brand_style)}
      ${row('Действующий сайт', order.current_site)}
      ${row('Оценка текущего сайта', order.current_site_assessment)}
      ${row('Конкуренты', order.competitors)}
    </div>
    <div class="section">
      <h2>2. Цели разработки</h2>
      ${row('Предполагаемый домен', order.proposed_domain)}
      <p><b>Тип сайта:</b></p>
      <div class="tags">${(order.site_types ?? []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <p><b>Задачи сайта:</b></p>
      <div class="tags">${(order.site_tasks ?? []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      ${(order.site_functionality ?? []).length > 0 ? `<p><b>Функциональность:</b></p><div class="tags">${order.site_functionality.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
      ${row('Целевая аудитория', order.target_audience)}
      ${row('Языковые версии', order.language_versions)}
    </div>
    <div class="section">
      <h2>5. Дизайн</h2>
      ${row('Желаемое впечатление', order.design_impression)}
      ${row('Цветовая гамма', order.color_scheme)}
      ${row('Расположение контента', order.content_placement)}
      ${row('Понравившиеся сайты', order.liked_sites)}
      ${row('Неприемлемые сайты', order.disliked_sites)}
    </div>
    <div class="section">
      <h2>7–8. Реклама и дополнительно</h2>
      ${row('Место для баннерной рекламы', order.has_advertising)}
      ${row('Информация о рекламе', order.advertising_details)}
      ${row('Размещение сайта', order.hosting_type)}
      ${row('Техническая поддержка', order.tech_support)}
      ${row('Наполнение контентом', order.content_filling)}
      ${row('Дополнительные пожелания', order.additional_wishes)}
    </div>
  </div>
  <div class="footer">Заявка с сайта Плюсуй Portfolio</div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body></html>`
}

function handlePrint(order: BriefOrder) {
    const win = window.open('', '_blank', 'width=800,height=900')
    if (!win) return
    win.document.write(buildPrintHTML(order))
    win.document.close()
    win.focus()
}

function Tags({ items }: { items: string[] | null | undefined }) {
    if (!items || items.length === 0) return <span className="text-muted-foreground text-sm">—</span>
    return (
        <div className="flex flex-wrap gap-1.5">
            {items.map((t, i) => (
                <span key={i} className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 text-xs font-medium border border-sky-500/25">{t}</span>
            ))}
        </div>
    )
}

function Row({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p>
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border-l-2 border-sky-500/50 pl-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-sky-400">{title}</h3>
            {children}
        </div>
    )
}

function OrderModal({ id, onClose }: { id: number; onClose: () => void }) {
    const [order, setOrder] = useState<BriefOrder | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiGetBriefOrder(id)
            .then(r => setOrder(r.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [id])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25 }}
                className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
                    <h2 className="text-lg font-bold">
                        {loading ? 'Загрузка…' : `Бриф #${order?.id} — ${order?.company_name}`}
                    </h2>
                    <div className="flex items-center gap-2">
                        {order && (
                            <button
                                onClick={() => handlePrint(order)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/25 transition-colors"
                            >
                                <Printer size={13} /> Печать / PDF
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
                            <X size={17} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading && <p className="text-muted-foreground text-sm text-center py-10">Загрузка данных…</p>}
                    {!loading && !order && (
                        <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle size={15} /> Не удалось загрузить данные заказа.</p>
                    )}
                    {order && (
                        <>
                            <Section title="1. Информация о компании">
                                <Row label="Контактное лицо" value={order.contact_person} />
                                <Row label="Компания" value={order.company_name} />
                                <Row label="Направления деятельности" value={order.company_activity} />
                                <Row label="Товары / услуги" value={order.products_info} />
                                <Row label="Разделы сайта" value={order.site_sections} />
                                <Row label="Фирменный стиль" value={order.brand_style} />
                                <Row label="Действующий сайт" value={order.current_site} />
                                <Row label="Оценка текущего сайта" value={order.current_site_assessment} />
                                <Row label="Конкуренты" value={order.competitors} />
                            </Section>

                            <Section title="2. Цели разработки">
                                <Row label="Предполагаемый домен" value={order.proposed_domain} />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Тип сайта</p>
                                    <Tags items={order.site_types} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Задачи сайта</p>
                                    <Tags items={order.site_tasks} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Функциональность</p>
                                    <Tags items={order.site_functionality} />
                                </div>
                                <Row label="Целевая аудитория" value={order.target_audience} />
                                <Row label="Языковые версии" value={order.language_versions} />
                            </Section>

                            <Section title="5. Дизайн">
                                <Row label="Желаемое впечатление" value={order.design_impression} />
                                <Row label="Цветовая гамма" value={order.color_scheme} />
                                <Row label="Расположение контента" value={order.content_placement} />
                                <Row label="Понравившиеся сайты" value={order.liked_sites} />
                                <Row label="Неприемлемые сайты" value={order.disliked_sites} />
                            </Section>

                            <Section title="7–8. Реклама и дополнительно">
                                <Row label="Место для баннерной рекламы" value={order.has_advertising} />
                                <Row label="Информация о рекламе" value={order.advertising_details} />
                                <Row label="Размещение сайта" value={order.hosting_type} />
                                <Row label="Техническая поддержка" value={order.tech_support} />
                                <Row label="Наполнение контентом" value={order.content_filling} />
                                <Row label="Дополнительные пожелания" value={order.additional_wishes} />
                            </Section>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

export default function Orders() {
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const [orders, setOrders] = useState<BriefOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<number | null>(null)

    useEffect(() => {
        if (!isAuth) return
        apiGetBriefOrders()
            .then(r => setOrders(r.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [isAuth])

    if (!isAuth) return <Navigate to="/login" replace />

    return (
        <main className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <p className="text-sky-400 text-sm font-medium tracking-widest uppercase mb-2">Входящие заявки</p>
                    <h1 className="text-4xl font-bold">Заказы</h1>
                </motion.div>

                {loading && (
                    <p className="text-muted-foreground text-sm">Загрузка…</p>
                )}

                {!loading && orders.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4 py-24 text-muted-foreground"
                    >
                        <FileText size={48} className="opacity-30" />
                        <p>Заявок пока нет</p>
                    </motion.div>
                )}

                <div className="space-y-3">
                    {orders.map((order, i) => (
                        <motion.button
                            key={order.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.4 }}
                            onClick={() => setSelected(order.id)}
                            className="w-full text-left group card-block rounded-2xl p-5 hover:border-sky-400/30 transition-all"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                                        <Building2 size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-sm truncate">{order.company_name}</h3>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{order.contact_person}</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {order.site_types?.slice(0, 2).map((t, j) => (
                                                <span key={j} className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-medium border border-sky-500/20">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                            <Calendar size={11} /> {formatDate(order.created_at)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">#{order.id}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-sky-400 transition-colors" />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selected !== null && (
                    <OrderModal key={selected} id={selected} onClose={() => setSelected(null)} />
                )}
            </AnimatePresence>
        </main>
    )
}
