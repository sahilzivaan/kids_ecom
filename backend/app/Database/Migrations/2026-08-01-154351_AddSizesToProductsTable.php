<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSizesToProductsTable extends Migration
{
    public function up()
    {
        $fields = [
            'sizes' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
                'after' => 'stock'
            ]
        ];
        $this->forge->addColumn('products', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('products', 'sizes');
    }
}
