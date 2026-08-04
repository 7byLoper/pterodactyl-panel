import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faCopy,
    faEllipsisH,
    faFileArchive,
    faFileCode,
    faFileDownload,
    faFileUpload,
    faLevelUpAlt,
    faPencilAlt,
    faTrashAlt,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import { ServerContext } from '@/state/server';
import { join } from 'pathe';
import deleteFiles from '@/api/server/files/deleteFiles';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import copyFile from '@/api/server/files/copyFile';
import Can from '@/components/elements/Can';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import { FileObject } from '@/api/server/files/loadDirectory';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import DropdownMenu from '@/components/elements/DropdownMenu';
import styled from 'styled-components/macro';
import useEventListener from '@/plugins/useEventListener';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';
import isEqual from 'react-fast-compare';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import { Dialog } from '@/components/elements/dialog';
import Input from '@/components/elements/Input';
import { Button } from '@/components/elements/button/index';
import { getTransferTargets, transferFile, TransferTarget } from '@/api/server/files/transferFile';

type ModalType = 'rename' | 'move' | 'chmod';

const StyledRow = styled.div<{ $danger?: boolean }>`
    ${tw`p-2 flex items-center rounded`};
    ${(props) =>
        props.$danger ? tw`hover:bg-red-100 hover:text-red-700` : tw`hover:bg-neutral-100 hover:text-neutral-700`};
`;

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: IconDefinition;
    title: string;
    $danger?: boolean;
}

const Row = ({ icon, title, ...props }: RowProps) => (
    <StyledRow {...props}>
        <FontAwesomeIcon icon={icon} css={tw`text-xs`} fixedWidth />
        <span css={tw`ml-2`}>{title}</span>
    </StyledRow>
);

