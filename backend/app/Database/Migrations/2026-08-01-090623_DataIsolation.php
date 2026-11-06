<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class DataIsolation extends Migration
{
    public function up()
    {
        // Cart Items Table
        $this->forge->addField([
            'id'          => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'user_id'     => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'name'        => ['type' => 'VARCHAR', 'constraint' => 255],
            'meta'        => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'price'       => ['type' => 'VARCHAR', 'constraint' => 50],
            'img'         => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'quantity'    => ['type' => 'INT', 'constraint' => 5, 'default' => 1],
            'created_at'  => ['type' => 'DATETIME', 'null' => true],
            'updated_at'  => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('cart_items', true);

        // Orders Table
        $this->forge->addField([
            'id'           => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'user_id'      => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'order_number' => ['type' => 'VARCHAR', 'constraint' => 50],
            'items_count'  => ['type' => 'INT', 'constraint' => 5],
            'total_amount' => ['type' => 'VARCHAR', 'constraint' => 50],
            'status'       => ['type' => 'VARCHAR', 'constraint' => 50, 'default' => 'Pending'],
            'created_at'   => ['type' => 'DATETIME', 'null' => true],
            'updated_at'   => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('orders', true);
    }

    public function down()
    {
        $this->forge->dropTable('cart_items', true);
        $this->forge->dropTable('orders', true);
    }
}
