export interface SectionItem {
    name: string;
    lname?: string;
    readonly?: boolean;
    wide?: boolean;
    action?: () => void;
    hideLabel?: boolean;
    hideEmpty?: boolean;
    type?: any;
}