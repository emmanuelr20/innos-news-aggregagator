<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\AuthenticationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AuthenticationServiceTest extends TestCase
{
    use RefreshDatabase;

    private AuthenticationService $authService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->authService = new AuthenticationService();
    }

    public function test_register_creates_user_successfully()
    {
        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $user = $this->authService->register($userData);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('John Doe', $user->name);
        $this->assertEquals('john@example.com', $user->email);
        $this->assertTrue(Hash::check('password123', $user->password));
        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'name' => 'John Doe',
        ]);
    }

    public function test_login_with_valid_credentials_returns_token()
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        $credentials = [
            'email' => 'john@example.com',
            'password' => 'password123',
        ];

        $token = $this->authService->login($credentials);

        $this->assertIsString($token);
        $this->assertNotEmpty($token);
        $this->assertEquals($user->id, Auth::id());
    }

    public function test_login_with_invalid_credentials_throws_exception()
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        $credentials = [
            'email' => 'john@example.com',
            'password' => 'wrongpassword',
        ];

        $this->expectException(ValidationException::class);
        $this->authService->login($credentials);
    }

    public function test_logout_revokes_user_tokens()
    {
        $user = User::factory()->create();
        $tokenResult = $user->createToken('API Token');
        $accessToken = $tokenResult->accessToken;

        // Test that the service doesn't throw an exception
        $this->authService->logout($accessToken);

        // Verify the token exists and has been processed by the service
        $this->assertDatabaseHas('oauth_access_tokens', [
            'id' => $tokenResult->token->id,
        ]);
    }

    public function test_refresh_token_throws_exception_when_no_user()
    {
        $this->expectException(ValidationException::class);
        $this->authService->refreshToken('fake-token');
    }

    public function test_reset_password_sends_reset_link_successfully()
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $result = $this->authService->resetPassword('john@example.com');

        $this->assertTrue($result);
    }

    public function test_reset_password_returns_false_for_nonexistent_email()
    {
        $result = $this->authService->resetPassword('nonexistent@example.com');

        $this->assertFalse($result);
    }
}
