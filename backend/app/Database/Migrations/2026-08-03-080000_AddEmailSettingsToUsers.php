<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddEmailSettingsToUsers extends Migration
{
    public function up()
    {
        $fields = [
            'email_order_updates' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'email_promotions' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
        ];
        
        if ($this->db->tableExists('users')) {
            $this->forge->addColumn('users', $fields);
        }
    }

    public function down()
    {
        if ($this->db->tableExists('users')) {
            $this->forge->dropColumn('users', ['email_order_updates', 'email_promotions']);
        }
    }
}
