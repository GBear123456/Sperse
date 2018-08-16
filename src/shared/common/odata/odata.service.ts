import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { FilterModel } from '@shared/filters/models/filter.model';
import { ODataSearchStrategy } from '@shared/AppEnums';
import buildQuery from 'odata-query';

@Injectable({
    providedIn: 'root'
})
export class ODataService {

    getODataUrl(uri: String, filter?: Object) {
        return AppConsts.remoteServiceBaseUrl + '/odata/' + uri + (filter ? buildQuery({ filter }) : '');
    }

    private advancedODataFilter(grid: any, uri: string, query: any[], searchColumns: any[], searchValue: string) {
        let queryWithSearch = query.concat(this.getSearchFilter(searchColumns, searchValue));
        let dataSource = grid.getDataSource();
        dataSource['_store']['_url'] = this.getODataUrl(uri, queryWithSearch);
        dataSource.load().done(() => grid.repaint());
        return queryWithSearch;
    }

    processODataFilter(grid, uri, filters, getCheckCustom, searchColumns: any[], searchValue: string) {
        return this.advancedODataFilter(grid, uri,
            filters.map((filter) => {
                return getCheckCustom && getCheckCustom(filter) ||
                    filter.getODataFilterObject();
            }),
            searchColumns,
            searchValue
        );
    }

    getSearchFilter(searchColumns: any[], searchValue: string) {
        let data = {};
        let filterData: any[] = [];

        if (searchColumns && searchValue) {
            let values = FilterModel.getSearchKeyWords(searchValue);
            values.forEach((val) => {
                let valueFilterData: any[] = [];
                searchColumns.forEach((col) => {
                    let colName = col.name || col;
                    let searchStrategy = col.strategy || ODataSearchStrategy.Contains;
                    let el = this.getFilterExpression(colName, searchStrategy, val);
                    valueFilterData.push(el);
                });

                let elF = {
                    or: valueFilterData
                };
                filterData.push(elF);
            });

            data = {
                and: filterData
            };
        }

        return data;
    }

    private getFilterExpression(colName: string, strategy: string, value: string): object {
        let el = {};
        el[colName] = {};

        switch (strategy) {
            case ODataSearchStrategy.Contains:
            case ODataSearchStrategy.StartsWith:
                el[colName][strategy] = value;
                break;
            case ODataSearchStrategy.Equals:
            default:
                el[colName] = value;
        }
        return el;
    }
}
