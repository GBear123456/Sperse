/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, ViewChild, Inject, ChangeDetectorRef } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';

/** Third party imports */
import { DxValidationGroupComponent } from '@root/node_modules/devextreme-angular';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import { finalize, first, switchMap } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import startCase from 'lodash/startCase';
import cloneDeep from 'lodash/cloneDeep';
import * as moment from 'moment';

/** Application imports */
import { ContactStatus } from '@shared/AppEnums';
import { CustomReuseStrategy } from '@shared/common/custom-reuse-strategy/custom-reuse-strategy.service.ts';
import { NameParserService } from '@shared/common/name-parser/name-parser.service';
import Inputmask from 'inputmask/dist/inputmask/inputmask.date.extensions';
import { ODataService } from '@shared/common/odata/odata.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { ContactGroup } from '@shared/AppEnums';
import {
    PersonInfoDto,
    InvoiceServiceProxy,
    InvoiceAddressInput,
    CreateInvoiceInput,
    UpdateInvoiceLineInput,
    UpdateInvoiceInput,
    CustomerServiceProxy,
    InvoiceStatus,
    CreateInvoiceLineInput,
    InvoiceInfo,
    InvoiceLineUnit,
    InvoiceSettings,
    GetNewInvoiceInfoOutput,
    ContactServiceProxy,
    InvoiceAddressInfo,
    ContactAddressDto
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { MessageService } from '@abp/message/message.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { CreateEntityDialogComponent } from '@shared/common/create-entity-dialog/create-entity-dialog.component';
import { InvoiceAddressDialog } from './invoice-address-dialog/invoice-address-dialog.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { OrderDropdownComponent } from '@app/crm/shared/order-dropdown/order-dropdown.component';
import { StatesService } from '@root/store/states-store/states.service';

@Component({
    templateUrl: 'create-invoice-dialog.component.html',
    styleUrls: [
        '../../../shared/common/styles/form.less',
        '../../contacts/addresses/addresses.styles.less',
        'create-invoice-dialog.component.less'
    ],
    providers: [ CacheHelper, CustomerServiceProxy, InvoiceServiceProxy ],
    host: {
        '(click)': 'closeAddressDialogs()'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateInvoiceDialogComponent implements OnInit {
    @ViewChild(DxValidationGroupComponent, { static: false }) linesValidationGroup: DxValidationGroupComponent;
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild(DxContextMenuComponent, { static: false }) saveContextComponent: DxContextMenuComponent;
    @ViewChild('dueDateComponent', { static: false }) dueDateComponent: DxDateBoxComponent;
    @ViewChild('dateComponent', { static: false }) dateComponent: DxDateBoxComponent;
    @ViewChild('invoice', { static: false }) invoiceNoComponent: DxTextBoxComponent;
    @ViewChild('contact', { static: false }) contactComponent: DxSelectBoxComponent;
    @ViewChild(OrderDropdownComponent, { static: true }) orderDropdown: OrderDropdownComponent;

    private lookupTimeout;

    private readonly SAVE_OPTION_DEFAULT = 0;
    private readonly SAVE_OPTION_DRAFT   = 1;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';
    private readonly cacheKey = this.cacheHelper.getCacheKey(
        this.SAVE_OPTION_CACHE_KEY, 'CreateInvoiceDialog'
    );

    invoiceNo;
    orderId: number;
    invoiceId: number;
    orderNumber: string;
    statuses: any[] = [];
    status = InvoiceStatus.Draft;
    startCase = startCase;

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
    products = [];
    descriptions = [];
    lastProductPhrase: string;
    date = new Date();
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

    invoiceUnits = Object.keys(InvoiceLineUnit);
    billingAddresses: InvoiceAddressInfo[] = [];
    shippingAddresses: InvoiceAddressInfo[] = [];
    filterBoolean = Boolean;

    constructor(
        private reuseService: RouteReuseStrategy,
        private nameParser: NameParserService,
        private oDataService: ODataService,
        private contactProxy: ContactServiceProxy,
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
        private statesService: StatesService,
        public appSession: AppSessionService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.afterClosed().subscribe(() => {
            this.closeAddressDialogs();
        });
    }

    ngOnInit() {
        this.invoicesService.settings$.pipe(first()).subscribe(settings => {
            this.invoiceSettings = settings;
            if (!this.data.invoice) {
                this.notes = settings.defaultNote;
            }
            this.changeDetectorRef.detectChanges();
        });

        this.initInvoiceData();
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

    initInvoiceData() {
        let invoice = this.data.invoice;
        if (invoice) {
            this.orderNumber = invoice.OrderNumber;
            this.orderId = invoice.OrderId;
        }
        if (invoice && invoice.InvoiceId) {
            this.modalDialog.startLoading();
            if (this.data.addNew)
                this.status = InvoiceStatus.Draft;
            else {
                this.invoiceId = invoice.InvoiceId;
                this.invoiceNo = invoice.InvoiceNumber;
                this.status = invoice.InvoiceStatus;
                this.disabledForUpdate = [InvoiceStatus.Draft, InvoiceStatus.Final].indexOf(this.status) < 0;
                this.date = invoice.Date;
                this.dueDate = invoice.InvoiceDueDate;
            }
            this.contactId = invoice.ContactId;
            this.productsLookupRequest();
            this.orderDropdown.initOrderDataSource();
            this.invoiceProxy.getInvoiceInfo(invoice.InvoiceId)
                .pipe(finalize(() => this.modalDialog.finishLoading()))
                .subscribe((invoiceInfo: InvoiceInfo) => {
                    this.subTotal =
                    this.total =
                    this.balance = invoiceInfo.grandTotal;
                    this.description = invoiceInfo.description;
                    this.notes = invoiceInfo.note;
                    if (!this.data.addNew) {
                        this.invoiceNo = invoiceInfo.number;
                        this.date = invoiceInfo.date;
                        this.dueDate = invoiceInfo.dueDate;
                        this.status = invoiceInfo.status;
                    }
                    this.orderNumber = invoiceInfo.orderNumber;
                    this.customer = invoiceInfo.contactName;
                    this.selectedBillingAddress = invoiceInfo.billingAddress;
                    this.selectedShippingAddress = invoiceInfo.shippingAddress;
                    this.lines = invoiceInfo.lines.map(res => {
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
            if (!this.data.contactInfo)
                this.customerLookupRequest();
        }

        this.initNewInvoiceInfo();
        this.initContextMenuItems();
        this.initContactInfo(this.data.contactInfo);
        this.changeDetectorRef.detectChanges();
    }

    initContextMenuItems() {
        this.buttons.forEach(item => item.disabled = this.disabledForUpdate);
        this.saveContextMenuItems = [
            {text: this.ls.l('Save'), selected: false, status: InvoiceStatus.Final, disabled: this.disabledForUpdate},
            {text: this.ls.l('Invoice_SaveAsDraft'), selected: false, disabled: this.disabledForUpdate, status: InvoiceStatus.Draft},
            {text: this.ls.l('Invoice_SaveAndSend'), selected: false, status: InvoiceStatus.Final, email: true, disabled: this.disabledForUpdate},
            {text: this.ls.l('Invoice_SaveAndMarkSent'), selected: false, disabled: true}
        ];
        this.saveOptionsInit();
    }

    initNewInvoiceInfo() {
        let invoice = this.data.invoice;
        if (!invoice || !invoice.InvoiceId || this.data.addNew)
            this.invoiceProxy.getNewInvoiceInfo().subscribe((newInvoiceInfo: GetNewInvoiceInfoOutput) => {
                this.invoiceInfo = newInvoiceInfo;
                this.invoiceNo = newInvoiceInfo.nextInvoiceNumber;
                this.changeDetectorRef.detectChanges();
            });
    }

    initContactInfo(contact) {
        if (contact) {
            this.contactId = contact.id;
            this.orderDropdown.initOrderDataSource();
            this.initContactAddresses(contact.id);
            this.customer = contact.personContactInfo.fullName;
            let details = contact.personContactInfo.details,
                emailAddress = details.emails.length ?
                    details.emails[0].emailAddress : undefined,
                address: ContactAddressDto = details.addresses[0];
            this.selectedContact = {
                id: contact.id,
                name: this.customer,
                email: emailAddress,
                address: address ? {
                    streetAddress: address.streetAddress,
                    city: address.city,
                    stateId: address.stateId,
                    stateName: address.stateName,
                    country: address.country,
                    zip: address.zip
                } : {},
                isActive: true
            };
            this.productsLookupRequest();
        }
    }

    saveOptionsInit() {
        this.selectedOption = this.saveContextMenuItems[
            this.data.saveAsDraft
                ? this.SAVE_OPTION_DRAFT : this.cacheService.exists(this.cacheKey)
                ? this.cacheService.get(this.cacheKey) : this.SAVE_OPTION_DEFAULT
        ];
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
        this.cacheService.set(this.cacheKey,
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
    }

    private setRequestCommonFields(data) {
        data.number = this.invoiceNo;
        data.orderNumber = this.orderNumber;
        data.date = this.getDate(this.date);
        data.dueDate = this.getDate(this.dueDate);
        data.description = this.description;
        data.billingAddress = this.selectedBillingAddress &&
            new InvoiceAddressInput(this.selectedBillingAddress);
        if (data.billingAddress) {
            data.billingAddress.stateId = data.billingAddress && this.statesService.getAdjustedStateCode(
                data.billingAddress.stateId,
                data.billingAddress.stateName
            );
        }
        data.shippingAddress = this.selectedShippingAddress &&
            new InvoiceAddressInput(this.selectedShippingAddress);
        if (data.shippingAddress) {
            data.shippingAddress.stateId = data.shippingAddress && this.statesService.getAdjustedStateCode(
                data.shippingAddress.stateId,
                data.shippingAddress.stateName
            );
        }
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
                    productCode: '',
                    description: row['description'],
                    sortOrder: index
                });
            });
            subscription$ = this.invoiceProxy.update(data);
        } else {
            let data = new CreateInvoiceInput();
            this.setRequestCommonFields(data);
            data.contactId = this.contactId;
            if (!this.orderNumber && this.data && this.data.contactInfo && this.data.contactInfo.leadId) {
                data.leadId = this.data.contactInfo.leadId;
            }
            data.orderId = this.orderId;
            data.grandTotal = this.total;
            data.status = InvoiceStatus[this.status];
            data.lines = this.lines.map((row, index) => {
                return new CreateInvoiceLineInput({
                    quantity: row['quantity'],
                    rate: row['rate'],
                    total: row['total'],
                    unitId: row['unitId'] as InvoiceLineUnit,
                    productCode: '',
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

    updateStatus(status?: InvoiceStatus, emailId?: number) {
        if (status)
            this.status = status;
        if (this.status != this.data.status) {
            status || this.modalDialog.startLoading();
            this.invoicesService.updateStatus(this.invoiceId, this.status, emailId)
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
        let contact = this.data.contactInfo;
        this.data.refreshParent && this.data.refreshParent();
        if (this.status != InvoiceStatus.Draft && (!contact || contact.statusId == ContactStatus.Prospective))
            (this.reuseService as CustomReuseStrategy).invalidate('leads');

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
                  return this.contactsService.showInvoiceEmailDialog(this.invoiceId, data);
              })
        ).subscribe(emailId => {
            this.updateStatus(InvoiceStatus.Sent, emailId);
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
            this.notifyService.error(this.ls.l('RequiredField', this.ls.l('Client')));
            return this.contactComponent.instance.option('isValid', false);
        }

        if (!this.validateField(this.ls.l('Date'), this.date))
            return this.dateComponent.instance.option('isValid', false);

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

    onFieldFocusIn(event) {
        event.component.option('isValid', true);
    }

    initContactAddresses(contactId: number) {
        if (contactId)
            this.invoiceProxy.getInvoiceAddresses(contactId).subscribe(res => {
                let addresses: InvoiceAddressInfo[] = res.map(address => {
                    let fullName = [address.firstName, address.lastName].filter(Boolean).join(' ');
                    address['display'] = [address.company, fullName, address.address1, address.address2,
                        address.city, address.stateId, address.zip, address.countryId].filter(Boolean).join(', ');
                    return address;
                });
                this.shippingAddresses = this.sortAddresses(addresses, 'S');
                if (this.shippingAddresses && this.shippingAddresses.length) {
                    this.selectedShippingAddress = this.shippingAddresses[0];
                    this.showEditAddressDialog(null, 'selectedShippingAddress');
                }
                this.billingAddresses = this.sortAddresses(addresses, 'B');
                if (this.billingAddresses && this.billingAddresses.length) {
                    this.selectedBillingAddress = this.billingAddresses[0];
                    this.showEditAddressDialog(null, 'selectedBillingAddress');
                }
                this.changeDetectorRef.markForCheck();
            });
    }

    onAddressChanged(e, field: string) {
        if (e.event && e.value && !e.value.lastBillingDate && !e.value.lastShippingDate) {
            this.showEditAddressDialog(e.event, field);
        }
    }

    private sortAddresses(addresses: InvoiceAddressInfo[], usageTypeId: 'B' | 'S') {
        const dateProperty = usageTypeId === 'B' ? 'lastBillingDate' : 'lastShippingDate';
        return cloneDeep(addresses).sort((addressA: InvoiceAddressInfo, addressB: InvoiceAddressInfo) => {
            let result = 0;
            if (addressA[dateProperty] && addressB[dateProperty]) {
                result = moment(addressA[dateProperty]).diff(moment(addressB[dateProperty])) > 0 ? -1 : 1;
            } else if (addressA[dateProperty] && !addressB[dateProperty]) {
                result = -1;
            } else if (addressB[dateProperty] && !addressA[dateProperty]) {
                result = 1;
            } else if (addressA.usageTypeId === usageTypeId && addressB.usageTypeId !== usageTypeId) {
                result = -1;
            } else if (addressA.usageTypeId !== usageTypeId && addressB.usageTypeId === usageTypeId) {
                result = 1;
            } else {
                result = addressA.contactAddressId > addressB.contactAddressId ? -1 : 1;
            }
            return result;
        });
    }

    customerLookupRequest(phrase = '', callback?) {
        this.contactProxy.getAllByPhrase(phrase, 10, undefined, undefined).subscribe(res => {
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

    productsLookupRequest(phrase = '', callback?) {
        this.invoiceProxy.getProductsByPhrase(this.contactId, phrase, 10).subscribe(res => {
            if (!phrase || phrase == this.lastProductPhrase) {
                this.descriptions = (this.products = res).map(item => item.description);
                this.changeDetectorRef.markForCheck();
                callback && callback(res);
            }
        });
    }

    productLookupItems($event, cellData) {
        this.lastProductPhrase = $event.event.target.value;
        if (this.products.length)
            this.products = [];

        $event.component.option('opened', true);
        $event.component.option('noDataText', this.ls.l('LookingForItems'));

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            $event.component.option('opened', true);
            $event.component.option('noDataText', this.ls.l('LookingForItems'));

            this.productsLookupRequest(this.lastProductPhrase, res => {
                cellData.data.description = this.lastProductPhrase;
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
            this.date = new Date();
            this.dueDate = undefined;
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

    selectProduct(event, cellData) {
        this.products.some(item => {
            if (item.description == event.value) {
                cellData.data.unitId = item.unitId;
                cellData.data.rate = item.rate;
                this.changeDetectorRef.detectChanges();
                return true;
            }
        });
    }

    selectContact(event) {
        let contactId = event.selectedItem && event.selectedItem.id;
        if (contactId != this.contactId) {
            this.contactId = contactId;
            this.selectedContact = event.selectedItem;
            if (this.orderId && !this.data.invoice) {
                this.orderId = undefined;
                this.orderNumber = undefined;
            }
            this.productsLookupRequest();
            this.orderDropdown.initOrderDataSource();
            this.initContactAddresses(this.contactId);
            this.changeDetectorRef.detectChanges();
        }
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

    allowDigitsOnly(event, exceptions = []) {
        let key = event.event.key;
        if (exceptions.indexOf(key) < 0 && key.length == 1 && isNaN(key)) {
            event.event.preventDefault();
            event.event.stopPropagation();
        }
    }

    addNewLine() {
        this.lines.push({});
        this.changeDetectorRef.detectChanges();
    }

    deleteLine(data) {
        if (data.rowIndex || this.lines.length > 1) {
            this.lines.splice(data.rowIndex, 1);
            this.calculateBalance();
        }
    }

    createClient() {
        if (!this.disabledForUpdate)
            this.dialog.open(CreateEntityDialogComponent, {
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

    showEditAddressDialog(event, field) {
        let person = new PersonInfoDto(),
            address = this.selectedContact.address;
        this.nameParser.parseIntoPerson(this.customer, person);
        let dialogData: any = Object.assign({}, this[field]) || {
            countryId: address.countryCode,
            stateId: address.stateId,
            stateName: address.stateName,
            country: address.country,
            city: address.city,
            zip: address.zip,
            address1: address.streetAddress,
            address2: undefined,
            firstName: person.firstName,
            lastName: person.lastName,
            company: undefined,
            email: this.selectedContact.email,
            phone: undefined
        };
        dialogData['viewMode'] = this.disabledForUpdate;
        dialogData['addrType'] = field.match(/[A-Z][a-z]+/g).shift();
        dialogData['contactId'] = dialogData['contactId'] || this.contactId;
        if (event) {
            this.dialog.open(InvoiceAddressDialog, {
                id: field,
                data: dialogData,
                hasBackdrop: false,
                disableClose: false,
                closeOnNavigation: true,
                position: {
                    top: '100px',
                    left: Math.max((innerWidth - 900 - 620) / 2, 0) + 'px'
                }
            }).afterClosed().subscribe(result => {
                if (result) {
                    this[field] = new InvoiceAddressInput(dialogData);
                    this.changeDetectorRef.detectChanges();
                }
            });
            event.stopPropagation();
            event.preventDefault();
        }
    }
}
