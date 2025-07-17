import { PortalMenuItemEnum } from "./portal-menu-item.enum";

export interface PortalMenuItemConfig {
    code: PortalMenuItemEnum;
    customTitle?: string;
    hide: boolean;
}