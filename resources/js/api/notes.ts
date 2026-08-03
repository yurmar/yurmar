import client from './client'

export interface Note {
    id: number
    title: string
    content: string | null
    created_at: string
    updated_at: string
    deleted_at?: string | null
}

export const apiGetNotes = () => client.get<Note[]>('/notes')
export const apiCreateNote = () => client.post<Note>('/notes')
export const apiUpdateNote = (id: number, data: Partial<Pick<Note, 'title' | 'content'>>) =>
    client.put<Note>(`/notes/${id}`, data)
export const apiDeleteNote = (id: number) => client.delete(`/notes/${id}`)

export const apiGetTrashedNotes = () => client.get<Note[]>('/notes/trash')
export const apiRestoreNote = (id: number) => client.post<Note>(`/notes/${id}/restore`)
export const apiForceDeleteNote = (id: number) => client.delete(`/notes/${id}/force`)
