export class ToolbarGroupModelItem {
    name: string;
    action: () => void;
    options: object;
    widget?: string;
    itemTemplate?: string;
    text?: string;
    html?: string;
    attr?: object;
}

export class ToolbarGroupModel {
    areItemsDependent: boolean = false;
    location: string;
    itemTemplate?: string;
    items: ToolbarGroupModelItem[];
}
