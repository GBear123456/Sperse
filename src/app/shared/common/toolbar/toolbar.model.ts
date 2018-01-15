export class ToolbarGroupModelItem {
    name: string;
    action: () => void;
    options: any;
    widget?: string;
    itemTemplate?: string;
    text?: string;
    responsiveText?: string;
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
