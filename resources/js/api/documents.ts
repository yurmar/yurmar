import client from './client'

export interface DocumentItem {
    id: number
    title: string
    description: string | null
    original_name: string
    mime_type: string | null
    size: number
    created_at: string
}

export const apiGetDocuments = () => client.get<DocumentItem[]>('/documents')

export const apiCreateDocument = (data: FormData) =>
    client.post<DocumentItem>('/documents', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })

export const apiDeleteDocument = (id: number) => client.delete(`/documents/${id}`)

export const apiDocumentDownloadUrl = (id: number) => `/api/documents/${id}/download`
