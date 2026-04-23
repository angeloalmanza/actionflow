<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function update(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTask($task);

        $data = $request->validate([
            'status'   => 'sometimes|in:todo,in_progress,done',
            'position' => 'sometimes|integer|min:0',
            'assignee_id' => 'sometimes|nullable|exists:users,id',
            'due_date' => 'sometimes|nullable|date',
            'priority' => 'sometimes|in:low,medium,high',
        ]);

        $task->update($data);

        return response()->json($task->load('assignee'));
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->authorizeTask($task);

        $task->delete();

        return response()->json(['message' => 'Task eliminato.']);
    }

    private function authorizeTask(Task $task): void
    {
        abort_unless(
            $task->workspace->members()->where('user_id', auth()->id())->exists(),
            403
        );
    }
}
