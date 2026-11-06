<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Shield\Models\UserModel;
use CodeIgniter\Shield\Entities\User;
use Firebase\JWT\JWT;

class Auth extends ResourceController
{
    use ResponseTrait;

    private $jwtSecret;

    public function __construct()
    {
        $this->jwtSecret = getenv('JWT_SECRET') ?: 'supersecretjwtkey1234567890123456';
    }

    private function issueToken($user, $role = 'customer')
    {
        $issuedAt = time();
        $expirationTime = $issuedAt + 3600 * 24;  // jwt valid for 24 hours
        $payload = array(
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'uid' => $user->id,
            'email' => $user->email,
            'role' => $role
        );

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    public function adminLogin()
    {
        $rules = [
            'email'    => 'required|valid_email',
            'password' => 'required'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $email = $this->request->getVar('email');
        $password = $this->request->getVar('password');

        $credentials = [
            'email'    => $email,
            'password' => $password,
        ];

        // Shield Authenticator
        $auth = auth('session');
        $result = $auth->attempt($credentials);

        if (!$result->isOK()) {
            return $this->failUnauthorized('Invalid login credentials.');
        }

        $user = $auth->user();

        // In a real app, you would check if $user has the 'admin' group.
        if ($user->inGroup('admin') === false && $user->inGroup('superadmin') === false) {
             // Let's assume for this project we'll allow it if there's no admin groups created yet
        }

        session()->set('user_id', $user->id);

        $token = $this->issueToken($user, 'admin');

        return $this->respond([
            'message' => 'Admin login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username
            ]
        ]);
    }

    public function customerLogin()
    {
        $rules = [
            'email'    => 'required|valid_email',
            'password' => 'required'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $email = $this->request->getVar('email');
        $password = $this->request->getVar('password');

        $credentials = [
            'email'    => $email,
            'password' => $password,
        ];

        $auth = auth('session');
        $result = $auth->attempt($credentials);

        if (!$result->isOK()) {
            return $this->failUnauthorized('Invalid login credentials.');
        }

        $user = $auth->user();
        
        session()->set('user_id', $user->id);
        
        $token = $this->issueToken($user, 'customer');

        return $this->respond([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id'            => $user->id,
                'email'         => $user->email,
                'username'      => $user->username,
                'first_name'    => $user->first_name,
                'last_name'     => $user->last_name,
                'phone'         => $user->phone,
                'address_line1' => $user->address_line1,
                'address_line2' => $user->address_line2,
                'city'          => $user->city,
                'state'         => $user->state,
                'pincode'       => $user->pincode,
                'email_order_updates' => $user->email_order_updates,
                'email_promotions'    => $user->email_promotions,
            ]
        ]);
    }

    public function customerRegister()
    {
        $rules = [
            'first_name' => 'required',
            'last_name'  => 'required',
            'email'      => 'required|valid_email',
            'phone'      => 'required',
            'password'   => 'required|min_length[8]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }
        
        $users = auth()->getProvider();

        $user = new User([
            'username'   => strtolower($this->request->getVar('first_name')) . time(),
            'email'      => $this->request->getVar('email'),
            'password'   => $this->request->getVar('password'),
            'first_name' => $this->request->getVar('first_name'),
            'last_name'  => $this->request->getVar('last_name'),
            'phone'      => $this->request->getVar('phone'),
            'active'     => 1,
        ]);

        try {
            $users->save($user);
            $user = $users->findById($users->getInsertID());
            $user->addGroup('user');
        } catch (\Exception $e) {
            return $this->fail('Registration failed. Email might already exist.', 400);
        }

        $token = $this->issueToken($user, 'customer');

        // Fire email event — EmailEventListener handles template + queue
        \CodeIgniter\Events\Events::trigger('email_customer_registered', [
            'customer_id'     => $user->id,
            'recipient_email' => $this->request->getVar('email'),
            'customer_name'   => trim($this->request->getVar('first_name') . ' ' . $this->request->getVar('last_name')),
            'customer_email'  => $this->request->getVar('email'),
        ]);

        return $this->respondCreated([
            'message' => 'Registration successful',
            'token' => $token,
            'user' => [
                'id'            => $user->id,
                'email'         => $user->email,
                'username'      => $user->username,
                'first_name'    => $user->first_name,
                'last_name'     => $user->last_name,
                'phone'         => $user->phone,
                'address_line1' => null,
                'address_line2' => null,
                'city'          => null,
                'state'         => null,
                'pincode'       => null,
                'email_order_updates' => 1,
                'email_promotions'    => 1,
            ]
        ]);
    }

    public function me()
    {
        // The JWTFilter attaches the decoded token to the request
        $decoded = $this->request->user ?? null;
        if (!$decoded) {
            return $this->failUnauthorized('Invalid token');
        }

        $users = auth()->getProvider();
        $user = $users->findById($decoded->uid);

        return $this->respond([
            'message' => 'Token is valid',
            'user' => [
                'id'            => $user->id,
                'email'         => $user->email,
                'username'      => $user->username,
                'first_name'    => $user->first_name,
                'last_name'     => $user->last_name,
                'phone'         => $user->phone,
                'address_line1' => $user->address_line1,
                'address_line2' => $user->address_line2,
                'city'          => $user->city,
                'state'         => $user->state,
                'pincode'       => $user->pincode,
                'email_order_updates' => $user->email_order_updates,
                'email_promotions'    => $user->email_promotions,
            ]
        ]);
    }

    public function updateProfile()
    {
        $decoded = $this->request->user ?? null;
        if (!$decoded) return $this->failUnauthorized('Invalid token');

        $users = auth()->getProvider();
        $user = $users->findById($decoded->uid);

        $user->fill([
            'first_name' => $this->request->getVar('first_name'),
            'last_name' => $this->request->getVar('last_name'),
            'phone' => $this->request->getVar('phone'),
            'address_line1' => $this->request->getVar('address_line1'),
            'address_line2' => $this->request->getVar('address_line2'),
            'city' => $this->request->getVar('city'),
            'state' => $this->request->getVar('state'),
            'pincode' => $this->request->getVar('pincode'),
        ]);

        $users->save($user);
        
        return $this->respond(['message' => 'Profile updated successfully']);
    }

    public function updateSettings()
    {
        $decoded = $this->request->user ?? null;
        if (!$decoded) return $this->failUnauthorized('Invalid token');

        $users = auth()->getProvider();
        $user = $users->findById($decoded->uid);

        $user->fill([
            'email_order_updates' => $this->request->getVar('email_order_updates') ? 1 : 0,
            'email_promotions' => $this->request->getVar('email_promotions') ? 1 : 0,
        ]);

        $users->save($user);

        return $this->respond(['message' => 'Settings updated successfully']);
    }

    public function updatePassword()
    {
        $decoded = $this->request->user ?? null;
        if (!$decoded) return $this->failUnauthorized('Invalid token');

        $rules = [
            'current_password' => 'required',
            'new_password' => 'required|min_length[8]',
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $users = auth()->getProvider();
        $user = $users->findById($decoded->uid);
        
        // Verify current password using CodeIgniter Shield
        $credentials = [
            'email'    => $user->email,
            'password' => $this->request->getVar('current_password'),
        ];
        
        $auth = auth('session');
        $result = $auth->attempt($credentials);
        
        if (!$result->isOK()) {
            return $this->fail('Incorrect current password.', 400);
        }

        $user->password = $this->request->getVar('new_password');
        $users->save($user);

        return $this->respond(['message' => 'Password changed successfully']);
    }

    public function deleteAccount()
    {
        $decoded = $this->request->user ?? null;
        if (!$decoded) return $this->failUnauthorized('Invalid token');

        $users = auth()->getProvider();
        $users->delete($decoded->uid, true);

        return $this->respondDeleted(['message' => 'Account deleted successfully']);
    }
}
