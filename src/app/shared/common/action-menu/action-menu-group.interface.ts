import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';

export interface ActionMenuGroup {
    key: string;
    visible: boolean;
    items: ActionMenuItem[];
}