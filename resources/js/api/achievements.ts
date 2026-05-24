import client from './client'

export interface AchievementItem {
    id: number
    count: string
    label: string
    sort_order: number
}

export const apiGetAchievements = () => client.get<AchievementItem[]>('/achievements')
export const apiCreateAchievement = (data: Omit<AchievementItem, 'id'>) => client.post<AchievementItem>('/achievements', data)
export const apiUpdateAchievement = (id: number, data: Partial<AchievementItem>) => client.put<AchievementItem>(`/achievements/${id}`, data)
export const apiDeleteAchievement = (id: number) => client.delete(`/achievements/${id}`)
