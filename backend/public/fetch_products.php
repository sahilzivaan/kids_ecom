<?php
define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR);
require FCPATH . '../app/Config/Paths.php';
$paths = new Config\Paths();
require rtrim($paths->systemDirectory, '\\/ ') . DIRECTORY_SEPARATOR . 'bootstrap.php';
$db = \Config\Database::connect();
$products = $db->table('products')->select('id, name, category')->get()->getResultArray();
echo json_encode($products);
