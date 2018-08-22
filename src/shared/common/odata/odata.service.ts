import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { FilterModel } from '@shared/filters/models/filter.model';
import { ODataSearchStrategy } from '@shared/AppEnums';
import buildQuery from 'odata-query';
import { InstanceType } from '@shared/service-proxies/service-proxies';

@Injectable({
    providedIn: 'root'
})
export class ODataService {

    getODataUrl(uri: String, filter?: Object, instanceData = null) {
        let url = AppConsts.remoteServiceBaseUrl + '/odata/' + uri + (filter ? buildQuery({ filter }) : '');
        if (instanceData) {
            url += (url.indexOf('?') == -1 ? '?' : '&');

            if (instanceData.instanceType !== undefined && InstanceType[instanceData.instanceType] !== undefined) {
                url += 'instanceType=' + encodeURIComponent('' + InstanceType[instanceData.instanceType]) + '&';
            }

            if (instanceData.instanceId !== undefined) {
                url += 'instanceId=' + encodeURIComponent('' + instanceData.instanceId) + '&';
            }

            url = url.replace(/[?&]$/, '');
        }
        return url;
    }

    private advancedODataFilter(grid: any, uri: string, query: any[], searchColumns: any[], searchValue: string, instanceData = null) {
        let queryWithSearch = query.concat(this.getSearchFilter(searchColumns, searchValue));
        let dataSource = grid.getDataSource();
        dataSource['_store']['_url'] = this.getODataUrl(uri, queryWithSearch, instanceData);
        dataSource.load().done(() => grid.repaint());
        return queryWithSearch;
    }

    processODataFilter(grid, uri, filters, getCheckCustom, searchColumns: any[], searchValue: string, instanceData = null) {
        return this.advancedODataFilter(grid, uri,
            filters.map((filter) => {
                return getCheckCustom && getCheckCustom(filter) ||
                    filter.getODataFilterObject();
            }),
            searchColumns,
            searchValue,
            instanceData
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
