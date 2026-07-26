import client from './client'

export interface DocumentItem {
    id: number
    title: string
    description: string | null
    original_name: string
    mime_type: string | null
    size: number
    downloads_count: number
    created_at: string
}

export const apiGetDocuments = () => client.get<DocumentItem[]>('/documents')

export const apiCreateDocument = (data: FormData) =>
    client.post<DocumentItem>('/documents', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })

export const apiUpdateDocument = (id: number, data: { title: string; description: string; file?: File | null }) => {
    if (!data.file) {
        return client.put<DocumentItem>(`/documents/${id}`, { title: data.title, description: data.description })
    }

    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('file', data.file)
    formData.append('_method', 'PUT')

    return client.post<DocumentItem>(`/documents/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export const apiDeleteDocument = (id: number) => client.delete(`/documents/${id}`)

export const apiDocumentDownloadUrl = (id: number) => `/api/documents/${id}/download`
