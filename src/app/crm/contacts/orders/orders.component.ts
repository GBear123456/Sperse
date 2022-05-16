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
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { MatDialog } from '@angular/material/dialog';
import { first, filter } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactServiceProxy, OrderServiceProxy, InvoiceSettings } from '@shared/service-proxies/service-proxies';
import { HistoryListDialogComponent } from './history-list-dialog/history-list-dialog.component';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { OrderDto } from '@app/crm/contacts/orders/order-dto.type';
import { OrderFields } from '@app/crm/contacts/orders/order-fields.enum';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';

@Component({
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.less'],
    providers: [ CurrencyPipe, OrderServiceProxy ]
})
export class OrdersComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent, { static: true }) dataGrid: DxDataGridComponent;
    private readonly dataSourceURI = 'Order';
    private formatting = AppConsts.formatting;
    currency: string;
    private readonly ident = 'Orders';
    readonly orderFields: KeysEnum<OrderDto> = OrderFields;

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
        invoicesService.settings$.pipe(filter(Boolean), first()).subscribe(
            (res: InvoiceSettings) => this.currency = res.currency);
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
        return new DataSource({
            requireTotalCount: true,
            filter: [ 'ContactId', '=', contactId],
            store: new ODataStore({
                key: this.orderFields.Id,
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.params.$select = DataGridService.getSelectFields(
                        this.dataGrid,
                        [ this.orderFields.Id ]
                    );
                },
                onLoaded: () => {
                    this.dataGrid.instance.cancelEditData();
                    this.dataGrid.instance.endCustomLoading();
                },
                errorHandler: (error) => {
                    setTimeout(() => this.isDataLoaded = true);
                },
                deserializeDates: false
            })
        });
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

    showHistory(order: OrderDto) {
        setTimeout(() =>
            this.dialog.open(HistoryListDialogComponent, {
                panelClass: ['slider'],
                disableClose: true,
                hasBackdrop: false,
                closeOnNavigation: true,
                data: { orderId: order.Id }
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
