<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use CodeIgniter\Shield\Entities\User;
use CodeIgniter\Shield\Models\UserModel;

class CreateAdmin extends BaseCommand
{
    protected $group       = 'App';
    protected $name        = 'app:createadmin';
    protected $description = 'Create default admin user';

    public function run(array $params)
    {
        $users = auth()->getProvider();
        
        $user = new User([
            'username' => 'admin',
            'email'    => 'admin@chhotufashion.com',
            'password' => 'admin123',
        ]);

        $users->save($user);
        $user = $users->findById($users->getInsertID());

        if ($user) {
            $user->addGroup('admin');
            CLI::write('Admin created successfully.', 'green');
        } else {
            CLI::error('Failed to create admin.');
        }
    }
}
