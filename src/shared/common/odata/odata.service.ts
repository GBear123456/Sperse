import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { FilterModel } from '@shared/filters/models/filter.model';
import { ODataSearchStrategy } from '@shared/AppEnums';
import buildQuery from 'odata-query';
import * as dxAjax from 'devextreme/core/utils/ajax';
import { InstanceType } from '@shared/service-proxies/service-proxies';

@Injectable({
    providedIn: 'root'
})
export class ODataService {
    private _dxRequestPool = {};

    constructor() {
        dxAjax.setStrategy((options) => {
            options.responseType = 'application/json';
            let key = options.url.match(/odata\/(\w+)(\?|$)/)[1] +
                (options.headers.context || '');

            return (this._dxRequestPool[key] = dxAjax.sendRequest(options));
        });
    }

    loadDataSource(dataSource, uri, url?) {
        let promise = Promise.resolve();
        if (dataSource) {
            if (dataSource.isLoading() && dataSource['operationId'])
                dataSource.cancel(dataSource['operationId']);
            if (this._dxRequestPool[uri])
                this._dxRequestPool[uri].abort();

            if (url)
                dataSource['_store']['_url'] = url;
            promise = dataSource.load();
            dataSource['operationId'] = promise['operationId'];
        }
        return promise;
    }

    getODataUrl(uri: String, filter?: Object, instanceData = null, params?: { name: string, value: string }[]) {
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
        if (params && params.length) {
            params.forEach(param => {
                url += (url.indexOf('?') == -1 ? '?' : '&');
                url += param.name + '=' + encodeURIComponent(param.value).replace(/[?&]$/, '');
            });
        }

        return url;
    }

    private advancedODataFilter(grid: any, uri: string, query: any[], searchColumns: any[], searchValue: string, instanceData = null, params = null) {
        let queryWithSearch = query.concat(this.getSearchFilter(searchColumns, searchValue)),
            url = this.getODataUrl(uri, queryWithSearch, instanceData, params);

        this.loadDataSource(grid.getDataSource(), uri, url);

        return queryWithSearch;
    }

    processODataFilter(grid, uri, filters, getCheckCustom, searchColumns: any[], searchValue: string, instanceData = null, params = null) {
        return this.advancedODataFilter(grid, uri,
            (filters || []).map((filter) => {
                return getCheckCustom && getCheckCustom(filter) ||
                    filter.getODataFilterObject();
            }),
            searchColumns,
            searchValue,
            instanceData,
            params
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
