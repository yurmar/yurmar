import client from './client'

export interface ServiceItem {
    id: number
    title: string
    icon: string | null
    description: string | null
    sort_order: number
}

export const apiGetServices = () => client.get<ServiceItem[]>('/services')
export const apiCreateService = (data: Omit<ServiceItem, 'id'>) => client.post<ServiceItem>('/services', data)
export const apiUpdateService = (id: number, data: Partial<ServiceItem>) => client.put<ServiceItem>(`/services/${id}`, data)
export const apiDeleteService = (id: number) => client.delete(`/services/${id}`)
