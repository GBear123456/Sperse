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
    adaptive?: boolean;
    attr?: object;
}

export class ToolbarGroupModel {
    areItemsDependent: boolean = false;
    location: string;
    itemTemplate?: string;
    items: ToolbarGroupModelItem[];
}
