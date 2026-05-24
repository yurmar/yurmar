import client from './client'

export interface AuthUser {
    id: number
    name: string
    email: string
}

export const apiLogin = (email: string, password: string) =>
    client.post<{ user: AuthUser; token: string }>('/auth/login', { email, password })

export const apiLogout = () =>
    client.post('/auth/logout')

export const apiGetUser = () =>
    client.get<AuthUser>('/auth/user')
