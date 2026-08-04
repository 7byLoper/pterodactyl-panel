import http from '@/api/http';

export interface TransferTarget {
    uuid: string;
    name: string;
    identifier: string;
}

export const getTransferTargets = async (uuid: string): Promise<TransferTarget[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/files/transfer-targets`);

    return data.data || [];
};

export const transferFile = async (uuid: string, file: string, directory: string, targets: string[]): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/files/transfer`, { file, directory, target_servers: targets });
};
