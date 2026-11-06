<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class Products extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'          => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'name'        => ['type' => 'VARCHAR', 'constraint' => 255],
            'category'    => ['type' => 'VARCHAR', 'constraint' => 100],
            'status'      => ['type' => 'VARCHAR', 'constraint' => 50, 'default' => 'Active'],
            'mrp'         => ['type' => 'DECIMAL', 'constraint' => '10,2'],
            'sale'        => ['type' => 'DECIMAL', 'constraint' => '10,2', 'null' => true],
            'stock'       => ['type' => 'INT', 'constraint' => 11, 'default' => 0],
            'sizes'       => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'description' => ['type' => 'TEXT', 'null' => true],
            'img'         => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'created_at'  => ['type' => 'DATETIME', 'null' => true],
            'updated_at'  => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('products', true);
    }

    public function down()
    {
        $this->forge->dropTable('products', true);
    }
}
