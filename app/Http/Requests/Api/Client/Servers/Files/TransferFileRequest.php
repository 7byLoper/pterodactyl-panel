<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Files;

class TransferFileRequest extends DownloadFileRequest
{
    public function rules(): array
    {
        return [
            'files' => 'required|array|min:1|max:50',
            'files.*.file' => 'required|string',
            'files.*.directory' => 'nullable|string',
            'files.*.is_directory' => 'required|boolean',
            'target_servers' => 'required|array|min:1|max:100',
            'target_servers.*' => 'required|string|uuid|distinct',
        ];
    }
}
