export class ToolbarGroupModelItem {
    name: string;
    action: () => void;
    onSelectionChanged?: () => void;
    options: any;
    disabled?: boolean;
    widget?: string;
    itemTemplate?: string;
    text?: string;
    responsiveText?: string;
    visible?: boolean;
    html?: string;
    attr?: object;
}

export class ToolbarGroupModel {
    areItemsDependent: boolean = false;
    location: string;
    locateInMenu: string;
    itemTemplate?: string;
    items: ToolbarGroupModelItem[];
}
