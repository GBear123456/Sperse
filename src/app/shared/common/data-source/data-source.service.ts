/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

/** Application imports */
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { AppConsts } from '@shared/AppConsts';
import { ODataService } from '@shared/common/odata/odata.service';

@Injectable()
export class DataSourceService {
    constructor(
        private oDataService: ODataService
    ) {}
    dataSourcesConfigs = {
        [ItemTypeEnum.Lead]: new DataSource({
            requireTotalCount: true,
            store: new ODataStore({
                key: 'Id',
                url: this.oDataService.getODataUrl('Lead'),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                deserializeDates: false
            })
        }),
        [ItemTypeEnum.Customer]: new DataSource({
            store: new ODataStore({
                key: 'Id',
                url: this.oDataService.getODataUrl('Customer'),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            })
        }),
        // [ItemTypeEnum.User]: {
        //     key: 'id',
        //     load: (loadOptions) => {
        //         return this.userServiceProxy.getUsers(
        //             this.searchValue || undefined,
        //             this.selectedPermission || undefined,
        //             this.role || undefined,
        //             false,
        //             this.group,
        //             (loadOptions.sort || []).map((item) => {
        //                 return item.selector + ' ' + (item.desc ? 'DESC' : 'ASC');
        //             }).join(','), loadOptions.take, loadOptions.skip
        //         ).toPromise().then(response => {
        //             return {
        //                 data: response.items,
        //                 totalCount: response.totalCount
        //             };
        //         });
        //     }
        // },
        [ItemTypeEnum.Partner]: new DataSource({
            store: new ODataStore({
                key: 'Id',
                url: this.oDataService.getODataUrl('Partner'),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            })
        }),
        [ItemTypeEnum.Offer]: new DataSource({
            store: new ODataStore({
                url: this.oDataService.getODataUrl('Offer'),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            }),
            sort: [
                { selector: 'Created', desc: true }
            ]
        })
    };
    dataSources = {
        [ItemTypeEnum.Lead]: null,
        [ItemTypeEnum.Customer]: null,
        [ItemTypeEnum.User]: null,
        [ItemTypeEnum.Partner]: null,
        [ItemTypeEnum.Offer]: null
    };

    getDataSource(itemType: ItemTypeEnum, load = false): Observable<DataSource> {
        let dataSource$;
        if (!this.dataSources[itemType]) {
            this.dataSources[itemType] = new DataSource(this.dataSourcesConfigs[itemType]);
            dataSource$ = load
                          ? from(this.dataSources[itemType].load()).pipe(switchMap(() => this.dataSources[itemType]))
                          : of(this.dataSources[itemType]);
        } else {
            dataSource$ = of(this.dataSources[itemType]);
        }
        return dataSource$;
    }
}
