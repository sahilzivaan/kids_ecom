<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class AdminCustomerController extends ResourceController
{
    use ResponseTrait;

    public function index()
    {
        $db = \Config\Database::connect();
        
        $builder = $db->table('users');
        $builder->select('users.id, users.first_name, users.last_name, users.username, users.active, users.created_at');
        // Fetch emails from auth_identities if using Shield properly
        $builder->select('auth_identities.secret as email');
        $builder->join('auth_identities', "auth_identities.user_id = users.id AND auth_identities.type = 'email_password'", 'left');
        
        // Ensure they have the user role
        $builder->join('auth_groups_users', 'auth_groups_users.user_id = users.id', 'left');
        $builder->where('auth_groups_users.group', 'user');
        
        // Let's also fetch phone directly since it's on users table now
        $builder->select('users.phone');

        $users = $builder->get()->getResultArray();

        // Also fetch aggregated order stats per user
        $orders = $db->table('orders')->select('user_id, total_amount')->get()->getResultArray();
        $statsMap = [];
        foreach ($orders as $o) {
            $uid = $o['user_id'];
            if (!isset($statsMap[$uid])) {
                $statsMap[$uid] = ['total_orders' => 0, 'total_spent' => 0];
            }
            $statsMap[$uid]['total_orders']++;
            $amtStr = preg_replace('/[^0-9]/', '', $o['total_amount']);
            $statsMap[$uid]['total_spent'] += (int)$amtStr;
        }

        // Fetch latest city for each user
        $cities = $db->table('orders')
                     ->select('user_id, city')
                     ->where('city IS NOT NULL')
                     ->where('city !=', '')
                     ->orderBy('created_at', 'DESC')
                     ->get()->getResultArray();
                     
        $cityMap = [];
        foreach ($cities as $c) {
            if (!isset($cityMap[$c['user_id']])) {
                $cityMap[$c['user_id']] = $c['city'];
            }
        }

        $formatted = [];
        foreach ($users as $u) {
            $name = trim(($u['first_name'] ?? '') . ' ' . ($u['last_name'] ?? ''));
            if (!$name) $name = $u['username'] ?? 'Unknown';
            
            $uStats = $statsMap[$u['id']] ?? ['total_orders' => 0, 'total_spent' => 0];
            $uCity  = $cityMap[$u['id']] ?? 'Not provided';
            
            $formatted[] = [
                'id'       => $u['id'],
                'name'     => $name,
                'email'    => $u['email'] ?? 'N/A',
                'phone'    => $u['phone'] ?? 'N/A',
                'city'     => $uCity,
                'orders'   => $uStats['total_orders'],
                'spent'    => (float)$uStats['total_spent'],
                'status'   => empty($u['active']) ? 'Inactive' : 'Active',
                'joined'   => date('M j, Y', strtotime($u['created_at'])),
                'initials' => strtoupper(substr($u['first_name'] ?? $name, 0, 1))
            ];
        }

        return $this->respond(['customers' => $formatted]);
    }

    public function updateStatus($id = null)
    {
        $input = $this->request->getJSON(true);
        if (!$input) {
            $input = $this->request->getRawInput();
        }

        if (empty($input['status'])) {
            return $this->response->setStatusCode(400)->setJSON(['error' => 'Status is required']);
        }

        $active = $input['status'] === 'Active' ? 1 : 0;

        $db = \Config\Database::connect();
        $user = $db->table('users')->where('id', $id)->get()->getRow();
        
        if (!$user) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Customer not found']);
        }

        $db->table('users')
           ->where('id', $id)
           ->update(['active' => $active]);

        return $this->response->setJSON([
            'message' => 'Customer status updated successfully',
            'status'  => $input['status']
        ]);
    }
}
