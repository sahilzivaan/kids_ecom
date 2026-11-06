<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class ProductImagesAndEmailQueue extends Migration
{
    public function up()
    {
        // 1. Product Images
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'product_id' => [
                'type'       => 'INT',
                'constraint' => 11,
            ],
            'image_url' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
            ],
            'display_order' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 0,
            ],
            'is_primary' => [
                'type'       => 'BOOLEAN',
                'default'    => false,
            ],
            'created_at' => [
                'type' => 'TIMESTAMP',
            ],
        ]);
        $this->forge->addKey('id', true);
        // Assuming products table uses INT for id, otherwise adjust constraint
        // $this->forge->addForeignKey('product_id', 'products', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('product_images', true);

        // Drop the old `img` column if it still exists
        if ($this->db->fieldExists('img', 'products')) {
            $this->forge->dropColumn('products', 'img');
        }

        // 2. Email Settings
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'smtp_host' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'smtp_port' => [
                'type' => 'INT',
                'constraint' => 11,
                'null' => true,
            ],
            'smtp_user' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'smtp_pass' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'smtp_encryption' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
                'null' => true,
            ],
            'from_email' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'from_name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('email_settings', true);

        // Seed default email settings
        $this->db->table('email_settings')->insert([
            'id' => 1,
            'smtp_host' => 'smtp.mailtrap.io',
            'smtp_port' => 2525,
            'smtp_user' => '',
            'smtp_pass' => '',
            'smtp_encryption' => 'tls',
            'from_email' => 'noreply@chhotufashion.com',
            'from_name' => 'Chhotu Fashion'
        ]);

        // 3. Email Templates
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'trigger_name' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
                'unique' => true,
            ],
            'subject' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'html_content' => [
                'type' => 'TEXT',
            ],
            'is_active' => [
                'type' => 'BOOLEAN',
                'default' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('email_templates', true);

        // Seed default email template
        $this->db->table('email_templates')->insert([
            'trigger_name' => 'order_placed',
            'subject' => 'Order Confirmation - #{{order_number}}',
            'html_content' => '<h1>Thank you for your order!</h1><p>Hi {{customer_name}},</p><p>We have received your order #{{order_number}} for {{items_count}} item(s) totaling {{total_amount}}.</p><p>We will notify you once it ships!</p>'
        ]);

        // 4. Email Queue
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'customer_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'null' => true,
            ],
            'recipient_email' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'subject' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'html_body' => [
                'type' => 'TEXT',
            ],
            'status' => [
                'type' => 'ENUM',
                'constraint' => ['pending', 'processing', 'sent', 'failed'],
                'default' => 'pending',
            ],
            'error_message' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'sent_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('email_queue', true);
    }

    public function down()
    {
        $this->forge->dropTable('email_queue', true);
        $this->forge->dropTable('email_templates', true);
        $this->forge->dropTable('email_settings', true);
        $this->forge->dropTable('product_images', true);
        
        if (!$this->db->fieldExists('img', 'products')) {
            $this->forge->addColumn('products', [
                'img' => [
                    'type' => 'VARCHAR',
                    'constraint' => '255',
                    'null' => true,
                ]
            ]);
        }
    }
}
