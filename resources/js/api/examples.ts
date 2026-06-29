import client from './client'

export interface ExampleFolder {
    id: number
    name: string
    description: string | null
    icon: string | null
    color: string | null
    sort_order: number
    examples?: ExampleItem[]
}

export interface ExampleItem {
    id: number
    folder_id: number
    title: string
    description: string | null
    screenshot_path: string | null
    url: string | null
    tags: string | null
    sort_order: number
}

export const apiGetFolders = () => client.get<ExampleFolder[]>('/example-folders')
export const apiGetFolder = (id: number) => client.get<ExampleFolder>(`/example-folders/${id}`)
export const apiCreateFolder = (data: Omit<ExampleFolder, 'id' | 'examples'>) => client.post<ExampleFolder>('/example-folders', data)
export const apiUpdateFolder = (id: number, data: Partial<ExampleFolder>) => client.put<ExampleFolder>(`/example-folders/${id}`, data)
export const apiDeleteFolder = (id: number) => client.delete(`/example-folders/${id}`)

export const apiGetExamples = (folderId: number) => client.get<ExampleItem[]>(`/example-folders/${folderId}/examples`)
export const apiCreateExample = (folderId: number, data: Omit<ExampleItem, 'id' | 'folder_id'>) =>
    client.post<ExampleItem>(`/example-folders/${folderId}/examples`, data)
export const apiUpdateExample = (folderId: number, id: number, data: Partial<ExampleItem>) =>
    client.put<ExampleItem>(`/example-folders/${folderId}/examples/${id}`, data)
export const apiDeleteExample = (folderId: number, id: number) =>
    client.delete(`/example-folders/${folderId}/examples/${id}`)
