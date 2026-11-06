<?php
namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Models\EmailQueueModel;
use App\Models\EmailSettingModel;
use Config\Email;

class EmailWorker extends BaseCommand
{
    protected $group       = 'Mail';
    protected $name        = 'email:work';
    protected $description = 'Process the pending email queue and send emails.';

    public function run(array $params)
    {
        $queueModel = new EmailQueueModel();
        $settingModel = new EmailSettingModel();
        
        $settings = $settingModel->find(1);
        if (!$settings) {
            CLI::error('No email settings found. Please configure them in the admin panel.');
            return;
        }

        $pendingEmails = $queueModel->where('status', 'pending')->findAll(50); // process 50 at a time
        if (empty($pendingEmails)) {
            CLI::write('No pending emails found.');
            return;
        }

        CLI::write('Found ' . count($pendingEmails) . ' pending emails. Processing...');

        $emailConfig = new Email();
        $emailConfig->protocol = 'smtp';
        $emailConfig->SMTPHost = $settings['smtp_host'];
        $emailConfig->SMTPUser = $settings['smtp_user'];
        $emailConfig->SMTPPass = $settings['smtp_pass'];
        $emailConfig->SMTPPort = $settings['smtp_port'];
        $emailConfig->SMTPCrypto = $settings['smtp_encryption'] ?: '';
        $emailConfig->mailType = 'html';
        $emailConfig->charset  = 'utf-8';
        $emailConfig->wordWrap = true;

        $emailService = \Config\Services::email();
        $emailService->initialize($emailConfig);

        foreach ($pendingEmails as $mail) {
            $queueModel->update($mail['id'], ['status' => 'processing']);

            $emailService->clear();
            $emailService->setFrom($settings['from_email'], $settings['from_name']);
            $emailService->setTo($mail['recipient_email']);
            $emailService->setSubject($mail['subject']);
            $emailService->setMessage($mail['html_body']);

            if ($emailService->send()) {
                $queueModel->update($mail['id'], [
                    'status' => 'sent',
                    'sent_at' => date('Y-m-d H:i:s')
                ]);
                CLI::write("Sent email ID {$mail['id']} to {$mail['recipient_email']}", 'green');
            } else {
                $error = $emailService->printDebugger(['headers']);
                $queueModel->update($mail['id'], [
                    'status' => 'failed',
                    'error_message' => $error
                ]);
                CLI::error("Failed to send email ID {$mail['id']}");
            }
        }
        
        CLI::write('Queue processing complete.');
    }
}
