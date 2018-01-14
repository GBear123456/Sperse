export class ToolbarGroupModel {
    location: string;
    itemTemplate?: string;
    items: {
        name: string,
        action: () => void,
        options: any,
        widget?: string,
        itemTemplate?: string,
        text?: string,
        responsiveText?: string,
        html?: string,
        adaptive?: boolean,
        attr?: object
    }[];
}
