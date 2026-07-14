import client from './client'

export interface TodoTask {
    id: number
    todo_day_id: number
    title: string
    is_done: boolean
    sort_order: number
}

export interface TodoDay {
    id: number
    date: string
    tasks_count: number
    done_tasks_count: number
}

export interface TodoDayDetail {
    id: number
    date: string
    tasks: TodoTask[]
}

export const apiGetTodoDays = () => client.get<TodoDay[]>('/todo-days')

export const apiGetTodoDay = (id: number) => client.get<TodoDayDetail>(`/todo-days/${id}`)

export const apiCreateTodoDay = (date: string, tasks: string) =>
    client.post<TodoDayDetail>('/todo-days', { date, tasks })

export const apiDeleteTodoDay = (id: number) => client.delete(`/todo-days/${id}`)

export const apiAddTodoTasks = (dayId: number, tasks: string) =>
    client.post<TodoDayDetail>(`/todo-days/${dayId}/tasks`, { tasks })

export const apiUpdateTodoTask = (dayId: number, taskId: number, data: Partial<Pick<TodoTask, 'title' | 'is_done'>>) =>
    client.put<TodoTask>(`/todo-days/${dayId}/tasks/${taskId}`, data)

export const apiDeleteTodoTask = (dayId: number, taskId: number) =>
    client.delete(`/todo-days/${dayId}/tasks/${taskId}`)

export const apiMoveTodoTask = (dayId: number, taskId: number, date: string) =>
    client.post<TodoDayDetail>(`/todo-days/${dayId}/tasks/${taskId}/move`, { date })
