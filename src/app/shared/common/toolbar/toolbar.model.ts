export interface ToolbarGroupModelItem {
    accessKey?: string;
    name?: string;
    action?: Function;
    onSelectionChanged?: () => void;
    options?: any;
    disabled?: boolean;
    widget?: string;
    itemTemplate?: string;
    text?: string;
    visible?: boolean;
    html?: string;
    attr?: object;
}

export class ToolbarGroupModel {
    areItemsDependent ? = false;
    location: 'before' | 'center' | 'after';
    locateInMenu?: string;
    itemTemplate?: string;
    items: ToolbarGroupModelItem[];
}
