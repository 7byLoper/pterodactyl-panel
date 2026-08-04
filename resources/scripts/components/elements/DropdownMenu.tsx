import React, { createRef } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Fade from '@/components/elements/Fade';

interface Props {
    children: React.ReactNode;
    renderToggle: (onClick: (e: React.MouseEvent<any, MouseEvent>) => void) => React.ReactChild;
}

export const DropdownButtonRow = styled.button<{ danger?: boolean }>`
    ${tw`flex w-full items-center rounded-md px-3 py-2 text-sm text-neutral-200`};
    transition: 150ms all ease;

    &:hover {
        ${(props) =>
            props.danger
                ? 'background-color: rgba(239, 68, 68, 0.18); color: #fca5a5;'
                : 'background-color: color-mix(in srgb, var(--primary) 22%, transparent); color: #ffffff;'};
    }
`;

const Menu = styled.div`
    width: 13rem;
    background-color: var(--secondary);
    border: 1px solid color-mix(in srgb, var(--primary) 28%, transparent);
    border-radius: 0.75rem;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
`;

interface State {
    posX: number;
    visible: boolean;
}

class DropdownMenu extends React.PureComponent<Props, State> {
    menu = createRef<HTMLDivElement>();

    state: State = {
        posX: 0,
        visible: false,
    };

    componentWillUnmount() {
        this.removeListeners();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
        const menu = this.menu.current;

        if (this.state.visible && !prevState.visible && menu) {
            document.addEventListener('click', this.windowListener);
            document.addEventListener('contextmenu', this.contextMenuListener);
            menu.style.left = `${Math.round(this.state.posX - menu.clientWidth)}px`;
        }

        if (!this.state.visible && prevState.visible) {
            this.removeListeners();
        }
    }

    removeListeners = () => {
        document.removeEventListener('click', this.windowListener);
        document.removeEventListener('contextmenu', this.contextMenuListener);
    };

    onClickHandler = (e: React.MouseEvent<any, MouseEvent>) => {
        e.preventDefault();
        this.triggerMenu(e.clientX);
    };

    contextMenuListener = () => this.setState({ visible: false });

    windowListener = (e: MouseEvent) => {
        const menu = this.menu.current;

        if (e.button === 2 || !this.state.visible || !menu) {
            return;
        }

        if (e.target === menu || menu.contains(e.target as Node)) {
            return;
        }

        if (e.target !== menu && !menu.contains(e.target as Node)) {
            this.setState({ visible: false });
        }
    };

    triggerMenu = (posX: number) =>
        this.setState((s) => ({
            posX: !s.visible ? posX : s.posX,
            visible: !s.visible,
        }));

    render() {
        return (
            <div>
                {this.props.renderToggle(this.onClickHandler)}
                <Fade timeout={150} in={this.state.visible} unmountOnExit>
                    <Menu
                        ref={this.menu}
                        onClick={(e) => {
                            e.stopPropagation();
                            this.setState({ visible: false });
                        }}
                        css={tw`absolute z-50 p-1.5 text-neutral-200`}
                    >
                        {this.props.children}
                    </Menu>
                </Fade>
            </div>
        );
    }
}

export default DropdownMenu;
