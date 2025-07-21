<?php

namespace App\Contracts;

use App\Models\User;

interface AuthenticationServiceInterface
{
    public function register(array $userData): User;
    public function login(array $credentials): string; // JWT token
    public function logout(string $token): bool;
    public function refreshToken(string $token): string;
    public function resetPassword(string $email): bool;
}
