import client from './client'

export interface ContactData {
    id?: number
    description: string | null
    telegram_url: string | null
    max_url: string | null
    email: string | null
    form_title: string | null
}

export const apiGetContacts = () => client.get<ContactData>('/contacts')
export const apiUpdateContacts = (data: Partial<ContactData>) => client.put<ContactData>('/contacts', data)
