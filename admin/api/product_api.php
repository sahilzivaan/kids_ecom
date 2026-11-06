<?php
require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/db.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$action = $input['action'] ?? '';

try {
    if ($action === 'create') {
        $stmt = $pdo->prepare("INSERT INTO products (name, sku, category, mrp, sale, cost_price, stock, status, sizes, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([
            $input['name'] ?? '',
            $input['sku'] ?? '',
            $input['category'] ?? '',
            $input['mrp'] ?? 0,
            $input['sale'] ?? 0,
            $input['cost_price'] ?? 0,
            $input['stock'] ?? 0,
            $input['status'] ?? 'Draft',
            $input['sizes'] ?? '',
            $input['description'] ?? ''
        ]);
        $id = $pdo->lastInsertId();
        
        echo json_encode(['success' => true, 'message' => 'Product created', 'id' => $id]);
    }
    elseif ($action === 'update') {
        if (empty($input['id'])) {
            echo json_encode(['success' => false, 'message' => 'Missing ID']);
            exit;
        }
        $stmt = $pdo->prepare("UPDATE products SET name=?, sku=?, category=?, mrp=?, sale=?, cost_price=?, stock=?, status=?, sizes=?, description=?, updated_at=NOW() WHERE id=?");
        $stmt->execute([
            $input['name'] ?? '',
            $input['sku'] ?? '',
            $input['category'] ?? '',
            $input['mrp'] ?? 0,
            $input['sale'] ?? 0,
            $input['cost_price'] ?? 0,
            $input['stock'] ?? 0,
            $input['status'] ?? 'Draft',
            $input['sizes'] ?? '',
            $input['description'] ?? '',
            $input['id']
        ]);
        echo json_encode(['success' => true, 'message' => 'Product updated']);
    }
    elseif ($action === 'delete') {
        if (empty($input['id'])) {
            echo json_encode(['success' => false, 'message' => 'Missing ID']);
            exit;
        }
        $stmt = $pdo->prepare("UPDATE products SET status='Deleted', updated_at=NOW() WHERE id=?");
        $stmt->execute([$input['id']]);
        echo json_encode(['success' => true, 'message' => 'Product deleted']);
    }
    elseif ($action === 'bulk_status') {
        $ids = $input['ids'] ?? [];
        $status = $input['status'] ?? 'Draft';
        if (!empty($ids) && is_array($ids)) {
            $ids = array_map('intval', $ids);
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $params = array_merge([$status], $ids);
            $stmt = $pdo->prepare("UPDATE products SET status=?, updated_at=NOW() WHERE id IN ($placeholders)");
            $stmt->execute($params);
            echo json_encode(['success' => true, 'message' => 'Products updated']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No products selected']);
        }
    }
    elseif ($action === 'update_stock') {
        if (!isset($input['id']) || !isset($input['stock'])) {
            echo json_encode(['success' => false, 'message' => 'Missing id or stock']);
            exit;
        }
        $stmt = $pdo->prepare("UPDATE products SET stock=?, updated_at=NOW() WHERE id=?");
        $stmt->execute([(int)$input['stock'], (int)$input['id']]);
        echo json_encode(['success' => true, 'message' => 'Stock updated']);
    }
    elseif ($action === 'bulk_stock') {
        $ids  = array_map('intval', $input['ids'] ?? []);
        $qty  = (int)($input['qty'] ?? 0);
        $mode = $input['mode'] ?? 'set'; // 'set' or 'add'
        if (empty($ids)) {
            echo json_encode(['success' => false, 'message' => 'No products selected']);
            exit;
        }
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        if ($mode === 'add') {
            $stmt = $pdo->prepare("UPDATE products SET stock=stock+?, updated_at=NOW() WHERE id IN ($placeholders)");
            $stmt->execute(array_merge([$qty], $ids));
        } else {
            $stmt = $pdo->prepare("UPDATE products SET stock=?, updated_at=NOW() WHERE id IN ($placeholders)");
            $stmt->execute(array_merge([$qty], $ids));
        }
        echo json_encode(['success' => true, 'message' => count($ids) . ' products updated']);
    }
    else {
        echo json_encode(['success' => false, 'message' => 'Unknown action']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}
