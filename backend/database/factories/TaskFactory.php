<?php

namespace Database\Factories;

use App\Models\Meeting;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Task> */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'meeting_id' => Meeting::factory(),
            'workspace_id' => fn (array $attributes) => Meeting::find($attributes['meeting_id'])->workspace_id,
            'title' => fake()->sentence(4),
            'status' => 'todo',
            'priority' => 'medium',
            'position' => 0,
        ];
    }
}
