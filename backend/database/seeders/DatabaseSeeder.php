<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Utente demo principale
        $owner = User::factory()->create([
            'name'  => 'Angelo Demo',
            'email' => 'demo@actionflow.dev',
            'password' => bcrypt('password'),
        ]);

        // Due colleghi nel team
        $alice = User::factory()->create(['name' => 'Alice Rossi', 'email' => 'alice@actionflow.dev', 'password' => bcrypt('password')]);
        $bob   = User::factory()->create(['name' => 'Bob Verdi',   'email' => 'bob@actionflow.dev',   'password' => bcrypt('password')]);

        // Workspace di esempio
        $workspace = \App\Models\Workspace::create([
            'name'     => 'Progetto ActionFlow',
            'owner_id' => $owner->id,
        ]);

        // Aggiungi tutti come membri
        $workspace->members()->attach($owner->id, ['role' => 'owner']);
        $workspace->members()->attach($alice->id, ['role' => 'member']);
        $workspace->members()->attach($bob->id,   ['role' => 'member']);

        // Meeting di esempio già processato
        $meeting = $workspace->meetings()->create([
            'title'          => 'Sprint Planning — Settimana 1',
            'raw_transcript' => 'Angelo: iniziamo con il setup del progetto. Alice puoi occuparti del design del kanban entro venerdì? Alice: sì nessun problema. Bob puoi configurare il CI/CD entro giovedì? Bob: perfetto, lo faccio. Angelo: io mi occupo dell\'integrazione OpenAI, priorità alta.',
            'status'         => 'done',
            'processed_at'   => now(),
        ]);

        // Task già estratti (come se l'AI li avesse creati)
        $tasks = [
            ['title' => 'Design componente Kanban Board', 'assignee_id' => $alice->id, 'due_date' => now()->addDays(4), 'priority' => 'medium', 'status' => 'in_progress'],
            ['title' => 'Configurare CI/CD pipeline',     'assignee_id' => $bob->id,   'due_date' => now()->addDays(3), 'priority' => 'medium', 'status' => 'todo'],
            ['title' => 'Integrare API OpenAI',           'assignee_id' => $owner->id, 'due_date' => now()->addDays(5), 'priority' => 'high',   'status' => 'todo'],
        ];

        foreach ($tasks as $i => $task) {
            $meeting->tasks()->create(array_merge($task, [
                'workspace_id' => $workspace->id,
                'position'     => $i,
            ]));
        }
    }
}
