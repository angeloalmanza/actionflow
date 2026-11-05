<?php

namespace Database\Factories;

use App\Models\Meeting;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Meeting> */
class MeetingFactory extends Factory
{
    protected $model = Meeting::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'title' => fake()->sentence(3),
            'raw_transcript' => fake()->paragraphs(3, true),
            'status' => 'pending',
        ];
    }
}
