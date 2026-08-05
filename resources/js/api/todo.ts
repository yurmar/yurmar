import client from './client'

export interface TodoTask {
    id: number
    todo_day_id: number | null
    todo_list_id: number | null
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

export interface TodoList {
    id: number
    name: string
    tasks_count: number
    done_tasks_count: number
}

export interface TodoListDetail {
    id: number
    name: string
    tasks: TodoTask[]
}

export const apiGetTodoLists = () => client.get<TodoList[]>('/todo-lists')

export const apiGetTodoList = (id: number) => client.get<TodoListDetail>(`/todo-lists/${id}`)

export const apiCreateTodoList = (name: string, tasks?: string) =>
    client.post<TodoListDetail>('/todo-lists', { name, tasks })

export const apiRenameTodoList = (id: number, name: string) =>
    client.put<TodoList>(`/todo-lists/${id}`, { name })

export const apiDeleteTodoList = (id: number) => client.delete(`/todo-lists/${id}`)

export const apiAddTodoListTasks = (listId: number, tasks: string) =>
    client.post<TodoListDetail>(`/todo-lists/${listId}/tasks`, { tasks })

export const apiUpdateTodoListTask = (listId: number, taskId: number, data: Partial<Pick<TodoTask, 'title' | 'is_done' | 'is_priority'>>) =>
    client.put<TodoTask>(`/todo-lists/${listId}/tasks/${taskId}`, data)

export const apiDeleteTodoListTask = (listId: number, taskId: number) =>
    client.delete(`/todo-lists/${listId}/tasks/${taskId}`)

export const apiMoveTodoListTask = (listId: number, taskId: number, date: string) =>
    client.post<TodoTask>(`/todo-lists/${listId}/tasks/${taskId}/move`, { date })
