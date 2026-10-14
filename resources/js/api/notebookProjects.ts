import client from './client'

export type ProjectStatus = 'idea' | 'planning' | 'active' | 'paused' | 'completed' | 'archived'
export type ProjectPriority = 'low' | 'normal' | 'high'

export interface NotebookProject {
    id: number
    name: string
    description: string | null
    status: ProjectStatus
    priority: ProjectPriority
    local_path: string | null
    repository_url: string | null
    technologies: string[] | null
    start_date: string | null
    deadline: string | null
    is_pinned: boolean
    created_at: string
    updated_at: string
    tasks_count?: number
    done_tasks_count?: number
    files_count?: number
    notes_count?: number
}

export type NotebookProjectPatch = Partial<
    Pick<
        NotebookProject,
        | 'name' | 'description' | 'status' | 'priority' | 'local_path' | 'repository_url'
        | 'technologies' | 'start_date' | 'deadline' | 'is_pinned'
    >
>

export const apiGetNotebookProjects = () => client.get<NotebookProject[]>('/notebook-projects')
export const apiGetNotebookProject = (id: number) => client.get<NotebookProject>(`/notebook-projects/${id}`)
export const apiCreateNotebookProject = (data: NotebookProjectPatch = {}) =>
    client.post<NotebookProject>('/notebook-projects', data)
export const apiUpdateNotebookProject = (id: number, data: NotebookProjectPatch) =>
    client.put<NotebookProject>(`/notebook-projects/${id}`, data)
export const apiDeleteNotebookProject = (id: number) => client.delete(`/notebook-projects/${id}`)
