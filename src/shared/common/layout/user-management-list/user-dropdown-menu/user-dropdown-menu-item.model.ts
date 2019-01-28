import { SubmenuItems } from 'shared/common/layout/user-management-list/user-dropdown-menu/submenu-items.model';
import { UserDropdownMenuItemType } from 'shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item-type';

export class UserDropdownMenuItemModel {
    name?: string;
    type?: UserDropdownMenuItemType;
    visible?: boolean;
    id?: string;
    iconSrc?: string;
    iconClass?: string;
    cssClass?: string;
    onClick?: (clickEvent: MouseEvent) => void;
    submenuItems?: SubmenuItems;
}
