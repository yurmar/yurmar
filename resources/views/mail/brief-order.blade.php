<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<style>
body { font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; background: #f8fafc; }
.wrap { max-width: 700px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.header { background: linear-gradient(135deg, #0ea5e9, #0369a1); color: white; padding: 28px 32px; }
.header h1 { margin: 0; font-size: 22px; }
.header p { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
.body { padding: 28px 32px; }
.section { margin-bottom: 24px; border-left: 3px solid #0ea5e9; padding-left: 16px; }
.section h2 { margin: 0 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #0ea5e9; }
.row { margin-bottom: 10px; }
.label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.value { font-size: 14px; color: #1e293b; margin-top: 2px; white-space: pre-wrap; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.tag { background: #e0f2fe; color: #0369a1; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.footer { background: #f1f5f9; padding: 16px 32px; font-size: 12px; color: #64748b; text-align: center; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Новый запрос на разработку сайта</h1>
    <p>Получен {{ now()->format('d.m.Y в H:i') }}</p>
  </div>

  <div class="body">

    <div class="section">
      <h2>1. Информация о компании</h2>

      <div class="row">
        <div class="label">Контактное лицо и контакты</div>
        <div class="value">{{ $order->contact_person }}</div>
      </div>
      <div class="row">
        <div class="label">Название компании</div>
        <div class="value">{{ $order->company_name }}</div>
      </div>
      <div class="row">
        <div class="label">Направления деятельности</div>
        <div class="value">{{ $order->company_activity }}</div>
      </div>
      <div class="row">
        <div class="label">Товары / услуги</div>
        <div class="value">{{ $order->products_info }}</div>
      </div>
      <div class="row">
        <div class="label">Разделы сайта</div>
        <div class="value">{{ $order->site_sections }}</div>
      </div>
      <div class="row">
        <div class="label">Фирменный стиль</div>
        <div class="value">{{ $order->brand_style }}</div>
      </div>
      @if($order->current_site)
      <div class="row">
        <div class="label">Действующий сайт</div>
        <div class="value">{{ $order->current_site }}</div>
      </div>
      @endif
      @if($order->current_site_assessment)
      <div class="row">
        <div class="label">Оценка текущего сайта</div>
        <div class="value">{{ $order->current_site_assessment }}</div>
      </div>
      @endif
      @if($order->competitors)
      <div class="row">
        <div class="label">Конкуренты</div>
        <div class="value">{{ $order->competitors }}</div>
      </div>
      @endif
    </div>

    <div class="section">
      <h2>2. Цели разработки</h2>

      @if($order->proposed_domain)
      <div class="row">
        <div class="label">Предполагаемый домен</div>
        <div class="value">{{ $order->proposed_domain }}</div>
      </div>
      @endif
      <div class="row">
        <div class="label">Тип сайта</div>
        <div class="tags">
          @foreach($order->site_types as $t)<span class="tag">{{ $t }}</span>@endforeach
        </div>
        @if($order->site_type_other)
        <div class="value" style="margin-top:6px">Другой вариант: {{ $order->site_type_other }}</div>
        @endif
      </div>
      <div class="row">
        <div class="label">Задачи сайта</div>
        <div class="tags">
          @foreach($order->site_tasks as $t)<span class="tag">{{ $t }}</span>@endforeach
        </div>
        @if($order->site_tasks_other)
        <div class="value" style="margin-top:6px">Другой вариант: {{ $order->site_tasks_other }}</div>
        @endif
      </div>
      @if(count($order->site_functionality) > 0)
      <div class="row">
        <div class="label">Функциональность</div>
        <div class="tags">
          @foreach($order->site_functionality as $t)<span class="tag">{{ $t }}</span>@endforeach
        </div>
        @if($order->site_functionality_other)
        <div class="value" style="margin-top:6px">Другой вариант: {{ $order->site_functionality_other }}</div>
        @endif
      </div>
      @endif
      <div class="row">
        <div class="label">Целевая аудитория</div>
        <div class="value">{{ $order->target_audience }}</div>
      </div>
      <div class="row">
        <div class="label">Языковые версии</div>
        <div class="value">{{ $order->language_versions }}</div>
      </div>
    </div>

    <div class="section">
      <h2>5. Дизайн</h2>

      <div class="row">
        <div class="label">Желаемое впечатление</div>
        <div class="value">{{ $order->design_impression }}</div>
      </div>
      <div class="row">
        <div class="label">Цветовая гамма</div>
        <div class="value">{{ $order->color_scheme }}</div>
      </div>
      <div class="row">
        <div class="label">Расположение контента</div>
        <div class="value">{{ $order->content_placement }}</div>
      </div>
      @if($order->liked_sites)
      <div class="row">
        <div class="label">Понравившиеся сайты</div>
        <div class="value">{{ $order->liked_sites }}</div>
      </div>
      @endif
      @if($order->disliked_sites)
      <div class="row">
        <div class="label">Неприемлемые сайты</div>
        <div class="value">{{ $order->disliked_sites }}</div>
      </div>
      @endif
    </div>

    <div class="section">
      <h2>7–8. Реклама и дополнительно</h2>

      <div class="row">
        <div class="label">Место для рекламы</div>
        <div class="value">{{ $order->has_advertising }}</div>
      </div>
      @if($order->advertising_details)
      <div class="row">
        <div class="label">Информация о рекламе</div>
        <div class="value">{{ $order->advertising_details }}</div>
      </div>
      @endif
      <div class="row">
        <div class="label">Размещение сайта</div>
        <div class="value">{{ $order->hosting_type }}</div>
      </div>
      <div class="row">
        <div class="label">Техническая поддержка</div>
        <div class="value">{{ $order->tech_support }}</div>
      </div>
      <div class="row">
        <div class="label">Наполнение сайта</div>
        <div class="value">{{ $order->content_filling }}</div>
      </div>
      @if($order->additional_wishes)
      <div class="row">
        <div class="label">Дополнительные пожелания</div>
        <div class="value">{{ $order->additional_wishes }}</div>
      </div>
      @endif
    </div>

  </div>

  <div class="footer">
    Этот запрос поступил с сайта Плюсуй Portfolio · {{ config('app.url') }}
  </div>
</div>
</body>
</html>
