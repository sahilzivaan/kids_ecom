<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\NotificationModel;

class AdminNotificationController extends ResourceController
{
    public function index()
    {
        $notificationModel = new NotificationModel();
        
        $notifications = $notificationModel->orderBy('created_at', 'DESC')->findAll(10);
        
        $formatted = array_map(function($notif) {
            return [
                'id' => (int)$notif['id'],
                'text' => $notif['text'],
                'isNew' => (bool)$notif['is_new']
            ];
        }, $notifications);

        return $this->respond(['notifications' => $formatted]);
    }
}
