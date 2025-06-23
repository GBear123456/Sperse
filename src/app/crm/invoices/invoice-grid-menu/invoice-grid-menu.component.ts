/** Core imports */
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';

/** Third party imports */
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ClipboardService } from 'ngx-clipboard';
import { Observable } from 'rxjs';
import { finalize, switchMap, filter, first, map } from 'rxjs/operators';

/** Application imports */
import { MessageService } from 'abp-ng2-module';
import { NotifyService } from 'abp-ng2-module';
import {
    InvoiceServiceProxy,
    InvoiceSettingsDto,
    InvoiceStatus,
    PipelineDto,
    StageDto
} from '@shared/service-proxies/service-proxies';
import { InvoiceGridMenuDto } from './invoice-grid-menu.interface';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MarkAsPaidDialogComponent } from '@app/crm/contacts/invoices/mark-paid-dialog/mark-paid-dialog.component';
import { CreateInvoiceDialogComponent } from '@app/crm/shared/create-invoice-dialog/create-invoice-dialog.component';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { HistoryListDialogComponent } from '@app/crm/contacts/orders/history-list-dialog/history-list-dialog.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppConsts } from '@shared/AppConsts';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';

@Component({
    selector: 'invoice-grid-menu',
    templateUrl: './invoice-grid-menu.component.html',
    styleUrls: ['./invoice-grid-menu.component.less'],
    providers: [InvoiceServiceProxy]
})
export class InvoiceGridMenuComponent {
    @ViewChild(DxTooltipComponent) actionsTooltip: DxTooltipComponent;
    @Output() onRefresh: EventEmitter<any> = new EventEmitter();

    invoiceData: InvoiceGridMenuDto;
    invoiceStatus = InvoiceStatus;

    addPaymentDisabled = true
    markAsDraftDisabled = false;
    markAsSendInvoiceDisabled = false;
    resendInvoiceDisabled = false;
    downloadPdfDisabled = false;
    duplicateInvoiceDisabled = false;
    markAsCancelledDisabled = false;
    deleteDisabled = false;
    previewDisabled = false;
    copyLinkDisabled = false;

