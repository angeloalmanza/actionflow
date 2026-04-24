const styles = {
  pending:    'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800 animate-pulse',
  done:       'bg-green-100 text-green-800',
  failed:     'bg-red-100 text-red-800',
  low:        'bg-gray-100 text-gray-700',
  medium:     'bg-yellow-100 text-yellow-800',
  high:       'bg-red-100 text-red-800',
  todo:       'bg-gray-100 text-gray-700',
  in_progress:'bg-blue-100 text-blue-800',
}

const labels = {
  pending: 'In attesa', processing: 'In elaborazione', done: 'Completato',
  failed: 'Fallito', low: 'Bassa', medium: 'Media', high: 'Alta',
  todo: 'Da fare', in_progress: 'In corso',
}

export default function Badge({ value }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[value] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[value] ?? value}
    </span>
  )
}
