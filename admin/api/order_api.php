<?php
require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/db.php';

header('Content-Type: application/json');

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['action'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$action = $data['action'];

try {
    if ($action === 'update_status') {
        $id = $data['order_id'] ?? 0;
        $status = $data['status'] ?? '';
        $stmt = $pdo->prepare("UPDATE orders SET status=?, updated_at=NOW() WHERE id=?");
        $stmt->execute([$status, $id]);
        echo json_encode(['success' => true, 'message' => 'Status updated successfully']);
    } elseif ($action === 'update_tracking') {
        $id = $data['order_id'] ?? 0;
        $tracking = $data['tracking'] ?? '';
        $stmt = $pdo->prepare("UPDATE orders SET tracking_number=?, updated_at=NOW() WHERE id=?");
        $stmt->execute([$tracking, $id]);
        echo json_encode(['success' => true, 'message' => 'Tracking number updated successfully']);
    } elseif ($action === 'bulk_status') {
        $ids = $data['ids'] ?? [];
        $status = $data['status'] ?? '';
        
        $validIds = [];
        foreach ($ids as $id) {
            $id = intval($id);
            if ($id > 0) $validIds[] = $id;
        }
        
        if (empty($validIds)) {
            echo json_encode(['success' => false, 'message' => 'No valid IDs provided']);
            exit;
        }
        
        $placeholders = implode(',', array_fill(0, count($validIds), '?'));
        $stmt = $pdo->prepare("UPDATE orders SET status=?, updated_at=NOW() WHERE id IN ($placeholders)");
        $params = array_merge([$status], $validIds);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'message' => count($validIds) . ' orders updated to ' . $status]);
    } elseif ($action === 'add_note') {
        $id = $data['order_id'] ?? 0;
        $note = $data['note'] ?? '';
        $createdBy = $_SESSION['admin_id'] ?? 1; // Fallback
        
        $stmt = $pdo->prepare("INSERT INTO order_notes (order_id, note, created_by, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$id, $note, $createdBy]);
        echo json_encode(['success' => true, 'message' => 'Note added successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Unknown action']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
