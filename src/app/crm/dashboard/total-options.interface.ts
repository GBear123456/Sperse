export interface ITotalOption {
    key: string;
    label: string;
    method: Function;
    argumentField: string;
    valueField: string;
    sorting?: (a: any, b: any) => -1 | 0 | 1;
    getColor?: (item: any) => string;
}
