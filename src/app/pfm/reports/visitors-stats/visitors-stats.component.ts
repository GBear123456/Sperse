/** Core imports */
import { Component, Injector, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@root/shared/AppConsts';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { VisitorStatsDto } from '@app/pfm/reports/visitors-stats/visitor-stats-dto.inteface';
import { VisitorStatsFields } from '@app/pfm/reports/visitors-stats/visitor-stats-fields.enum';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { FieldDependencies } from '@app/shared/common/data-grid.service/field-dependencies.interface';

@Component({
    selector: 'pfm-visitors-stats',
    templateUrl: './visitors-stats.component.html',
    styleUrls: ['./visitors-stats.component.less'],
    providers: [ DatePipe ]
})
export class VisitorsStatsComponent extends AppComponentBase {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    readonly visitorStatsFields: KeysEnum<VisitorStatsDto> = VisitorStatsFields;
    private fieldsDependencies: FieldDependencies = {
        name: [
            this.visitorStatsFields.FirstName,
            this.visitorStatsFields.LastName
        ]
    }
    dataSource: DataSource = new DataSource({
        store: new ODataStore({
            key: this.visitorStatsFields.Id,
            url: this.getODataUrl('PfmOfferRequest'),
            version: AppConsts.ODataVersion,
            deserializeDates: false,
            beforeSend: (request) => {
                this.isDataLoaded = false;
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.params.$select = DataGridService.getSelectFields(
                    this.dataGrid,
                    [ this.visitorStatsFields.Id, this.visitorStatsFields.ApplicantUserId ],
                    this.fieldsDependencies
                );
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
            },
            errorHandler: (error) => {
                setTimeout(() => this.isDataLoaded = true);
            }
        })
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
        const visitorStats: VisitorStatsDto = event.data;
        this._router.navigate(['app/pfm/user', visitorStats.ApplicantUserId],
            { queryParams: { referrer: location.pathname } });
    }

    getVisitorFullName = (visitorStats: VisitorStatsDto) => {
        return visitorStats.FirstName + ' ' + visitorStats.LastName;
    }

    getCreatedDate = (visitorStats: VisitorStatsDto) => {
        return this.datePipe.transform(visitorStats.Date, AppConsts.formatting.dateTime, this.userTimezone);
    }

    contentReady() {
        this.setGridDataLoaded();
    }

    repaint() {
        this.dataGrid.instance.repaint();
    }
}
