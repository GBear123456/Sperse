/** Core imports */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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

    constructor(
        private filtersService: FiltersService,
        private appService: AppService,
        private fullScreenService: FullScreenService,
        private oDataService: ODataService,
        private http: HttpClient,
        private ls: AppLocalizationService
    ) { }

    static setDataSourceToComponent(dataSource: any, componentInstance: any) {
        if (componentInstance && !componentInstance.option('dataSource')) {
            componentInstance.option('dataSource', dataSource);
        }
    }

    loadSliceChartData(sourceURI: string, filters, summaryBy: SummaryBy, additionalParams?: { [name: string]: any}): Promise<{ items: any[], infoItems: InfoItem[] }> {
        const params = {
            group: `[{"selector":"CreationTime","groupInterval":"${summaryBy}","isExpanded":false,"desc":true}]`,
            groupSummary: '[{"selector":"CreationTime","summaryType":"min"}]',
            ...additionalParams
        };
        const filter = this.oDataService.getODataFilter(filters, this.filtersService.getCheckCustom);
        if (filter) {
            params['$filter'] = filter;
        }
        return this.http.get(sourceURI, {
            headers: new HttpHeaders({
                'Authorization': 'Bearer ' + abp.auth.getToken()
            }),
            params: params
        }).toPromise().then((contacts: any) => {
            const avgGroupValue = contacts.totalCount ? (contacts.totalCount / contacts.data.length).toFixed(0) : 0;
            let minGroupValue, maxGroupValue;
            const result = contacts.data.map(contact => {
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
                    value: contacts.totalCount
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
                items: result,
                infoItems: chartInfoItems
            };
        });
    }
}
