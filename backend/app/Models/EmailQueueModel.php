<?php
namespace App\Models;
use CodeIgniter\Model;

class EmailQueueModel extends Model
{
    protected $table = 'email_queue';
    protected $primaryKey = 'id';
    protected $allowedFields = ['customer_id', 'recipient_email', 'subject', 'html_body', 'status', 'error_message', 'created_at', 'sent_at'];
    protected $useTimestamps = false;
}
