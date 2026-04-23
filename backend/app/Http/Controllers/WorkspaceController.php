<?php

namespace App\Http\Controllers;

use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspaces = $request->user()
            ->workspaces()
            ->withCount('members', 'meetings')
            ->get();

        return response()->json($workspaces);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $workspace = Workspace::create([
            'name'     => $data['name'],
            'owner_id' => $request->user()->id,
        ]);

        // L'owner viene aggiunto anche come membro con ruolo owner
        $workspace->members()->attach($request->user()->id, ['role' => 'owner']);

        return response()->json($workspace->load('owner'), 201);
    }

    public function show(Workspace $workspace): JsonResponse
    {
        $this->authorizeWorkspace($workspace);

        return response()->json(
            $workspace->load(['owner', 'members'])
                      ->loadCount(['meetings', 'tasks'])
        );
    }

    public function addMember(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorizeOwner($workspace, $request->user());

        $data = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = \App\Models\User::where('email', $data['email'])->first();

        if ($workspace->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Utente già membro.'], 422);
        }

        $workspace->members()->attach($user->id, ['role' => 'member']);

        return response()->json(['message' => 'Membro aggiunto.']);
    }

    public function removeMember(Request $request, Workspace $workspace, int $userId): JsonResponse
    {
        $this->authorizeOwner($workspace, $request->user());

        if ($userId === $workspace->owner_id) {
            return response()->json(['message' => 'Non puoi rimuovere il proprietario.'], 422);
        }

        $workspace->members()->detach($userId);

        return response()->json(['message' => 'Membro rimosso.']);
    }

    public function stats(Workspace $workspace): JsonResponse
    {
        $this->authorizeWorkspace($workspace);

        $tasks = $workspace->tasks();

        return response()->json([
            'meetings_count'        => $workspace->meetings()->count(),
            'tasks_total'           => $tasks->count(),
            'tasks_done'            => $tasks->clone()->where('status', 'done')->count(),
            'tasks_in_progress'     => $tasks->clone()->where('status', 'in_progress')->count(),
            'tasks_todo'            => $tasks->clone()->where('status', 'todo')->count(),
            'tasks_per_day'         => $tasks->clone()
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->where('created_at', '>=', now()->subDays(7))
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
        ]);
    }

    private function authorizeWorkspace(Workspace $workspace): void
    {
        abort_unless(
            $workspace->members()->where('user_id', auth()->id())->exists(),
            403
        );
    }

    private function authorizeOwner(Workspace $workspace, $user): void
    {
        abort_unless($workspace->owner_id === $user->id, 403);
    }
}
