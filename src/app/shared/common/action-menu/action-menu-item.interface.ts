export interface ActionMenuItem {
    text: string;
    class: string;
    visible?: boolean;
    disabled?: boolean;
    action: () => void;
}