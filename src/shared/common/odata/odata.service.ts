/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import buildQuery from 'odata-query';
import * as dxAjax from 'devextreme/core/utils/ajax';
import { Observable, forkJoin, of } from 'rxjs';
import { map, tap, pluck } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { FilterModel } from '@shared/filters/models/filter.model';
import { ODataSearchStrategy } from '@shared/AppEnums';
import { InstanceType } from '@shared/service-proxies/service-proxies';
import { InstanceModel } from '@shared/cfo/instance.model';
import { Param } from '@shared/common/odata/param.model';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';

@Injectable({
    providedIn: 'root'
})
export class ODataService {
    private dxRequestPool = {};
    private pivotGridInitialBeforeSend;

    constructor() {
        dxAjax.setStrategy((options) => {
            options.responseType = 'application/json';
            let key = (options.url.match(/odata\/(\w+)[\?|$]?/) || []).pop() + (options.headers.context || '');
            return (this.dxRequestPool[key] = dxAjax.sendRequest(options));
        });
    }

    loadDataSource(dataSource, uri: string, url?: string): Promise<any> {
        let promise = Promise.resolve([]);
        if (dataSource) {
            this.cancelDataSource(dataSource, uri);
            if (url && dataSource['_store'])
                dataSource['_store']['_url'] = url;
            promise = dataSource.reload();
            dataSource['operationId'] = promise['operationId'];
        }
        return promise;
    }

    cancelDataSource(dataSource, requestKey) {
        if (dataSource.isLoading() && !isNaN(dataSource['operationId']))
            dataSource.cancel(dataSource['operationId']);
        if (this.dxRequestPool[requestKey])
            this.dxRequestPool[requestKey].abort();
    }

    getODataUrl(uri: string, filter?: any, instanceData: InstanceModel = null, params: Param[] = []): string {
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
        url = this.addParamsToUrl(url, params);
        return url;
    }

    private addParamsToUrl(url: string, params: Param[]): string {
        if (params && params.length) {
            params.forEach(param => {
                url += (url.indexOf('?') == -1 ? '?' : '&');
                url += param.name + '=';
                if (param.value != null) {
                    url += encodeURIComponent(param.value).replace(/[?&]$/, '');
                }
            });
        }
        return url;
    }

    getODataFilterString(filter): Observable<ODataRequestValues> {
        return this.getODataRequestValues(filter).pipe(
            map((requestValues: ODataRequestValues) => {
                filter = requestValues.filter;
                return {
                    filter: (filter ? buildQuery({ filter }) : '').slice('?$filter='.length),
                    params: requestValues.params
                };
            })
        );
    }

    getODataRequestValues(filter): Observable<ODataRequestValues> {
        let simpleFilters = [], serverCachedFilters: Observable<any>[] = [];
        let params = [];
        filter.forEach((filterData) => {
            const filterValue = Object.values(filterData)[0];
            if (filterValue instanceof Observable) {
                serverCachedFilters.push(filterData);
            } else {
                simpleFilters.push(filterData);
            }
        });
        return (serverCachedFilters && serverCachedFilters.length
            ? forkJoin(
                ...serverCachedFilters.map((filter) => {
                    const filterValue: any = Object.values(filter)[0];
                    return filterValue.pipe(
                        tap((uuid: string) => {
                            params.push({
                                name: Object.keys(filter)[0],
                                value: uuid
                            });
                        })
                    );
                }))
            : of(true)
        ).pipe(
             map(() => ({
                 filter: simpleFilters,
                 params: params
             }))
        );
    }

    private advancedODataFilter(
        grid: any,
        uri: string,
        query: any[],
        searchColumns: any[],
        searchValue: string,
        instanceData: InstanceModel = null,
        params: Param[] = []
    ): Observable<string> {
        const requestValuesWithSearch$ = this.getODataRequestValues(query).pipe(
            map((requestValues: ODataRequestValues) => ({
                filter: requestValues.filter.concat(this.getSearchFilter(searchColumns, searchValue)),
                params: requestValues.params
            }))
        );
        requestValuesWithSearch$.subscribe((requestValues: ODataRequestValues) => {
            let url = this.getODataUrl(uri, requestValues.filter, instanceData, [ ...(params || []), ...requestValues.params]);
            if (grid) {
                /** Add filter to the params for pivot grid data source */
                if (grid.NAME === 'dxPivotGrid') {
                    const filter = requestValues.filter ? buildQuery({ filter: requestValues.filter }) : '';
                    if (filter) {
                        const store = grid.getDataSource()._store;
                        if (!this.pivotGridInitialBeforeSend) {
                            this.pivotGridInitialBeforeSend = store && store._dataSource._store._beforeSend;
                        }
                        const newBeforeSend = (request) => {
                            const filterIndex = request.url.indexOf('?$filter');
                            if (filterIndex !== -1) {
                                request.url = request.url.slice(0, filterIndex);
                            }
                            request.params['$filter'] = filter.slice('?$filter='.length);
                            this.pivotGridInitialBeforeSend(request);
                        };
                        if (store) {
                            store._dataSource._store._beforeSend = newBeforeSend;
                        }
                    }
                }
                this.loadDataSource(grid.getDataSource(), uri, url);
            }
        });
        return requestValuesWithSearch$.pipe(pluck('filter'));
    }

    processODataFilter(
        grid,
        uri,
        filters: FilterModel[],
        getCheckCustom,
        searchColumns: any[],
        searchValue: string,
        instanceData: InstanceModel = null,
        params: Param[] = null
    ): Observable<string> {
        return this.advancedODataFilter(
            grid,
            uri,
            this.processFilters(filters, getCheckCustom),
            searchColumns,
            searchValue,
            instanceData,
            params
        );
    }

    processFilters(filters: FilterModel[], getCheckCustom): any[] {
        let processedFilters = [];
        (filters || []).forEach((filter: FilterModel) => {
            const processedFilter = getCheckCustom && getCheckCustom(filter);
            if (processedFilter) {
                if (processedFilter !== 'cancelled') {
                    processedFilters.push(processedFilter);
                }
            } else {
                processedFilters.push(filter.getODataFilterObject());
            }
        });
        return processedFilters;
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

    getODataFilter(filters: FilterModel[], getCheckCustom): Observable<ODataRequestValues> {
        return this.getODataFilterString(this.processFilters(filters, getCheckCustom));
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
