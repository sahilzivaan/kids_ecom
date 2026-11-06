<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\StoreSettingModel;

class AdminSettingController extends ResourceController
{
    public function getSettings()
    {
        $model = new StoreSettingModel();
        $record = $model->find(1);

        if (!$record || empty($record['settings_json'])) {
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

                // Payments
                'codEnabled'            => true,
                'codFee'                => 0,
                'codMinAmount'          => 199,
                'codMaxAmount'          => 5000,
                'codRequireOtp'         => true,
                'codInstructions'       => 'Please keep exact cash ready or scan the delivery partner QR code upon arrival.',
                
                'razorpayEnabled'       => true,
                'razorpayMode'          => 'test',
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

            if (!$record) {
                $model->insert([
                    'id'            => 1,
                    'settings_json' => json_encode($defaults),
                    'created_at'    => date('Y-m-d H:i:s'),
                    'updated_at'    => date('Y-m-d H:i:s')
                ]);
            } else {
                $model->update(1, [
                    'settings_json' => json_encode($defaults),
                    'updated_at'    => date('Y-m-d H:i:s')
                ]);
            }

            return $this->respond(['settings' => $defaults]);
        }

        $settings = json_decode($record['settings_json'], true) ?: [];

        // Mask secrets if needed for display
        return $this->respond(['settings' => $settings]);
    }

    public function updateSettings()
    {
        $model = new StoreSettingModel();
        $record = $model->find(1);
        $current = ($record && !empty($record['settings_json'])) ? (json_decode($record['settings_json'], true) ?: []) : [];

        $payload = $this->request->getJSON(true) ?: [];

        // Preserve unedited masked secrets
        if (isset($payload['razorpaySecret']) && $payload['razorpaySecret'] === '********' && !empty($current['razorpaySecret'])) {
            $payload['razorpaySecret'] = $current['razorpaySecret'];
        }
        if (isset($payload['phonepeSaltKey']) && $payload['phonepeSaltKey'] === '********' && !empty($current['phonepeSaltKey'])) {
            $payload['phonepeSaltKey'] = $current['phonepeSaltKey'];
        }

        $merged = array_merge($current, $payload);

        if ($record) {
            $model->update(1, [
                'settings_json' => json_encode($merged),
                'updated_at'    => date('Y-m-d H:i:s')
            ]);
        } else {
            $model->insert([
                'id'            => 1,
                'settings_json' => json_encode($merged),
                'created_at'    => date('Y-m-d H:i:s'),
                'updated_at'    => date('Y-m-d H:i:s')
            ]);
        }

        return $this->respond([
            'message'  => 'Settings saved successfully',
            'settings' => $merged
        ]);
    }
}
