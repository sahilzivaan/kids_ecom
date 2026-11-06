<?php

namespace App\Models;

use CodeIgniter\Model;

class ProductReviewModel extends Model
{
    protected $table            = 'product_reviews';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['product_id', 'user_id', 'rating', 'comment', 'status'];

    protected bool $allowEmptyInserts = false;
    protected bool $updateOnlyChanged = true;

    protected array $casts = [];
    protected array $castHandlers = [];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Validation
    protected $validationRules      = [
        'product_id' => 'required|is_natural_no_zero',
        'user_id'    => 'required|is_natural_no_zero',
        'rating'     => 'required|is_natural_no_zero|less_than_equal_to[5]',
        'comment'    => 'required|string'
    ];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    // Callbacks
    protected $allowCallbacks = true;
    protected $beforeInsert   = [];
    protected $afterInsert    = [];
    protected $beforeUpdate   = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    public function getReviewsWithUsers($productId)
    {
        return $this->select('product_reviews.*, users.first_name, users.last_name')
                    ->join('users', 'users.id = product_reviews.user_id', 'left')
                    ->where('product_reviews.product_id', $productId)
                    ->where('product_reviews.status', 'approved')
                    ->orderBy('product_reviews.created_at', 'DESC')
                    ->findAll();
    }
}
