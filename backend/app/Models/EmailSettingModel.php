<?php
namespace App\Models;
use CodeIgniter\Model;

class EmailSettingModel extends Model
{
    protected $table = 'email_settings';
    protected $primaryKey = 'id';
    protected $allowedFields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_encryption', 'from_email', 'from_name'];
    protected $useTimestamps = false;
}
