import { Droppable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'

const columnStyles = {
  todo:        { header: 'bg-gray-100 text-gray-700',   dot: 'bg-gray-400',  label: 'Da fare' },
  in_progress: { header: 'bg-blue-50 text-blue-700',    dot: 'bg-blue-500',  label: 'In corso' },
  done:        { header: 'bg-green-50 text-green-700',  dot: 'bg-green-500', label: 'Completati' },
}

export default function Column({ status, tasks }) {
  const { header, dot, label } = columnStyles[status]

  return (
    <div className="flex-1 min-w-0">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-3 ${header}`}>
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="font-semibold text-sm">{label}</span>
        <span className="ml-auto text-xs font-medium opacity-70">{tasks.length}</span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-24 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50' : ''}`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
