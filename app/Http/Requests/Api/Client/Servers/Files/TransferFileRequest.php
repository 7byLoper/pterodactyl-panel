<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Files;

class TransferFileRequest extends DownloadFileRequest
{
    public function rules(): array
    {
        return [
            'file' => 'required|string',
            'target_servers' => 'required|array|min:1|max:100',
            'target_servers.*' => 'required|string|uuid|distinct',
        ];
    }
}
