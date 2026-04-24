import client from './client'

export const getWorkspaces   = ()           => client.get('/workspaces')
export const createWorkspace = (data)       => client.post('/workspaces', data)
export const getWorkspace    = (id)         => client.get(`/workspaces/${id}`)
export const getStats        = (id)         => client.get(`/workspaces/${id}/stats`)
export const addMember       = (id, data)   => client.post(`/workspaces/${id}/members`, data)
export const removeMember    = (id, userId) => client.delete(`/workspaces/${id}/members/${userId}`)
