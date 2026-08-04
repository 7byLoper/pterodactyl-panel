import http from '@/api/http';

export interface TransferTarget {
    uuid: string;
    name: string;
    identifier: string;
}

export interface TransferFileItem {
    file: string;
    directory: string;
    is_directory: boolean;
}

export const getTransferTargets = async (uuid: string, requiresArchive = false): Promise<TransferTarget[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/files/transfer-targets`, {
        params: { requires_archive: requiresArchive },
    });

    return data.data || [];
};

export const transferFiles = async (uuid: string, files: TransferFileItem[], targets: string[]): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/files/transfer`, { files, target_servers: targets });
};
