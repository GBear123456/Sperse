import { Injectable } from '@angular/core';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { AppConsts } from '@shared/AppConsts';
import { ODataService } from '@shared/common/odata/odata.service';
import { UserServiceProxy } from '@shared/service-proxies/service-proxies';
import DataSource from 'devextreme/data/data_source';
import { Observable, from, of } from 'rxjs';
import { switchMap } from '@node_modules/rxjs/internal/operators';

@Injectable()
export class DataSourceService {
    constructor(
        private oDataService: ODataService,
        private userServiceProxy: UserServiceProxy
    ) {}
    dataSourcesConfigs = {
        [ItemTypeEnum.Lead]: {
            uri: 'Lead',
            requireTotalCount: true,
            store: {
                key: 'Id',
                type: 'odata',
                url: this.oDataService.getODataUrl('Lead'),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                deserializeDates: false,
                paginate: true
            }
        },
        [ItemTypeEnum.Customer]: {
            store: {
                key: 'Id',
                type: 'odata',
                url: this.oDataService.getODataUrl('Customer'),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            }
        },
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
        [ItemTypeEnum.Partner]: {
            store: {
                key: 'Id',
                type: 'odata',
                url: this.oDataService.getODataUrl('Partner'),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            }
        },
        [ItemTypeEnum.Offer]: {
            store: {
                type: 'odata',
                url: this.oDataService.getODataUrl('Offer'),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            },
            sort: [
                { selector: 'Created', desc: true }
            ]
        }
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
