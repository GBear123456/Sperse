/** Core imports */
import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/** Third party imports */
import * as canadaMap from 'devextreme/dist/js/vectormap-data/canada.js';
import * as usaMap from 'devextreme/dist/js/vectormap-data/usa.js';
import * as worldMap from 'devextreme/dist/js/vectormap-data/world.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { pluck, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import { MapArea } from '@app/shared/common/slice/map/map-area.enum';
import { MapAreaItem } from '@app/shared/common/slice/map/map-area-item.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';
import { map, withLatestFrom } from '@node_modules/rxjs/operators';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';
import { Param } from '@shared/common/odata/param.model';
import { UrlHelper } from '@shared/helpers/UrlHelper';

@Injectable()
export class MapService {
    mapAreasItems: MapAreaItem[] = [
        {
            key: MapArea.USA,
            name: this.ls.l('USA'),
            map: usaMap.usa,
            bounds: [-143, 62, -60, 5],
            zoomFactor: 1.8
        },
        {
            key: MapArea.Canada,
            name: this.ls.l('Canada'),
            map: canadaMap.canada,
            bounds: [-128, 90, -60, -20],
            zoomFactor: 1
        },
        {
            key: MapArea.World,
            name: this.ls.l('World'),
            map: worldMap.world,
            bounds: [-180, 85, 180, -60],
            zoomFactor: 1
        }
    ];
    selectedMapAreaItem: BehaviorSubject<MapAreaItem> = new BehaviorSubject<MapAreaItem>(
        this.selectedMapArea
            ? this.mapAreasItems.find((mapAreaItem: MapAreaItem) => mapAreaItem.key === this.selectedMapArea)
            : this.mapAreasItems[0]
    );
    selectedMapAreaItem$: Observable<MapAreaItem> = this.selectedMapAreaItem.asObservable();
    selectedMapArea$: Observable<MapArea> = this.selectedMapAreaItem$.pipe(
        pluck('key')
    );
    constructor(
        private ls: AppLocalizationService,
        private http: HttpClient,
        @Inject('selectedMapArea') @Optional() private selectedMapArea: MapArea
    ) {}

    getSliceMapUrl(
        sourceUri: string,
        oDataRequestValues: ODataRequestValues,
        mapArea: MapArea,
        dateField: 'LeadDate' | 'ContactDate',
        params?: { [name: string]: any }
    ) {
        params = {
            group: `[{"selector":"${mapArea === MapArea.World ? 'CountryId' : 'StateId'}","isExpanded":false}]`,
            groupSummary: `[{"selector":"${dateField}","summaryType":"min"}]`,
            ...params
        };
        if (oDataRequestValues.params && oDataRequestValues.params.length) {
            oDataRequestValues.params.forEach((param: Param) => {
                params[param.name] = param.value;
            });
        }
        if (mapArea === MapArea.Canada) {
            params['filter'] = '[["CountryId","=","CA"]]';
        }
        if (mapArea === MapArea.USA) {
            params['filter'] = '[["CountryId","=","US"]]';
        }
        if (oDataRequestValues.filter) {
            params['$filter'] = oDataRequestValues.filter;
        }
        return UrlHelper.getUrl(sourceUri, params);
    }

    getAdjustedMapData(mapData$: Observable<any>): Observable<MapData> {
        return mapData$.pipe(
            map((mapData: any) => {
                const data: MapData = {};
                mapData.data.forEach(contact => {
                    data[contact.key] = {
                        name: contact.key,
                        total: contact.count
                    };
                });
                return data;
            })
        );
    }

    getMapInfoItems(mapData$: Observable<any>, mapArea$: Observable<MapArea>): Observable<InfoItem[]> {
        return mapData$.pipe(
            withLatestFrom(mapArea$),
            map(([mapData, mapArea]: [any, MapArea]) => {
                const itemWithoutKey = mapData.data.find(mapData => !mapData.key);
                const avgGroupValue = mapData.totalCount
                    ? (
                        itemWithoutKey
                            ? (mapData.totalCount - itemWithoutKey.count) / (
                                mapData.data.length > 1 ? mapData.data.length - 1 : 1
                            )
                            : mapData.totalCount / mapData.data.length
                    ).toFixed(0)
                    : 0;
                let minGroupValue, maxGroupValue;
                mapData.data.forEach(contact => {
                    if (contact.key) {
                        minGroupValue = !minGroupValue || contact.count < minGroupValue ? contact.count : minGroupValue;
                        maxGroupValue = !maxGroupValue || contact.count > maxGroupValue ? contact.count : maxGroupValue;
                    }
                });
                let mapInfoItems: InfoItem[] = [
                    {
                        label: this.ls.l('Totals'),
                        value: mapData.totalCount
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
                /** Add total data without null key */
                if (itemWithoutKey) {
                    mapInfoItems.splice(1, 0, {
                        label: this.ls.l('TotalsBy') + ' ' + (mapArea === MapArea.World
                            ? this.ls.l('Countries')
                            : this.ls.l('States')
                        ),
                        value: mapData.totalCount - itemWithoutKey.count
                    });
                }
                return mapInfoItems;
            }),
            publishReplay(),
            refCount()
        );
    }
}
