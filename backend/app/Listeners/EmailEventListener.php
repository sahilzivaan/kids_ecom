<?php

namespace App\Listeners;

use App\Models\EmailTemplateModel;
use App\Models\EmailQueueModel;

/**
 * EmailEventListener
 *
 * Central listener for all email-related CI4 events.
 * Triggered via Events::trigger() from controllers — keeps
 * email queue logic completely out of business controllers.
 *
 * Each method receives a single associative-array payload
 * and is responsible for:
 *   1. Loading the correct template by trigger_name
 *   2. Replacing placeholders
 *   3. Inserting into email_queue
 */
class EmailEventListener
{
    private EmailTemplateModel $templateModel;
    private EmailQueueModel    $queueModel;

    public function __construct()
    {
        $this->templateModel = new EmailTemplateModel();
        $this->queueModel    = new EmailQueueModel();
    }

    // ------------------------------------------------------------------
    // Internal helper — resolves template, replaces placeholders, queues
    // ------------------------------------------------------------------
    private function queue(string $triggerName, array $placeholders, int $customerId, string $recipientEmail): void
    {
        $template = $this->templateModel
            ->where('trigger_name', $triggerName)
            ->where('is_active', 1)
            ->first();

        if (!$template) {
            log_message('warning', "EmailEventListener: no active template found for trigger '{$triggerName}'");
            return;
        }

        $find    = array_map(fn($k) => '{{' . $k . '}}', array_keys($placeholders));
        $replace = array_values($placeholders);

        $subject = str_replace($find, $replace, $template['subject']);
        $body    = str_replace($find, $replace, $template['html_content']);

        $this->queueModel->insert([
            'customer_id'     => $customerId,
            'recipient_email' => $recipientEmail,
            'subject'         => $subject,
            'html_body'       => $body,
            'status'          => 'pending',
            'created_at'      => date('Y-m-d H:i:s'),
        ]);

        log_message('info', "EmailEventListener: queued '{$triggerName}' email to {$recipientEmail}");
    }

    // ------------------------------------------------------------------
    // Listener: order_placed
    // Payload keys: customer_id, recipient_email, order_number,
    //               customer_name, items_count, total_amount
    // ------------------------------------------------------------------
    public function onOrderPlaced(array $payload): void
    {
        $this->queue('order_placed', [
            'order_number'  => $payload['order_number']  ?? '',
            'customer_name' => $payload['customer_name'] ?? 'Customer',
            'items_count'   => $payload['items_count']   ?? 0,
            'total_amount'  => $payload['total_amount']  ?? '',
        ], $payload['customer_id'], $payload['recipient_email']);
    }

    // ------------------------------------------------------------------
    // Listener: order_status_changed
    // Payload keys: customer_id, recipient_email, order_number,
    //               customer_name, order_status, total_amount
    // ------------------------------------------------------------------
    public function onOrderStatusChanged(array $payload): void
    {
        $this->queue('order_status_changed', [
            'order_number'  => $payload['order_number']  ?? '',
            'customer_name' => $payload['customer_name'] ?? 'Customer',
            'order_status'  => $payload['order_status']  ?? '',
            'total_amount'  => $payload['total_amount']  ?? '',
        ], $payload['customer_id'], $payload['recipient_email']);
    }

    // ------------------------------------------------------------------
    // Listener: order_cancelled
    // Payload keys: customer_id, recipient_email, order_number,
    //               customer_name, total_amount
    // ------------------------------------------------------------------
    public function onOrderCancelled(array $payload): void
    {
        $this->queue('order_cancelled', [
            'order_number'  => $payload['order_number']  ?? '',
            'customer_name' => $payload['customer_name'] ?? 'Customer',
            'total_amount'  => $payload['total_amount']  ?? '',
        ], $payload['customer_id'], $payload['recipient_email']);
    }

    // ------------------------------------------------------------------
    // Listener: customer_registered
    // Payload keys: customer_id, recipient_email, customer_name,
    //               customer_email
    // ------------------------------------------------------------------
    public function onCustomerRegistered(array $payload): void
    {
        $this->queue('customer_registered', [
            'customer_name'  => $payload['customer_name']  ?? '',
            'customer_email' => $payload['customer_email'] ?? '',
        ], $payload['customer_id'], $payload['recipient_email']);
    }
}
