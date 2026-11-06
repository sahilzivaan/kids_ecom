<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class CartController extends ResourceController
{
    use ResponseTrait;

    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    public function index()
    {
        $user = $this->request->user;
        if (!$user) return $this->failUnauthorized();

        $cart = $this->db->table('cart_items')
                         ->where('user_id', $user->uid)
                         ->get()->getResult();

        return $this->respond(['cart' => $cart]);
    }

    public function create()
    {
        $user = $this->request->user;
        if (!$user) return $this->failUnauthorized();

        $data = $this->request->getJSON(true);
        $data['user_id'] = $user->uid;
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');

        $this->db->table('cart_items')->insert($data);

        return $this->respondCreated(['message' => 'Added to cart']);
    }

    public function delete($id = null)
    {
        $user = $this->request->user;
        if (!$user) return $this->failUnauthorized();

        $this->db->table('cart_items')
                 ->where('id', $id)
                 ->where('user_id', $user->uid)
                 ->delete();

        return $this->respondDeleted(['message' => 'Removed from cart']);
    }
}
