import { ContextMenu } from '@shared/common/dialogs/modal/context-menu.interface';

export interface IDialogButton {
    id?: string;
    title?: string;
    class?: string;
    disabled?: boolean;
    hint?: string;
    iconName?: string;
    action?: (e: any) => void;
    contextMenu?: ContextMenu;
}
