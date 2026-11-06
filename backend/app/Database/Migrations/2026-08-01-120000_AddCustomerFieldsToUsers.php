<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCustomerFieldsToUsers extends Migration
{
    public function up()
    {
        $fields = [
            'first_name' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
                'null'       => true,
            ],
            'last_name' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
                'null'       => true,
            ],
            'phone' => [
                'type'       => 'VARCHAR',
                'constraint' => '20',
                'null'       => true,
            ],
        ];
        
        if ($this->db->tableExists('users')) {
            $this->forge->addColumn('users', $fields);
        }
    }

    public function down()
    {
        if ($this->db->tableExists('users')) {
            $this->forge->dropColumn('users', ['first_name', 'last_name', 'phone']);
        }
    }
}
