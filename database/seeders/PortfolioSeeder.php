<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\AboutBlock;
use App\Models\Contact;
use App\Models\HeroBlock;
use App\Models\Project;
use App\Models\Service;
use App\Models\Technology;
use Illuminate\Database\Seeder;

class PortfolioSeeder extends Seeder
{
    public function run(): void
    {
        HeroBlock::create([
            'name' => 'Юрий Марчук',
            'specialization' => 'Fullstack Web Developer',
            'offer_text' => "Fullstack Web Developer • Bitrix / Laravel / React\nБолее 12 лет в разработке веб-систем и корпоративных решений",
            'btn_portfolio' => 'Смотреть портфолио',
            'btn_contact' => 'Связаться',
            'btn_resume' => 'Скачать резюме PDF',
        ]);

        AboutBlock::create([
            'description' => 'Разрабатываю сайты и веб-приложения с 2012 года. Специализируюсь на корпоративных системах, государственных проектах и современных React SPA.',
            'short_facts' => ['12+ лет опыта', 'Fullstack-разработка', 'Гос. проекты', 'CRM / корпоративные системы', 'Frontend + Backend + DevOps'],
            'skills_frontend' => ['React', 'Redux', 'MUI', 'Bootstrap', 'Tailwind', 'Framer Motion', 'Chart.js', 'HTML / CSS / SASS / JS'],
            'skills_backend' => ['PHP', 'Laravel', 'Bitrix', 'WordPress', 'MySQL', 'REST API'],
            'skills_devops' => ['LAMP', 'SSH', 'Git', 'Linux', 'Docker'],
            'skills_design' => ['Figma', 'Photoshop', 'UI/UX'],
        ]);

        $services = [
            ['title' => 'Разработка сайтов', 'icon' => 'Globe', 'description' => 'Корпоративные сайты, лендинги и порталы любой сложности'],
            ['title' => 'Корпоративные системы', 'icon' => 'Building2', 'description' => 'CRM, ERP, внутренние порталы и системы управления'],
            ['title' => 'React SPA', 'icon' => 'Layers', 'description' => 'Современные одностраничные приложения на React'],
            ['title' => 'Laravel Backend', 'icon' => 'Server', 'description' => 'API, бэкенд-системы и микросервисы на Laravel'],
            ['title' => 'Bitrix / WordPress', 'icon' => 'Code2', 'description' => 'Разработка и доработка на Bitrix и WordPress'],
            ['title' => 'Дашборды и аналитика', 'icon' => 'BarChart3', 'description' => 'Интерактивные дашборды с графиками и KPI'],
            ['title' => 'Поддержка проектов', 'icon' => 'Wrench', 'description' => 'Техническая поддержка и развитие существующих проектов'],
            ['title' => 'Администрирование серверов', 'icon' => 'Terminal', 'description' => 'Настройка LAMP, Docker, деплой и мониторинг'],
            ['title' => 'Telegram-боты', 'icon' => 'MessageCircle', 'description' => 'Боты для автоматизации и бизнес-процессов'],
            ['title' => 'Макс-боты', 'icon' => 'Bot', 'description' => 'Боты для платформы Макс'],
        ];

        foreach ($services as $i => $service) {
            Service::create(array_merge($service, ['sort_order' => $i]));
        }

        $achievements = [
            ['count' => '40+', 'label' => 'разработанных сайтов', 'sort_order' => 0],
            ['count' => '12+', 'label' => 'лет опыта', 'sort_order' => 1],
            ['count' => '100+', 'label' => 'модераторов в госсистеме', 'sort_order' => 2],
            ['count' => '3', 'label' => 'благотворительных проекта', 'sort_order' => 3],
            ['count' => '50+', 'label' => 'смонтированных видео', 'sort_order' => 4],
        ];

        foreach ($achievements as $achievement) {
            Achievement::create($achievement);
        }

        $technologies = [
            ['name' => 'React', 'color' => '#61dafb', 'category' => 'frontend', 'sort_order' => 0],
            ['name' => 'TypeScript', 'color' => '#3178c6', 'category' => 'frontend', 'sort_order' => 1],
            ['name' => 'Redux', 'color' => '#764abc', 'category' => 'frontend', 'sort_order' => 2],
            ['name' => 'Tailwind', 'color' => '#38bdf8', 'category' => 'frontend', 'sort_order' => 3],
            ['name' => 'Framer Motion', 'color' => '#ff0055', 'category' => 'frontend', 'sort_order' => 4],
            ['name' => 'Chart.js', 'color' => '#ff6384', 'category' => 'frontend', 'sort_order' => 5],
            ['name' => 'SASS', 'color' => '#cc6699', 'category' => 'frontend', 'sort_order' => 6],
            ['name' => 'PHP', 'color' => '#7a86b8', 'category' => 'backend', 'sort_order' => 7],
            ['name' => 'Laravel', 'color' => '#ff2d20', 'category' => 'backend', 'sort_order' => 8],
            ['name' => 'Bitrix', 'color' => '#e94343', 'category' => 'backend', 'sort_order' => 9],
            ['name' => 'WordPress', 'color' => '#21759b', 'category' => 'backend', 'sort_order' => 10],
            ['name' => 'MySQL', 'color' => '#4479a1', 'category' => 'backend', 'sort_order' => 11],
            ['name' => 'REST API', 'color' => '#6366f1', 'category' => 'backend', 'sort_order' => 12],
            ['name' => 'Docker', 'color' => '#2496ed', 'category' => 'devops', 'sort_order' => 13],
            ['name' => 'Linux', 'color' => '#fcc624', 'category' => 'devops', 'sort_order' => 14],
            ['name' => 'Git', 'color' => '#f05032', 'category' => 'devops', 'sort_order' => 15],
            ['name' => 'Figma', 'color' => '#f24e1e', 'category' => 'design', 'sort_order' => 16],
        ];

        foreach ($technologies as $tech) {
            Technology::create($tech);
        }

        $projects = [
            [
                'title' => 'ИАС "Открытое Правительство ИО"',
                'stack' => 'Bitrix, PHP, MySQL, JS',
                'description' => 'Государственная информационно-аналитическая система для мониторинга обращений граждан. Более 100 модераторов.',
                'screenshot_path' => '/images/img_op.jpg',
                'url' => null,
                'is_featured' => true,
                'sort_order' => 0,
            ],
            [
                'title' => 'Корпоративный портал',
                'stack' => 'Laravel, React, MySQL',
                'description' => 'Внутренний корпоративный портал с системой задач, документооборотом и аналитикой.',
                'screenshot_path' => null,
                'url' => null,
                'is_featured' => true,
                'sort_order' => 1,
            ],
            [
                'title' => 'CRM-система',
                'stack' => 'Laravel, React, Redux, Chart.js',
                'description' => 'CRM для управления клиентами, сделками и отчётностью.',
                'screenshot_path' => null,
                'url' => null,
                'is_featured' => true,
                'sort_order' => 2,
            ],
        ];

        foreach ($projects as $project) {
            Project::create($project);
        }

        Contact::create([
            'description' => 'Готов обсудить проект любой сложности',
            'telegram_url' => 'https://t.me/yurmar',
            'max_url' => null,
            'email' => 'yurmarchuk@gmail.com',
            'form_title' => 'Связаться',
        ]);
    }
}
