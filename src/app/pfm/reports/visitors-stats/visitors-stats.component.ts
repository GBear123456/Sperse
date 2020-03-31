/** Core imports */
import { Component, Injector, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@root/shared/AppConsts';

@Component({
    selector: 'pfm-visitors-stats',
    templateUrl: './visitors-stats.component.html',
    styleUrls: ['./visitors-stats.component.less'],
    providers: [ DatePipe ]
})
export class VisitorsStatsComponent extends AppComponentBase {
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
    dataSource: DataSource = new DataSource({
        store: {
            key: 'Id',
            type: 'odata',
            url: this.getODataUrl('PfmOfferRequest'),
            version: AppConsts.ODataVersion,
            deserializeDates: false,
            beforeSend: (request) => {
                this.isDataLoaded = false;
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
            }
        }
    });
    campaignId: number;
    quickSearch: string;
    constructor(
        injector: Injector,
        private datePipe: DatePipe
    ) {
        super(injector);
    }

    onVisitorCellClick(event) {
        this._router.navigate(['app/pfm/user', event.data.ApplicantUserId],
            { queryParams: { referrer: location.pathname } });
    }

    getVisitorFullName = (e) => {
        return e.FirstName + ' ' + e.LastName;
    }

    getCreatedDate = (e) => {
        return this.datePipe.transform(e.Date, AppConsts.formatting.dateTime, this.userTimezone);
    }

    contentReady() {
        this.setGridDataLoaded();
    }

    repaint() {
        this.dataGrid.instance.repaint();
    }
}
