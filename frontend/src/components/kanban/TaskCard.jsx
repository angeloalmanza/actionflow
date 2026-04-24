import { Draggable } from '@hello-pangea/dnd'
import Badge from '../ui/Badge'

const priorityBorder = { low: 'border-l-gray-300', medium: 'border-l-yellow-400', high: 'border-l-red-500' }

function Avatar({ name }) {
  const initials = name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
      {initials}
    </span>
  )
}

export default function TaskCard({ task, index }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg border-l-4 border border-gray-200 p-3 mb-2 shadow-sm
            ${priorityBorder[task.priority]}
            ${snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'}
            transition-shadow cursor-grab active:cursor-grabbing`}
        >
          <p className="text-sm font-medium text-gray-900 mb-2 leading-snug">{task.title}</p>

          <div className="flex items-center justify-between">
            <Badge value={task.priority} />
            <div className="flex items-center gap-2">
              {task.due_date && (
                <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                  {new Date(task.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                </span>
              )}
              {task.assignee && <Avatar name={task.assignee.name} />}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
