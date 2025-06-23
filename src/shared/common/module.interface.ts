export interface Module {
    name: string;
    showDescription: boolean;
    showInDropdown?: boolean;
    focusItem?: boolean;
    footerItem?: boolean;
    uri?: string;
    isComingSoon?: boolean;
    isMemberPortal?: boolean;
}