<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddVariantIdToCart extends Migration
{
    public function up()
    {
        $fields = [
            'variant_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'null' => true,
                'after' => 'user_id'
            ]
        ];
        $this->forge->addColumn('cart_items', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('cart_items', 'variant_id');
    }
}
