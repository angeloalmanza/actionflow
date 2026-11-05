<?php

namespace Tests\Feature;

use App\Jobs\ProcessMeetingJob;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MeetingApiTest extends TestCase
{
    use RefreshDatabase;

    private function workspaceWithMember(): array
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create(['owner_id' => $user->id]);
        $workspace->members()->attach($user->id, ['role' => 'owner']);

        return [$user, $workspace];
    }

    public function test_creating_a_meeting_dispatches_the_processing_job(): void
    {
        Queue::fake();
        [$user, $workspace] = $this->workspaceWithMember();
        Sanctum::actingAs($user);

        $this->postJson("/api/workspaces/{$workspace->id}/meetings", [
            'title' => 'Riunione settimanale',
            'raw_transcript' => str_repeat('Discussione sul progetto. ', 10),
        ])->assertCreated()->assertJsonPath('status', 'pending');

        Queue::assertPushed(ProcessMeetingJob::class, 1);
        $this->assertDatabaseHas('meetings', ['title' => 'Riunione settimanale']);
    }

    public function test_a_too_short_transcript_is_rejected(): void
    {
        Queue::fake();
        [$user, $workspace] = $this->workspaceWithMember();
        Sanctum::actingAs($user);

        $this->postJson("/api/workspaces/{$workspace->id}/meetings", [
            'title' => 'Riunione',
            'raw_transcript' => 'Troppo corta.',
        ])->assertUnprocessable()->assertJsonValidationErrors('raw_transcript');

        Queue::assertNothingPushed();
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        Queue::fake();
        $workspace = Workspace::factory()->create();

        $this->postJson("/api/workspaces/{$workspace->id}/meetings", [
            'title' => 'Riunione',
            'raw_transcript' => str_repeat('Discussione sul progetto. ', 10),
        ])->assertUnauthorized();

        Queue::assertNothingPushed();
    }

    public function test_non_members_cannot_create_meetings(): void
    {
        Queue::fake();
        $workspace = Workspace::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/workspaces/{$workspace->id}/meetings", [
            'title' => 'Riunione',
            'raw_transcript' => str_repeat('Discussione sul progetto. ', 10),
        ])->assertForbidden();

        Queue::assertNothingPushed();
    }
}
