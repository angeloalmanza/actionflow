import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DragDropContext } from '@hello-pangea/dnd'
import { getWorkspace } from '../api/workspaces'
import { updateTask } from '../api/tasks'
import Layout from '../components/ui/Layout'
import Column from '../components/kanban/Column'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'

const COLUMNS = ['todo', 'in_progress', 'done']

export default function Board() {
  const { workspaceId } = useParams()
  const queryClient     = useQueryClient()
  const [filterAssignee, setFilterAssignee] = useState(null)

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn:  () => getWorkspace(workspaceId).then((r) => r.data),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onError: () => {
      toast.error('Errore aggiornamento task')
      queryClient.invalidateQueries(['workspace', workspaceId])
    },
  })

  const onDragEnd = (result) => {
    const { draggableId, destination, source } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // Aggiornamento ottimistico — aggiorna lo stato locale prima della risposta API
    queryClient.setQueryData(['workspace', workspaceId], (old) => {
      if (!old) return old
      const tasks = old.tasks.map((t) =>
        t.id === Number(draggableId)
          ? { ...t, status: destination.droppableId, position: destination.index }
          : t,
      )
      return { ...old, tasks }
    })

    updateMut.mutate({
      id:   Number(draggableId),
      data: { status: destination.droppableId, position: destination.index },
    })
  }

  if (isLoading) return <Layout><div className="flex justify-center py-20"><Spinner /></div></Layout>

  const allTasks    = workspace?.tasks ?? []
  const members     = workspace?.members ?? []
  const filtered    = filterAssignee ? allTasks.filter((t) => t.assignee_id === filterAssignee) : allTasks
  const tasksByCol  = (col) => filtered.filter((t) => t.status === col).sort((a, b) => a.position - b.position)

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{workspace?.name}</h1>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filtra:</span>
          <button
            onClick={() => setFilterAssignee(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filterAssignee ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Tutti
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setFilterAssignee(filterAssignee === m.id ? null : m.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterAssignee === m.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {m.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4">
          {COLUMNS.map((col) => (
            <Column key={col} status={col} tasks={tasksByCol(col)} />
          ))}
        </div>
      </DragDropContext>

      {allTasks.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>Nessun task ancora. Processa una riunione per crearne automaticamente.</p>
        </div>
      )}
    </Layout>
  )
}
