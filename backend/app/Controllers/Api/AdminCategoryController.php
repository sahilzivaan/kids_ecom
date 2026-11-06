<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\CategoryModel;

class AdminCategoryController extends BaseController
{
    public function index()
    {
        $model = new CategoryModel();
        return $this->response->setJSON(['categories' => $model->orderBy('id', 'DESC')->findAll()]);
    }

    public function create()
    {
        $rules = [
            'name' => 'required|min_length[2]|is_unique[categories.name]'
        ];

        if (!$this->validate($rules)) {
            return $this->response->setStatusCode(400)->setJSON([
                'error' => $this->validator->getErrors()
            ]);
        }

        $model = new CategoryModel();
        $data = ['name' => $this->request->getVar('name')];
        $model->insert($data);
        $data['id'] = $model->getInsertID();

        return $this->response->setStatusCode(201)->setJSON([
            'message' => 'Category created successfully',
            'category' => $data
        ]);
    }

    public function update($id = null)
    {
        $model = new CategoryModel();
        $category = $model->find($id);

        if (!$category) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Category not found']);
        }

        $input = $this->request->getJSON(true) ?? $this->request->getRawInput();
        
        if (empty($input['name'])) {
            return $this->response->setStatusCode(400)->setJSON(['error' => 'Category name is required']);
        }

        $model->update($id, ['name' => $input['name']]);

        return $this->response->setJSON([
            'message' => 'Category updated successfully',
            'category' => $model->find($id)
        ]);
    }

    public function delete($id = null)
    {
        $model = new CategoryModel();
        $category = $model->find($id);

        if (!$category) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Category not found']);
        }

        $model->delete($id);
        return $this->response->setJSON(['message' => 'Category deleted successfully']);
    }
}
