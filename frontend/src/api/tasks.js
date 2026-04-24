import client from './client'

export const updateTask = (id, data) => client.patch(`/tasks/${id}`, data)
export const deleteTask = (id)       => client.delete(`/tasks/${id}`)
