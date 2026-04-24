import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMeetings, createMeeting, retryMeeting } from '../api/meetings'
import Layout from '../components/ui/Layout'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function Meetings() {
  const { workspaceId } = useParams()
  const navigate        = useNavigate()
  const queryClient     = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState({ title: '', raw_transcript: '' })

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings', workspaceId],
    queryFn:  () => getMeetings(workspaceId).then((r) => r.data),
    // Polling ogni 4 secondi se ci sono meeting in elaborazione
    refetchInterval: (data) =>
      data?.some((m) => m.status === 'pending' || m.status === 'processing') ? 4000 : false,
  })

  const createMut = useMutation({
    mutationFn: () => createMeeting(workspaceId, form),
    onSuccess: () => {
      queryClient.invalidateQueries(['meetings', workspaceId])
      setModal(false)
      setForm({ title: '', raw_transcript: '' })
      toast.success('Riunione inviata — estrazione task in corso...')
    },
    onError: (err) => {
      const errors = err.response?.data?.errors
      if (errors) Object.values(errors).flat().forEach((m) => toast.error(m))
      else toast.error('Errore durante l\'invio')
    },
  })

  const retryMut = useMutation({
    mutationFn: (id) => retryMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['meetings', workspaceId])
      toast.success('Rielaborazione avviata...')
    },
  })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Riunioni</h1>
        <Button onClick={() => setModal(true)}>+ Nuova Riunione</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : meetings?.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="mb-4">Nessuna riunione ancora. Incolla la trascrizione di una riunione per estrarre i task automaticamente.</p>
          <Button onClick={() => setModal(true)}>Inizia ora</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings?.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-indigo-300 transition-colors"
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => m.status === 'done' && navigate(`/workspaces/${workspaceId}/board`)}
              >
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium text-gray-900">{m.title}</h3>
                  <Badge value={m.status} />
                </div>
                <p className="text-sm text-gray-400">
                  {new Date(m.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  {m.tasks_count > 0 && ` · ${m.tasks_count} task estratti`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {m.status === 'processing' && <Spinner className="h-5 w-5" />}
                {m.status === 'failed' && (
                  <Button variant="danger" size="sm" onClick={() => retryMut.mutate(m.id)} loading={retryMut.isPending}>
                    Riprova
                  </Button>
                )}
                {m.status === 'done' && (
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/workspaces/${workspaceId}/board`)}>
                    Vedi Board →
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nuova Riunione">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo riunione</label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="es. Sprint Planning — Settimana 5"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trascrizione della riunione
            </label>
            <textarea
              rows={8}
              value={form.raw_transcript}
              onChange={(e) => setForm({ ...form, raw_transcript: e.target.value })}
              placeholder="Incolla qui la trascrizione o le note della riunione. L'AI estrarrà automaticamente i task e li assegnerà ai membri del team..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{form.raw_transcript.length} caratteri (minimo 50)</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Annulla</Button>
            <Button
              loading={createMut.isPending}
              onClick={() => createMut.mutate()}
              disabled={!form.title.trim() || form.raw_transcript.length < 50}
            >
              Estrai Task con AI
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
