/** Core imports */
import { Component, Output, EventEmitter, ViewChild, Injector } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular';
import * as moment from 'moment-timezone';

/** Application imports */
import { AppConsts } from '@root/shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { OfferStatsDto } from '@app/pfm/reports/offer-stats/offer-stats-dto.type';
import { OfferStatsFields } from '@app/pfm/reports/offer-stats/offer-stats-fields.enum';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';

@Component({
    selector: 'pfm-offer-stats',
    templateUrl: './offer-stats.component.html',
    styleUrls: ['./offer-stats.component.less']
})
export class OfferStatsComponent extends AppComponentBase {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @Output() onOfferClicksClick: EventEmitter<OfferStatsDto> = new EventEmitter<OfferStatsDto>();
    offersStaticFilter = { 'RequestCount': { gt: 0 } };
    readonly offerStatsFields: KeysEnum<OfferStatsDto> = OfferStatsFields;
    dataSource: DataSource = new DataSource({
        store: new ODataStore({
            url: this.getODataUrl('Offer', this.offersStaticFilter),
            deserializeDates: false,
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                this.isDataLoaded = false;
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.params.$select = DataGridService.getSelectFields(this.dataGrid);
            },
            errorHandler: (error) => {
                setTimeout(() => this.isDataLoaded = true);
            }
        }),
        sort: [
            { selector: 'Created', desc: true }
        ]
    });
    quickSearch: string;

    constructor(injector: Injector) {
        super(injector);
    }

    refresh(dateFrom: moment, dateTo: moment) {
        let customFilter = [];
        if (dateFrom)
            customFilter.push({ name: 'RequestDateFrom', value: dateFrom.toDate().toJSON() });
        if (dateTo)
            customFilter.push({ name: 'RequestDateTo', value: dateTo.toDate().toJSON() });
        let filters: any[] = [this.offersStaticFilter];
        if (this.quickSearch)
            filters.push({ 'Name': { contains: this.quickSearch } });
        this.processODataFilter(this.dataGrid.instance, 'Offer', filters, (filter) => filter, null, customFilter);
    }

    repaint() {
        this.dataGrid.instance.repaint();
    }

    getCategoryValue(data) {
        return data.Categories.map(item => item.Name).join(', ');
    }

    offerClicksClick(offer: OfferStatsDto) {
        this.onOfferClicksClick.emit(offer);
    }

    contentReady() {
        this.setGridDataLoaded();
    }

}
