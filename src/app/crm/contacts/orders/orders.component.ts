/** Core imports */
import { CurrencyPipe } from '@angular/common';
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
import { first } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactServiceProxy, OrderServiceProxy } from '@shared/service-proxies/service-proxies';
import { HistoryListDialogComponent } from './history-list-dialog/history-list-dialog.component';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';

@Component({
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.less'],
    animations: [appModuleAnimation()],
    providers: [ CurrencyPipe, OrderServiceProxy ]
})
export class OrdersComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent, { static: true }) dataGrid: DxDataGridComponent;
    private readonly dataSourceURI = 'Order';
    private formatting = AppConsts.formatting;
    currency: string;
    private readonly ident = "Orders";

    constructor(injector: Injector,
        private dialog: MatDialog,
        private invoicesService: InvoicesService,
        private contactService: ContactServiceProxy,
        private clientService: ContactsService,
        private orderServiceProxy: OrderServiceProxy,
        private currencyPipe: CurrencyPipe
    ) {
        super(injector);
        this.dataSource = this.getDataSource(+this.contactService['data'].contactInfo.id);
        clientService.invalidateSubscribe((area: string) => {
            if (area === 'orders') {
                this.dataSource = this.getDataSource(+this.contactService['data'].contactInfo.id);
                const dataSource = this.dataGrid.instance.getDataSource();
                if (dataSource) {
                    dataSource.load();
                }
            }
        }, this.ident);
        invoicesService.settings$.pipe(first()).subscribe(res => this.currency = res.currency);
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

    showHistory(data) {
        setTimeout(() =>
            this.dialog.open(HistoryListDialogComponent, {
                panelClass: ['slider'],
                disableClose: true,
                hasBackdrop: false,
                closeOnNavigation: true,
                data: data
            })
        );
    }

    customizeAmountValue = (e) => {
        return this.currencyPipe.transform(e.value, this.currency);
    }

    ngOnDestroy() {
        this.clientService.unsubscribe(this.ident);
    }
}
