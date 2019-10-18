/** Core imports */
import {
    Component,
    OnInit,
    OnDestroy,
    Injector,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterModel } from '@shared/filters/models/filter.model';
import {
    ContactServiceProxy,
    OrderServiceProxy,
    SetAmountInfo
} from '@shared/service-proxies/service-proxies';
import { HistoryListDialogComponent } from './history-list-dialog/history-list-dialog.component';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { CurrencyPipe } from '@angular/common';

@Component({
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.less'],
    animations: [appModuleAnimation()],
    providers: [ CurrencyPipe, OrderServiceProxy ]
})
export class OrdersComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    private readonly dataSourceURI = 'Order';
    private formatting = AppConsts.formatting;

    constructor(injector: Injector,
        private dialog: MatDialog,
        private contactService: ContactServiceProxy,
        private clientService: ContactsService,
        private orderServiceProxy: OrderServiceProxy,
        private currencyPipe: CurrencyPipe
    ) {
        super(injector);
        this.dataSource = this.getDataSource(+this.contactService['data'].contactInfo.id);
        this.clientService.invalidateSubscribe((area) => {
            if (area == 'orders') {
                this.dataSource = this.getDataSource(+this.contactService['data'].contactInfo.id);
                const dataSource = this.dataGrid.instance.getDataSource();
                if (dataSource) {
                    dataSource.load();
                }
            }
        });
    }

    ngOnInit(): void {
        this.processFilterInternal();
    }

    onContentReady(event) {
        this.setGridDataLoaded();
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    private getDataSource(contactId) {
        return {
            uri: this.dataSourceURI,
            requireTotalCount: true,
            filter: [ 'ContactId', '=', contactId],
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                onLoaded: () => {
                    this.dataGrid.instance.cancelEditData();
                    this.dataGrid.instance.endCustomLoading();
                },
                deserializeDates: false,
                paginate: true
            }
        };
    }

    processFilterInternal() {
        if (this.dataGrid && this.dataGrid.instance) {
            this.processODataFilter(
                this.dataGrid.instance,
                this.dataSourceURI,
                [],
                null
            );
        }
    }

    onRowUpdating(e) {
        if (e.newData.Amount !== e.oldData.Amount) {
            e.cancel = true;
            this.dataGrid.instance.beginCustomLoading('');
            const setAmountInput = new SetAmountInfo({
                orderId: e.oldData.Id,
                amount: e.newData.Amount
            });
            this.orderServiceProxy.setAmount(setAmountInput).subscribe(
                () => this.processFilterInternal()
            );
        }
    }

    showHistory(data) {
        setTimeout(() =>
            this.dialog.open(HistoryListDialogComponent, {
                panelClass: ['slider'],
                disableClose: false,
                hasBackdrop: false,
                closeOnNavigation: true,
                data: data
            })
        );
    }

    customizeAmountValue = (e) => {
        return this.currencyPipe.transform(e.value);
    }
}
