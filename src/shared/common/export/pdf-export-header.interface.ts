export interface PdfExportHeader {
    name: string;
    prompt?: string;
    width?: number;
    align?: string;
    padding?: number;
    calculateDisplayValue?: ((rowData: any) => any);
    lookup?: any;
}
