/** Core imports */
import { Component, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import startCase from 'lodash/startCase';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { AppComponentBase } from '@shared/common/app-component-base';
import { UserServiceProxy, ContactServiceProxy, ContactActivityLogInfo, 
    ContactActivityLogType } from '@shared/service-proxies/service-proxies';
import { ActivityLogsFields } from '@app/crm/contacts/activity-logs/activity-logs-fields.enum';
import { ActivityLogsDto } from '@app/crm/contacts/activity-logs/activity-logs-dto.interface';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { ContactsService } from '../contacts.service';

@Component({
    selector: 'activity-logs',
    templateUrl: './activity-logs.component.html',
    styleUrls: ['./activity-logs.component.less']
})
export class ActivityLogsComponent extends AppComponentBase {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    readonly activityLogsFields: KeysEnum<ActivityLogsDto> = ActivityLogsFields;
    hasPFMEnabled = this.permission.isGranted(AppPermissions.PFMApplications);
    startCase = startCase;

    private readonly dataSourceURI = 'PfmOfferRequest';
    contactDataSource: ContactActivityLogInfo[];
    pfmDataSource: any;

    constructor(
        injector: Injector,
        private userService: UserServiceProxy,
        private contactsService: ContactsService,
        private contactServiceProxy: ContactServiceProxy
    ) {
        super(injector);
        this.pfmDataSource = new DataSource({
            store: new ODataStore({
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.params.$select = DataGridService.getSelectFields(this.dataGrid);
                },
                errorHandler: (error) => {
                    setTimeout(() => this.isDataLoaded = true);
                }
            }),
            filter: [ 'ApplicantUserId', '=', +this.userService['data'].userId ]
        });

        this.contactsService.contactInfo$.subscribe(contactInfo => {
            this.contactServiceProxy.getActivityLogs(
                contactInfo.id
            ).subscribe((logs: ContactActivityLogInfo[]) => {
                this.contactDataSource = logs;
            });
        });
    }

    onToolbarPreparing(event) {
        event.toolbarOptions.items.push({
            location: 'before',
            template: 'title'
        });
    }
}