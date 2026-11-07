<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class OrderController extends ResourceController
{
    use ResponseTrait;

    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    public function index()
    {
        $user = $this->request->user;
        if (!$user) return $this->failUnauthorized();

        $orders = $this->db->table('orders')
                         ->where('user_id', $user->uid)
                         ->orderBy('created_at', 'DESC')
                         ->get()->getResult();

        return $this->respond(['orders' => $orders]);
    }

    public function create()
    {
        $user = $this->request->user;
        if (!$user) return $this->failUnauthorized();

        $data = $this->request->getJSON(true);
        if (!$data) {
            return $this->failValidationError('Invalid order payload');
        }

        $orderNumber = 'CF-' . mt_rand(10000, 99999);
        $trackingNumber = 'TRK-' . mt_rand(10000000, 99999999);
        
        $orderData = [
            'user_id'          => $user->uid,
            'order_number'     => $orderNumber,
            'items_count'      => isset($data['items_count']) ? (int)$data['items_count'] : 1,
            'total_amount'     => $data['total_amount'] ?? '₹0',
            'payment_method'   => $data['payment_method'] ?? 'UPI',
            'city'             => $data['city'] ?? null,
            'shipping_address' => $data['shipping_address'] ?? null,
            'delivery_name'    => $data['delivery_name'] ?? null,
            'delivery_email'   => $data['delivery_email'] ?? null,
            'delivery_phone'   => $data['delivery_phone'] ?? null,
            'items'            => isset($data['items']) ? (is_string($data['items']) ? $data['items'] : json_encode($data['items'])) : null,
            'coupon_code'      => (!empty($data['coupon_code'])) ? $data['coupon_code'] : null,
            'discount_amount'  => isset($data['discount_amount']) ? (float)$data['discount_amount'] : 0.00,
            'status'           => 'Pending',
            'tracking_number'  => $trackingNumber,
            'created_at'       => date('Y-m-d H:i:s'),
            'updated_at'       => date('Y-m-d H:i:s'),
        ];

        $this->db->table('orders')->insert($orderData);
        $orderData['id'] = $this->db->insertID();
        
        if (!empty($data['coupon_code'])) {
            $this->db->table('coupons')
                 ->where('code', $data['coupon_code'])
                 ->set('usage_count', 'usage_count + 1', false)
                 ->update();
        }

        
        // Save the address information to the user's profile
        $users = auth()->getProvider();
        $userRecord = $users->findById($user->uid);
        if ($userRecord) {
            $userRecord->fill([
                'address_line1' => $data['shipping_address'] ?? null,
                'address_line2' => $data['address_line2'] ?? null,
                'city'          => $data['city'] ?? null,
                'state'         => $data['state'] ?? null,
                'pincode'       => $data['pincode'] ?? null,
                'phone'         => $data['delivery_phone'] ?? $userRecord->phone,
            ]);
            $users->save($userRecord);
        }
        
        // Also clear their cart upon ordering
        $this->db->table('cart_items')->where('user_id', $user->uid)->delete();

        // Decrease stock for each item safely
        $itemsList = $data['items'] ?? [];
        if (is_string($itemsList)) {
            $itemsList = json_decode($itemsList, true) ?: [];
        }
        if (is_array($itemsList)) {
            foreach ($itemsList as $item) {
                $qty = isset($item['quantity']) ? (int)$item['quantity'] : 1;
                if ($qty <= 0) $qty = 1;
                
                if (!empty($item['variant_id'])) {
                    $this->db->table('product_variants')
                             ->set('stock', "GREATEST(0, stock - {$qty})", false)
                             ->where('id', $item['variant_id'])
                             ->update();
                }
                if (!empty($item['product_id'])) {
                    $this->db->table('products')
                             ->set('stock', "GREATEST(0, stock - {$qty})", false)
                             ->where('id', $item['product_id'])
                             ->update();
                }
            }
        }

        // Fire email event — EmailEventListener handles template + queue
        if (!empty($orderData['delivery_email'])) {
            \CodeIgniter\Events\Events::trigger('email_order_placed', [
                'customer_id'    => $user->uid,
                'recipient_email'=> $orderData['delivery_email'],
                'order_number'   => $orderData['order_number'],
                'customer_name'  => $orderData['delivery_name'] ?? 'Customer',
                'items_count'    => $orderData['items_count'],
                'total_amount'   => $orderData['total_amount'],
            ]);
        }

        // Create Admin Notification
        $this->db->table('notifications')->insert([
            'text'       => '📦 New order ' . $orderData['order_number'],
            'is_new'     => 1,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->respondCreated(['message' => 'Order placed successfully', 'order' => $orderData]);
    }

    public function track($orderNumber = null)
    {
        if (!$orderNumber) {
            return $this->failValidationError('Order number is required');
        }

        $order = $this->db->table('orders')
                          ->groupStart()
                              ->where('order_number', $orderNumber)
                              ->orWhere('tracking_number', $orderNumber)
                          ->groupEnd()
                          ->get()
                          ->getRow();

        if (!$order) {
            return $this->failNotFound('Order not found');
        }

        return $this->respond(['order' => $order]);
    }
}
