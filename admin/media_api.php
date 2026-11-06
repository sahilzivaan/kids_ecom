<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    if ($pdo) {
        $stmt = $pdo->query("SELECT m.*, 
            (SELECT COUNT(*) FROM product_images pi WHERE pi.media_id = m.id OR pi.image_url = m.file_url OR pi.image_url LIKE CONCAT('%', m.filename)) AS usage_count 
            FROM media_library m 
            ORDER BY m.id DESC");
        $items = $stmt->fetchAll();
    } else {
        $items = [];
    }

    echo json_encode(['success' => true, 'data' => $items]);
    exit;
}

if ($action === 'usage') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$id || !$pdo) {
        echo json_encode(['success' => false, 'usage' => []]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT DISTINCT p.id, p.name FROM products p 
        JOIN product_images pi ON p.id = pi.product_id 
        JOIN media_library m ON (pi.media_id = m.id OR pi.image_url = m.file_url OR pi.image_url LIKE CONCAT('%', m.filename)) 
        WHERE m.id = ?");
    $stmt->execute([$id]);
    $products = $stmt->fetchAll();

    echo json_encode(['success' => true, 'usage' => $products]);
    exit;
}

if ($action === 'delete') {
    $id    = isset($_REQUEST['id']) ? (int)$_REQUEST['id'] : 0;
    $force = isset($_REQUEST['force']) && $_REQUEST['force'] == '1';

    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Invalid Media ID']);
        exit;
    }

    if (!$pdo) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }

    // Check media info
    $stmt = $pdo->prepare("SELECT * FROM media_library WHERE id = ?");
    $stmt->execute([$id]);
    $media = $stmt->fetch();

    if (!$media) {
        echo json_encode(['success' => false, 'message' => 'Media not found']);
        exit;
    }

    // Check usage in product_images
    $stmtUsage = $pdo->prepare("SELECT DISTINCT p.name FROM products p 
        JOIN product_images pi ON p.id = pi.product_id 
        WHERE pi.media_id = ? OR pi.image_url = ? OR pi.image_url LIKE CONCAT('%', ?)");
    $stmtUsage->execute([$id, $media['file_url'], $media['filename']]);
    $usedInProducts = $stmtUsage->fetchAll(PDO::FETCH_COLUMN);

    if (count($usedInProducts) > 0 && !$force) {
        echo json_encode([
            'success'   => false,
            'is_in_use' => true,
            'products'  => $usedInProducts,
            'message'   => 'This image is currently used by ' . count($usedInProducts) . ' product(s).'
        ]);
        exit;
    }

    // Remove file from disk
    $filePath = __DIR__ . '/../' . $media['file_path'];
    if (file_exists($filePath)) {
        @unlink($filePath);
    }

    // Delete record from DB
    $delStmt = $pdo->prepare("DELETE FROM media_library WHERE id = ?");
    $delStmt->execute([$id]);

    // Set media_id to NULL in product_images if any
    $updateStmt = $pdo->prepare("UPDATE product_images SET media_id = NULL WHERE media_id = ?");
    $updateStmt->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'Media deleted successfully']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
