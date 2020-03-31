/** Core imports */
import { Component, Output, EventEmitter, ViewChild, Injector } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular';
import * as moment from 'moment-timezone';

/** Application imports */
import { AppConsts } from '@root/shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'pfm-offer-stats',
    templateUrl: './offer-stats.component.html',
    styleUrls: ['./offer-stats.component.less']
})
export class OfferStatsComponent extends AppComponentBase {
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
    @Output() onOfferClicksClick: EventEmitter<any> = new EventEmitter<any>();
    offersStaticFilter = { 'RequestCount': { gt: 0 } };
    dataSource: DataSource = new DataSource({
        store: {
            type: 'odata',
            url: this.getODataUrl('Offer', this.offersStaticFilter),
            deserializeDates: false,
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                this.isDataLoaded = false;
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
            }
        },
        select: [
            'CampaignId',
            'LogoUrl',
            'Name',
            'Categories',
            'RequestCount'
        ],
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

    offerClicksClick(field) {
        this.onOfferClicksClick.emit(field);
    }

    contentReady() {
        this.setGridDataLoaded();
    }

}
