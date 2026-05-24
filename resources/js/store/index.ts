import { configureStore } from '@reduxjs/toolkit'
import themeReducer from './slice/themeSlice'
import authReducer from './slice/authSlice'

export const store = configureStore({
    reducer: {
        theme: themeReducer,
        auth: authReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
