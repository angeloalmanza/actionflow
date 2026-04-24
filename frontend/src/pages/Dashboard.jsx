import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getWorkspaces, createWorkspace, getStats } from '../api/workspaces'
import Layout from '../components/ui/Layout'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'

function StatCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value ?? 0}</p>
    </div>
  )
}

function WorkspaceStats({ workspaceId }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', workspaceId],
    queryFn:  () => getStats(workspaceId).then((r) => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>
  if (!stats) return null

  const chartData = (stats.tasks_per_day ?? []).map((d) => ({
    data: new Date(d.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
    task: Number(d.count),
  }))

  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Riunioni processate" value={stats.meetings_count} />
        <StatCard label="Task totali"         value={stats.tasks_total} />
        <StatCard label="In corso"            value={stats.tasks_in_progress} color="text-blue-600" />
        <StatCard label="Completati"          value={stats.tasks_done} color="text-green-600" />
      </div>

      {chartData.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Task creati — ultimi 7 giorni</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="data" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="task" name="Task" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-gray-400 text-sm">
          Nessun task creato negli ultimi 7 giorni
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const [modal, setModal]   = useState(false)
  const [name, setName]     = useState('')
  const [active, setActive] = useState(null)

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn:  () => getWorkspaces().then((r) => r.data),
  })

  useEffect(() => {
    if (workspaces?.length > 0 && !active) setActive(workspaces[0].id)
  }, [workspaces])

  const createMut = useMutation({
    mutationFn: () => createWorkspace({ name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['workspaces'])
      setModal(false)
      setName('')
      setActive(res.data.id)
      toast.success('Workspace creato!')
    },
    onError: () => toast.error('Errore nella creazione'),
  })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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
        <>
          <div className="flex gap-2 flex-wrap mb-4">
            {workspaces?.map((ws) => (
              <button
                key={ws.id}
                onClick={() => setActive(ws.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active === ws.id ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}
              >
                {ws.name}
              </button>
            ))}
          </div>

          {active && (
            <div className="flex gap-2 mb-2">
              <Button variant="secondary" size="sm" onClick={() => navigate(`/workspaces/${active}/board`)}>Board →</Button>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/workspaces/${active}/meetings`)}>Riunioni →</Button>
            </div>
          )}

          {active && <WorkspaceStats workspaceId={active} />}
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nuovo Workspace">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome workspace</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && createMut.mutate()}
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
