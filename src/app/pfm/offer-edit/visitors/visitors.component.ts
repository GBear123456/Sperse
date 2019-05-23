/** Core imports */
import {
    AfterViewInit,
    Component,
    Injector,
    OnInit,
    Input,
    OnDestroy,
    ViewChild,
    QueryList
} from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import 'devextreme/data/odata/store';
import { Observable, from, of } from 'rxjs';
import { finalize, flatMap, tap, pluck, map } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import * as moment from 'moment-timezone';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactServiceProxy } from '@shared/service-proxies/service-proxies';


@Component({
    selector: 'pfm-offer-visitors',
    templateUrl: './visitors.component.html',
    styleUrls: ['./visitors.component.less']
})
export class VisitorsComponent extends AppComponentBase implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(DxTooltipComponent) actionsTooltip: DxTooltipComponent;

    @Input() dateFrom: moment;
    @Input() dateTo: moment;
    @Input() campaignId: number;

    actionMenuItems: any;
    dataSourceURI = 'PfmOfferRequest';
    formatting = AppConsts.formatting;

    constructor(injector: Injector,
        private _clientService: ContactServiceProxy,
        private cacheService: CacheService
    ) {
        super(injector);
        this.actionMenuItems = [
            {
                text: this.l('Edit'),
                action: Function()
            },
            {
                text: this.l('Download'),
                action: Function()
            },
            {
                text: this.l('Delete'),
                action: Function()
            }
        ];

        this.dataSource = {
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                }
            }
        };
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    ngOnInit() {

    }

    ngAfterViewInit() {

    }

    onDataGridInit(e) {
        this.startLoading();
    }

    startLoading() {
        super.startLoading(false);
    }

    finishLoading() {
        super.finishLoading(false);
    }

    onToolbarPreparing(event) {
        //event.toolbarOptions.items.push({ });
    }

    onContentReady(event) {
        this.setGridDataLoaded();
        this.finishLoading();
    }

    ngOnDestroy() {
    }

    showActionsMenu(data, target) {
        this.actionsTooltip.instance.show(target);
    }

    onCellClick($event) {
    }

    onMenuItemClick($event) {
    }

    hideActionsMenu() {
        if (this.actionsTooltip && this.actionsTooltip.instance)
            this.actionsTooltip.instance.hide();
    }
}