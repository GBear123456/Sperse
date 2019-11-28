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
import Inputmask from 'inputmask/dist/inputmask/inputmask.date.extensions';
import { ODataService } from '@shared/common/odata/odata.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { ContactGroup, AddressUsageType } from '@shared/AppEnums';
import {
    InvoiceServiceProxy,
    InvoiceAddressInput,
    CreateInvoiceInput,
    UpdateInvoiceLineInput,
    UpdateInvoiceStatusInput,
    UpdateInvoiceInput,
    CustomerServiceProxy,
    InvoiceStatus,
    CreateInvoiceLineInput,
    InvoiceLineUnit,
    InvoiceSettings,
    GetNewInvoiceInfoOutput,
    EntityContactInfo,
    ContactAddressInfo,
    ContactAddressServiceProxy
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { MessageService } from '@abp/message/message.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { CreateClientDialogComponent } from '../create-client-dialog/create-client-dialog.component';
import { InvoiceAddressDialog } from './invoice-address-dialog/invoice-address-dialog.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    templateUrl: 'create-invoice-dialog.component.html',
    styleUrls: [ '../../../shared/common/styles/form.less', 'create-invoice-dialog.component.less' ],
    providers: [ CacheHelper, CustomerServiceProxy, DialogService, InvoiceServiceProxy ],
    host: {
        '(click)': 'closeAddressDialogs()'
    }
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateInvoiceDialogComponent implements OnInit {
    @ViewChild(DxValidationGroupComponent) linesValidationGroup: DxValidationGroupComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    @ViewChild(DxDataGridComponent) linesComponent: DxDataGridComponent;
    @ViewChild('billingAddress') billingAddressComponent: DxSelectBoxComponent;
    @ViewChild('shippingAddress') shippingAddressComponent: DxSelectBoxComponent;
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
    orderNumber: string;
    statuses: any[] = [];
    status = InvoiceStatus.Draft;

    saveButtonId = 'saveInvoiceOptions';
    saveContextMenuItems = [];
    invoiceInfo = new GetNewInvoiceInfoOutput();
    invoiceSettings: InvoiceSettings = new InvoiceSettings();
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    selectedOption: any;
    selectedContact: any;
    selectedBillingAddress: InvoiceAddressInput;
    selectedShippingAddress: InvoiceAddressInput;
    customer: any;
    contactId: number;
    customers = [];

    date = DateHelper.addTimezoneOffset(new Date(), true);
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
    ordersDataSource;

    billingAddresses = [];
    shippingAddresses = [];

    constructor(
        private oDataService: ODataService,
        private invoiceProxy: InvoiceServiceProxy,
        private invoicesService: InvoicesService,
        private customerProxy: CustomerServiceProxy,
        private addressProxy: ContactAddressServiceProxy,
        private cacheService: CacheService,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private cacheHelper: CacheHelper,
        private dialogRef: MatDialogRef<CreateInvoiceDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private dialogService: DialogService,
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
        this.dialogRef.afterClosed().subscribe(() => {
            this.closeAddressDialogs();
        });
    }

    ngOnInit() {
        this.customerLookupRequest();
        this.invoicesService.settings$.pipe(first()).subscribe(settings => {
            this.invoiceSettings = settings;
            if (!this.data.invoice) {
                this.notes = settings.defaultNote;
            }
            this.changeDetectorRef.detectChanges();
        });

        this.initInvoiceData();
        this.saveOptionsInit();
    }

    checkCloseAddressDialog(name: string) {
        let dialog = this.dialog.getDialogById(name);
        if (dialog)
            dialog.close();
    }

    closeAddressDialogs() {
        this.checkCloseAddressDialog('selectedBillingAddress');
        this.checkCloseAddressDialog('selectedShippingAddress');
    }

    initOrderDataSource() {
        this.ordersDataSource = {
            uri: 'order',
            requireTotalCount: true,
            store: {
                key: 'Id',
                type: 'odata',
                url: this.oDataService.getODataUrl('order'),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    let contactFilter = '(ContactId eq ' + this.contactId + ')';
                    if (request.params.$filter)
                        request.params.$filter += ' and ' + contactFilter;
                    else
                        request.params.$filter = contactFilter;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                paginate: true
            }
        };
    }

    initInvoiceData() {
        let invoice = this.data.invoice;
        if (invoice) {
            this.modalDialog.startLoading();
            this.invoiceId = invoice.InvoiceId;
            this.invoiceNo = invoice.InvoiceNumber;
            this.orderId = invoice.OrderId;
            this.status = invoice.InvoiceStatus;
            this.date = DateHelper.addTimezoneOffset(new Date(invoice.Date), true);
            this.dueDate = invoice.InvoiceDueDate;
            this.contactId = invoice.ContactId;
            this.initOrderDataSource();
            this.disabledForUpdate = [InvoiceStatus.Draft, InvoiceStatus.Final].indexOf(this.status) < 0;
            if (this.disabledForUpdate)
                this.buttons[0].disabled = this.disabledForUpdate;
            this.invoiceProxy.getInvoiceInfo(invoice.InvoiceId)
                .pipe(finalize(() => this.modalDialog.finishLoading()))
                .subscribe((res) => {
                    this.subTotal =
                    this.total =
                    this.balance = res.grandTotal;
                    this.description = res.description;
                    this.notes = res.note;
                    this.orderNumber = res.orderNumber;
                    this.customer = res.contactName;
                    this.lines = res.lines.map((res) => {
                        return {
                            Quantity: res.quantity,
                            Rate: res.rate,
                            Description: res.description,
                            ...res
                        };
                    });
                    this.changeDetectorRef.detectChanges();
                });
        } else {
            this.resetNoteDefault();

            this.invoiceProxy.getNewInvoiceInfo().subscribe(res => {
                this.invoiceInfo = res;
                this.invoiceNo = res.nextInvoiceNumber;
                this.changeDetectorRef.detectChanges();
            });
        }

        this.initContactInfo(this.data.contactInfo);
        this.changeDetectorRef.detectChanges();
    }

    initContactInfo(contact) {
        if (contact) {
            this.contactId = contact.id;
            this.initOrderDataSource();
            this.initContactAddresses(contact.id);
            this.customer = contact.personContactInfo.fullName;
            let details = contact.personContactInfo.details,
                emailAddress = details.emails.length ?
                    details.emails[0].emailAddress : undefined,
                address = details.addresses[0];
            this.selectedContact =
                new EntityContactInfo({
                    id: contact.id,
                    name: this.customer,
                    email: emailAddress,
                    address: address ? new ContactAddressInfo({
                        streetAddress: address.streetAddress,
                        city: address.city,
                        state: address.state,
                        countryCode: address.country,
                        zip: address.zip
                    }) : new ContactAddressInfo(),
                    isActive: true
                });
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
        data.orderNumber = this.orderNumber;
        data.date = this.getDate(this.date, true, '');
        data.dueDate = this.getDate(this.dueDate);
        data.description = this.description;
        data.billingAddress = new InvoiceAddressInput(
            this.selectedBillingAddress);
        data.shippingAddress = new InvoiceAddressInput(
            this.selectedShippingAddress);
        data.note = this.notes;
    }

    private getDate(value, userTimezone = false, setTime = 'from') {
        return value ? DateHelper.removeTimezoneOffset(new Date(value), userTimezone, setTime) : undefined;
    }

    private createUpdateEntity(): void {
        let subscription$,
            saveButton: any = document.getElementById(this.saveButtonId);
        if (this.invoiceId) {
            let data = new UpdateInvoiceInput();
            this.setRequestCommonFields(data);
            data.id = this.invoiceId;
            data.grandTotal = this.total;
            data.status = InvoiceStatus[this.status];
            data.lines = this.lines.map((row, index) => {
                return new UpdateInvoiceLineInput({
                    id: row['id'],
                    quantity: row['quantity'],
                    rate: row['rate'],
                    total: row['total'],
                    unitId: row['unitId'] as InvoiceLineUnit,
                    description: row['description'],
                    sortOrder: index
                });
            });
            subscription$ = this.invoiceProxy.update(data);
        } else {
            let data = new CreateInvoiceInput();
            this.setRequestCommonFields(data);
            data.contactId = this.contactId;
            data.orderId = this.orderId;
            data.grandTotal = this.total;
            data.status = InvoiceStatus[this.status];
            data.lines = this.lines.map((row, index) => {
                return new CreateInvoiceLineInput({
                    quantity: row['quantity'],
                    rate: row['rate'],
                    total: row['total'],
                    unitId: row['unitId'] as InvoiceLineUnit,
                    description: row['description'],
                    sortOrder: index
                });
            });
            subscription$ = this.invoiceProxy.create(data);
        }

        saveButton.disabled = true;
        this.modalDialog.startLoading();
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
            this.invoicesService.updateStatus(this.invoiceId, this.status)
                .pipe(finalize(() => status || this.modalDialog.finishLoading()))
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
        this.invoiceProxy.getEmailData(this.invoiceSettings.defaultTemplateId, this.invoiceId).pipe(
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

    private validateField(caption, value) {
        return value || this.notifyService.error(this.ls.l('RequiredField', caption));
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

        let isAddressValid = this.selectedBillingAddress &&
            this.selectedBillingAddress.address1 &&
            this.selectedBillingAddress.city;
        if (!this.validateField(this.ls.l('Invoice_BillTo'), isAddressValid))
            return this.billingAddressComponent.instance.option('isValid', false);

        isAddressValid = this.selectedShippingAddress &&
            this.selectedShippingAddress.address1 &&
            this.selectedShippingAddress.city;
        if (!this.validateField(this.ls.l('Invoice_ShipTo'), isAddressValid))
            return this.shippingAddressComponent.instance.option('isValid', false);

        if (!this.validateField(this.ls.l('Date'), this.date))
            return this.dateComponent.instance.option('isValid', false);

        if (!this.validateField(this.ls.l('Invoice_DueOnReceipt'), this.dueDate))
            return this.dueDateComponent.instance.option('isValid', false);

        this.lines = this.getFilteredLines(false);
        if (!this.lines.length)
            this.lines.push({});
        this.changeDetectorRef.detectChanges();
        setTimeout(() => {
            if (!this.linesValidationGroup.instance.validate().isValid)
                return this.notifyService.error(this.ls.l('InvoiceLinesShouldBeDefined'));

            if (this.disabledForUpdate)
                this.updateStatus();
            else
                this.createUpdateEntity();
        }, 300);
    }

    getFilteredLines(fulfilled = true) {
        return this.lines.filter(line => this.checkFulfilledLine(line, fulfilled));
    }

    checkFulfilledLine(line, fulfilled = true) {
        return ['description', 'quantity', 'rate', 'unitId'][fulfilled ? 'every' : 'some'](field => line[field]);
    }

    onFieldFocus(event) {
        event.component.option('isValid', true);
    }

    getAddressesByType(addresses, condition) {
        return addresses.map(address => {
            if (condition.call(this, address)) {
                address['display'] = [address.streetAddress, address.city,
                    address.stateId, address.zip, address.countryId].join(', ');
                return address;
            }
        }).filter(Boolean);
    }

    initContactAddresses(contactId: number) {
        if (contactId)
            this.addressProxy.getContactAddresses(contactId).subscribe(res => {
                this.shippingAddresses = this.getAddressesByType(res,
                    addr => addr.usageTypeId == AddressUsageType.Shipping);
                this.billingAddresses = this.getAddressesByType(res,
                    addr => addr.usageTypeId != AddressUsageType.Shipping);
                this.changeDetectorRef.markForCheck();
            });
    }

    customerLookupRequest(phrase = '', callback?) {
        this.customerProxy.getAllByPhrase(phrase, 10).subscribe(res => {
            if (!phrase || phrase == this.customer) {
                this.customers = res;
                callback && callback(res);
                this.changeDetectorRef.markForCheck();
            }
        });
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

            this.customerLookupRequest(search, res => {
                if (!res['length'])
                    $event.component.option('noDataText', this.ls.l('NoItemsFound'));
            });
        }, 500);
    }

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            this.invoiceNo = this.invoiceInfo.nextInvoiceNumber;
            this.status = InvoiceStatus.Draft;
            this.customer = undefined;
            this.date = undefined;
            this.dueDate = this.date;
            this.description = '';
            this.notes = '';
            this.lines = [{}];
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

    calculateLineTotal(data) {
        let total = data.quantity * data.rate;
        if (total != data['total']) {
            data['total'] = total || 0;
            this.calculateBalance();
        }
    }

    calculateBalance() {
        this.subTotal =
        this.total =
        this.balance = 0;
        this.lines.forEach(line => {
            let total = line['total'];
            if (total)
                this.subTotal =
                this.total =
                this.balance = this.total + total;
        });
        this.changeDetectorRef.detectChanges();
    }

    selectContact(event) {
        this.selectedContact = event.selectedItem;
        this.contactId = event.selectedItem && event.selectedItem.id;
        if (this.orderId) {
            this.orderId = undefined;
            this.orderNumber = undefined;
        }
        this.initOrderDataSource();
        this.initContactAddresses(this.contactId);
        this.changeDetectorRef.detectChanges();
    }

    clearClient() {
        this.contactId = undefined;
        this.customer = undefined;
        this.selectedBillingAddress = undefined;
        this.selectedShippingAddress = undefined;
        this.changeDetectorRef.detectChanges();
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
            this.notes = this.invoiceSettings.defaultNote;
            this.changeDetectorRef.detectChanges();
        }
    }

    onRateChanged(event, cell) {
        let value = event.value;
        if (isNaN(value))
            value = value.replace(/(?!\.)\D/igm, '');
        cell.data.rate = value;
        this.calculateLineTotal(cell.data);
    }

    onOrderSelected(event, dropBox) {
        let data = event.data;
        if (data) {
            this.orderId = data.Id;
            this.orderNumber = data.Number;
            dropBox.instance.option('opened', false);
            this.changeDetectorRef.detectChanges();
        }
    }

    onOrderNumberValueChanged(event) {
        if (event.event)
            this.orderId = undefined;
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
        if (data.rowIndex || this.lines.length > 1) {
            this.lines.splice(data.rowIndex, 1);
            this.linesGridHeight -= 100;
            this.calculateBalance();
        }
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
                    this.initContactInfo({
                        id: data.id,
                        personContactInfo: {
                            fullName: [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' '),
                            details: {
                                addresses: data.addresses,
                                emails: data.emailAddresses
                            }
                        }
                    });
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

    onDateContentReady(event) {
        new Inputmask('mm/dd/yyyy', {
            showMaskOnHover: false,
            showMaskOnFocus: true
        }).mask(event.component.field());
    }

    orderFocusIn(event) {
        if (event.event.target.tagName == 'INPUT')
            setTimeout(() => event.event.target.focus(), 150);
    }

    showEditAddressDialog(event, field) {
        let address = this.selectedContact.address,
            customerNameParts = (this.customer || '').split(' '),
            dialogData = this[field] || new InvoiceAddressInput({
                countryId: address.countryCode,
                stateId: address.state,
                city:  address.city,
                zip: address.zip,
                address1: address.streetAddress,
                address2: undefined,
                firstName: customerNameParts.shift(),
                lastName: customerNameParts.shift(),
                company: undefined,
                email: this.selectedContact.email,
                phone: undefined
            });
        this.dialog.open(InvoiceAddressDialog, {
            id: field,
            data: dialogData,
            hasBackdrop: false,
            disableClose: false,
            closeOnNavigation: true,
            position: this.dialogService.calculateDialogPosition(event, event.target)
        }).afterClosed().subscribe(result => {
            if (!this[field] && result)
                this[field] = dialogData;
            this.changeDetectorRef.detectChanges();
        });
        event.stopPropagation();
        event.preventDefault();
    }
}