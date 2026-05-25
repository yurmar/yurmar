import api from './client'

export interface BriefFormData {
    contact_person: string
    company_name: string
    company_activity: string
    products_info: string
    site_sections: string
    brand_style: string
    current_site: string
    current_site_assessment: string
    competitors: string
    proposed_domain: string
    site_types: string[]
    site_type_other: string
    site_tasks: string[]
    site_tasks_other: string
    site_functionality: string[]
    site_functionality_other: string
    target_audience: string
    language_versions: string
    design_impression: string
    color_scheme: string
    content_placement: string
    liked_sites: string
    disliked_sites: string
    has_advertising: string
    advertising_details: string
    hosting_type: string
    tech_support: string
    content_filling: string
    additional_wishes: string
}

export interface BriefOrder extends BriefFormData {
    id: number
    created_at: string
    updated_at: string
}

export const apiCreateBriefOrder = (data: BriefFormData) =>
    api.post<{ message: string; id: number }>('/brief-orders', data)

export const apiGetBriefOrders = () =>
    api.get<BriefOrder[]>('/brief-orders')

export const apiGetBriefOrder = (id: number) =>
    api.get<BriefOrder>(`/brief-orders/${id}`)
