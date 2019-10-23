/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, ViewChild, Inject, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { DxValidationGroupComponent } from '@root/node_modules/devextreme-angular';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import { CacheService } from 'ng2-cache-service';
import { Store, select } from '@ngrx/store';
import { finalize, filter, first, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

/** Application imports */
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { ContactGroup } from '@shared/AppEnums';
import {
    InvoiceServiceProxy,
    CreateInvoiceInput,
    UpdateInvoiceLineInput,
    UpdateInvoiceStatusInput,
    UpdateInvoiceInput,
    CustomerServiceProxy,
    InvoiceStatus,
    CreateInvoiceLineInput,
    InvoiceLineUnit,
    InvoiceSettings
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { MessageService } from '@abp/message/message.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { CreateClientDialogComponent } from '../create-client-dialog/create-client-dialog.component';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    templateUrl: 'create-invoice-dialog.component.html',
    styleUrls: [ '../../../shared/common/styles/form.less', 'create-invoice-dialog.component.less' ],
    providers: [ CacheHelper, CustomerServiceProxy, DialogService, InvoiceServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateInvoiceDialogComponent implements OnInit {
    @ViewChild(DxValidationGroupComponent) linesValidationGroup: DxValidationGroupComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    @ViewChild(DxDataGridComponent) linesComponent: DxDataGridComponent;
    @ViewChild('dueDateComponent') dueDateComponent: DxDateBoxComponent;
    @ViewChild('dateComponent') dateComponent: DxDateBoxComponent;
    @ViewChild('invoice') invoiceNoComponent: DxTextBoxComponent;
    @ViewChild('contact') contactComponent: DxSelectBoxComponent;

    private lookupTimeout;

    private readonly SAVE_OPTION_DEFAULT = 0;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';

    private validationError: string;

    invoiceNo;
    orderId: number;
    invoiceId: number;
    statuses: any[] = [];
    status = InvoiceStatus.Draft;

    saveButtonId = 'saveInvoiceOptions';
    saveContextMenuItems = [];
    invoiceSettings: InvoiceSettings = new InvoiceSettings();
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    selectedOption: any;

    customer: any;
    contactId: number;
    customers = [];

    date;
    dueDate;

    description = '';
    notes = '';
    lines = [{}];

    subTotal = 0;
    total = 0;
    balance = 0;

    disabledForUpdate = false;
    title: string;
    isTitleValid = true;
    buttons: IDialogButton[] = [
        {
            id: this.saveButtonId,
            title: this.ls.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this),
            disabled: !this.permission.isGranted(AppPermissions.CRMOrdersInvoicesManage)
        }
    ];
    linesGridHeight = 200;
    invoiceUnits = Object.keys(InvoiceLineUnit);

    constructor(
        private invoiceProxy: InvoiceServiceProxy,
        private invoicesService: InvoicesService,
        private customerProxy: CustomerServiceProxy,
        private cacheService: CacheService,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private cacheHelper: CacheHelper,
        private dialogRef: MatDialogRef<CreateInvoiceDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private permission: AppPermissionService,
        private contactsService: ContactsService,
        public appSession: AppSessionService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.saveContextMenuItems = [
            {text: this.ls.l('Save'), selected: false, status: InvoiceStatus.Final, disabled: this.disabledForUpdate},
            {text: this.ls.l('Invoice_SaveAsDraft'), selected: false, disabled: this.disabledForUpdate, status: InvoiceStatus.Draft},
            {text: this.ls.l('Invoice_SaveAndSend'), selected: false, status: InvoiceStatus.Final, email: true, disabled: this.disabledForUpdate},
            {text: this.ls.l('Invoice_SaveAndMarkSent'), selected: false, disabled: true}
        ];
    }

    ngOnInit() {
        this.customerProxy.getAllByPhrase('', 10).subscribe((res) => {
            this.customers = res;
            this.changeDetectorRef.detectChanges();
        });

        this.invoicesService.settings$.pipe(first()).subscribe(settings => {
            this.invoiceSettings = settings;
            if (!this.data.invoice) {
                this.notes = settings.note;
            }
            this.changeDetectorRef.detectChanges();
        });

        this.initInvoiceData();
        this.saveOptionsInit();
    }

    initInvoiceData() {
        let invoice = this.data.invoice;
        if (invoice) {
            this.modalDialog.startLoading();
            this.invoiceId = invoice.Id;
            this.invoiceNo = invoice.Number;
            this.orderId = invoice.OrderId;
            this.status = invoice.Status;
            this.date = invoice.Date;
            this.dueDate = invoice.DueDate;
            this.contactId = invoice.ContactId;
            this.disabledForUpdate = [InvoiceStatus.Draft, InvoiceStatus.Final].indexOf(this.status) < 0;
            if (this.disabledForUpdate)
                this.buttons[0].disabled = this.disabledForUpdate;
            this.changeDetectorRef.detectChanges();
            this.invoiceProxy.getInvoiceInfo(invoice.Id)
                .pipe(finalize(() => this.modalDialog.finishLoading()))
                .subscribe((res) => {
                    this.description = res.description;
                    this.notes = res.note;
                    this.customer = res.contactName;
                    this.lines = res.lines.map((res) => {
                        return {
                            id: res.id,
                            Quantity: res.quantity,
                            Rate: res.rate,
                            Description: res.description,
                            unitId: res.unitId
                        };
                    });
                    this.calculateBalance();
                    this.changeDetectorRef.detectChanges();
                });
        } else {
            this.resetNoteDefault();

            this.invoiceProxy.getNewInvoiceInfo().subscribe(res => {
                this.invoiceNo = res.nextInvoiceNumber;
            });

            let contact = this.data.contactInfo;
            if (contact) {
                this.contactId = contact.id;
                this.customer = contact.personContactInfo.fullName;
            }
        }
    }

    saveOptionsInit() {
        let cacheKey = this.cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name);
        this.selectedOption = this.saveContextMenuItems[this.cacheService.exists(cacheKey)
                ? this.cacheService.get(cacheKey)
                : this.SAVE_OPTION_DEFAULT];
        this.selectedOption.selected = true;
        this.buttons[0].title = this.selectedOption.text;
        this.status = this.selectedOption.status;
    }

    onSaveItemClick(event) {
        event.event.stopPropagation();
        event.event.preventDefault();
    }

    onSaveOptionSelectionChanged(event) {
        this.selectedOption = event.addedItems.pop() || event.removedItems.pop() ||
            this.saveContextMenuItems[this.SAVE_OPTION_DEFAULT];
        this.selectedOption.selected = true;
        event.component.option('selectedItem', this.selectedOption);
        this.updateSaveOption(this.selectedOption);
        this.status = this.selectedOption.status;
        this.save();
    }

    updateSaveOption(option) {
        this.buttons[0].title = option.text;
        this.cacheService.set(this.cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
    }

    private setRequestCommonFields(data) {
        data.number = this.invoiceNo;
        data.date = this.getDate(this.date);
        data.dueDate = this.getDate(this.dueDate);
        data.description = this.description;
        data.note = this.notes;
    }

    private getDate(value) {
        return value ? DateHelper.removeTimezoneOffset(new Date(value), false, 'from') : undefined;
    }

    private createUpdateEntity(): void {
        let subscription$,
            saveButton: any = document.getElementById(this.saveButtonId);
        if (this.invoiceId) {
            let data = new UpdateInvoiceInput();
            this.setRequestCommonFields(data);
            data.id = this.invoiceId;
            data.status = InvoiceStatus[this.status];
            data.lines = this.lines.map((row, index) => {
                return new UpdateInvoiceLineInput({
                    id: row['id'],
                    quantity: row['Quantity'],
                    rate: row['Rate'],
                    unitId: row['unit'] as InvoiceLineUnit,
                    description: row['Description'],
                    sortOrder: index
                });
            });
            subscription$ = this.invoiceProxy.update(data);
        } else {
            let data = new CreateInvoiceInput();
            this.setRequestCommonFields(data);
            data.contactId = this.contactId;
            data.orderId = this.orderId;
            data.status = InvoiceStatus[this.status];
            data.lines = this.lines.map((row, index) => {
                return new CreateInvoiceLineInput({
                    quantity: row['Quantity'],
                    rate: row['Rate'],
                    unitId: row['unit'] as InvoiceLineUnit,
                    description: row['Description'],
                    sortOrder: index
                });
            });
            subscription$ = this.invoiceProxy.create(data);
        }

        saveButton.disabled = true;
        subscription$.pipe(finalize(() => {
            saveButton.disabled = false;
            this.modalDialog.finishLoading();
        })).subscribe(invoiceId => {
            if (invoiceId)
                this.invoiceId = invoiceId;
            this.afterSave();
        });
    }

    updateStatus(status?: InvoiceStatus) {
        if (status)
            this.status = status;
        if (this.status != this.data.status) {
            status || this.modalDialog.startLoading();
            this.invoiceProxy.updateStatus(new UpdateInvoiceStatusInput({
                id: this.invoiceId,
                status: InvoiceStatus[this.status]
            })).pipe(finalize(() => status || this.modalDialog.finishLoading()))
                .subscribe(() => {
                    if (status)
                        this.data.refreshParent && this.data.refreshParent();
                    else
                        this.afterSave();
                });
        }
    }

    private afterSave(): void {
        this.data.refreshParent && this.data.refreshParent();
        if (this.selectedOption.email)
            setTimeout(() => this.showNewEmailDialog());
        else {
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.close();
        }
    }

    private showNewEmailDialog() {
        this.modalDialog.startLoading();
        this.invoiceProxy.getPreprocessedEmail(this.invoiceSettings.defaultTemplateId, this.invoiceId).pipe(
              finalize(() => this.modalDialog.finishLoading()),
              switchMap(data => {
                  this.close();
                  data['contactId'] = this.contactId;
                  data['templateId'] = this.invoiceSettings.defaultTemplateId;
                  return this.contactsService.showEmailDialog(data);
              })
        ).subscribe(() => {
            this.updateStatus(InvoiceStatus.Sent);
            this.dialog.closeAll();
        });
    }

    private validateDate(caption, value) {
        return value || this.notifyService.error(this.ls.l('RequiredField', '', caption));
    }

    save(event?): void {
        if (event && event.offsetX > event.target.closest('button').offsetWidth - 32)
            return this.saveContextComponent.instance.option('visible', true);

        if (!this.invoiceNo)
            return this.invoiceNoComponent.instance.option('isValid', false);

        if (isNaN(this.contactId)) {
            this.notifyService.error(this.ls.l('RequiredField', '', this.ls.l('Client')));
            return this.contactComponent.instance.option('isValid', false);
        }

        if (!this.validateDate(this.ls.l('Date'), this.date))
            return this.dateComponent.instance.option('isValid', false);

        if (!this.validateDate(this.ls.l('Invoice_DueOnReceipt'), this.dueDate))
            return this.dueDateComponent.instance.option('isValid', false);

        if (!this.linesValidationGroup.instance.validate().isValid)
            return this.notifyService.error(this.ls.l('InvoiceLinesShouldBeDefined'));

        if (this.disabledForUpdate)
            this.updateStatus();
        else
            this.createUpdateEntity();
    }

    onFieldFocus(event) {
        event.component.option('isValid', true);
    }

    customerLookupItems($event) {
        let search = this.customer = $event.event.target.value;
        if (this.customers.length)
            this.customers = [];

        $event.component.option('opened', true);
        $event.component.option('noDataText', this.ls.l('LookingForItems'));

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            $event.component.option('opened', true);
            $event.component.option('noDataText', this.ls.l('LookingForItems'));

            this.customerProxy.getAllByPhrase(search, 10).subscribe((res) => {
                if (search == this.customer) {
                    if (!res['length'])
                        $event.component.option('noDataText', this.ls.l('NoItemsFound'));
                    this.customers = res;
                    this.changeDetectorRef.markForCheck();
                }
            });
        }, 500);
    }

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            //this.invoiceNo = this.invoiceSettings.nextInvoiceNumber;
            this.status = InvoiceStatus.Draft;
            this.customer = undefined;
            this.date = undefined;
            this.dueDate = this.date;
            this.description = '';
            this.notes = '';
            this.lines = [];
            this.changeDetectorRef.detectChanges();
        };

        if (forced)
            resetInternal();
        else
            this.messageService.confirm(this.ls.l('DiscardConfirmation'), '', (confirmed) => {
                if (confirmed)
                    resetInternal();
            });
    }

    calculateLineAmount = (data) => {
        let amount = data.Quantity * data.Rate;
        if (amount)
            this.calculateBalance();

        return amount || 0;
    }

    calculateBalance() {
        this.subTotal =
        this.total =
        this.balance = 0;

        this.lines.forEach((line) => {
            let amount = line['Quantity'] * line['Rate'];
            if (amount)
                this.subTotal =
                this.total =
                this.balance = this.total + amount;
        });
    }

    selectContact(event) {
        this.contactId = event.selectedItem && event.selectedItem.id;
    }

    close() {
        this.dialogRef.close();
    }

    deleteInvoice() {
        if (this.invoiceId)
            this.messageService.confirm(
                this.ls.l('InvoiceDeleteWarningMessage', this.invoiceNo),
                isConfirmed => {
                    if (isConfirmed) {
                        this.modalDialog.startLoading();
                        this.invoiceProxy.deleteInvoice(this.invoiceId).pipe(
                            finalize(() => this.modalDialog.finishLoading())
                        ).subscribe(() => {
                            this.notifyService.info(this.ls.l('SuccessfullyDeleted'));
                            this.data.refreshParent && this.data.refreshParent();
                            this.close();
                        });
                    }
                }
            );
    }

    resetNoteDefault() {
        if (!this.disabledForUpdate) {
            this.notes = this.invoiceSettings.note;
            this.changeDetectorRef.detectChanges();
        }
    }

    onValueChanged(event, data, field?) {
        this.lines[data.rowIndex][field || data.column.dataField] = event.value;
        this.changeDetectorRef.detectChanges();
    }

    allowDigitsOnly(event, exceptions = []) {
        let key = event.event.key;
        if (exceptions.indexOf(key) < 0 && key.length == 1 && isNaN(key)) {
            event.event.preventDefault();
            event.event.stopPropagation();
        }
    }

    addNewLine(data) {
        this.lines.push({});
        this.linesGridHeight += 100;
        this.changeDetectorRef.detectChanges();
    }

    deleteLine(data) {
        this.lines.splice(data.rowIndex, 1);
        this.linesGridHeight -= 100;
        this.changeDetectorRef.detectChanges();
    }

    createClient() {
        if (!this.disabledForUpdate)
            this.dialog.open(CreateClientDialogComponent, {
                panelClass: 'slider',
                disableClose: true,
                closeOnNavigation: false,
                data: {
                    customerType: ContactGroup.Client
                }
            }).afterClosed().subscribe(data => {
                if (data) {
                    this.contactId = data.id;
                    this.customer = [data.firstName, data.middleName,
                        data.lastName].filter(Boolean).join(' ');
                    this.changeDetectorRef.detectChanges();
                }
            });
    }

    openInvoiceSettings() {
        this.contactsService.showInvoiceSettingsDialog().subscribe(settings => {
            if (settings) {
                this.invoiceSettings = settings;
                this.changeDetectorRef.detectChanges();
            }
        });
    }
}