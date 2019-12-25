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
    private pivotGridInitialBeforeSend;
    constructor() {
        dxAjax.setStrategy((options) => {
            options.responseType = 'application/json';
            let key = (options.url.match(/odata\/(\w+)[\?|$]/) || []).pop() + (options.headers.context || '');
            return (this._dxRequestPool[key] = dxAjax.sendRequest(options));
        });
    }

    loadDataSource(dataSource, uri, url?) {
        let promise = Promise.resolve([]);
        if (dataSource) {
            if (dataSource.isLoading() && dataSource['operationId'])
                dataSource.cancel(dataSource['operationId']);
            if (this._dxRequestPool[uri])
                this._dxRequestPool[uri].abort();

            if (url)
                dataSource['_store']['_url'] = url;
            promise = dataSource.reload();
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

    private getODataFilterString(filter): string {
        return filter ? buildQuery({ filter }) : '';
    }

    private advancedODataFilter(grid: any, uri: string, query: any[], searchColumns: any[], searchValue: string, instanceData = null, params = null) {
        let queryWithSearch = query.concat(this.getSearchFilter(searchColumns, searchValue)),
            url = this.getODataUrl(uri, queryWithSearch, instanceData, params);

        /** Add filter to the params for pivot grid data source */
        if (grid.NAME === 'dxPivotGrid') {
            const filter = queryWithSearch ? buildQuery({ filter: queryWithSearch }) : '';
            if (filter) {
                if (!this.pivotGridInitialBeforeSend) {
                    this.pivotGridInitialBeforeSend = grid.getDataSource()._store._dataSource._store._beforeSend;
                }
                const newBeforeSend = (request) => {
                    const filterIndex = request.url.indexOf('?$filter');
                    if (filterIndex !== -1) {
                        request.url = request.url.slice(0, filterIndex);
                    }
                    request.params['$filter'] = filter.slice('?$filter='.length);
                    this.pivotGridInitialBeforeSend(request);
                };
                grid.getDataSource()._store._dataSource._store._beforeSend = newBeforeSend;
            }
        }

        this.loadDataSource(grid.getDataSource(), uri, url);

        return queryWithSearch;
    }

    processODataFilter(grid, uri, filters: FilterModel[], getCheckCustom, searchColumns: any[], searchValue: string, instanceData = null, params = null) {
        return this.advancedODataFilter(grid, uri,
            (filters || []).map((filter: FilterModel) => {
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

    getODataFilter(filters: FilterModel[], getCheckCustom): string {
        filters = (filters || []).map((filter) => getCheckCustom && getCheckCustom(filter) || filter.getODataFilterObject());
        const odataQueryString = this.getODataFilterString(filters);
        return odataQueryString.slice('?$filter='.length);
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
