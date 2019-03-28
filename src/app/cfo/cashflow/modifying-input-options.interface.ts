export interface IModifyingInputOptions {
    currencySymbol: string;
    type: 'number' | 'text';
    fontSize?: string;
    onValueChanged?: (e, cellObj) => void;
    onEnterKey?: (e, cellObj) => void;
}