const FileDropdownMenu = ({ file }: { file: FileObject }) => {
    const onClickRef = useRef<DropdownMenu>(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferTargets, setTransferTargets] = useState<TransferTarget[]>([]);
    const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [transferring, setTransferring] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { addFlash, clearAndAddHttpError, clearFlashes } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    useEffect(() => {
        if (!showTransfer) return;

        setLoadingTargets(true);
        setSelectedTargets([]);
        clearFlashes('files');

        getTransferTargets(uuid)
            .then(setTransferTargets)
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setLoadingTargets(false));
    }, [showTransfer]);

    useEventListener(`pterodactyl:files:ctx:${file.key}`, (e: CustomEvent) => {
        if (onClickRef.current) {
            onClickRef.current.triggerMenu(e.detail);
        }
    });

    const doDeletion = () => {
        clearFlashes('files');
        mutate((files) => files.filter((f) => f.key !== file.key), false);

        deleteFiles(uuid, directory, [file.name]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });
    };

    const doCopy = () => {
        setShowSpinner(true);
        clearFlashes('files');

        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doDownload = () => {
        setShowSpinner(true);
        clearFlashes('files');

        getFileDownloadUrl(uuid, join(directory, file.name))
            .then((url) => {
                window.location = url as unknown as Location;
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doArchive = () => {
        setShowSpinner(true);
        clearFlashes('files');

        compressFiles(uuid, directory, [file.name])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doUnarchive = () => {
        setShowSpinner(true);
        clearFlashes('files');

        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doTransfer = () => {
        if (!selectedTargets.length) return;

        setTransferring(true);
        clearFlashes('files');

        transferFile(uuid, join(directory, file.name), selectedTargets)
            .then(() => {
                setShowTransfer(false);
                addFlash({
                    key: 'files',
                    type: 'success',
                    message: `The file is being uploaded to ${selectedTargets.length} server${
                        selectedTargets.length === 1 ? '' : 's'
                    }.`,
                });
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setTransferring(false));
    };

    const toggleTarget = (target: string) => {
        setSelectedTargets((current) =>
            current.includes(target) ? current.filter((uuid) => uuid !== target) : [...current, target]
        );
    };

    return (
        <>
            <Dialog.Confirm
                open={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                title={`Delete ${file.isFile ? 'File' : 'Directory'}`}
                confirm={'Delete'}
                onConfirmed={doDeletion}
            >
                You will not be able to recover the contents of&nbsp;
                <span className={'font-semibold text-gray-50'}>{file.name}</span> once deleted.
            </Dialog.Confirm>
            <Dialog
                open={showTransfer}
                onClose={() => !transferring && setShowTransfer(false)}
                title={'Upload to Other Servers'}
                description={'Choose the servers that should receive this file in their root directory.'}
                preventExternalClose={transferring}
            >
                <div css={tw`mt-6 max-h-72 overflow-y-auto space-y-2`}>
                    {loadingTargets ? (
                        <p css={tw`text-sm text-neutral-300`}>Loading available servers...</p>
                    ) : transferTargets.length ? (
                        transferTargets.map((target) => (
                            <label
                                key={target.uuid}
                                css={tw`flex items-center cursor-pointer rounded bg-neutral-700 hover:bg-neutral-600 p-3`}
                            >
                                <Input
                                    type={'checkbox'}
                                    checked={selectedTargets.includes(target.uuid)}
                                    onChange={() => toggleTarget(target.uuid)}
                                    css={tw`mr-3`}
                                />
                                <span css={tw`text-sm text-neutral-100`}>{target.name}</span>
                            </label>
                        ))
                    ) : (
                        <p css={tw`text-sm text-neutral-300`}>No servers are available for file uploads.</p>
                    )}
                </div>
                <Dialog.Footer>
                    <Button.Text disabled={transferring} onClick={() => setShowTransfer(false)}>
                        Cancel
                    </Button.Text>
                    <Button disabled={loadingTargets || !selectedTargets.length || transferring} onClick={doTransfer}>
                        {transferring ? 'Uploading...' : 'Upload'}
                    </Button>
                </Dialog.Footer>
            </Dialog>
            <DropdownMenu
                ref={onClickRef}
                renderToggle={(onClick) => (
                    <div css={tw`px-4 py-2 hover:text-white`} onClick={onClick}>
                        <FontAwesomeIcon icon={faEllipsisH} />
                        {modal ? (
                            modal === 'chmod' ? (
                                <ChmodFileModal
                                    visible
                                    appear
                                    files={[{ file: file.name, mode: file.modeBits }]}
                                    onDismissed={() => setModal(null)}
                                />
                            ) : (
                                <RenameFileModal
                                    visible
                                    appear
                                    files={[file.name]}
                                    useMoveTerminology={modal === 'move'}
                                    onDismissed={() => setModal(null)}
                                />
                            )
                        ) : null}
                        <SpinnerOverlay visible={showSpinner} fixed size={'large'} />
                    </div>
                )}
            >
                <Can action={'file.update'}>
                    <Row onClick={() => setModal('rename')} icon={faPencilAlt} title={'Rename'} />
                    <Row onClick={() => setModal('move')} icon={faLevelUpAlt} title={'Move'} />
                    <Row onClick={() => setModal('chmod')} icon={faFileCode} title={'Permissions'} />
                </Can>
                {file.isFile && (
                    <Can action={'file.create'}>
                        <Row onClick={doCopy} icon={faCopy} title={'Copy'} />
                    </Can>
                )}
                {file.isArchiveType() ? (
                    <Can action={'file.create'}>
                        <Row onClick={doUnarchive} icon={faBoxOpen} title={'Unarchive'} />
                    </Can>
                ) : (
                    <Can action={'file.archive'}>
                        <Row onClick={doArchive} icon={faFileArchive} title={'Archive'} />
                    </Can>
                )}
                {file.isFile && (
                    <Can action={'file.download'}>
                        <Row onClick={doDownload} icon={faFileDownload} title={'Download'} />
                        <Row onClick={() => setShowTransfer(true)} icon={faFileUpload} title={'Upload to Other Servers'} />
                    </Can>
                )}
                <Can action={'file.delete'}>
                    <Row onClick={() => setShowConfirmation(true)} icon={faTrashAlt} title={'Delete'} $danger />
                </Can>
            </DropdownMenu>
        </>
    );
};

export default memo(FileDropdownMenu, isEqual);
