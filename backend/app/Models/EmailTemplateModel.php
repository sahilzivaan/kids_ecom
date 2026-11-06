<?php
namespace App\Models;
use CodeIgniter\Model;

class EmailTemplateModel extends Model
{
    protected $table = 'email_templates';
    protected $primaryKey = 'id';
    protected $allowedFields = ['trigger_name', 'subject', 'html_content', 'is_active'];
    protected $useTimestamps = false;
}
