<x-mail::message>
# Ciao {{ $assignee->name }},

Ti è stato assegnato un nuovo task estratto dalla riunione.

<x-mail::panel>
**{{ $task->title }}**

@if($task->description)
{{ $task->description }}
@endif

- **Priorità:** {{ ucfirst($task->priority) }}
@if($task->due_date)
- **Scadenza:** {{ $task->due_date->format('d/m/Y') }}
@endif
</x-mail::panel>

Accedi alla board per aggiornare lo stato del task.

<x-mail::button :url="$appUrl">
Apri ActionFlow
</x-mail::button>

A presto,<br>
{{ config('app.name') }}
</x-mail::message>
