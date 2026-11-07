<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class CouponController extends ResourceController
{
    use ResponseTrait;

    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    public function validateCoupon()
    {
        $data = $this->request->getJSON(true);
        $code = trim(strtoupper($data['code'] ?? ''));
        $orderAmount = (float)($data['order_amount'] ?? 0);

        if (empty($code)) {
            return $this->respond(['valid' => false, 'error' => 'Coupon code is required.']);
        }

        $coupon = $this->db->table('coupons')->where('code', $code)->get()->getRow();

        if (!$coupon) {
            return $this->respond(['valid' => false, 'error' => 'Invalid coupon code.']);
        }

        if ($coupon->status !== 'Active') {
            return $this->respond(['valid' => false, 'error' => 'This coupon is no longer active.']);
        }

        if ($coupon->expiry && strtotime($coupon->expiry) < time()) {
            return $this->respond(['valid' => false, 'error' => 'This coupon has expired.']);
        }

        if (!empty($coupon->max_uses) && (int)$coupon->usage_count >= (int)$coupon->max_uses) {
            return $this->respond(['valid' => false, 'error' => 'This coupon has reached its maximum usage limit.']);
        }

        if ($orderAmount > 0 && $orderAmount < (float)$coupon->min_order) {
            return $this->respond(['valid' => false, 'error' => 'Minimum order amount for this coupon is ₹' . $coupon->min_order]);
        }

        return $this->respond([
            'valid'       => true,
            'code'        => $coupon->code,
            'type'        => $coupon->type,
            'value'       => (float)$coupon->value,
            'description' => $coupon->description ?? ''
        ]);
    }
}
