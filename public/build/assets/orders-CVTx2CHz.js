import{j as e,m as x,A as b}from"./vendor-motion-BtEwk5Qp.js";import{u as j,a as c}from"./vendor-redux-Bf_jGU28.js";import{a as v,b as y}from"./app-Dq0oDfiv.js";import{b as _}from"./vendor-router-B-Z7ZT8I.js";import{F as k,k as w,u as N,p as $,v as z,X as S,n as C}from"./vendor-ui-OooYbOGE.js";import"./vendor-http-C0Zqfgkc.js";function u(s){return new Date(s).toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}function O(s){const a=(t,l)=>l?`<p><b>${t}:</b> ${String(l).replace(/\n/g,"<br>")}</p>`:"";return`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<title>Бриф #${s.id} — ${s.company_name}</title>
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
    <p>Заявка #${s.id} · Получена ${u(s.created_at)}</p>
  </div>
  <div class="body">
    <div class="section">
      <h2>1. Информация о компании</h2>
      ${a("Контактное лицо",s.contact_person)}
      ${a("Компания",s.company_name)}
      ${a("Направления деятельности",s.company_activity)}
      ${a("Товары / услуги",s.products_info)}
      ${a("Разделы сайта",s.site_sections)}
      ${a("Фирменный стиль",s.brand_style)}
      ${a("Действующий сайт",s.current_site)}
      ${a("Оценка текущего сайта",s.current_site_assessment)}
      ${a("Конкуренты",s.competitors)}
    </div>
    <div class="section">
      <h2>2. Цели разработки</h2>
      ${a("Предполагаемый домен",s.proposed_domain)}
      <p><b>Тип сайта:</b></p>
      <div class="tags">${(s.site_types??[]).map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      <p><b>Задачи сайта:</b></p>
      <div class="tags">${(s.site_tasks??[]).map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      ${(s.site_functionality??[]).length>0?`<p><b>Функциональность:</b></p><div class="tags">${s.site_functionality.map(t=>`<span class="tag">${t}</span>`).join("")}</div>`:""}
      ${a("Целевая аудитория",s.target_audience)}
      ${a("Языковые версии",s.language_versions)}
    </div>
    <div class="section">
      <h2>5. Дизайн</h2>
      ${a("Желаемое впечатление",s.design_impression)}
      ${a("Цветовая гамма",s.color_scheme)}
      ${a("Расположение контента",s.content_placement)}
      ${a("Понравившиеся сайты",s.liked_sites)}
      ${a("Неприемлемые сайты",s.disliked_sites)}
    </div>
    <div class="section">
      <h2>7–8. Реклама и дополнительно</h2>
      ${a("Место для баннерной рекламы",s.has_advertising)}
      ${a("Информация о рекламе",s.advertising_details)}
      ${a("Размещение сайта",s.hosting_type)}
      ${a("Техническая поддержка",s.tech_support)}
      ${a("Наполнение контентом",s.content_filling)}
      ${a("Дополнительные пожелания",s.additional_wishes)}
    </div>
  </div>
  <div class="footer">Заявка с сайта YurMar Portfolio</div>
</div>
<script>window.onload = () => { window.print(); }<\/script>
</body></html>`}function P(s){const a=window.open("","_blank","width=800,height=900");a&&(a.document.write(O(s)),a.document.close(),a.focus())}function m({items:s}){return!s||s.length===0?e.jsx("span",{className:"text-muted-foreground text-sm",children:"—"}):e.jsx("div",{className:"flex flex-wrap gap-1.5",children:s.map((a,t)=>e.jsx("span",{className:"px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 text-xs font-medium border border-sky-500/25",children:a},t))})}function i({label:s,value:a}){return a?e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5",children:s}),e.jsx("p",{className:"text-sm text-foreground whitespace-pre-wrap",children:a})]}):null}function p({title:s,children:a}){return e.jsxs("div",{className:"border-l-2 border-sky-500/50 pl-4 space-y-3",children:[e.jsx("h3",{className:"text-xs font-bold uppercase tracking-widest text-sky-400",children:s}),a]})}function A({id:s,onClose:a}){const[t,l]=c.useState(null),[o,d]=c.useState(!0);return c.useEffect(()=>{y(s).then(r=>l(r.data)).catch(()=>{}).finally(()=>d(!1))},[s]),e.jsxs(x.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed inset-0 z-[200] flex items-center justify-center p-4",onClick:r=>{r.target===r.currentTarget&&a()},children:[e.jsx("div",{className:"absolute inset-0 bg-black/70 backdrop-blur-sm"}),e.jsxs(x.div,{initial:{opacity:0,scale:.95,y:20},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.95,y:20},transition:{duration:.25},className:"relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl",style:{background:"var(--card)",border:"1px solid var(--border)"},children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0",children:[e.jsx("h2",{className:"text-lg font-bold",children:o?"Загрузка…":`Бриф #${t?.id} — ${t?.company_name}`}),e.jsxs("div",{className:"flex items-center gap-2",children:[t&&e.jsxs("button",{onClick:()=>P(t),className:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/25 transition-colors",children:[e.jsx(z,{size:13})," Печать / PDF"]}),e.jsx("button",{onClick:a,className:"p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors",children:e.jsx(S,{size:17})})]})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-6 space-y-6",children:[o&&e.jsx("p",{className:"text-muted-foreground text-sm text-center py-10",children:"Загрузка данных…"}),!o&&!t&&e.jsxs("p",{className:"text-red-400 text-sm flex items-center gap-2",children:[e.jsx(C,{size:15})," Не удалось загрузить данные заказа."]}),t&&e.jsxs(e.Fragment,{children:[e.jsxs(p,{title:"1. Информация о компании",children:[e.jsx(i,{label:"Контактное лицо",value:t.contact_person}),e.jsx(i,{label:"Компания",value:t.company_name}),e.jsx(i,{label:"Направления деятельности",value:t.company_activity}),e.jsx(i,{label:"Товары / услуги",value:t.products_info}),e.jsx(i,{label:"Разделы сайта",value:t.site_sections}),e.jsx(i,{label:"Фирменный стиль",value:t.brand_style}),e.jsx(i,{label:"Действующий сайт",value:t.current_site}),e.jsx(i,{label:"Оценка текущего сайта",value:t.current_site_assessment}),e.jsx(i,{label:"Конкуренты",value:t.competitors})]}),e.jsxs(p,{title:"2. Цели разработки",children:[e.jsx(i,{label:"Предполагаемый домен",value:t.proposed_domain}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1",children:"Тип сайта"}),e.jsx(m,{items:t.site_types})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1",children:"Задачи сайта"}),e.jsx(m,{items:t.site_tasks})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1",children:"Функциональность"}),e.jsx(m,{items:t.site_functionality})]}),e.jsx(i,{label:"Целевая аудитория",value:t.target_audience}),e.jsx(i,{label:"Языковые версии",value:t.language_versions})]}),e.jsxs(p,{title:"5. Дизайн",children:[e.jsx(i,{label:"Желаемое впечатление",value:t.design_impression}),e.jsx(i,{label:"Цветовая гамма",value:t.color_scheme}),e.jsx(i,{label:"Расположение контента",value:t.content_placement}),e.jsx(i,{label:"Понравившиеся сайты",value:t.liked_sites}),e.jsx(i,{label:"Неприемлемые сайты",value:t.disliked_sites})]}),e.jsxs(p,{title:"7–8. Реклама и дополнительно",children:[e.jsx(i,{label:"Место для баннерной рекламы",value:t.has_advertising}),e.jsx(i,{label:"Информация о рекламе",value:t.advertising_details}),e.jsx(i,{label:"Размещение сайта",value:t.hosting_type}),e.jsx(i,{label:"Техническая поддержка",value:t.tech_support}),e.jsx(i,{label:"Наполнение контентом",value:t.content_filling}),e.jsx(i,{label:"Дополнительные пожелания",value:t.additional_wishes})]})]})]})]})]})}function B(){const s=j(n=>n.auth.isAuthenticated),[a,t]=c.useState([]),[l,o]=c.useState(!0),[d,r]=c.useState(null);return c.useEffect(()=>{s&&v().then(n=>t(n.data)).catch(()=>{}).finally(()=>o(!1))},[s]),s?e.jsxs("main",{className:"min-h-screen pt-24 pb-16 px-4",children:[e.jsxs("div",{className:"max-w-4xl mx-auto",children:[e.jsxs(x.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{duration:.5},className:"mb-10",children:[e.jsx("p",{className:"text-sky-400 text-sm font-medium tracking-widest uppercase mb-2",children:"Входящие заявки"}),e.jsx("h1",{className:"text-4xl font-bold",children:"Заказы"})]}),l&&e.jsx("p",{className:"text-muted-foreground text-sm",children:"Загрузка…"}),!l&&a.length===0&&e.jsxs(x.div,{initial:{opacity:0},animate:{opacity:1},className:"flex flex-col items-center gap-4 py-24 text-muted-foreground",children:[e.jsx(k,{size:48,className:"opacity-30"}),e.jsx("p",{children:"Заявок пока нет"})]}),e.jsx("div",{className:"space-y-3",children:a.map((n,f)=>e.jsx(x.button,{initial:{opacity:0,y:16},animate:{opacity:1,y:0},transition:{delay:f*.06,duration:.4},onClick:()=>r(n.id),className:"w-full text-left group card-block rounded-2xl p-5 hover:border-sky-400/30 transition-all",children:e.jsxs("div",{className:"flex items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex items-start gap-4 flex-1 min-w-0",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0",children:e.jsx(w,{size:18})}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h3",{className:"font-semibold text-sm truncate",children:n.company_name}),e.jsx("p",{className:"text-xs text-muted-foreground truncate mt-0.5",children:n.contact_person}),e.jsx("div",{className:"flex flex-wrap gap-1 mt-2",children:n.site_types?.slice(0,2).map((h,g)=>e.jsx("span",{className:"px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-medium border border-sky-500/20",children:h},g))})]})]}),e.jsxs("div",{className:"flex items-center gap-3 shrink-0",children:[e.jsxs("div",{className:"text-right hidden sm:block",children:[e.jsxs("p",{className:"text-xs text-muted-foreground flex items-center gap-1 justify-end",children:[e.jsx(N,{size:11})," ",u(n.created_at)]}),e.jsxs("p",{className:"text-[10px] text-muted-foreground/60 mt-0.5",children:["#",n.id]})]}),e.jsx($,{size:16,className:"text-muted-foreground group-hover:text-sky-400 transition-colors"})]})]})},n.id))})]}),e.jsx(b,{children:d!==null&&e.jsx(A,{id:d,onClose:()=>r(null)},d)})]}):e.jsx(_,{to:"/login",replace:!0})}export{B as default};
