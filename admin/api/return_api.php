<?php
session_start();
require_once '../includes/auth.php';
require_once '../includes/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($action === 'create') {
        $order_number = $input['order_number'] ?? '';
        $customer_name = $input['customer_name'] ?? '';
        $reason = $input['reason'] ?? '';
        $description = $input['description'] ?? '';
        $refund_amount = $input['refund_amount'] ?? 0;
        
        if (empty($order_number) || empty($customer_name) || empty($reason)) {
            echo json_encode(['success' => false, 'message' => 'Required fields missing']);
            exit;
        }

        // Fetch order_id from orders table
        $stmt = $pdo->prepare("SELECT id FROM orders WHERE order_number = ? LIMIT 1");
        $stmt->execute([$order_number]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        $order_id = $order ? $order['id'] : null;

        try {
            $stmt = $pdo->prepare("
                INSERT INTO returns (order_id, order_number, customer_name, reason, description, refund_amount, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())
            ");
            $stmt->execute([$order_id, $order_number, $customer_name, $reason, $description, $refund_amount]);
            
            echo json_encode(['success' => true, 'message' => 'Return logged successfully']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'update_status') {
        $id = $input['id'] ?? '';
        $status = $input['status'] ?? '';
        $admin_note = $input['admin_note'] ?? '';
        $refund_amount = $input['refund_amount'] ?? 0;
        $refund_method = $input['refund_method'] ?? '';

        if (empty($id) || empty($status)) {
            echo json_encode(['success' => false, 'message' => 'Return ID and Status are required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE returns 
                SET status = ?, admin_note = ?, refund_amount = ?, refund_method = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$status, $admin_note, $refund_amount, $refund_method, $id]);
            
            echo json_encode(['success' => true, 'message' => 'Return updated successfully']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
