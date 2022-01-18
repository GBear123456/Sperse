import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';

export class FilterServicesAndProductsModel extends FilterCheckBoxesModel {
    codeField: string;

    public constructor(init?: Partial<FilterServicesAndProductsModel>) {
        super(init);
    }
}