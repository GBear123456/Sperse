import { Injectable } from '@angular/core';
import { CellInfo } from './models/cell-info';
import { CellInterval } from './models/cell-interval';
import { CategorizationPrefixes } from './enums/categorization-prefixes.enum';
import { BankAccountDto, CategoryDto, GetCategoryTreeOutput } from '@shared/service-proxies/service-proxies';
import * as _ from 'underscore';
import * as moment from 'moment-timezone';

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
    getCategorizationFromForecastAndTarget(source: CellInfo, target: CellInfo, subCategoryIsCategory = true) {

        let categorization = {};
        if (this.isUnclassified(target)) {
            categorization['cashflowTypeId'] = categorization['cashFlowTypeId'] = target.cashflowTypeId;
            categorization['transactionDescriptor'] = target.transactionDescriptor;
            return categorization;
        }

        let cashflowTypeId = target.cashflowTypeId != source.cashflowTypeId ? target.cashflowTypeId : source.cashflowTypeId;
        let accountingTypeId = target.accountingTypeId && target.accountingTypeId != source.accountingTypeId ? target.accountingTypeId : source.accountingTypeId;
        let subCategoryId;
        if (target.subCategoryId) {
            subCategoryId = target.subCategoryId && target.subCategoryId != source.subCategoryId ? target.subCategoryId : source.subCategoryId;
        }
        let categoryId = target.categoryId && target.categoryId != source.categoryId ? target.categoryId : source.categoryId;
        let transactionDescriptor = target.transactionDescriptor && target.transactionDescriptor != source.transactionDescriptor ? target.transactionDescriptor : source.transactionDescriptor;
        categorization = {
            categoryId: subCategoryIsCategory && subCategoryId ? subCategoryId : categoryId,
            transactionDescriptor: transactionDescriptor,
            accountingTypeId: accountingTypeId
        };

        if (!subCategoryIsCategory) {
            categorization['subCategoryId'] = subCategoryId;
        }

        categorization['cashflowTypeId'] = categorization['cashFlowTypeId'] = cashflowTypeId;
        return categorization;
    }

    isUnclassified(cell: CellInfo): boolean {
        return !cell.accountingTypeId && !cell.categoryId && !cell.subCategoryId;
    }

    isHorizontalCopying(sourceCellObj: any, targetCellObjs: any[]) {
        return targetCellObjs.every(targetCell => targetCell.rowIndex === sourceCellObj.rowIndex && targetCell.columnIndex !== sourceCellObj.columnIndex);
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

    /**
     * Get active account id
     * @param {number[]} activeAccountIds
     * @param {number} accountId
     * @return {number}
     */
    getActiveAccountId(activeAccountIds: number[], accountId: number = null) {
        return activeAccountIds && activeAccountIds.length ?
               accountId && (activeAccountIds.indexOf(accountId) !== -1 ? accountId : activeAccountIds[0]) :
               accountId;
    }

    /**
     * Gets current date with 00:00:00 time
     * @returns {moment.Moment}
     */
    getUtcCurrentDate(): moment.Moment {
        return moment.tz(moment().format('YYYY-MM-DD') + 'T00:00:00', 'UTC');
    }

    /**
     * Get forecasts interval for adding forecasts
     * @param futureForecastsYearCount
     * @returns {CellInterval}
     */
    getAllowedForecastsInterval(forecastsYearCount: number): CellInterval {
        const currentDate = this.getUtcCurrentDate();
        return {
            startDate: currentDate,
            endDate: moment(currentDate).add('day', -1).add('year', forecastsYearCount).endOf('day')
        };
    }

    cellIsAllowedForAddingForecast(cellInterval: CellInterval, futureForecastsYearCount: number): boolean {
        const allowedForecastsInterval = this.getAllowedForecastsInterval(futureForecastsYearCount);
        return cellInterval.endDate.isBefore(allowedForecastsInterval.endDate) ||
               cellInterval.startDate.isBefore(allowedForecastsInterval.endDate);
    }

    isSubCategory(categoryId: number, categoryTree: GetCategoryTreeOutput): boolean {
        return categoryId && !!categoryTree.categories[categoryId].parentId;
    }

    getCategoryFullPath(categoryId: number, category: CategoryDto, categoryTree: GetCategoryTreeOutput): string[] {
        let allCategoriesInPath: string[] = this.getCategoryPath(categoryId, categoryTree);
        return [
            CategorizationPrefixes.CashflowType + categoryTree.accountingTypes[category.accountingTypeId].typeId,
            ...allCategoriesInPath
        ];
    }

    private getCategoryPath(categoryId: number, categoryTree: GetCategoryTreeOutput): string[] {
        const parentCategoryId = categoryTree.categories[categoryId].parentId;
        const prevCategories = parentCategoryId  ? this.getCategoryPath(parentCategoryId, categoryTree) : [];
        const prefix = !!parentCategoryId ? CategorizationPrefixes.SubCategory : CategorizationPrefixes.Category;
        return [ ...prevCategories, prefix + categoryId ];
    }

    categoryHasTransactions(treePathes, categoryPath: string[]): boolean {
        return Object.keys(treePathes).some(path => path.indexOf(categoryPath.join(',')) >= 0);
    }
}
