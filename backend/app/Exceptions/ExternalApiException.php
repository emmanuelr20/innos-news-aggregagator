<?php

namespace App\Exceptions;

use Exception;

class ExternalApiException extends Exception
{
    protected $source;
    protected $statusCode;
    protected $responseBody;

    public function __construct(
        string $message = '',
        string $source = '',
        int $statusCode = 0,
        string $responseBody = '',
        Exception $previous = null
    ) {
        parent::__construct($message, $statusCode, $previous);

        $this->source = $source;
        $this->statusCode = $statusCode;
        $this->responseBody = $responseBody;
    }

    public function getSource(): string
    {
        return $this->source;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getResponseBody(): string
    {
        return $this->responseBody;
    }

    public function getContext(): array
    {
        return [
            'source' => $this->source,
            'status_code' => $this->statusCode,
            'response_body' => $this->responseBody,
            'message' => $this->getMessage(),
        ];
    }
}
