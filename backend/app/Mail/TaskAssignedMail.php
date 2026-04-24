<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public \App\Models\Task $task,
        public \App\Models\User $assignee,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Nuovo task assegnato: {$this->task->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.task-assigned',
            with: [
                'task'     => $this->task,
                'assignee' => $this->assignee,
                'appUrl'   => env('APP_URL', 'http://localhost'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
