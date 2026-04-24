import client from './client'

export const getMeetings  = (workspaceId)        => client.get(`/workspaces/${workspaceId}/meetings`)
export const createMeeting = (workspaceId, data) => client.post(`/workspaces/${workspaceId}/meetings`, data)
export const getMeeting   = (id)                 => client.get(`/meetings/${id}`)
export const retryMeeting = (id)                 => client.post(`/meetings/${id}/retry`)
