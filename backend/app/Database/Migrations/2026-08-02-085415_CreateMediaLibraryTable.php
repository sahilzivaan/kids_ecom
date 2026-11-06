<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateMediaLibraryTable extends Migration
{
    public function up()
    {
        // 1. Create media_library table
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'filename' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'original_name' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'file_path' => [
                'type'       => 'VARCHAR',
                'constraint' => 500,
            ],
            'file_url' => [
                'type'       => 'VARCHAR',
                'constraint' => 500,
            ],
            'file_size' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
            ],
            'mime_type' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'width' => [
                'type'       => 'SMALLINT',
                'constraint' => 6,
                'unsigned'   => true,
                'null'       => true,
            ],
            'height' => [
                'type'       => 'SMALLINT',
                'constraint' => 6,
                'unsigned'   => true,
                'null'       => true,
            ],
            'uploaded_by' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'default'    => 'admin',
            ],
            'created_at' => [
                'type'       => 'DATETIME',
                'null'       => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('media_library', true);

        // 2. Add media_id column to product_images table if not present
        if ($this->db->tableExists('product_images')) {
            $fields = [
                'media_id' => [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'unsigned'   => true,
                    'null'       => true,
                    'after'      => 'product_id',
                ],
            ];
            if (!$this->db->fieldExists('media_id', 'product_images')) {
                $this->forge->addColumn('product_images', $fields);
            }
        }
    }

    public function down()
    {
        if ($this->db->tableExists('product_images') && $this->db->fieldExists('media_id', 'product_images')) {
            $this->forge->dropColumn('product_images', 'media_id');
        }
        $this->forge->dropTable('media_library', true);
    }
}
