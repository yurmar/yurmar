import client from './client'

export interface TechItem {
    id: number
    name: string
    color: string
    category: string
    sort_order: number
}

export const apiGetTechnologies = () => client.get<TechItem[]>('/technologies')
export const apiCreateTechnology = (data: Omit<TechItem, 'id'>) => client.post<TechItem>('/technologies', data)
export const apiUpdateTechnology = (id: number, data: Partial<TechItem>) => client.put<TechItem>(`/technologies/${id}`, data)
export const apiDeleteTechnology = (id: number) => client.delete(`/technologies/${id}`)
