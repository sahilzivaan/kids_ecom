<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddMissingEmailTemplates extends Migration
{
    public function up()
    {
        $templates = [
            [
                'trigger_name' => 'customer_registered',
                'subject'      => 'Welcome to Chhotu Fashion, {{customer_name}}! 🎉',
                'html_content' => '<h1 style="color:#c9a84c;">Welcome to Chhotu Fashion!</h1><p>Hi {{customer_name}},</p><p>We\'re so excited to have you join our family! Your account has been created successfully.</p><p><strong>Email:</strong> {{customer_email}}</p><p>You can now browse our exclusive kids fashion collection and enjoy a seamless shopping experience.</p><p style="margin-top:20px;">Happy Shopping! 🛍️<br><strong>Team Chhotu Fashion</strong></p>',
                'is_active'    => 1,
            ],
            [
                'trigger_name' => 'order_status_changed',
                'subject'      => 'Your Order #{{order_number}} is now {{order_status}}',
                'html_content' => '<h1 style="color:#c9a84c;">Order Status Update</h1><p>Hi {{customer_name}},</p><p>Great news! Your order <strong>#{{order_number}}</strong> has been updated.</p><p><strong>New Status:</strong> <span style="color:#c9a84c;font-weight:bold;">{{order_status}}</span></p><p>If you have any questions about your order, feel free to contact us.</p><p style="margin-top:20px;">Thank you for shopping with us!<br><strong>Team Chhotu Fashion</strong></p>',
                'is_active'    => 1,
            ],
            [
                'trigger_name' => 'order_cancelled',
                'subject'      => 'Your Order #{{order_number}} Has Been Cancelled',
                'html_content' => '<h1 style="color:#e74c3c;">Order Cancelled</h1><p>Hi {{customer_name}},</p><p>We\'re sorry to inform you that your order <strong>#{{order_number}}</strong> has been <strong>cancelled</strong>.</p><p><strong>Total Refundable Amount:</strong> {{total_amount}}</p><p>If you believe this is a mistake or need assistance, please contact our support team immediately.</p><p style="margin-top:20px;">We hope to serve you again soon!<br><strong>Team Chhotu Fashion</strong></p>',
                'is_active'    => 1,
            ],
        ];

        foreach ($templates as $template) {
            // Only insert if trigger_name does not already exist
            $exists = $this->db->table('email_templates')
                               ->where('trigger_name', $template['trigger_name'])
                               ->countAllResults();
            if (!$exists) {
                $this->db->table('email_templates')->insert($template);
            }
        }
    }

    public function down()
    {
        $this->db->table('email_templates')
                 ->whereIn('trigger_name', ['customer_registered', 'order_status_changed', 'order_cancelled'])
                 ->delete();
    }
}
