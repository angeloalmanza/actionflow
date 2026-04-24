<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessMeetingJob;
use App\Models\Meeting;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeetingController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        $this->authorizeWorkspace($workspace);

        $meetings = $workspace->meetings()
            ->withCount('tasks')
            ->latest()
            ->get();

        return response()->json($meetings);
    }

    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorizeWorkspace($workspace);

        $data = $request->validate([
            'title'          => 'required|string|max:255',
            'raw_transcript' => 'required|string|min:50',
        ]);

        $meeting = $workspace->meetings()->create([
            'title'          => $data['title'],
            'raw_transcript' => $data['raw_transcript'],
            'status'         => 'pending',
        ]);

        // Dispatcha il job in background — Redis lo metterà in coda
        ProcessMeetingJob::dispatch($meeting);

        return response()->json($meeting, 201);
    }

    public function show(Meeting $meeting): JsonResponse
    {
        $this->authorizeWorkspace($meeting->workspace);

        return response()->json(
            $meeting->load(['tasks.assignee'])
        );
    }

    public function retry(Meeting $meeting): JsonResponse
    {
        $this->authorizeWorkspace($meeting->workspace);

        abort_unless($meeting->status === 'failed', 422, 'Solo i meeting falliti possono essere riprovati.');

        $meeting->tasks()->delete();
        $meeting->update(['status' => 'pending']);

        ProcessMeetingJob::dispatch($meeting);

        return response()->json($meeting);
    }

    private function authorizeWorkspace(Workspace $workspace): void
    {
        abort_unless(
            $workspace->members()->where('user_id', auth()->id())->exists(),
            403
        );
    }
}
