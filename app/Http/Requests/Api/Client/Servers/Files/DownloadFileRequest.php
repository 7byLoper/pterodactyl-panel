<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Files;

use Pterodactyl\Models\Server;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class DownloadFileRequest extends ClientApiRequest
{
    /**
     * Ensure that the user making this request has permission to download files
     * from this server.
     */
    public function authorize(): bool
    {
        $server = $this->route('server');
        $file = $this->input('file');
        $user = $this->user();
    
        if (!$user->can(Permission::ACTION_FILE_READ, $server)) {
            return false;
        }
    
        if ($user->root_admin || $server->owner_id === $user->id) {
            return true;
        }
    
        $blockedExtensions = ['.jar', '.sh', '.db', '.sqlite', '.tar.gz'];
    
        foreach ($blockedExtensions as $extension) {
            if (str_ends_with(strtolower($file), $extension)) {
                return false;
            }
        }
    
        return true;
    }
}
