/** Core imports */
import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { Observable, combineLatest, fromEvent} from 'rxjs';
import { map, startWith } from 'rxjs/operators';

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

@Injectable()
export class CrmService {
    windowResize$: Observable<Event> = fromEvent(window, 'resize').pipe(startWith(window.innerWidth));
    contentWidth$: Observable<number> = combineLatest(
        this.filtersService.filterFixed$,
        this.windowResize$
    ).pipe(map(([filterFixed]) => filterFixed ? window.innerWidth - 341 : window.innerWidth));
    contentHeight$: Observable<number> = combineLatest(
        this.appService.toolbarIsHidden$,
        this.fullScreenService.isFullScreenMode$,
        this.windowResize$
    ).pipe(map(([toolbarIsHidden, isFullScreenMode]: [boolean, boolean]) => {
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
        map((contentHeight) => contentHeight - 88)
    );

    constructor(
        private filtersService: FiltersService,
        private appService: AppService,
        private fullScreenService: FullScreenService,
        private oDataService: ODataService,
        private http: HttpClient,
        private ls: AppLocalizationService,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location
    ) {}

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
        const filter = this.oDataService.getODataFilter(filters, this.filtersService.getCheckCustom);
        if (filter) {
            params['$filter'] = filter;
        }
        this.http.get(sourceUri, {
            params: params,
            headers: new HttpHeaders({
                'Authorization': 'Bearer ' + abp.auth.getToken()
            })
        }).subscribe((result) => {
            if ('data' in result) {
                d.resolve(result['data'], { summary: result['summary'] });
            } else {
                d.resolve(result);
            }
        });
        return d.promise();
    }

    loadSliceChartData(sourceUri: string, filters, summaryBy: SummaryBy, additionalParams?: { [name: string]: any}): Promise<{ items: any[], infoItems: InfoItem[] }> {
        const params = {
            group: `[{"selector":"CreationTime","groupInterval":"${summaryBy}","isExpanded":false,"desc":false}]`,
            groupSummary: '[{"selector":"CreationTime","summaryType":"min"}]',
            ...additionalParams
        };
        const filter = this.oDataService.getODataFilter(filters, this.filtersService.getCheckCustom);
        if (filter) {
            params['$filter'] = filter;
        }
        return this.http.get(sourceUri, {
            headers: new HttpHeaders({
                'Authorization': 'Bearer ' + abp.auth.getToken()
            }),
            params: params
        }).toPromise().then((result: any) => {
            const avgGroupValue = result.totalCount ? (result.totalCount / result.data.length).toFixed(0) : 0;
            let minGroupValue, maxGroupValue;
            const items = result.data.map(contact => {
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
        });
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

}
