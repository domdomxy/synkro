<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SynkroNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $greetingName,
        public string $subjectLine,
        public array $lines,
        public ?string $actionUrl = null,
        public ?string $actionText = null,
    ) {}

    public function build()
    {
        return $this->subject($this->subjectLine)
            ->markdown('emails.notification');
    }
}