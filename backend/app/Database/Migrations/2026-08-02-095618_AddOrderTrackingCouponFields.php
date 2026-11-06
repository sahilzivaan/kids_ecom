<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddOrderTrackingCouponFields extends Migration
{
    public function up()
    {
        // Add tracking_number after status
        $this->forge->addColumn('orders', [
            'tracking_number' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
                'default'    => null,
                'after'      => 'status',
            ],
        ]);

        // Add coupon_code after payment_method
        $this->forge->addColumn('orders', [
            'coupon_code' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'null'       => true,
                'default'    => null,
                'after'      => 'payment_method',
            ],
        ]);

        // Add discount_amount after coupon_code
        $this->forge->addColumn('orders', [
            'discount_amount' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
                'null'       => false,
                'default'    => '0.00',
                'after'      => 'coupon_code',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('orders', 'tracking_number');
        $this->forge->dropColumn('orders', 'coupon_code');
        $this->forge->dropColumn('orders', 'discount_amount');
    }
}
