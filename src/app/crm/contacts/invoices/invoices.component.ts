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
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { MatDialog } from '@angular/material/dialog';
import { finalize, switchMap, first, map } from 'rxjs/operators';
import startCase from 'lodash/startCase';
import { Observable } from 'rxjs';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterModel } from '@shared/filters/models/filter.model';
import {
    ContactInfoDto,
    ContactServiceProxy,
    InvoiceServiceProxy,
    InvoiceStatus,
    InvoiceSettings, PipelineDto
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { MarkAsPaidDialogComponent } from '@app/crm/contacts/invoices/mark-paid-dialog/mark-paid-dialog.component';
import { CreateInvoiceDialogComponent } from '@app/crm/shared/create-invoice-dialog/create-invoice-dialog.component';
import { HistoryListDialogComponent } from '../orders/history-list-dialog/history-list-dialog.component';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppPermissions } from '@shared/AppPermissions';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { InvoiceDto } from '@app/crm/contacts/invoices/invoice-dto.interface';
import { InvoiceFields } from '@app/crm/contacts/invoices/invoice-fields.enum';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { FieldDependencies } from '@app/shared/common/data-grid.service/field-dependencies.interface';

@Component({
    templateUrl: './invoices.component.html',
    styleUrls: ['./invoices.component.less'],
    animations: [appModuleAnimation()],
    providers: [ InvoiceServiceProxy ]
})
export class InvoicesComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxTooltipComponent, { static: false }) actionsTooltip: DxTooltipComponent;
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

    private actionRecordData: InvoiceDto;
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

    private readonly ident = 'Invoices';

    contactId: number;
    stages$ = this.pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.order).pipe(
        map((pipeline: PipelineDto) => pipeline.stages)
    );
    readonly invoiceFields: KeysEnum<InvoiceDto> = InvoiceFields;
    private fieldsDependencies: FieldDependencies = {
        stage: [
            this.invoiceFields.OrderId,
            this.invoiceFields.OrderStage,
            this.invoiceFields.ContactId,
            this.invoiceFields.Date
        ]
    }

    constructor(injector: Injector,
        private dialog: MatDialog,
        private pipelineService: PipelineService,
        private invoicesService: InvoicesService,
        private contactService: ContactServiceProxy,
        private clientService: ContactsService,
        private invoiceProxy: InvoiceServiceProxy
    ) {
        super(injector);
        this.clientService.invalidateSubscribe((area: string) => {
            if (area === 'invoices') {
                this.dataSource = this.getDataSource();
            }
        }, this.ident);

        this.clientService.contactInfoSubscribe((data: ContactInfoDto) => {
            if (data && (!this.contactId || data.id != this.contactId)) {
                this.contactId = data.id;
                this.dataSource = this.getDataSource();
            }
        }, this.ident);

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

    private getDataSource(): DataSource {
        return new DataSource({
            requireTotalCount: true,
            filter: [ this.invoiceFields.ContactId, '=', this.contactId],
            store: new ODataStore({
                key: this.invoiceFields.Key,
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.params.$select = DataGridService.getSelectFields(
                        this.dataGrid,
                        [
                            this.invoiceFields.Key,
                            this.invoiceFields.InvoiceId,
                            this.invoiceFields.InvoiceStatus
                        ],
                        this.fieldsDependencies
                    );
                },
                onLoaded: () => {
                    if (this.dataGrid && this.dataGrid.instance) {
                        this.dataGrid.instance.cancelEditData();
                        this.dataGrid.instance.endCustomLoading();
                        setTimeout(() => this.getElementRef().nativeElement.parentNode
                            && this.dataGrid.instance.repaint());
                    }
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

    toggleActionMenu(target) {
        setTimeout(() => {
            if (!this.actionsTooltip.instance.option('visible')) {
                this.actionsTooltip.instance.show(target);
            } else {
                this.actionsTooltip.instance.hide();
            }
        });
        this.actionsTooltip.instance.repaint();
    }

    onCellClick(event) {
        if (event.rowType === 'data' && event.column.caption != 'Stage'
            && this.isGranted(AppPermissions.CRMOrdersInvoicesManage)
        ) {
            const invoice: InvoiceDto = event.data;
            /** If user click on actions icon */
            if (event.columnIndex > 1 && invoice) {
                this.actionRecordData = invoice;
                setTimeout(() => this.editInvoice());
            } else {
                if (event.event.target.closest('.dx-link.dx-link-edit')) {
                    const isOrder: boolean = !invoice.InvoiceId;
                    this.downloadPdfDisabled =
                    this.duplicateInvoiceDisabled =
                    this.previewDisabled = isOrder;
                    this.markAsPaidDisabled = isOrder || [
                        InvoiceStatus.Final, InvoiceStatus.Sent, InvoiceStatus.PartiallyPaid
                    ].indexOf(invoice.InvoiceStatus) < 0;
                    this.markAsDraftDisabled = isOrder || [
                        InvoiceStatus.Final, InvoiceStatus.Canceled
                    ].indexOf(invoice.InvoiceStatus) < 0;
                    this.resendInvoiceDisabled = isOrder || [
                        InvoiceStatus.Final, InvoiceStatus.Canceled, InvoiceStatus.Sent
                    ].indexOf(invoice.InvoiceStatus) < 0;
                    this.markAsCancelledDisabled = isOrder || invoice.InvoiceStatus != InvoiceStatus.Sent;
                    this.deleteDisabled = isOrder || [
                        InvoiceStatus.Draft, InvoiceStatus.Final, InvoiceStatus.Canceled
                    ].indexOf(invoice.InvoiceStatus) < 0;
                    this.actionRecordData = event.data;
                    this.toggleActionMenu(event.event.target);
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
        ).subscribe(emailId => emailId && this.updateStatus(InvoiceStatus.Sent, emailId));
    }

    onMenuItemClick(action) {
        if (this.isGranted(AppPermissions.CRMOrdersInvoicesManage)) {
            let tooltip = this.actionsTooltip.instance;
            if (tooltip.option('visible'))
                tooltip.hide();
            action.call(this);
        }
    }

    updateStatus(newStatus: InvoiceStatus, emailId?: number) {
        this.startLoading(true);
        this.invoicesService.updateStatus(
            this.actionRecordData.InvoiceId, newStatus, emailId
        ).pipe(
            finalize(() => this.finishLoading(true))
        ).subscribe(() => this.invalidate());
    }

    showHistory() {
        setTimeout(() =>
            this.dialog.open(HistoryListDialogComponent, {
                panelClass: ['slider'],
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

    updateOrderStage(event) {
        this.startLoading(true);
        const invoice: InvoiceDto = event.data;
        this.pipelineService.updateEntitiesStage(
            AppConsts.PipelinePurposeIds.order, [{
                Id: invoice.OrderId,
                ContactId: invoice.ContactId,
                CreationTime: invoice.Date,
                Stage: invoice.OrderStage
            }], event.value
        ).subscribe(declinedList => {
            this.finishLoading(true);
            if (declinedList.length)
                event.value = invoice.OrderStage;
            else {
                this.contactService['data'].refresh = true;
                this.notify.success(this.l('StageSuccessfullyUpdated'));
                this.dataGrid.instance.getVisibleRows().map(row => {
                    if (invoice.OrderId == row.data.OrderId)
                        row.data.OrderStage = event.value;
                });
            }
        });
    }

    markAsPaidDialog() {
        this.dialog.open(MarkAsPaidDialogComponent, {
            closeOnNavigation: false,
            data: {
                stages$: this.stages$,
                invoice: this.actionRecordData
            }
        }).beforeClose().subscribe((successed: boolean) => {
            if (successed) {
                this.notify.success(this.l('SuccessfullyUpdated'));
                this.dataGrid.instance.refresh();
            }
        });
    }

    onStageOptionChanged(data, event) {
        event.component.option('disabled', event.component.option('dataSource')
            .some(item => data.value == item.name && item.isFinal));
    }

    onTooltipReady(e) {
        const contentElement = e.component.content();
        contentElement.style.padding = '0';
        contentElement.style.width = '100%';
    }

    ngOnDestroy() {
        this.clientService.unsubscribe(this.ident);
    }
}
