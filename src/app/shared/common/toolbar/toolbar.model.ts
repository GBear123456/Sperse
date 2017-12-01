export class ToolbarGroupModel {
    location: string;
    items: {
        name: string,
        action: () => void,
        options: object,
        widget?: string,
        template?: () => string,
        text?: string
    }[];
}
