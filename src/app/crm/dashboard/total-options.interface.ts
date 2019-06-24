export interface ITotalOption {
    key: string;
    label: string;
    method: Function;
    argumentField: string;
    valueField: string;
    argumentIsColor?: boolean;
    sorting?: (a: any, b: any) => -1 | 0 | 1;
    getColor?: (argument: string) => string;
}
