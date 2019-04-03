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
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterModel } from '@shared/filters/models/filter.model';
import {
    ContactServiceProxy,
    InvoiceServiceProxy,
    SetAmountInfo
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { CreateInvoiceDialogComponent } from '@app/crm/shared/create-invoice-dialog/create-invoice-dialog.component';

@Component({
    templateUrl: './invoices.component.html',
    styleUrls: ['./invoices.component.less'],
    animations: [appModuleAnimation()],
    providers: [ InvoiceServiceProxy ]
})
export class InvoicesComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(DxTooltipComponent) actionsTooltip: DxTooltipComponent;

    private actionRecordData;
    private readonly dataSourceURI = 'Invoice';
    private filters: FilterModel[];
    private formatting = AppConsts.formatting;
    actionMenuItems = [
        {
            text: this.l('Edit'),
            action: this.editInvoice.bind(this)
        },
        {
            text: this.l('Delete'),
            action: this.deleteInvoice.bind(this)
        }
    ];

    constructor(injector: Injector,
        private dialog: MatDialog,
        private _contactService: ContactServiceProxy,
        private _clientService: ContactsService,
        private _invoiceService: InvoiceServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.dataSource = this.getDataSource(+this._contactService['data'].contactInfo.id);
        this._clientService.invalidateSubscribe((area) => {
            if (area == 'invoices') {
                this.dataSource = this.getDataSource(+this._contactService['data'].contactInfo.id);
                const dataSource = this.dataGrid.instance.getDataSource();
                if (dataSource) {
                    dataSource.load();
                }
            }
        });
    }

    onContentReady(event) {
        this.finishLoading(true);
        this.setGridDataLoaded();
    }

    ngOnInit(): void {
        this.processFilterInternal();
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
                this.filters,
                (filter) => {
                    let filterMethod = this['filterBy' +
                    this.capitalize(filter.caption)];
                    if (filterMethod)
                        return filterMethod.call(this, filter);
                }
            );
        }
    }

    showActionsMenu(target) {
        this.actionsTooltip.instance.show(target);
    }

    onCellClick(event) {
        if (event.rowType === 'data') {
            /** If user click on actions icon */
            if (event.event.target.closest('.dx-link.dx-link-edit')) {
                this.actionRecordData = event.data;
                this.showActionsMenu(event.event.target);
            }
        }
    }

    deleteInvoice() {
        this.message.confirm(
            this.l('InvoiceDeleteWarningMessage', this.actionRecordData.Number),
            isConfirmed => {
                if (isConfirmed) {
                    this.startLoading(true);
                    this._invoiceService.deleteInvoice(this.actionRecordData.Id).subscribe((response) => {
                        this.dataGrid.instance.refresh();
                    });
                }
            }
        );
    }

    editInvoice() {
        this.actionsTooltip.instance.hide();
        this.dialog.open(CreateInvoiceDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                invoice: this.actionRecordData,
                refreshParent: () => {
                    this.dataGrid.instance.refresh();
                }
            }
        });
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
    }
}
