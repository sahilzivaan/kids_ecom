<?php
namespace App\Controllers\Api;
use CodeIgniter\RESTful\ResourceController;
use App\Models\EmailSettingModel;
use App\Models\EmailTemplateModel;
use App\Models\EmailQueueModel;

class AdminEmailController extends ResourceController
{
    public function getSettings()
    {
        $model = new EmailSettingModel();
        $settings = $model->find(1);
        if (!$settings) {
            $settings = ['id' => 1, 'smtp_host' => '', 'smtp_port' => 587, 'smtp_user' => '', 'smtp_pass' => '', 'smtp_encryption' => 'tls', 'from_email' => '', 'from_name' => ''];
            $model->insert($settings);
        }
        // Mask password for security
        if (!empty($settings['smtp_pass'])) {
            $settings['smtp_pass'] = '********';
        }
        return $this->respond($settings);
    }

    public function updateSettings()
    {
        $model = new EmailSettingModel();
        $data = $this->request->getJSON(true);
        if (isset($data['smtp_pass']) && $data['smtp_pass'] === '********') {
            unset($data['smtp_pass']);
        }
        $model->update(1, $data);
        return $this->respond(['message' => 'Settings updated successfully']);
    }

    public function getTemplates()
    {
        $model = new EmailTemplateModel();
        return $this->respond(['templates' => $model->findAll()]);
    }

    public function updateTemplate($id = null)
    {
        $model = new EmailTemplateModel();
        $data = $this->request->getJSON(true);
        $model->update($id, $data);
        return $this->respond(['message' => 'Template updated successfully']);
    }

    public function getLogs()
    {
        $model = new EmailQueueModel();
        $builder = $model->builder();
        $builder->select('email_queue.*, CONCAT(users.first_name, " ", users.last_name) as customer_name');
        $builder->join('users', 'users.id = email_queue.customer_id', 'left');
        
        $status = $this->request->getGet('status');
        if ($status) {
            $builder->where('email_queue.status', $status);
        }
        
        $search = $this->request->getGet('search');
        if ($search) {
            $builder->groupStart()
                    ->like('users.first_name', $search)
                    ->orLike('users.last_name', $search)
                    ->orLike('email_queue.recipient_email', $search)
                    ->orLike('email_queue.subject', $search)
                    ->groupEnd();
        }
        
        $builder->orderBy('email_queue.id', 'DESC');
        $logs = $builder->get()->getResult();
        
        return $this->respond(['logs' => $logs]);
    }
}
