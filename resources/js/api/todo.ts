import client from './client'

export interface TodoTask {
    id: number
    todo_day_id: number | null
    title: string
    is_done: boolean
    is_priority: boolean
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

export const apiUpdateTodoTask = (dayId: number, taskId: number, data: Partial<Pick<TodoTask, 'title' | 'is_done' | 'is_priority'>>) =>
    client.put<TodoTask>(`/todo-days/${dayId}/tasks/${taskId}`, data)

export const apiDeleteTodoTask = (dayId: number, taskId: number) =>
    client.delete(`/todo-days/${dayId}/tasks/${taskId}`)

export const apiMoveTodoTask = (dayId: number, taskId: number, date: string | null) =>
    client.post<TodoDayDetail>(`/todo-days/${dayId}/tasks/${taskId}/move`, { date })

export const apiGetGeneralTasks = () => client.get<TodoTask[]>('/todo-general-tasks')

export const apiAddGeneralTasks = (tasks: string) =>
    client.post<TodoTask[]>('/todo-general-tasks', { tasks })

export const apiUpdateGeneralTask = (taskId: number, data: Partial<Pick<TodoTask, 'title' | 'is_done' | 'is_priority'>>) =>
    client.put<TodoTask>(`/todo-general-tasks/${taskId}`, data)

export const apiDeleteGeneralTask = (taskId: number) => client.delete(`/todo-general-tasks/${taskId}`)

export const apiMoveGeneralTaskToDay = (taskId: number, date: string) =>
    client.post<TodoTask>(`/todo-general-tasks/${taskId}/move`, { date })
