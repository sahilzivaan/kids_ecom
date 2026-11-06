<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class AdminCouponController extends ResourceController
{
    use ResponseTrait;

    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    public function index()
    {
        $coupons = $this->db->table('coupons')
            ->orderBy('id', 'DESC')
            ->get()->getResult();

        return $this->respond(['coupons' => $coupons]);
    }

    public function create()
    {
        $data = $this->request->getJSON(true);
        
        $code = trim(strtoupper($data['code'] ?? ''));
        if (empty($code)) {
            return $this->failValidationError('Coupon code is required.');
        }

        $existing = $this->db->table('coupons')->where('code', $code)->get()->getRow();
        if ($existing) {
            return $this->failValidationError('Coupon code already exists.');
        }

        $couponData = [
            'code'        => $code,
            'type'        => $data['type'] ?? 'percent',
            'value'       => $data['value'] ?? 0,
            'min_order'   => $data['min_order'] ?? 0,
            'expiry'      => !empty($data['expiry']) ? $data['expiry'] : null,
            'usage_count' => 0,
            'status'      => $data['status'] ?? 'Active',
            'created_at'  => date('Y-m-d H:i:s'),
            'updated_at'  => date('Y-m-d H:i:s'),
        ];

        $this->db->table('coupons')->insert($couponData);
        $couponData['id'] = $this->db->insertID();

        return $this->respondCreated(['message' => 'Coupon created successfully', 'coupon' => $couponData]);
    }

    public function update($id = null)
    {
        if (!$id) return $this->failValidationError('ID is required');
        
        $data = $this->request->getJSON(true);

        $coupon = $this->db->table('coupons')->where('id', $id)->get()->getRow();
        if (!$coupon) return $this->failNotFound('Coupon not found');

        $code = trim(strtoupper($data['code'] ?? $coupon->code));

        if ($code !== $coupon->code) {
            $existing = $this->db->table('coupons')->where('code', $code)->get()->getRow();
            if ($existing) {
                return $this->failValidationError('Coupon code already exists.');
            }
        }

        $updateData = [
            'code'        => $code,
            'type'        => $data['type'] ?? $coupon->type,
            'value'       => $data['value'] ?? $coupon->value,
            'min_order'   => $data['min_order'] ?? $coupon->min_order,
            'expiry'      => !empty($data['expiry']) ? $data['expiry'] : null,
            'status'      => $data['status'] ?? $coupon->status,
            'updated_at'  => date('Y-m-d H:i:s'),
        ];

        $this->db->table('coupons')->where('id', $id)->update($updateData);
        
        $updatedCoupon = $this->db->table('coupons')->where('id', $id)->get()->getRow();

        return $this->respond(['message' => 'Coupon updated successfully', 'coupon' => $updatedCoupon]);
    }

    public function delete($id = null)
    {
        if (!$id) return $this->failValidationError('ID is required');

        $coupon = $this->db->table('coupons')->where('id', $id)->get()->getRow();
        if (!$coupon) return $this->failNotFound('Coupon not found');

        $this->db->table('coupons')->where('id', $id)->delete();

        return $this->respondDeleted(['message' => 'Coupon deleted successfully']);
    }
}
