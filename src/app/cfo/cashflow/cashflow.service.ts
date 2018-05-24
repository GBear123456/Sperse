import { Injectable } from '@angular/core';
import { CellInfo } from './models/cell-info';

@Injectable()
export class CashflowService {

    constructor() { }

    getCategorizationFromForecastAndTarget(forecast, target: CellInfo, subCategoryIsCategory = true) {
        let cashflowTypeId = target.cashflowTypeId != forecast.cashflowTypeId ? target.cashflowTypeId : forecast.cashflowTypeId;
        let subCategoryId = target.subCategoryId && target.subCategoryId != forecast.subCategoryId ? target.subCategoryId : forecast.subCategoryId;

        let categoryId = target.categoryId && target.categoryId != forecast.categoryId ? target.categoryId : forecast.categoryId;

        let transactionDescriptor = target.transactionDescriptor && target.transactionDescriptor != forecast.transactionDescriptor ? target.transactionDescriptor : forecast.transactionDescriptor;

        const categorization = {
            categoryId: subCategoryIsCategory && subCategoryId ? subCategoryId : categoryId,
            transactionDescriptor: transactionDescriptor
        };

        if (!subCategoryIsCategory) {
            categorization['subCategoryId'] = subCategoryId;
            categorization['cashflowTypeId'] = cashflowTypeId;
        } else {
            /** @todo change when parameters */
            categorization['cashFlowTypeId'] = cashflowTypeId;
        }
        return categorization;
    }

}
