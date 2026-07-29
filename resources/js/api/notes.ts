import client from './client'

export interface Note {
    id: number
    title: string
    content: string | null
    created_at: string
    updated_at: string
}

export const apiGetNotes = () => client.get<Note[]>('/notes')
export const apiCreateNote = () => client.post<Note>('/notes')
export const apiUpdateNote = (id: number, data: Partial<Pick<Note, 'title' | 'content'>>) =>
    client.put<Note>(`/notes/${id}`, data)
export const apiDeleteNote = (id: number) => client.delete(`/notes/${id}`)
