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
import { finalize, switchMap, first, map } from 'rxjs/operators';
import startCase from 'lodash/startCase';
import { Observable } from 'rxjs';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterModel } from '@shared/filters/models/filter.model';
import {
    ContactInfoDto,
    GetEmailDataOutput,
    ContactServiceProxy,
    InvoiceServiceProxy,
    InvoiceStatus,
    InvoiceSettings
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { CreateInvoiceDialogComponent } from '@app/crm/shared/create-invoice-dialog/create-invoice-dialog.component';
import { HistoryListDialogComponent } from '../orders/history-list-dialog/history-list-dialog.component';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    templateUrl: './invoices.component.html',
    styleUrls: ['./invoices.component.less'],
    animations: [appModuleAnimation()],
    providers: [ InvoiceServiceProxy ]
})
export class InvoicesComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxTooltipComponent) actionsTooltip: DxTooltipComponent;
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    private actionRecordData;
    private settings = new InvoiceSettings();
    private readonly dataSourceURI = 'OrderInvoices';
    private filters: FilterModel[];

    formatting = AppConsts.formatting;
    invoiceStatus = InvoiceStatus;
    startCase = startCase;

    markAsPaidDisabled = true;
    markAsDraftDisabled = false;
    resendInvoiceDisabled = false;
    markAsCancelledDisabled = false;
    deleteDisabled = false;
    previewDisabled = false;
    downloadPdfDisabled = false;
    duplicateInvoiceDisabled = false;

    contactId: number;

    constructor(injector: Injector,
        private dialog: MatDialog,
        private invoicesService: InvoicesService,
        private contactService: ContactServiceProxy,
        private clientService: ContactsService,
        private invoiceProxy: InvoiceServiceProxy
    ) {
        super(injector);
        this.clientService.invalidateSubscribe((area) => {
            if (area == 'invoices')
                this.dataSource = this.getDataSource();
        });

        this.clientService.contactInfoSubscribe((data: ContactInfoDto) => {
            if (!this.contactId || data.id != this.contactId) {
                this.contactId = data.id;
                this.dataSource = this.getDataSource();
            }
        }, this.constructor.name);

        this.invoicesService.settings$.pipe(first()).subscribe(res => {
            this.settings = res;
        });
    }

    ngOnInit(): void {
        this.processFilterInternal();
    }

    onContentReady() {
        this.finishLoading(true);
        this.setGridDataLoaded();
    }

    private getDataSource() {
        return {
            uri: this.dataSourceURI,
            requireTotalCount: true,
            filter: [ 'ContactId', '=', this.contactId],
            store: {
                key: 'Key',
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
        setTimeout(() => {
            this.actionsTooltip.instance.show(target);
        });
        this.actionsTooltip.instance.repaint();
    }

    onCellClick(event) {
        if (event.rowType === 'data' && this.isGranted(AppPermissions.CRMOrdersInvoicesManage)) {
            /** If user click on actions icon */
            if (event.columnIndex > 1 && event.data) {
                this.actionRecordData = event.data;
                setTimeout(() => this.editInvoice());
            } else {
                if (event.event.target.closest('.dx-link.dx-link-edit')) {
                    const isOrder: boolean = !event.data.InvoiceId;
                    this.downloadPdfDisabled =
                    this.duplicateInvoiceDisabled =
                    this.previewDisabled = isOrder;
                    this.markAsDraftDisabled = isOrder || [
                        InvoiceStatus.Final, InvoiceStatus.Canceled
                    ].indexOf(event.data.InvoiceStatus) < 0;
                    this.resendInvoiceDisabled = isOrder || [
                        InvoiceStatus.Final, InvoiceStatus.Canceled, InvoiceStatus.Sent
                    ].indexOf(event.data.InvoiceStatus) < 0;
                    this.markAsCancelledDisabled = isOrder || event.data.InvoiceStatus != InvoiceStatus.Sent;
                    this.deleteDisabled = isOrder || [
                        InvoiceStatus.Draft, InvoiceStatus.Final, InvoiceStatus.Canceled
                    ].indexOf(event.data.InvoiceStatus) < 0;
                    this.actionRecordData = event.data;
                    this.showActionsMenu(event.event.target);
                }
            }
        }
    }

    deleteInvoice() {
        this.message.confirm(
            this.l('InvoiceDeleteWarningMessage', this.actionRecordData.InvoiceNumber),
            isConfirmed => {
                if (isConfirmed) {
                    this.startLoading(true);
                    this.invoiceProxy.deleteInvoice(this.actionRecordData.InvoiceId).pipe(
                        finalize(() => this.finishLoading(true))
                    ).subscribe(() => {
                        this.dataGrid.instance.refresh();
                    });
                }
            }
        );
    }

    private openCreateInvoiceDialog(addNew = false, saveAsDraft = false) {
        this.dialog.open(CreateInvoiceDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                addNew: addNew,
                saveAsDraft: saveAsDraft,
                invoice: this.actionRecordData,
                contactInfo: this.contactService['data'].contactInfo,
                refreshParent: () => {
                    this.dataGrid.instance.refresh();
                }
            }
        });
    }

    editInvoice() {
        this.openCreateInvoiceDialog();
    }

    addInvoice() {
        this.openCreateInvoiceDialog(true);
    }

    sendInvoice() {
        this.startLoading(true);
        this.invoiceProxy.getEmailData(undefined, this.actionRecordData.InvoiceId).pipe(
            finalize(() => this.finishLoading(true)),
            switchMap(data => {
                data['contactId'] = this.contactId;
                data['templateId'] = this.settings.defaultTemplateId;
                return this.clientService.showInvoiceEmailDialog(
                    this.actionRecordData.InvoiceId, data);
            })
        ).subscribe(data => this.updateStatus(InvoiceStatus.Sent));
    }

    onMenuItemClick(action) {
        if (this.isGranted(AppPermissions.CRMOrdersInvoicesManage)) {
            let tooltip = this.actionsTooltip.instance;
            if (tooltip.option('visible'))
                tooltip.hide();
            action.call(this);
        }
    }

    updateStatus(newStatus: InvoiceStatus) {
        this.startLoading(true);
        this.invoicesService.updateStatus(this.actionRecordData.InvoiceId, newStatus).pipe(
            finalize(() => this.finishLoading(true))
        ).subscribe(() => this.invalidate());
    }

    showHistory() {
        setTimeout(() =>
            this.dialog.open(HistoryListDialogComponent, {
                panelClass: ['slider'],
                disableClose: false,
                hasBackdrop: false,
                closeOnNavigation: true,
                data: { Id: this.actionRecordData.OrderId }
            })
        );
    }

    getPdfLink(): Observable<string> {
        this.startLoading(true);
        return this.invoiceProxy.generatePdf(this.actionRecordData.InvoiceId, false).pipe(
            finalize(() => this.finishLoading(true))
        );
    }

    downloadInvoicePdf() {
        this.getPdfLink().subscribe((pdfUrl: string) => {
            let link = document.createElement('a');
            link.href = pdfUrl;
            link.target = '_blank';
            link.download = this.actionRecordData.InvoiceNumber + '.pdf';
            link.dispatchEvent(new MouseEvent('click'));
        });
    }

    duplicateInvoice() {
        this.openCreateInvoiceDialog(true, true);
    }

    previewInvoice() {
        this.getPdfLink().subscribe((pdfUrl: string) => {
            window.open(pdfUrl, '_blank');
        });
    }
}