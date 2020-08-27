import { ContextMenuItem } from '@shared/common/dialogs/modal/context-menu-item.interface';

export interface ContextMenu {
    items: ContextMenuItem[];
    defaultIndex?: number;
    selectedIndex?: number;
    cacheKey?: string;
    hidden?: boolean;
}