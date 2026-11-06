<?php

namespace App\Models;

use CodeIgniter\Model;

class WishlistModel extends Model
{
    protected $table = 'wishlists';
    protected $primaryKey = 'id';
    protected $allowedFields = ['user_id', 'product_id', 'created_at'];
    protected $useTimestamps = false; // We will manually handle created_at
}
