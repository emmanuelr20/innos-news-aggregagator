<?php

namespace App\Services;

use App\Contracts\AuthenticationServiceInterface;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthenticationService implements AuthenticationServiceInterface
{
    public function register(array $userData): User
    {
        $user = User::create([
            'name' => $userData['name'],
            'email' => $userData['email'],
            'password' => Hash::make($userData['password']),
        ]);

        event(new Registered($user));

        return $user;
    }

    public function login(array $credentials): string
    {
        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();
        $token = $user->createToken('API Token')->accessToken;

        return $token;
    }

    public function logout(string $token): bool
    {
        /** @var \App\Models\User $user */
        $user =  Auth::guard('api')->user();

        if ($user) {
            $user->tokens()->delete();
            return true;
        }

        return false;
    }

    public function refreshToken(string $token): string
    {
        /** @var \App\Models\User $user */
        $user =  Auth::guard('api')->user();

        if (!$user) {
            throw ValidationException::withMessages([
                'token' => ['Invalid token provided.'],
            ]);
        }

        // Revoke current token
        $user->tokens()->delete();

        // Create new token
        $newToken = $user->createToken('API Token')->accessToken;

        return $newToken;
    }

    public function resetPassword(string $email): bool
    {
        $status = Password::sendResetLink(['email' => $email]);

        return $status === Password::RESET_LINK_SENT;
    }
}
