# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Команды разработки

**Запуск dev-окружения** (нужны оба процесса одновременно):
```bash
php artisan serve       # Laravel backend на localhost:8000
npm run dev             # Vite + HMR для React-фронтенда
```

**Сборка для продакшена:**
```bash
npm run build
```

**PHP-тесты:**
```bash
php artisan test
./vendor/bin/phpunit --filter TestName   # запуск одного теста
```

**Форматирование PHP:**
```bash
./vendor/bin/pint
```

**Миграции:**
```bash
php artisan migrate
php artisan migrate:fresh --seed
```

## Архитектура

### Стек
Laravel 10 (API) + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion + Redux Toolkit. Сборка через Vite с плагином `laravel-vite-plugin`. Алиас `@/` указывает на `resources/js/`.

### Бэкенд (Laravel)
Все роуты — в `routes/api.php`. Паттерн авторизации: публичные GET-запросы открыты, все мутации защищены `auth:sanctum`.

Две категории моделей:
- **Singleton-блоки** (`HeroBlock`, `AboutBlock`, `Contact`) — хранят единственную запись, контроллер использует `firstOrNew([])` для upsert.
- **Коллекции** (`Service`, `Achievement`, `Technology`, `Project`, `BriefOrder`) — стандартный CRUD.

Аутентификация: Sanctum с Bearer-токеном. Токен возвращается при `/api/auth/login` и кладётся в `localStorage`.

### Фронтенд (React)
Точка входа: `resources/js/app.tsx` — монтирует Redux Provider, запускает `initAuth` thunk (восстанавливает сессию из `localStorage`), подключает Router.

**Слои:**
- `router/index.tsx` — React Router v7, все роуты вложены в `<Layout />`
- `pages/` — страницы; `pages/sections/` — секции главной страницы (`home.tsx` их компонует)
- `api/` — по одному файлу на сущность, все используют `api/client.ts` (axios с Bearer-токеном из `localStorage`)
- `store/` — Redux Toolkit; два слайса: `auth` (пользователь + флаги) и `theme` (dark/light)
- `components/ui/Modal.tsx` — универсальный модальный редактор, принимает `fields[]` с описанием полей, `values`, `onChange`, `onSave`; используется во всех секциях для inline-редактирования

**Паттерн редактирования контента:** каждая секция рендерит `<EditButton />`, видимый только авторизованным пользователям, открывающий `<Modal />` для правки данных секции через API.

**Тема:** переключается через Redux-слайс `themeSlice` → добавляет/убирает класс `dark` на `document.documentElement` и сохраняет в `localStorage`. `ThemeInitializer` восстанавливает тему при загрузке.

### Текущее состояние
`ProjectsSection` и страница `/portfolio` временно закомментированы в `router/index.tsx` и `pages/home.tsx`.
