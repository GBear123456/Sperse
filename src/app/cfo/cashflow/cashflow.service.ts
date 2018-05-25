import { Injectable } from '@angular/core';
import { CellInfo } from './models/cell-info';
import { CategorizationPrefixes } from './enums/categorization-prefixes.enum';
import { BankAccountDto } from '@shared/service-proxies/service-proxies';
import * as _ from 'underscore';

@Injectable()
export class CashflowService {

    constructor() { }

    /**
     * Gets categorization properties and their values depend on targets and forecasts data
     * @param forecast
     * @param {CellInfo} target
     * @param {boolean} subCategoryIsCategory
     * @return {{categoryId: number; transactionDescriptor: string}}
     */
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

    /**
     * Get Category value by prefix
     * @param {any[]} path
     * @param {CategorizationPrefixes} prefix
     * @return {any}
     */
    getCategoryValueByPrefix(path: any[], prefix: CategorizationPrefixes): any {
        let value;
        path.some(pathItem => {
            if (pathItem && pathItem.slice(0, 2) === prefix) {
                value = pathItem.slice(2);
                return true;
            }
            return false;
        });
        return value;
    }

    /**
     * Gets active accounts ids including filter
     * @param {BankAccountDto[]} bankAccounts
     * @param {number[]} idsFromFilter
     * @return {number[]}
     */
    getActiveAccountIds(bankAccounts: BankAccountDto[], idsFromFilter: number[] = null): number[] {
        let activeBankAccountsIds: number[] = bankAccounts.filter(account => account.isActive).map(account => account.id);
        if (idsFromFilter && idsFromFilter.length) {
            activeBankAccountsIds = _.intersection(activeBankAccountsIds, idsFromFilter);
        }
        return activeBankAccountsIds;
    }

}
