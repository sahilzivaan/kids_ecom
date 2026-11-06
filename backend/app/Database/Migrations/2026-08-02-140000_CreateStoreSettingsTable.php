<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateStoreSettingsTable extends Migration
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
            'settings_json' => [
                'type' => 'LONGTEXT',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->createTable('store_settings');

        // Insert initial default settings
        $db = \Config\Database::connect();
        $defaults = [
            'storeName'             => 'Chhotu Fashion',
            'tagline'               => "India's Most Loved Kids Clothing Brand",
            'supportEmail'          => 'support@chhotufashion.in',
            'supportPhone'          => '+91 1800-123-4567',
            'whatsappNumber'        => '+91 98765 43210',
            'storeAddress'          => '204, Fashion Hub, Linking Road, Bandra West, Mumbai, Maharashtra 400050',
            'currency'              => 'INR (₹)',
            'timezone'              => 'Asia/Kolkata (IST +5:30)',
            'maintenanceMode'       => false,
            'acceptingOrders'       => true,

            // Payment Gateways
            'codEnabled'            => true,
            'codFee'                => 0,
            'codMinAmount'          => 199,
            'codMaxAmount'          => 5000,
            'codRequireOtp'         => true,
            'codInstructions'       => 'Please keep exact cash ready or scan the delivery partner QR code upon arrival.',
            
            'razorpayEnabled'       => true,
            'razorpayMode'          => 'test', // test or live
            'razorpayKey'           => 'rzp_test_99abCdEFG12345',
            'razorpaySecret'        => 's3cr3t_k3y_r4z0rp4y_t3st',
            'razorpayWebhookSecret' => 'whsec_9876543210abcdef',
            'razorpayAutoCapture'   => true,

            'phonepeEnabled'        => false,
            'phonepeMerchantId'     => '',
            'phonepeSaltKey'        => '',
            'phonepeSaltIndex'      => '1',
            'phonepeMode'           => 'test',

            'bankTransferEnabled'   => false,
            'bankAccountName'       => 'Chhotu Fashion Private Limited',
            'bankAccountNumber'     => '98765432109876',
            'bankIfscCode'          => 'HDFC0001234',
            'bankName'              => 'HDFC Bank, Bandra West Branch',

            // Shipping
            'shippingRate'          => 49,
            'freeDeliveryThreshold' => 499,
            'expressDeliveryEnabled'=> true,
            'expressDeliveryRate'   => 99,
            'standardDeliveryDays'  => '3–5 Business Days',
            'expressDeliveryDays'   => '1–2 Business Days',
            'maxWeightKg'           => 5,
            'returnWindowDays'      => '7 Days',

            // Notifications
            'orderEmailAlerts'      => true,
            'orderSmsAlerts'        => true,
            'orderWhatsappAlerts'   => true,
            'lowStockThreshold'     => 5,
            'adminAlertEmail'       => 'admin@chhotufashion.in',
            'adminAlertPhone'       => '+91 98765 43210',

            // Tax & Invoicing
            'gstPercent'            => 18,
            'gstNumber'             => '27AABCC1234D1Z5',
            'pricesIncludeGst'      => true,
            'invoicePrefix'         => 'CF-2026-',
            'nextInvoiceNumber'     => 1001,
            'invoiceFooterNote'     => 'Thank you for shopping with Chhotu Fashion! For queries, reach us at support@chhotufashion.in'
        ];

        $db->table('store_settings')->insert([
            'id'            => 1,
            'settings_json' => json_encode($defaults),
            'created_at'    => date('Y-m-d H:i:s'),
            'updated_at'    => date('Y-m-d H:i:s')
        ]);
    }

    public function down()
    {
        $this->forge->dropTable('store_settings');
    }
}
