export interface ITotalOption {
    key: string;
    label: string;
    method: Function;
    hasCurrencyFilter: true;
    argumentField: string;
    valueField: string;
    format?: string;
    sorting?: (a: any, b: any) => -1 | 0 | 1;
    getColor?: (item: any) => string;
}
