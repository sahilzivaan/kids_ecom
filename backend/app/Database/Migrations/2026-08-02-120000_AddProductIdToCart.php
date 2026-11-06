<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;

class AddProductIdToCart extends Migration {
    public function up() {
        $this->forge->addColumn('cart_items', [
            'product_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'null' => true,
                'after' => 'user_id'
            ]
        ]);
    }

    public function down() {
        $this->forge->dropColumn('cart_items', 'product_id');
    }
}
