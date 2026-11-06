<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Config\Services;
use Exception;

class JWTFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        if (strtolower($request->getMethod()) === 'options') {
            return;
        }

        $header = $request->getServer('HTTP_AUTHORIZATION');
        
        if (!$header) {
            return Services::response()
                ->setJSON(['error' => 'Token Required'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $token = explode(' ', $header)[1] ?? null;

        if (!$token) {
            return Services::response()
                ->setJSON(['error' => 'Token Required'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }

        try {
            $secretKey = getenv('JWT_SECRET') ?: 'supersecretjwtkey1234567890123456';
            $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));
            
            // Optionally check roles using $arguments if needed
            if (!empty($arguments)) {
                $requiredRole = $arguments[0];
                if ($decoded->role !== $requiredRole) {
                    return Services::response()
                        ->setJSON(['error' => 'Forbidden: Insufficient role'])
                        ->setStatusCode(ResponseInterface::HTTP_FORBIDDEN);
                }
            }

            // We can attach the decoded token to the request for controller use
            $request->user = $decoded;
            
        } catch (Exception $e) {
            return Services::response()
                ->setJSON(['error' => 'Invalid or expired token'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
