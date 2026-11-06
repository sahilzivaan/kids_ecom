<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ProductReviewModel;

class ReviewController extends ResourceController
{
    protected $format = 'json';

    public function index()
    {
        $productId = $this->request->getVar('product_id');
        if (!$productId) {
            return $this->failValidationErrors('Product ID is required');
        }

        $reviewModel = new ProductReviewModel();
        $reviews = $reviewModel->getReviewsWithUsers($productId);

        $formattedReviews = array_map(function($review) {
            $name = 'Anonymous';
            if (!empty($review['first_name']) || !empty($review['last_name'])) {
                $name = trim(($review['first_name'] ?? '') . ' ' . ($review['last_name'] ?? ''));
            }
            return [
                'id' => $review['id'],
                'rating' => (int)$review['rating'],
                'comment' => $review['comment'],
                'user_name' => $name,
                'created_at' => $review['created_at'],
            ];
        }, $reviews);

        return $this->respond(['reviews' => $formattedReviews]);
    }

    public function create()
    {
        $user = $this->request->user;
        if (!$user) {
            return $this->failUnauthorized('You must be logged in to leave a review.');
        }

        $rules = [
            'product_id' => 'required|is_natural_no_zero',
            'rating'     => 'required|is_natural_no_zero|less_than_equal_to[5]',
            'comment'    => 'required|string',
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $reviewModel = new ProductReviewModel();

        // Check if user already reviewed this product
        $existing = $reviewModel->where('product_id', $this->request->getVar('product_id'))
                                ->where('user_id', $user->uid)
                                ->first();
        if ($existing) {
            return $this->failResourceExists('You have already submitted a review for this product.');
        }

        $data = [
            'product_id' => $this->request->getVar('product_id'),
            'user_id'    => $user->uid,
            'rating'     => $this->request->getVar('rating'),
            'comment'    => $this->request->getVar('comment'),
            'status'     => 'approved', // Auto approve for now
        ];

        if ($reviewModel->insert($data)) {
            // Create Admin Notification
            $db = \Config\Database::connect();
            $db->table('notifications')->insert([
                'text'       => '⭐ New ' . $data['rating'] . '-star review received for product ID ' . $data['product_id'],
                'is_new'     => 1,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return $this->respondCreated(['message' => 'Review submitted successfully.']);
        }

        return $this->failServerError('Could not save review.');
    }
}