    private settings = new InvoiceSettingsDto();
    stages$: Observable<StageDto[]> = this.pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.order, null).pipe(
        map((pipeline: PipelineDto) => pipeline.stages)
    );

    constructor(
        public ls: AppLocalizationService,
        private dialog: MatDialog,
        private invoiceProxy: InvoiceServiceProxy,
        private clipboardService: ClipboardService,
        private permission: AppPermissionService,
        private invoicesService: InvoicesService,
        private clientService: ContactsService,
        private message: MessageService,
        private notify: NotifyService,
        private loadingService: LoadingService,
        private appSession: AppSessionService,
        private pipelineService: PipelineService,
    ) {
        this.invoicesService.settings$.pipe(filter(Boolean), first()).subscribe(
            (settings: InvoiceSettingsDto) => {
                this.settings = settings;
            }
        );
    }

    onTooltipReady(e) {
        const contentElement = e.component.content();
        contentElement.style.padding = '0';
        contentElement.style.width = '100%';
    }

    showTooltip(invoiceData: InvoiceGridMenuDto, target: string | Element | JQuery, isSendEmailAllowed: boolean) {
        const isOrder: boolean = !invoiceData.Id;
        this.downloadPdfDisabled =
            this.duplicateInvoiceDisabled =
            this.previewDisabled =
            this.copyLinkDisabled = isOrder;
        this.addPaymentDisabled = isOrder || [
            InvoiceStatus.Draft, InvoiceStatus.Canceled
        ].indexOf(invoiceData.Status) >= 0;
        this.markAsDraftDisabled = isOrder || [
            InvoiceStatus.Final, InvoiceStatus.Canceled
        ].indexOf(invoiceData.Status) < 0;
        this.markAsSendInvoiceDisabled = isOrder || [
            InvoiceStatus.Final, InvoiceStatus.Canceled, InvoiceStatus.Sent
        ].indexOf(invoiceData.Status) < 0;
        this.resendInvoiceDisabled = !isSendEmailAllowed || this.markAsSendInvoiceDisabled;
        this.markAsCancelledDisabled = isOrder || invoiceData.Status != InvoiceStatus.Sent;
        this.deleteDisabled = isOrder || [
            InvoiceStatus.Draft, InvoiceStatus.Final, InvoiceStatus.Canceled
        ].indexOf(invoiceData.Status) < 0;
        this.invoiceData = invoiceData;

        this.toggleActionMenu(target);
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

    onMenuItemClick(action) {
        if (this.permission.isGranted(AppPermissions.CRMOrdersInvoicesManage)) {
            let tooltip = this.actionsTooltip.instance;
            if (tooltip.option('visible'))
                tooltip.hide();
            action.call(this);
        }
    }

    addInvoice() {
        this.openCreateInvoiceDialog(true);
    }

    editInvoice() {
        this.openCreateInvoiceDialog();
    }

    deleteInvoice() {
        this.message.confirm(
            this.l('InvoiceDeleteWarningMessage', this.invoiceData.Number), '',
            isConfirmed => {
                if (isConfirmed) {
                    this.loadingService.startLoading();
                    this.invoiceProxy.deleteInvoice(this.invoiceData.Id).pipe(
                        finalize(() => this.loadingService.finishLoading())
                    ).subscribe(() => {
                        this.onRefresh.emit();
                    });
                }
            }
        );
    }

    copyInvoiceLink() {
        let publicId = this.invoiceData.PublicId;
        this.clipboardService.copyFromContent(location.origin +
            `/invoicing/invoice/${this.appSession.tenantId || 0}/${publicId}`);
        this.notify.info(this.l('SavedToClipboard'));
    }

    sendInvoice() {
        this.loadingService.startLoading();
        this.invoiceProxy.getEmailData(
            this.settings.defaultTemplateId,
            this.invoiceData.Id
        ).pipe(
            finalize(() => this.loadingService.finishLoading()),
            switchMap(data => {
                data['contactId'] = this.invoiceData.ContactId;
                data['templateId'] = this.settings.defaultTemplateId;
                return this.clientService.showInvoiceEmailDialog(
                    this.invoiceData.Id, data);
            })
        ).subscribe(emailId => {
            if (!isNaN(emailId))
                this.updateStatus(InvoiceStatus.Sent, emailId);
        });
    }

    getPdfLink(): Observable<string> {
        this.loadingService.startLoading();
        return this.invoiceProxy.generatePdf(this.invoiceData.Id, false).pipe(
            finalize(() => this.loadingService.finishLoading())
        );
    }

    downloadInvoicePdf() {
        this.getPdfLink().subscribe((pdfUrl: string) => {
            UrlHelper.downloadFileFromUrl(pdfUrl, this.invoiceData.Number + '.pdf');
        });
    }

    duplicateInvoice() {
        this.openCreateInvoiceDialog(true, true);
    }

    previewInvoice() {
        let publicId = this.invoiceData.PublicId;
        window.open(location.origin + `/invoicing/invoice/${this.appSession.tenantId || 0}/${publicId}`, '_blank');
    }

    addPaymentDialog() {
        this.dialog.open(MarkAsPaidDialogComponent, {
            closeOnNavigation: false,
            data: {
                stages$: this.stages$,
                invoice: {
                    InvoiceId: this.invoiceData.Id,
                    InvoiceNumber: this.invoiceData.Number,
                    InvoiceStatus: this.invoiceData.Status,
                    Amount: this.invoiceData.Amount,
                    CurrencyId: this.invoiceData.CurrencyId,
                    OrderStage: this.invoiceData.OrderStage
                }
            }
        }).beforeClosed().subscribe((successed: boolean) => {
            if (successed) {
                this.notify.success(this.l('SuccessfullyUpdated'));
                this.onRefresh.emit();
            }
        });
    }

    updateStatus(newStatus: InvoiceStatus, emailId?: number) {
        this.loadingService.startLoading();
        this.invoicesService.updateStatus(
            this.invoiceData.Id, newStatus, emailId
        ).pipe(
            finalize(() => this.loadingService.finishLoading())
        ).subscribe(() => this.onRefresh.emit());
    }

    showHistory() {
        setTimeout(() =>
            this.dialog.open(HistoryListDialogComponent, {
                panelClass: ['slider'],
                hasBackdrop: false,
                closeOnNavigation: true,
                data: { orderId: this.invoiceData.OrderId }
            })
        );
    }

    l(key: string, ...args: any[]): string {
        return this.ls.l(key, ...args);
    }

    private openCreateInvoiceDialog(addNew = false, saveAsDraft = false) {
        this.dialog.open(CreateInvoiceDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                addNew: addNew,
                saveAsDraft: saveAsDraft,
                invoice: { InvoiceId: this.invoiceData.Id, ContactId: this.invoiceData.ContactId },
                refreshParent: () => {
                    this.onRefresh.emit();
                }
            }
        });
    }
}