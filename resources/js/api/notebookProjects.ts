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

export interface ProjectFile {
    id: number
    notebook_project_id: number
    folder_id: number | null
    name: string
    original_name: string
    mime_type: string | null
    size: number
    description: string | null
    created_at: string
    updated_at: string
}

export interface ProjectFolder {
    id: number
    notebook_project_id: number
    parent_id: number | null
    name: string
    system_key: string | null
    created_at: string
}

export type ProjectFilePatch = Partial<Pick<ProjectFile, 'name' | 'folder_id' | 'description'>>

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

export interface LinkedNote {
    id: number
    title: string
    is_pinned: boolean
    updated_at: string
}

export interface NoteProjectRef {
    id: number
    name: string
}

export interface NotebookProject {
    id: number
    name: string
    short_name: string | null
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
    files?: ProjectFile[]
    folders?: ProjectFolder[]
    notes?: LinkedNote[]
}

export type NotebookProjectPatch = Partial<
    Pick<
        NotebookProject,
        | 'name' | 'short_name' | 'description' | 'status' | 'priority' | 'local_path' | 'repository_url'
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

export const apiUploadFile = (
    projectId: number,
    file: File,
    folderId: number | null,
    onProgress?: (percent: number) => void,
) => {
    const form = new FormData()
    form.append('file', file)
    if (folderId !== null) form.append('folder_id', String(folderId))
    return client.post<ProjectFile>(`${planUrl(projectId)}/files`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => {
            if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
        },
    })
}
export const apiUpdateFile = (projectId: number, id: number, data: ProjectFilePatch) =>
    client.put<ProjectFile>(`${planUrl(projectId)}/files/${id}`, data)
export const apiDeleteFile = (projectId: number, id: number) =>
    client.delete(`${planUrl(projectId)}/files/${id}`)
export const apiDownloadFile = (projectId: number, id: number) =>
    client.get<Blob>(`${planUrl(projectId)}/files/${id}/download`, { responseType: 'blob' })

export const apiCreateFolder = (projectId: number, data: { name: string; parent_id?: number | null }) =>
    client.post<ProjectFolder>(`${planUrl(projectId)}/folders`, data)
export const apiUpdateFolder = (projectId: number, id: number, data: { name?: string; parent_id?: number | null }) =>
    client.put<ProjectFolder>(`${planUrl(projectId)}/folders/${id}`, data)
export const apiDeleteFolder = (projectId: number, id: number) =>
    client.delete(`${planUrl(projectId)}/folders/${id}`)

export const apiGetProjectNotes = (projectId: number) =>
    client.get<LinkedNote[]>(`${planUrl(projectId)}/notes`)
export const apiAttachNote = (projectId: number, noteId: number) =>
    client.post<LinkedNote>(`${planUrl(projectId)}/notes/${noteId}`)
export const apiDetachNote = (projectId: number, noteId: number) =>
    client.delete(`${planUrl(projectId)}/notes/${noteId}`)
export const apiGetNoteProjects = (noteId: number) =>
    client.get<NoteProjectRef[]>(`/notes/${noteId}/projects`)

export interface ImportPreview {
    project: Pick<NotebookProject, 'name' | 'description' | 'status' | 'priority' | 'start_date' | 'deadline' | 'local_path' | 'repository_url' | 'technologies'>
    milestones: { title: string; description: string | null; status: MilestoneStatus; start_date: string | null; deadline: string | null; tasks: unknown[] }[]
    unassigned: unknown[]
    links: { name: string; type: LinkType; url: string | null; path: string | null }[]
    warnings: string[]
    totals: { milestones: number; tasks: number; links: number }
}

export const apiImportPreview = (source: { markdown?: string; file?: File }) => {
    if (source.file) {
        const form = new FormData()
        form.append('file', source.file)
        form.append('dry_run', '1')
        return client.post<ImportPreview>('/notebook-projects/import', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    }
    return client.post<ImportPreview>('/notebook-projects/import', { markdown: source.markdown, dry_run: true })
}

export const apiImportPreviewInto = (projectId: number, markdown: string) =>
    client.post<ImportPreview>(`${planUrl(projectId)}/import-plan`, { markdown, dry_run: true })

export const apiImportInto = (projectId: number, markdown: string) =>
    client.post<{ project: NotebookProject; filled: string[]; warnings: string[]; totals: ImportPreview['totals'] }>(
        `${planUrl(projectId)}/import-plan`,
        { markdown },
    )

export const apiImportProject = (markdown: string) =>
    client.post<{ project: NotebookProject; warnings: string[]; totals: ImportPreview['totals'] }>(
        '/notebook-projects/import',
        { markdown },
    )
