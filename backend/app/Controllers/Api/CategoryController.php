<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\CategoryModel;

class CategoryController extends BaseController
{
    public function index()
    {
        $model = new CategoryModel();
        return $this->response->setJSON(['categories' => $model->orderBy('name', 'ASC')->findAll()]);
    }
}
