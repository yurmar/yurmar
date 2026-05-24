import client from './client'

export interface ProjectItem {
    id: number
    title: string
    stack: string | null
    description: string | null
    screenshot_path: string | null
    url: string | null
    is_featured: boolean
    sort_order: number
}

export const apiGetProjects = () => client.get<ProjectItem[]>('/projects')
export const apiGetProject = (id: number) => client.get<ProjectItem>(`/projects/${id}`)
export const apiCreateProject = (data: Omit<ProjectItem, 'id'>) => client.post<ProjectItem>('/projects', data)
export const apiUpdateProject = (id: number, data: Partial<ProjectItem>) => client.put<ProjectItem>(`/projects/${id}`, data)
export const apiDeleteProject = (id: number) => client.delete(`/projects/${id}`)
