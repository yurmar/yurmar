import client from './client'

export type ProjectStatus = 'idea' | 'planning' | 'active' | 'paused' | 'completed' | 'archived'
export type ProjectPriority = 'low' | 'normal' | 'high'

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'
export type MilestoneStatus = 'todo' | 'in_progress' | 'done'

export interface ProjectTask {
    id: number
    notebook_project_id: number
    milestone_id: number | null
    note_id: number | null
    title: string
    description: string | null
    status: TaskStatus
    priority: ProjectPriority
    due_date: string | null
    sort_order: number
    reference_url: string | null
    completed_at: string | null
}

export type LinkType = 'local_path' | 'url'
export type LinkCategory = 'code' | 'design' | 'docs' | 'data' | 'other'

export interface ProjectLink {
    id: number
    notebook_project_id: number
    name: string
    type: LinkType
    path: string | null
    url: string | null
    description: string | null
    category: LinkCategory | null
    tags: string[] | null
    sort_order: number
    created_at: string
}

export type ProjectLinkPatch = Partial<
    Pick<ProjectLink, 'name' | 'type' | 'path' | 'url' | 'description' | 'category' | 'tags'>
>

export interface ProjectMilestone {
    id: number
    notebook_project_id: number
    title: string
    description: string | null
    status: MilestoneStatus
    start_date: string | null
    deadline: string | null
    sort_order: number
}

export type ProjectTaskPatch = Partial<
    Pick<ProjectTask, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'milestone_id' | 'note_id' | 'reference_url'>
>
export type ProjectMilestonePatch = Partial<
    Pick<ProjectMilestone, 'title' | 'description' | 'status' | 'start_date' | 'deadline'>
>

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
    links_count?: number
    files_count?: number
    notes_count?: number
    milestones?: ProjectMilestone[]
    tasks?: ProjectTask[]
    links?: ProjectLink[]
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

const planUrl = (projectId: number) => `/notebook-projects/${projectId}`

export const apiCreateTask = (projectId: number, data: ProjectTaskPatch) =>
    client.post<ProjectTask>(`${planUrl(projectId)}/tasks`, data)
export const apiUpdateTask = (projectId: number, id: number, data: ProjectTaskPatch) =>
    client.put<ProjectTask>(`${planUrl(projectId)}/tasks/${id}`, data)
export const apiDeleteTask = (projectId: number, id: number) =>
    client.delete(`${planUrl(projectId)}/tasks/${id}`)
export const apiReorderTasks = (projectId: number, ids: number[]) =>
    client.post<ProjectTask[]>(`${planUrl(projectId)}/tasks/reorder`, { ids })

export const apiCreateMilestone = (projectId: number, data: ProjectMilestonePatch) =>
    client.post<ProjectMilestone>(`${planUrl(projectId)}/milestones`, data)
export const apiUpdateMilestone = (projectId: number, id: number, data: ProjectMilestonePatch) =>
    client.put<ProjectMilestone>(`${planUrl(projectId)}/milestones/${id}`, data)
export const apiDeleteMilestone = (projectId: number, id: number) =>
    client.delete(`${planUrl(projectId)}/milestones/${id}`)
export const apiReorderMilestones = (projectId: number, ids: number[]) =>
    client.post<ProjectMilestone[]>(`${planUrl(projectId)}/milestones/reorder`, { ids })

export const apiCreateLink = (projectId: number, data: ProjectLinkPatch) =>
    client.post<ProjectLink>(`${planUrl(projectId)}/links`, data)
export const apiUpdateLink = (projectId: number, id: number, data: ProjectLinkPatch) =>
    client.put<ProjectLink>(`${planUrl(projectId)}/links/${id}`, data)
export const apiDeleteLink = (projectId: number, id: number) =>
    client.delete(`${planUrl(projectId)}/links/${id}`)
