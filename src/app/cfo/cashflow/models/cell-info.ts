import { CellInterval } from './cell-interval';
export class CellInfo {
    date: CellInterval;
    fieldCaption: string;
    cashflowTypeId: string;
    categoryId: number;
    subCategoryId?: number;
    transactionDescriptor?: string;
}
