import client from './client'

export interface HeroData {
    id?: number
    photo_path: string | null
    name: string
    specialization: string
    offer_text: string | null
    resume_path: string | null
    btn_portfolio: string
    btn_contact: string
    btn_resume: string
}

export const apiGetHero = () => client.get<HeroData>('/hero')
export const apiUpdateHero = (data: Partial<HeroData>) => client.put<HeroData>('/hero', data)
