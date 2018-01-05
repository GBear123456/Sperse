export class ToolbarGroupModel {
    location: string;
    itemTemplate?: string;
    items: {
        name: string,
        action: () => void,
        options: object,
        widget?: string,
        itemTemplate?: string,
        text?: string,
        html?: string,
        attr?: object
    }[];
}
