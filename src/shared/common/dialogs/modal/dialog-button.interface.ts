export interface IDialogButton {
    id?: string;
    title?: string;
    class?: string;
    iconName?: string;
    action?: () => void;
}
