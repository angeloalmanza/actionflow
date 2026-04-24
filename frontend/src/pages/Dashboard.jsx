import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWorkspaces, createWorkspace } from '../api/workspaces'
import Layout from '../components/ui/Layout'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const [modal, setModal] = useState(false)
  const [name, setName]   = useState('')

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => getWorkspaces().then((r) => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => createWorkspace({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces'])
      setModal(false)
      setName('')
      toast.success('Workspace creato!')
    },
    onError: () => toast.error('Errore nella creazione'),
  })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">I tuoi Workspace</h1>
        <Button onClick={() => setModal(true)}>+ Nuovo Workspace</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : workspaces?.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-4">Nessun workspace ancora</p>
          <Button onClick={() => setModal(true)}>Crea il primo</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces?.map((ws) => (
            <div
              key={ws.id}
              onClick={() => navigate(`/workspaces/${ws.id}/board`)}
              className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all"
            >
              <h2 className="font-semibold text-gray-900 mb-3">{ws.name}</h2>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>{ws.members_count ?? 0} membri</span>
                <span>{ws.meetings_count ?? 0} riunioni</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nuovo Workspace">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome workspace</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createMut.mutate()}
              placeholder="es. Progetto Client X"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Annulla</Button>
            <Button loading={createMut.isPending} onClick={() => createMut.mutate()} disabled={!name.trim()}>Crea</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
