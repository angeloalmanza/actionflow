<?php

namespace App\Jobs;

use App\Mail\TaskAssignedMail;
use App\Models\Meeting;
use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;
use OpenAI\Laravel\Facades\OpenAI;
use Throwable;

class ProcessMeetingJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(public Meeting $meeting) {}

    public function handle(): void
    {
        $this->meeting->update(['status' => 'processing']);

        try {
            $extractedTasks = $this->extractTasksFromTranscript();
            $members        = $this->meeting->workspace->members()->get();

            foreach ($extractedTasks as $index => $taskData) {
                $assignee = $this->matchAssignee($taskData['assignee_name'] ?? null, $members);

                $task = Task::create([
                    'meeting_id'   => $this->meeting->id,
                    'workspace_id' => $this->meeting->workspace_id,
                    'assignee_id'  => $assignee?->id,
                    'title'        => $taskData['title'],
                    'description'  => $taskData['description'] ?? null,
                    'due_date'     => $taskData['due_date'] ?? null,
                    'priority'     => $taskData['priority'] ?? 'medium',
                    'status'       => 'todo',
                    'position'     => $index,
                ]);

                if ($assignee) {
                    Mail::to($assignee->email)->queue(new TaskAssignedMail($task, $assignee));
                }
            }

            $this->meeting->update([
                'status'       => 'done',
                'processed_at' => now(),
            ]);
        } catch (Throwable $e) {
            $this->meeting->update(['status' => 'failed']);
            throw $e;
        }
    }

    private function extractTasksFromTranscript(): array
    {
        $response = OpenAI::chat()->create([
            'model'           => 'llama-3.3-70b-versatile',
            'response_format' => ['type' => 'json_object'],
            'messages'        => [
                [
                    'role'    => 'system',
                    'content' => 'Sei un assistente che estrae action items da trascrizioni di riunioni. Rispondi sempre in JSON valido.',
                ],
                [
                    'role'    => 'user',
                    'content' => $this->buildPrompt(),
                ],
            ],
        ]);

        $content = $response->choices[0]->message->content;
        $decoded = json_decode($content, true);

        return $decoded['tasks'] ?? [];
    }

    private function buildPrompt(): string
    {
        return <<<PROMPT
Analizza questa trascrizione di riunione ed estrai tutti gli action items assegnati a persone specifiche.

Per ogni action item restituisci un oggetto JSON con questi campi:
- "title": titolo breve e chiaro del task (max 80 caratteri)
- "description": descrizione più dettagliata se disponibile, altrimenti null
- "assignee_name": nome della persona a cui è assegnato il task, esattamente come appare nella trascrizione
- "due_date": data di scadenza in formato YYYY-MM-DD se menzionata, altrimenti null
- "priority": "low", "medium" o "high" in base all'urgenza percepita

Rispondi con questo formato JSON:
{"tasks": [...]}

Trascrizione:
{$this->meeting->raw_transcript}
PROMPT;
    }

    private function matchAssignee(string|null $name, $members): User|null
    {
        if (! $name) {
            return null;
        }

        $bestMatch  = null;
        $bestScore  = 0;
        $nameLower  = strtolower(trim($name));

        foreach ($members as $member) {
            // Confronta con nome completo e solo con il primo nome
            $fullName  = strtolower($member->name);
            $firstName = strtolower(explode(' ', $member->name)[0]);

            similar_text($nameLower, $fullName, $scoreFullName);
            similar_text($nameLower, $firstName, $scoreFirstName);
            $score = max($scoreFullName, $scoreFirstName);

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestMatch = $member;
            }
        }

        // Accetta solo match con almeno 60% di somiglianza
        return $bestScore >= 60 ? $bestMatch : null;
    }
}
