<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\Events\Events;

class AdminOrderController extends BaseController
{
    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    public function index()
    {
        // Join orders with the users table to get the customer's username and email.
        $orders = $this->db->table('orders')
                           ->select('orders.*, users.username as customer_name, users.first_name, users.last_name')
                           ->join('users', 'users.id = orders.user_id', 'left')
                           ->orderBy('orders.created_at', 'DESC')
                           ->get()
                           ->getResultArray();

        foreach ($orders as &$order) {
            $name = trim(($order['first_name'] ?? '') . ' ' . ($order['last_name'] ?? ''));
            if (!$name) $name = $order['customer_name']; // fallback to username
            $order['customer_name'] = $name;
        }

        return $this->response->setJSON(['orders' => $orders]);
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

        // Fetch order with customer details before updating
        $order = $this->db->table('orders')
                          ->select('orders.*, auth_identities.secret as customer_email, users.first_name, users.last_name, users.username')
                          ->join('users', 'users.id = orders.user_id', 'left')
                          ->join('auth_identities', 'auth_identities.user_id = users.id AND auth_identities.type = "email_password"', 'left')
                          ->where('orders.id', $id)
                          ->get()
                          ->getRow();

        if (!$order) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Order not found']);
        }

        $newStatus = $input['status'];

        if ($newStatus === 'Cancelled' && $order->status !== 'Cancelled') {
            $items = json_decode($order->items, true);
            if (is_array($items)) {
                foreach ($items as $item) {
                    $qty = isset($item['quantity']) ? (int)$item['quantity'] : 1;
                    
                    if (!empty($item['variant_id'])) {
                        $this->db->table('product_variants')
                                 ->set('stock', 'stock + ' . $qty, false)
                                 ->where('id', $item['variant_id'])
                                 ->update();
                    } elseif (!empty($item['product_id'])) {
                        $this->db->table('products')
                                 ->set('stock', 'stock + ' . $qty, false)
                                 ->where('id', $item['product_id'])
                                 ->update();
                    }
                }
            }
        }

        $this->db->table('orders')
                 ->where('id', $id)
                 ->update(['status' => $newStatus, 'updated_at' => date('Y-m-d H:i:s')]);

        // Fire email event — EmailEventListener handles template + queue
        $recipientEmail = $order->delivery_email ?? $order->customer_email ?? null;
        $customerName   = trim(($order->first_name ?? '') . ' ' . ($order->last_name ?? ''));
        if (!$customerName) $customerName = $order->username ?? 'Customer';

        if ($recipientEmail) {
            $eventName = ($newStatus === 'Cancelled') ? 'email_order_cancelled' : 'email_order_status_changed';

            Events::trigger($eventName, [
                'customer_id'     => $order->user_id,
                'recipient_email' => $recipientEmail,
                'order_number'    => $order->order_number,
                'customer_name'   => $customerName,
                'order_status'    => $newStatus,
                'total_amount'    => $order->total_amount ?? '',
            ]);
        }

        return $this->response->setJSON([
            'message' => 'Order status updated successfully',
            'status'  => $newStatus,
        ]);
    }
}
