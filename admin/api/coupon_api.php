<?php
require_once '../includes/auth.php';
require_once '../includes/db.php';
header('Content-Type: application/json');

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['action'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$action = $data['action'];

try {
    if ($action === 'create') {
        $expiry = !empty($data['expiry']) ? str_replace('T', ' ', $data['expiry']) : null;
        $maxUses = (isset($data['max_uses']) && $data['max_uses'] !== '') ? (int)$data['max_uses'] : null;
        
        $stmt = $pdo->prepare("INSERT INTO coupons (code, description, type, value, min_order, max_uses, usage_count, expiry, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, NOW(), NOW())");
        $stmt->execute([
            $data['code'],
            $data['description'] ?? null,
            $data['type'],
            $data['value'],
            $data['min_order'] ?? 0,
            $maxUses,
            $expiry,
            $data['status'] ?? 'Active'
        ]);
        echo json_encode(['success' => true, 'message' => 'Coupon created successfully']);
    } elseif ($action === 'update') {
        $expiry = !empty($data['expiry']) ? str_replace('T', ' ', $data['expiry']) : null;
        $maxUses = (isset($data['max_uses']) && $data['max_uses'] !== '') ? (int)$data['max_uses'] : null;
        
        $stmt = $pdo->prepare("UPDATE coupons SET code = ?, description = ?, type = ?, value = ?, min_order = ?, max_uses = ?, expiry = ?, status = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([
            $data['code'],
            $data['description'] ?? null,
            $data['type'],
            $data['value'],
            $data['min_order'] ?? 0,
            $maxUses,
            $expiry,
            $data['status'],
            $data['id']
        ]);
        echo json_encode(['success' => true, 'message' => 'Coupon updated successfully']);
    } elseif ($action === 'toggle_status') {
        $stmt = $pdo->prepare("UPDATE coupons SET status = IF(status='Active','Inactive','Active') WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true, 'message' => 'Status toggled successfully']);
    } elseif ($action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM coupons WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true, 'message' => 'Coupon deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
