/** Core imports */
import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Params, Router } from '@angular/router';

/** Third party imports */
import { Observable, combineLatest, fromEvent, of } from 'rxjs';
import { map, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';
import flatten from 'lodash/flatten';

/** Application imports */
import { FiltersService } from '@shared/filters/filters.service';
import { AppService } from '@app/app.service';
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';
import { ODataService } from '@shared/common/odata/odata.service';
import { SummaryBy } from '@app/shared/common/slice/chart/summary-by.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';
import { FilterModel } from '@shared/filters/models/filter.model';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import {
    GetUserPermissionsForEditOutput,
    InstanceServiceProxy,
    UserServiceProxy
} from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';
import { environment } from '../../environments/environment';
import { AppPermissions } from '@shared/AppPermissions';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';
import { Param } from '@shared/common/odata/param.model';
import { SliceChartData } from '@app/crm/shared/common/slice-chart-data.interface';
import { UrlHelper } from '@shared/helpers/UrlHelper';

@Injectable()
export class CrmService {
    windowResize$: Observable<Event | number> = fromEvent(window, 'resize').pipe(startWith(window.innerWidth));
    contentWidth$: Observable<number> = combineLatest(
        this.filtersService.filterFixed$,
        this.windowResize$
    ).pipe(map(([filterFixed]) => filterFixed ? window.innerWidth - 341 : window.innerWidth));
    contentHeight$: Observable<number> = combineLatest(
        this.appService.toolbarIsHidden$,
        this.fullScreenService.isFullScreenMode$,
        this.windowResize$
    ).pipe(map(([toolbarIsHidden, isFullScreenMode, ]: [boolean, boolean, any]) => {
        let height: number;
        if (isFullScreenMode) {
            height = window.innerHeight - 60;
        } else if (toolbarIsHidden) {
            height = window.innerHeight - 150;
        } else {
            height = window.innerHeight - 210;
        }
        return height;
    }));
    mapHeight$: Observable<number> = this.contentHeight$.pipe(
        map((contentHeight: number) => contentHeight - 88)
    );
    private usersIdsWithInstance: { [id: string]: boolean } = {};
    private usersPermissions: { [id: string]: Observable<string[]> } = {};
    showSliceButtons: boolean = environment.releaseStage !== 'production' && environment.releaseStage !== 'beta';

    constructor(
        private filtersService: FiltersService,
        private appService: AppService,
        private fullScreenService: FullScreenService,
        private oDataService: ODataService,
        private http: HttpClient,
        private ls: AppLocalizationService,
        private router: Router,
        private location: Location,
        private instanceServiceProxy: InstanceServiceProxy,
        private userService: UserServiceProxy
    ) {}

    static getEntityDetailsLink(contactId: string | number, section?: string, leadId?: number, organizationId?: number): any[] {
        return ['app/crm/contact', contactId]
            .concat(leadId ? ['lead', leadId] : [])
            .concat(organizationId ? ['company', organizationId] : [])
            .concat(section ? [ section ] : []);
    }

    static getModuleNameFromLayoutType(dataLayoutType: DataLayoutType) {
        let moduleName: string;
        switch (dataLayoutType) {
            case DataLayoutType.PivotGrid:
            case DataLayoutType.Chart:
            case DataLayoutType.Map: {
                moduleName = 'slice';
                break;
            }
            default: moduleName = 'crm';
        }
        return moduleName;
    }

    static setDataSourceToComponent(dataSource: any, componentInstance: any) {
        if (componentInstance && !componentInstance.option('dataSource')) {
            componentInstance.option('dataSource', dataSource);
        }
    }

    loadSlicePivotGridData(sourceUri: string, filters: FilterModel[], loadOptions, params?: { [paramName: string]: string }) {
        let d = $.Deferred();
        params = {
            group: loadOptions.group ? JSON.stringify(loadOptions.group) : '',
            filter: loadOptions.filter ? JSON.stringify(loadOptions.filter) : '',
            totalSummary: loadOptions.totalSummary ? JSON.stringify(loadOptions.totalSummary) : '',
            groupSummary: loadOptions.groupSummary ? JSON.stringify(loadOptions.groupSummary) : '',
            ...params
        };
        if (loadOptions.take !== undefined) {
            params['take'] = loadOptions.take;
        }
        if (loadOptions.skip !== undefined) {
            params['skip'] = loadOptions.skip;
        }
        this.oDataService.getODataFilter(filters, this.filtersService.getCheckCustom).pipe(
            map((oDataRequestValues: ODataRequestValues) => this.updateParams(oDataRequestValues, params)),
            switchMap(() => this.http.get(sourceUri, {
                params: params,
                headers: new HttpHeaders({
                    'Authorization': 'Bearer ' + abp.auth.getToken()
                })
            }))
        ).subscribe((result) => {
            if ('data' in result) {
                d.resolve(result['data'], {
                    summary: result['summary'],
                    totalCount: result['totalCount']
                });
            } else {
                d.resolve(result);
            }
        });
        return d.promise();
    }

    getChartDataUrl(
        sourceUri: string,
        oDataRequestValues: ODataRequestValues,
        summaryBy: SummaryBy,
        dateField: 'LeadDate' | 'ContactDate',
        additionalParams?: { [name: string]: any}
    ): string {
        let group = [
            {
                selector: dateField,
                groupInterval: summaryBy,
                isExpanded: false,
                desc: false
            }
        ];
        /** Add grouping by year also to avoid grouping by month or quarters of different years */
        if (summaryBy !== SummaryBy.Year) {
            group.unshift({
                selector: dateField,
                groupInterval: SummaryBy.Year,
                isExpanded: false,
                desc: false
            });
        }
        const params = {
            group: JSON.stringify(group),
            groupSummary: `[{"selector":"${dateField}","summaryType":"min"}]`,
            ...additionalParams
        };
        this.updateParams(oDataRequestValues, params);
        return UrlHelper.getUrl(sourceUri, params);
    }

    parseChartData(result: any): SliceChartData {
        const avgGroupValue = result.totalCount ? (result.totalCount / result.data.length).toFixed(0) : 0;
        let minGroupValue, maxGroupValue;
        const data = result.data[0] && result.data[0].items ? flatten(result.data.map(a => a.items)) : result.data;
        const items = data && data.map(contact => {
            minGroupValue = !minGroupValue || contact.count < minGroupValue ? contact.count : minGroupValue;
            maxGroupValue = !maxGroupValue || contact.count > maxGroupValue ? contact.count : maxGroupValue;
            return {
                creationDate: contact.summary[0],
                count: contact.count
            };
        });
        const chartInfoItems: InfoItem[] = [
            {
                label: this.ls.l('Totals'),
                value: result.totalCount
            },
            {
                label: this.ls.l('Average'),
                value: avgGroupValue
            },
            {
                label: this.ls.l('Lowest'),
                value: minGroupValue || 0
            },
            {
                label: this.ls.l('Highest'),
                value: maxGroupValue || 0
            }
        ];
        return {
            items: items.sort(this.sortByDate),
            infoItems: chartInfoItems
        };
    }

    updateParams(oDataRequestValues: ODataRequestValues, params = {}) {
        if (oDataRequestValues && oDataRequestValues.filter) {
            params['$filter'] = oDataRequestValues.filter;
        }
        if (oDataRequestValues && oDataRequestValues.params && oDataRequestValues.params.length) {
            oDataRequestValues.params.forEach((param: Param) => {
                params[param.name] = param.value;
            });
        }
        return params;
    }

    sortByDate = (a: any, b: any) => {
        const dateA = new Date(a.creationDate);
        const dateB = new Date(b.creationDate);
        return dateA > dateB ? 1 : (dateA < dateB ? -1 : 0);
    }

    handleModuleChange(newDataLayoutType: DataLayoutType) {
        const currentModule = this.appService.getModule();
        const targetModule = CrmService.getModuleNameFromLayoutType(newDataLayoutType);
        if (targetModule !== currentModule) {
            this.appService.switchModule(targetModule);
            /** Update url */
            const newUrl = this.router.url.replace(currentModule, targetModule);
            this.location.replaceState(newUrl);
        }
    }

    getUsersWithInstances(usersIds: number[]): Observable<number[]> {
        if (usersIds instanceof Array)
            return this.instanceServiceProxy.getUsersWithInstance(usersIds).pipe(map((usersIdsWithInstance: number[]) => {
                usersIds.forEach((userId) => {
                    this.usersIdsWithInstance[userId] = usersIdsWithInstance.indexOf(userId) >= 0;
                });
                return usersIdsWithInstance;
            }));
        else
            return of([]);
    }

    isCfoAvailable(userId: number): Observable<boolean> {
        if (userId)
            return this.usersIdsWithInstance.hasOwnProperty(userId) ?
                of(this.usersIdsWithInstance[userId]) :
                this.instanceServiceProxy.getUsersWithInstance([userId]).pipe(
                    map((usersIds: number[]) => {
                        return this.usersIdsWithInstance[userId] = !!usersIds.length;
                    })
                );
        else
            return of(false);
    }

    isModuleAvailable(userId: number, modulePermission: AppPermissions): Observable<boolean> {
        return this.getUserPermissions(userId).pipe(
            map((grantedPermissions: string[]) => grantedPermissions.indexOf(modulePermission) >= 0
        ));
    }

    private getUserPermissions(userId: number): Observable<string[]> {
        if (userId && !this.usersPermissions[userId]) {
            this.usersPermissions[userId] = this.userService.getUserPermissionsForEdit(userId).pipe(
                map((permissionsOutput: GetUserPermissionsForEditOutput) => permissionsOutput.grantedPermissionNames),
                publishReplay(),
                refCount()
            );
        }
        return !userId ? of([]) : this.usersPermissions[userId];
    }

    handleCountryStateParams(queryParams$: Observable<Params>, countryStatesFilter: FilterModel) {
        queryParams$.subscribe((params: Params) => this.updateCountryStateFilter(params, countryStatesFilter));
    }

    updateCountryStateFilter(params: Params, countryStatesFilter: FilterModel): boolean {
        let filterChanged = false;
        if (params.countryId) {
            if (params.countryId && params.stateId) {
                countryStatesFilter.items.countryStates.value = [ params.countryId + ':' + params.stateId ];
            } else if (params.countryId) {
                countryStatesFilter.items.countryStates.value = [ params.countryId ];
            }
            countryStatesFilter.updateCaptions();
            filterChanged = true;
        }
        return filterChanged;
    }

    updateDateFilter(params: Params, dateFilter: FilterModel): boolean {
        let filterChanged = false;
        if (params.startDate || params.endDate) {
            if (params.startDate) {
                dateFilter.items.from.value = params.startDate === 'null'
                    ? null
                    : DateHelper.addTimezoneOffset(new Date(params.startDate), true);
            }
            if (params.endDate) {
                dateFilter.items.to.value = params.endDate === 'null'
                    ? null
                    : DateHelper.addTimezoneOffset(new Date(params.endDate), true);
            }
            dateFilter.updateCaptions();
            filterChanged = true;
        }
        return filterChanged;
    }
}