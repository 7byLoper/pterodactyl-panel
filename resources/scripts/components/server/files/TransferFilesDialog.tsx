import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { join } from 'pathe';
import Input from '@/components/elements/Input';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';
import { ServerContext } from '@/state/server';
import useFlash from '@/plugins/useFlash';
import {
    getTransferTargets,
    transferFiles,
    TransferFileItem,
    TransferTarget,
} from '@/api/server/files/transferFile';

export interface TransferItem {
    name: string;
    isDirectory: boolean;
}

interface Props {
    open: boolean;
    onClose: () => void;
    items: TransferItem[];
}

const TargetRow = styled.label<{ $selected: boolean }>`
    ${tw`flex cursor-pointer items-center px-3 py-3 text-neutral-100 transition-colors`};
    background-color: ${(props) =>
        props.$selected ? 'color-mix(in srgb, var(--primary) 24%, var(--input))' : 'var(--input)'};
    border-radius: var(--borderradius);

    &:hover {
        background-color: color-mix(in srgb, var(--primary) 18%, var(--input));
    }
`;

const TargetCheckbox = styled(Input)`
    ${tw`mr-3 h-5 w-5 rounded-md`};
    border: none;
    background-color: color-mix(in srgb, var(--primary) 12%, var(--secondary));

    &:checked {
        background-color: var(--primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
    }
`;

export default ({ open, onClose, items }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { addFlash, clearAndAddHttpError, clearFlashes } = useFlash();
    const [targets, setTargets] = useState<TransferTarget[]>([]);
    const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [transferring, setTransferring] = useState(false);

    const containsDirectories = items.some((item) => item.isDirectory);

    useEffect(() => {
        if (!open) return;

        setLoadingTargets(true);
        setSelectedTargets([]);
        clearFlashes('files');

        getTransferTargets(uuid, containsDirectories)
            .then(setTargets)
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setLoadingTargets(false));
    }, [open]);

    const toggleTarget = (target: string) => {
        setSelectedTargets((current) =>
            current.includes(target) ? current.filter((uuid) => uuid !== target) : [...current, target]
        );
    };

    const transfer = () => {
        if (!selectedTargets.length || !items.length) return;

        const files: TransferFileItem[] = items.map((item) => ({
            file: join(directory, item.name),
            directory,
            is_directory: item.isDirectory,
        }));

        setTransferring(true);
        clearFlashes('files');

        transferFiles(uuid, files, selectedTargets)
            .then(() => {
                onClose();
                addFlash({
                    key: 'files',
                    type: 'success',
                    message: `${items.length} item${items.length === 1 ? '' : 's'} sent to ${selectedTargets.length} server${
                        selectedTargets.length === 1 ? '' : 's'
                    }.`,
                });
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setTransferring(false));
    };

    return (
        <Dialog
            open={open}
            onClose={() => !transferring && onClose()}
            title={'Upload to Other Servers'}
            description={
                containsDirectories
                    ? 'Folders are archived, transferred, and unpacked in the same directory path.'
                    : 'Files are uploaded to the same directory path on each selected server.'
            }
            preventExternalClose={transferring}
        >
            <div css={tw`mt-3 text-xs text-neutral-300`}>
                Selected: {items.length} item{items.length === 1 ? '' : 's'}
            </div>
            <div css={tw`mt-4 max-h-72 overflow-y-auto space-y-2`}>
                {loadingTargets ? (
                    <p css={tw`text-sm text-neutral-300`}>Loading available servers...</p>
                ) : targets.length ? (
                    targets.map((target) => {
                        const selected = selectedTargets.includes(target.uuid);

                        return (
                        <TargetRow
                            key={target.uuid}
                            $selected={selected}
                        >
                            <TargetCheckbox
                                type={'checkbox'}
                                checked={selected}
                                onChange={() => toggleTarget(target.uuid)}
                            />
                            <span css={tw`text-sm text-neutral-100`}>{target.name}</span>
                        </TargetRow>
                        );
                    })
                ) : (
                    <p css={tw`text-sm text-neutral-300`}>No servers are available for this transfer.</p>
                )}
            </div>
            <Dialog.Footer>
                <Button.Text disabled={transferring} onClick={onClose}>
                    Cancel
                </Button.Text>
                <Button disabled={loadingTargets || !selectedTargets.length || transferring} onClick={transfer}>
                    {transferring ? 'Uploading...' : 'Upload'}
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
};
