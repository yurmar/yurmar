<?php

namespace App\Mail;

use App\Models\BriefOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BriefOrderReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public BriefOrder $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Новый запрос на разработку: ' . $this->order->company_name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.brief-order',
        );
    }
}
