/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, ViewChild, Inject, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { CacheService } from 'ng2-cache-service';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { DateHelper } from '@shared/helpers/DateHelper';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { ContactGroup } from '@shared/AppEnums';
import {
    InvoiceServiceProxy, CreateInvoiceInput, UpdateInvoiceLineInput, UpdateInvoiceStatusInput, UpdateInvoiceInput, CustomerServiceProxy, InvoiceStatus,
    CreateInvoiceLineInput, InvoiceSettingsInfoDto
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { MessageService } from '@abp/message/message.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { CreateClientDialogComponent } from '../create-client-dialog/create-client-dialog.component';

@Component({
    templateUrl: 'create-invoice-dialog.component.html',
    styleUrls: [ '../../../shared/common/styles/form.less', 'create-invoice-dialog.component.less' ],
    providers: [ CacheHelper, CustomerServiceProxy, DialogService, InvoiceServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateInvoiceDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    @ViewChild(DxDataGridComponent) linesComponent: DxDataGridComponent;
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
    billingSettings: InvoiceSettingsInfoDto = InvoiceSettingsInfoDto.fromJS({});

    currencies = [
        {name: 'US Dollar', code: 'USD'},
        {name: 'GB Pound', code: 'GBP'},
        {name: 'Euro', code: 'EUR'}
    ];
    currency = this.currencies[0].code;

    customer: any;
    contactId: number;
    customers = [];

    date;
    dueDate;
    currentDate = new Date();

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
            action: this.save.bind(this)
        }
    ];
    linesGridHeight = 200;

    constructor(
        private _invoiceProxy: InvoiceServiceProxy,
        private _customerProxy: CustomerServiceProxy,
        private _cacheService: CacheService,
        private _notifyService: NotifyService,
        private _messageService: MessageService,
        private _cacheHelper: CacheHelper,
        private _dialogRef: MatDialogRef<CreateInvoiceDialogComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.saveContextMenuItems = [
            {text: this.ls.l('Save'), selected: false},
            {text: this.ls.l('Invoice_SaveAsDraft'), selected: false, disabled: this.data.invoice
                && this.data.invoice.Status != InvoiceStatus.Draft},
            {text: this.ls.l('Invoice_SaveAndSend'), selected: false, disabled: true},
            {text: this.ls.l('Invoice_SaveAndMarkSent'), selected: false, disabled: true}
        ];
    }

    ngOnInit() {
        this._customerProxy.getAllByPhrase('', 10).subscribe((res) => {
            this.customers = res;
            this._changeDetectorRef.detectChanges();
        });

        this._invoiceProxy.getSettings().subscribe((settings) => {
            this.billingSettings = settings;
            if (!this.data.invoice)
                this.invoiceNo = settings.nextInvoiceNumber;
            this._changeDetectorRef.detectChanges();
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
            this.disabledForUpdate = this.status != InvoiceStatus.Draft
                && this.status != InvoiceStatus.Final;
            this._changeDetectorRef.detectChanges();
            this._invoiceProxy.getInvoiceInfo(invoice.Id)
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
                            Description: res.description
                        };
                    });
                    this._changeDetectorRef.detectChanges();
                });
        } else {
            this.resetNoteDefault();
        }
    }

    saveOptionsInit() {
        let cacheKey = this._cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            selectedIndex = this.SAVE_OPTION_DEFAULT;
        if (this._cacheService.exists(cacheKey))
            selectedIndex = this._cacheService.get(cacheKey);
        this.saveContextMenuItems[selectedIndex].selected = true;
        this.buttons[0].title = this.saveContextMenuItems[selectedIndex].text;
    }

    onSaveOptionSelectionChanged($event) {
        let option = $event.addedItems.pop() || $event.removedItems.pop() ||
            this.saveContextMenuItems[this.SAVE_OPTION_DEFAULT];
        option.selected = true;
        $event.component.option('selectedItem', option);

        this.updateSaveOption(option);
        this.save();
    }

    updateSaveOption(option) {
        this.buttons[0].title = option.text;
        this._cacheService.set(this._cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
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
        return DateHelper.removeTimezoneOffset(new Date(value), false, 'from');
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
                    unitId: 'UT',
                    description: row['Description'],
                    sortOrder: index
                });
            });
            subscription$ = this._invoiceProxy.update(data);
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
                    unitId: 'UT',
                    description: row['Description'],
                    sortOrder: index
                });
            });
            subscription$ = this._invoiceProxy.create(data);
        }

        saveButton.disabled = true;
        subscription$.pipe(finalize(() => {
            saveButton.disabled = false;
            this.modalDialog.finishLoading();
        })).subscribe(() => {
            this.afterSave();
        });
    }

    updateStatus() {
        if (this.status != this.data.invoice.Status) {
            this.modalDialog.startLoading();
            this._invoiceProxy.updateStatus(new UpdateInvoiceStatusInput({
                id: this.invoiceId,
                status: InvoiceStatus[this.status]
            })).pipe(finalize(() => this.modalDialog.finishLoading()))
                .subscribe(() => {
                    this.afterSave();
                });
        }
    }

    private afterSave(): void {
        this.close();
        this._notifyService.info(this.ls.l('SavedSuccessfully'));
        this.data.refreshParent && this.data.refreshParent();
    }

    save(event?): void {
        if (event && event.offsetX > event.target.closest('button').offsetWidth - 32)
            return this.saveContextComponent.instance.option('visible', true);

        if (!this.invoiceNo)
            return this.invoiceNoComponent.instance.option('isValid', false);

        if (isNaN(this.contactId))
            return this.contactComponent.instance.option('isValid', false);

        if (!this.lines.length)
            return this._notifyService.error(this.ls.l('InvoiceLinesShouldBeDefined'));

        this.saveContextMenuItems.some((item, index) => {
            if (item.selected) {
                this.status = InvoiceStatus[index == 1 ? 'Draft' : 'Final'];
                this._changeDetectorRef.detectChanges();
            }
            return item.selected;
        });

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

            this._customerProxy.getAllByPhrase(search, 10).subscribe((res) => {
                if (search == this.customer) {
                    if (!res['length'])
                        $event.component.option('noDataText', this.ls.l('NoItemsFound'));

                    this.customers = res;
                }
            });
        }, 500);
    }

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            this.invoiceNo = this.billingSettings.nextInvoiceNumber;
            this.status = InvoiceStatus.Draft;
            this.customer = undefined;
            this.date = undefined;
            this.dueDate = this.date;
            this.description = '';
            this.notes = '';
            this.lines = [];
            this._changeDetectorRef.detectChanges();
        };

        if (forced)
            resetInternal();
        else
            this._messageService.confirm(this.ls.l('DiscardConfirmation'), '', (confirmed) => {
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
        this._dialogRef.close();
    }

    deleteInvoice() {
        if (this.invoiceId)
            this._messageService.confirm(
                this.ls.l('InvoiceDeleteWarningMessage', this.invoiceNo),
                isConfirmed => {
                    if (isConfirmed) {
                        this.modalDialog.startLoading();
                        this._invoiceProxy.deleteInvoice(this.invoiceId).pipe(
                            finalize(() => this.modalDialog.finishLoading())
                        ).subscribe(() => {
                            this._notifyService.info(this.ls.l('SuccessfullyDeleted'));
                            this.data.refreshParent && this.data.refreshParent();
                            this.close();
                        });
                    }
                }
            );
    }

    resetNoteDefault() {
        this.notes = this.ls.l('Invoice_DefaultNote');
        this._changeDetectorRef.detectChanges();
    }

    onValueChanged(event, data) {
        this.lines[data.rowIndex][data.column.dataField] = event.value;
        this._changeDetectorRef.detectChanges();
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
        this._changeDetectorRef.detectChanges();
    }

    deleteLine(data) {
        this.lines.splice(data.rowIndex, 1);
        this.linesGridHeight -= 100;
        this._changeDetectorRef.detectChanges();
    }

    createClient() {
        this.dialog.open(CreateClientDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                customerType: ContactGroup.Client
            }
        }).afterClosed().subscribe((data) => {
            if (data) {
                this.contactId = data.id;
                this.customer = [data.firstName, data.middleName, 
                    data.lastName].filter(Boolean).join(' ');
                this._changeDetectorRef.detectChanges();
            }
        });
    }
}