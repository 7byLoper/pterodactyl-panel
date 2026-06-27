<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Files;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class DownloadFileRequest extends ClientApiRequest
{
    public function authorize(): bool
    {
        $server = $this->parameter('server', Server::class);

        if (!$this->user()->can(Permission::ACTION_FILE_READ, $server)) {
            return false;
        }

        return $this->user()->can(Permission::ACTION_FILE_DOWNLOAD, $server);
    }
}