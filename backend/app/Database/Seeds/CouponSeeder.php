<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class CouponSeeder extends Seeder
{
    public function run()
    {
        $db = \Config\Database::connect();
        
        $coupons = [
            [
                'code'        => 'CF10',
                'description' => '10% off on all orders',
                'type'        => 'percent',
                'value'       => 10.00,
                'min_order'   => 0.00,
                'expiry'      => '2028-12-31 23:59:59',
                'usage_count' => 0,
                'max_uses'    => 1000,
                'status'      => 'Active',
                'created_at'  => date('Y-m-d H:i:s'),
                'updated_at'  => date('Y-m-d H:i:s'),
            ],
            [
                'code'        => 'SAVE10',
                'description' => 'Flat 10% discount',
                'type'        => 'percent',
                'value'       => 10.00,
                'min_order'   => 0.00,
                'expiry'      => '2028-12-31 23:59:59',
                'usage_count' => 0,
                'max_uses'    => 1000,
                'status'      => 'Active',
                'created_at'  => date('Y-m-d H:i:s'),
                'updated_at'  => date('Y-m-d H:i:s'),
            ],
            [
                'code'        => 'NEW50',
                'description' => 'Flat ₹100 off on orders above ₹500',
                'type'        => 'flat',
                'value'       => 100.00,
                'min_order'   => 500.00,
                'expiry'      => '2028-12-31 23:59:59',
                'usage_count' => 0,
                'max_uses'    => 1000,
                'status'      => 'Active',
                'created_at'  => date('Y-m-d H:i:s'),
                'updated_at'  => date('Y-m-d H:i:s'),
            ]
        ];

        foreach ($coupons as $c) {
            $existing = $db->table('coupons')->where('code', $c['code'])->get()->getRow();
            if ($existing) {
                $db->table('coupons')->where('id', $existing->id)->update([
                    'description' => $c['description'],
                    'type'        => $c['type'],
                    'value'       => $c['value'],
                    'min_order'   => $c['min_order'],
                    'expiry'      => $c['expiry'],
                    'status'      => 'Active',
                    'updated_at'  => date('Y-m-d H:i:s'),
                ]);
            } else {
                $db->table('coupons')->insert($c);
            }
        }
    }
}
