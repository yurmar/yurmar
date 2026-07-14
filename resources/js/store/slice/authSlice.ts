import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiGetUser, apiLogin, apiLogout, AuthUser } from '@/api/auth'

interface AuthState {
    user: AuthUser | null
    isAuthenticated: boolean
    loading: boolean
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    loading: true,
}

export const initAuth = createAsyncThunk('auth/init', async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) return null
    const res = await apiGetUser()
    return res.data
})

export const login = createAsyncThunk('auth/login', async ({ email, password, remember }: { email: string; password: string; remember: boolean }) => {
    const res = await apiLogin(email, password)
    if (remember) {
        localStorage.setItem('auth_token', res.data.token)
        sessionStorage.removeItem('auth_token')
    } else {
        sessionStorage.setItem('auth_token', res.data.token)
        localStorage.removeItem('auth_token')
    }
    return res.data.user
})

export const logout = createAsyncThunk('auth/logout', async () => {
    await apiLogout()
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
})

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(initAuth.pending, (state) => { state.loading = true })
            .addCase(initAuth.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload
                state.isAuthenticated = !!action.payload
            })
            .addCase(initAuth.rejected, (state) => {
                state.loading = false
                state.user = null
                state.isAuthenticated = false
                localStorage.removeItem('auth_token')
                sessionStorage.removeItem('auth_token')
            })
            .addCase(login.fulfilled, (state, action) => {
                state.user = action.payload
                state.isAuthenticated = true
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null
                state.isAuthenticated = false
            })
    },
})

export default authSlice.reducer
