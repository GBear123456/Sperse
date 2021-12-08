/** Core imports */
import { Component, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { UserServiceProxy } from '@shared/service-proxies/service-proxies';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ActivityLogsFields } from '@app/crm/contacts/activity-logs/activity-logs-fields.enum';
import { ActivityLogsDto } from '@app/crm/contacts/activity-logs/activity-logs-dto.interface';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';

@Component({
    selector: 'activity-logs',
    templateUrl: './activity-logs.component.html',
    styleUrls: ['./activity-logs.component.less']
})
export class ActivityLogsComponent extends AppComponentBase {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    dataSource: any;
    private readonly dataSourceURI = 'PfmOfferRequest';
    readonly activityLogsFields: KeysEnum<ActivityLogsDto> = ActivityLogsFields;

    constructor(
        injector: Injector,
        private userService: UserServiceProxy
    ) {
        super(injector);
        this.dataSource = new DataSource({
            store: new ODataStore({
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.params.$select = DataGridService.getSelectFields(this.dataGrid);
                }
            }),
            filter: [ 'ApplicantUserId', '=', +this.userService['data'].userId ]
        });
    }

    onToolbarPreparing($event) {
        $event.toolbarOptions.items.push({
            location: 'before',
            template: 'title'
        });
    }
}
