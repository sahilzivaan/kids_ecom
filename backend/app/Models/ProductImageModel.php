<?php
namespace App\Models;
use CodeIgniter\Model;

class ProductImageModel extends Model
{
    protected $table = 'product_images';
    protected $primaryKey = 'id';
    protected $allowedFields = ['product_id', 'image_url', 'display_order', 'is_primary'];
    protected $useTimestamps = false;
}
