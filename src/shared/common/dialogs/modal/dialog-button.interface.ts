export interface IDialogButton {
    id?: string;
    title?: string;
    class?: string;
    hint?: string;
    iconName?: string;
    action?: () => void;
}
