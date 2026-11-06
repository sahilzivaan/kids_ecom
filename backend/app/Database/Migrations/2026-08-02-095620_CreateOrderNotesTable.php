<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateOrderNotesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'order_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
            ],
            'note' => [
                'type' => 'TEXT',
            ],
            'created_by' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'default'    => 'admin',
            ],
            'created_at' => [
                'type'    => 'DATETIME',
                'null'    => true,
                'default' => null,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('order_id');
        $this->forge->createTable('order_notes');
    }

    public function down()
    {
        $this->forge->dropTable('order_notes');
    }
}
