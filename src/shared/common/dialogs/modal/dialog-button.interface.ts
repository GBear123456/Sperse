export interface IDialogButton {
    id?: string;
    title?: string;
    class?: string;
    disabled?: boolean;
    hint?: string;
    iconName?: string;
    action?: () => void;
}
