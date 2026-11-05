<?php

namespace Tests\Feature;

use App\Jobs\ProcessMeetingJob;
use App\Mail\TaskAssignedMail;
use App\Models\Meeting;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use OpenAI\Laravel\Facades\OpenAI;
use OpenAI\Responses\Chat\CreateResponse;
use RuntimeException;
use Tests\TestCase;

class ProcessMeetingJobTest extends TestCase
{
    use RefreshDatabase;

    private function fakeModelReply(array $tasks): void
    {
        OpenAI::fake([
            CreateResponse::fake([
                'choices' => [[
                    'message' => ['role' => 'assistant', 'content' => json_encode(['tasks' => $tasks])],
                ]],
            ]),
        ]);
    }

    public function test_job_creates_tasks_and_assigns_them_to_the_matching_members(): void
    {
        Mail::fake();

        $owner = User::factory()->create(['name' => 'Marco Rossi']);
        $anna = User::factory()->create(['name' => 'Anna Bianchi']);
        $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
        $workspace->members()->attach([$owner->id => ['role' => 'owner'], $anna->id => ['role' => 'member']]);
        $meeting = Meeting::factory()->create(['workspace_id' => $workspace->id]);

        $this->fakeModelReply([
            ['title' => 'Preparare la demo', 'assignee_name' => 'Anna', 'priority' => 'high', 'due_date' => '2026-12-01'],
            ['title' => 'Aggiornare il budget', 'assignee_name' => 'Marco Rossi'],
            ['title' => 'Chiamare il cliente', 'assignee_name' => 'Giuseppe'],
        ]);

        (new ProcessMeetingJob($meeting))->handle();

        $tasks = $meeting->fresh()->tasks;
        $this->assertCount(3, $tasks);
        $this->assertSame($anna->id, $tasks[0]->assignee_id);
        $this->assertSame('high', $tasks[0]->priority);
        $this->assertSame($owner->id, $tasks[1]->assignee_id);
        $this->assertNull($tasks[2]->assignee_id, 'Un nome senza corrispondenza non deve essere assegnato a nessuno');

        $this->assertSame('done', $meeting->fresh()->status);
        Mail::assertQueued(TaskAssignedMail::class, 2);
    }

    public function test_job_marks_the_meeting_as_failed_when_the_model_call_breaks(): void
    {
        $meeting = Meeting::factory()->create();

        OpenAI::fake([new RuntimeException('Servizio non disponibile')]);

        try {
            (new ProcessMeetingJob($meeting))->handle();
            $this->fail('Il job doveva rilanciare l\'eccezione');
        } catch (RuntimeException) {
            // atteso: il job rilancia così la coda può ritentare
        }

        $this->assertSame('failed', $meeting->fresh()->status);
    }
}
