import { ContextMenuItem } from '@shared/common/dialogs/modal/context-menu-item.interface';

export interface IDialogButton {
    id?: string;
    title?: string;
    class?: string;
    disabled?: boolean;
    hint?: string;
    iconName?: string;
    action?: (e: any) => void;
    contextMenuItems?: ContextMenuItem[];
    contextMenuDefaultIndex?: number;
    contextMenuCacheKey?: string;
}
