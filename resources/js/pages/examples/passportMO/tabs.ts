import type { LucideIcon } from 'lucide-react'
import { BarChart3, FileText, Heart, Info, Landmark, LayoutDashboard, RussianRuble, TrendingUp, User, Users } from 'lucide-react'

export type TabId = 'overview' | 'general' | 'leader' | 'demographic' | 'economy' | 'budget' | 'infrastructure' | 'social' | 'reports' | 'monitoring'

export interface TabConfig { id: TabId; label: string; icon: LucideIcon; /** Ключи паспорта, по которым считается заполненность */ sections?: string[] }
export interface TabGroup { id: string; label: string; tabs: TabConfig[] }

export const GROUPS: TabGroup[] = [
    { id: 'overview', label: 'Обзор', tabs: [{ id: 'overview', label: 'Обзор', icon: LayoutDashboard }] },
    {
        id: 'territory', label: 'Территория', tabs: [
            { id: 'general', label: 'Основное', icon: Info, sections: ['main_info'] },
            { id: 'demographic', label: 'Демография', icon: Users, sections: ['demographic'] },
            { id: 'infrastructure', label: 'Инфраструктура', icon: Landmark, sections: ['roads', 'housing'] },
        ],
    },
    {
        id: 'economy', label: 'Экономика и бюджет', tabs: [
            { id: 'economy', label: 'Экономика', icon: TrendingUp, sections: ['economy', 'production', 'agriculture'] },
            { id: 'budget', label: 'Бюджет', icon: RussianRuble, sections: ['budget'] },
            { id: 'social', label: 'Социальная сфера', icon: Heart, sections: ['education', 'healthcare', 'culture_sport'] },
        ],
    },
    { id: 'leadership', label: 'Руководство', tabs: [{ id: 'leader', label: 'Руководитель', icon: User, sections: ['leader'] }] },
    {
        id: 'special', label: 'Специальные разделы', tabs: [
            { id: 'monitoring', label: 'Мониторинг', icon: BarChart3, sections: ['monitoring'] },
            { id: 'reports', label: 'Отчёты', icon: FileText },
        ],
    },
]

export const PASSPORT_TABS: TabConfig[] = GROUPS.flatMap(g => g.tabs)
export const isTabId = (v: string | null): v is TabId => !!v && PASSPORT_TABS.some(t => t.id === v)
