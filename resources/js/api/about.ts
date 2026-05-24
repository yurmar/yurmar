import client from './client'

export interface AboutData {
    id?: number
    description: string | null
    short_facts: string[] | null
    skills_frontend: string[] | null
    skills_backend: string[] | null
    skills_devops: string[] | null
    skills_design: string[] | null
}

export const apiGetAbout = () => client.get<AboutData>('/about')
export const apiUpdateAbout = (data: Partial<AboutData>) => client.put<AboutData>('/about', data)
