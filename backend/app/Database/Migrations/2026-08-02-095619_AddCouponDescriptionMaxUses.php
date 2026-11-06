<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCouponDescriptionMaxUses extends Migration
{
    public function up()
    {
        // Add description after code
        $this->forge->addColumn('coupons', [
            'description' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
                'default'    => null,
                'after'      => 'code',
            ],
        ]);

        // Add max_uses after usage_count
        $this->forge->addColumn('coupons', [
            'max_uses' => [
                'type'       => 'INT',
                'constraint' => 11,
                'null'       => true,
                'default'    => null,
                'after'      => 'usage_count',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('coupons', 'description');
        $this->forge->dropColumn('coupons', 'max_uses');
    }
}
