<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddProductCostAndSku extends Migration
{
    public function up()
    {
        // Add sku after name
        $this->forge->addColumn('products', [
            'sku' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
                'default'    => null,
                'after'      => 'name',
            ],
        ]);

        // Add cost_price after sale
        $this->forge->addColumn('products', [
            'cost_price' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
                'null'       => true,
                'default'    => null,
                'after'      => 'sale',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('products', 'sku');
        $this->forge->dropColumn('products', 'cost_price');
    }
}
