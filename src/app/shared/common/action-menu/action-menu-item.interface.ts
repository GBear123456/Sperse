export interface ActionMenuItem {
    text?: string;
    getText?: (itemData: any) => string;
    class: string;
    visible?: boolean;
    disabled?: boolean;
    action: () => void;
    checkVisible?: (itemData: any) => boolean;
    button?: {
        text: string;
        action: (event: any) => void;
        checkVisible?: (itemData: any) => boolean;
    };
}