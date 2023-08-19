/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    OnInit,
    ViewChild,
    Inject,
    ChangeDetectorRef
} from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';

/** Third party imports */
import { DxValidationGroupComponent } from 'devextreme-angular';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import DataSource from 'devextreme/data/data_source';
import { forkJoin, of } from 'rxjs';
import { finalize, first, switchMap, filter } from 'rxjs/operators';
import startCase from 'lodash/startCase';
import cloneDeep from 'lodash/cloneDeep';
import round from 'lodash/round';
import * as moment from 'moment';

/** Application imports */
import { CustomReuseStrategy } from '@shared/common/custom-reuse-strategy/custom-reuse-strategy.service';
import { NameParserService } from '@shared/common/name-parser/name-parser.service';
import Inputmask from 'inputmask/dist/inputmask/inputmask.date.extensions';
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
    ProductMeasurementUnit,
    InvoiceSettings,
    GetNewInvoiceInfoOutput,
    InvoiceAddressInfo,
    ContactAddressDto,
    EntityContactInfo,
    ContactInfoDto,
    ContactInfoDetailsDto,
    PersonContactInfoDto,
    EntityAddressInfo,
    ProductServiceProxy,
    ProductPaymentOptionsInfo,
    ProductShortInfo,
    CouponServiceProxy,
    CouponDto,
    CouponDiscountType,
    PaymentServiceProxy,
    InvoicePaymentMethod,
    GetApplicablePaymentMethodsInput,
    ApplicableCheckLine,
    UpdatePaymentMethodsInput,
    InvoiceSettingsDto
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { MessageService } from 'abp-ng2-module';
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
import { ContextMenuItem } from '@shared/common/dialogs/modal/context-menu-item.interface';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { CustomerListDialogComponent } from '@app/crm/shared/create-invoice-dialog/customer-list-dialog/customer-list-dialog.component';
import { CreateInvoiceDialogData } from '@app/crm/shared/create-invoice-dialog/create-invoice-dialog-data.interface';
import { CreateEntityDialogData } from '@shared/common/create-entity-dialog/models/create-entity-dialog-data.interface';
import { InvoiceSettingsDialogComponent } from '../../contacts/invoice-settings-dialog/invoice-settings-dialog.component';
import { AppFeatures } from '@shared/AppFeatures';
import { SettingsHelper } from '@shared/common/settings/settings.helper';

@Component({
    templateUrl: 'create-invoice-dialog.component.html',
    styleUrls: [
        '../../../shared/common/styles/form.less',
        '../../contacts/addresses/addresses.styles.less',
        'create-invoice-dialog.component.less'
    ],
    providers: [CacheHelper, CustomerServiceProxy, InvoiceServiceProxy, ProductServiceProxy, CouponServiceProxy, PaymentServiceProxy],
    host: {
        '(click)': 'closeAddressDialogs()'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateInvoiceDialogComponent implements OnInit {
    @ViewChild(DxValidationGroupComponent) linesValidationGroup: DxValidationGroupComponent;
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    @ViewChild('startDateComponent') startDateComponent: DxDateBoxComponent;
    @ViewChild('dueDateComponent') dueDateComponent: DxDateBoxComponent;
    @ViewChild('dateComponent') dateComponent: DxDateBoxComponent;
    @ViewChild('invoice') invoiceNoComponent: DxTextBoxComponent;
    @ViewChild(OrderDropdownComponent, { static: true }) orderDropdown: OrderDropdownComponent;

    private lookupTimeout;
    invoiceNo;
    orderId: number;
    invoiceId: number;
    orderNumber: string;
    statuses: any[] = [];
    status = InvoiceStatus.Draft;
    startCase = startCase;


    private readonly MAX_DESCRIPTION_LENGTH = 499;
    defaultCountryCode = AppConsts.defaultCountryCode;
    currency = SettingsHelper.getCurrency();
    saveButtonId = 'saveInvoiceOptions';
    newInvoiceInfo = new GetNewInvoiceInfoOutput();
    invoiceSettings: InvoiceSettingsDto = new InvoiceSettingsDto();
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    selectedOption: ContextMenuItem;
    selectedContact: EntityContactInfo;
    selectedBillingAddress: InvoiceAddressInput;
    selectedShippingAddress: InvoiceAddressInput;
    customer: string;
    contactId: number;
    products: (ProductPaymentOptionsInfo | ProductShortInfo)[] = [];
    lastProductPhrase: string;
    lastProductCount: number;
    date = moment().utcOffset(0, true).toDate();
    tomorrowDate = DateHelper.addTimezoneOffset(moment().add(1, 'days').startOf('day').utcOffset(0, true).toDate());
    startDate;
    dueDate;
    isAddressDialogOpened = false;
    featureMaxProductCount: number = this.contactsService.getFeatureCount(AppFeatures.CRMMaxProductCount);

    description = '';
    notes = '';
    lines = [{ isCrmProduct: !!this.featureMaxProductCount }];

    couponId: number;
    selectedCoupon: CouponDto;

    subTotal = 0;
    balance = 0;
    discountTotal = 0;
    shippingTotal = 0;
    taxTotal = 0;

    isStripeEnabled = false;
    stripeSubscriptionsLinesCount = 0;

    isSendEmailAllowed = false;
    disabledForUpdate = false;
    hasReccuringSubscription = false;
    hasSubscription = false;
    title: string;
    isTitleValid = true;
    buttons: IDialogButton[] = [
        {
            id: this.saveButtonId,
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this),
            disabled: !this.permission.isGranted(AppPermissions.CRMOrdersInvoicesManage),
            contextMenu: {
                items: [
                    {
                        text: this.ls.l('Save'),
                        selected: false,
                        disabled: this.disabledForUpdate,
                        data: {
                            status: InvoiceStatus.Final,
                        }
                    },
                    {
                        text: this.ls.l('Invoice_SaveAsDraft'),
                        selected: false,
                        disabled: this.disabledForUpdate,
                        data: {
                            status: InvoiceStatus.Draft
                        }
                    },
                    {
                        text: this.ls.l('Invoice_SaveAndSend'),
                        selected: false,
                        disabled: !this.isSendEmailAllowed || this.disabledForUpdate,
                        data: {
                            status: InvoiceStatus.Final,
                            email: true
                        }
                    },
                    {
                        text: this.ls.l('Invoice_SaveAndMarkSent'),
                        selected: false,
                        disabled: this.disabledForUpdate,
                        data: {
                            status: InvoiceStatus.Sent,
                            email: false
                        }
                    }
                ],
                defaultIndex: 0,
                selectedIndex: this.data.saveAsDraft ? 1 : undefined,
                cacheKey: this.cacheHelper.getCacheKey('save_option_active_index', 'CreateInvoiceDialog')
            }
        }
    ];

    invoiceInfo: InvoiceInfo;
    invoiceUnits = Object.keys(ProductMeasurementUnit).map(item => {
        return {
            unitId: item,
            unitName: this.ls.l(item)
        };
    });

    showPaymentMethods = false;
    forbiddenPaymentMethods: number = 0;
    paymentMethods = Object.keys(InvoicePaymentMethod).filter(v => typeof InvoicePaymentMethod[v] === "number").map(item => {
        return {
            id: item,
            checked: true,
            disabled: true,
            visible: false,
            value: InvoicePaymentMethod[item],
            name: this.ls.l(item)
        }
    });
    showUpdatePaymentMethodButton = false;
    paymentMethodsCheckTimeout;
    paymentMethodsCheckLoading = false;
    paymentMethodsCheckReload = false;

    billingAddresses: InvoiceAddressInfo[] = [];
    shippingAddresses: InvoiceAddressInfo[] = [];
    filterBoolean = Boolean;
    hideAddNew = false;

    couponsDataSource: DataSource = new DataSource({
        pageSize: 10,
        byKey: (key) => {
            return this.couponProxy.getCoupon(key).toPromise();
        },
        load: (loadOptions) => {
            return loadOptions.hasOwnProperty('searchValue') ?
                this.couponProxy.getCouponsByPhrase(loadOptions.searchValue || '', loadOptions.take).toPromise() :
                Promise.resolve([]);
        }
    });

    constructor(
        private reuseService: RouteReuseStrategy,
        private nameParser: NameParserService,
        private invoiceProxy: InvoiceServiceProxy,
        private invoicesService: InvoicesService,
        private productProxy: ProductServiceProxy,
        private couponProxy: CouponServiceProxy,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private cacheHelper: CacheHelper,
        private dialogRef: MatDialogRef<CreateInvoiceDialogComponent>,
        public changeDetectorRef: ChangeDetectorRef,
        private permission: AppPermissionService,
        private contactsService: ContactsService,
        private statesService: StatesService,
        private paymetService: PaymentServiceProxy,
        public appSession: AppSessionService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: CreateInvoiceDialogData
    ) {
        this.dialogRef.afterClosed().subscribe(() => {
            this.closeAddressDialogs();
        });
        this.paymetService.isStripeEnabled()
            .subscribe(res => this.isStripeEnabled = res);
    }

    ngOnInit() {
        this.invoicesService.settings$.pipe(filter(Boolean), first()).subscribe((settings: InvoiceSettingsDto) => {
            this.invoiceSettings = settings;
            if (!this.data.invoice) {
                this.notes = settings.defaultNote;
                this.initForbiddenPaymentMethods(settings.forbiddenPaymentMethods, true);
            }
            this.hideNotConfiguredPaymentMethods();
            this.showPaymentMethods = true;
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
                this.date = this.getDate(invoice.Date);
                this.dueDate = invoice.InvoiceDueDate;
            }
            this.contactId = invoice.ContactId;
            this.orderDropdown.initOrderDataSource();

            let contactInfoObs = !this.data.contactInfo && invoice.ContactId ? this.contactsService.getContactInfo(invoice.ContactId) : of<ContactInfoDto>(null);
            forkJoin(this.invoiceProxy.getInvoiceInfo(invoice.InvoiceId), contactInfoObs)
                .pipe(finalize(() => this.modalDialog.finishLoading()))
                .subscribe(([invoiceInfo, contactInfo]) => {
                    this.invoiceInfo = invoiceInfo;
                    this.subTotal = invoiceInfo.lines.map(line => {
                        return line.quantity * line.rate;
                    }).reduce((acc, val) => acc + val, 0);
                    this.balance = invoiceInfo.grandTotal || 0;
                    this.discountTotal = invoiceInfo.discountTotal || 0;
                    this.shippingTotal = invoiceInfo.shippingTotal || 0;
                    this.taxTotal = invoiceInfo.taxTotal || 0;
                    this.couponId = invoiceInfo.couponId;
                    this.description = invoiceInfo.description;
                    this.notes = invoiceInfo.note;
                    if (!this.data.addNew) {
                        this.invoiceNo = invoiceInfo.number;
                        this.date = invoiceInfo.date;
                        this.dueDate = invoiceInfo.dueDate;
                        if (invoiceInfo.subscriptionStartOn)
                            this.startDate = DateHelper.addTimezoneOffset(new Date(invoiceInfo.subscriptionStartOn), true);
                        if (this.disabledForUpdate) {
                            this.status = invoiceInfo.status;
                            this.disabledForUpdate = [InvoiceStatus.Draft, InvoiceStatus.Final].indexOf(this.status) < 0;
                        }
                    }
                    this.orderNumber = invoiceInfo.orderNumber;
                    this.customer = invoiceInfo.contactName;
                    this.selectedBillingAddress = invoiceInfo.billingAddress;
                    this.selectedShippingAddress = invoiceInfo.shippingAddress;
                    this.lines = invoiceInfo.lines.map((res) => {
                        let lineDescription = res.description || res.productName || '<No description>';
                        let description = lineDescription.split('\n').shift();
                        return {
                            isCrmProduct: !!res.productCode,
                            Quantity: res.quantity,
                            Rate: res.rate,
                            Description: description,
                            details: lineDescription.split('\n').slice(1).join('\n'),
                            units: res.productType == 'Subscription' ? [{
                                unitId: res.unitId,
                                unitName: res.unitName
                            }] : undefined,
                            ...res,
                            description: description
                        };
                    });
                    this.showUpdatePaymentMethodButton = this.disabledForUpdate && [InvoiceStatus.Sent, InvoiceStatus.PartiallyPaid].indexOf(this.status) >= 0;
                    this.initForbiddenPaymentMethods(invoiceInfo.forbiddenPaymentMethods);
                    if (contactInfo) {
                        this.initContactInfo(contactInfo);
                    }
                    else {
                        this.initiatePaymentMethodsCheck(0);
                    }

                    this.initContextMenuItems();
                    this.checkSubscriptionsCount();
                    this.checkReccuringSubscriptionIsSelected(false);
                    this.changeDetectorRef.detectChanges();
                });
        } else
            this.resetNoteDefault();

        this.initNewInvoiceInfo();
        this.initContactInfo(this.data.contactInfo);
        this.changeDetectorRef.detectChanges();
    }

    initContextMenuItems() {
        this.buttons.forEach((item: IDialogButton) => {
            item.disabled = this.disabledForUpdate;
            item.contextMenu.items.forEach((contextMenuItem: ContextMenuItem) => {
                if (contextMenuItem.text == this.ls.l('Invoice_SaveAndSend'))
                    contextMenuItem.disabled = !this.isSendEmailAllowed || this.disabledForUpdate;
                else if (contextMenuItem.text != this.ls.l('Invoice_SaveAndMarkSent'))
                    contextMenuItem.disabled = this.disabledForUpdate;
            });
        });
        this.saveOptionsInit();
    }

    initNewInvoiceInfo() {
        let invoice = this.data.invoice;
        if (!invoice || !invoice.InvoiceId || this.data.addNew)
            this.invoiceProxy.getNewInvoiceInfo().subscribe((newInvoiceInfo: GetNewInvoiceInfoOutput) => {
                this.newInvoiceInfo = newInvoiceInfo;
                this.invoiceNo = newInvoiceInfo.nextInvoiceNumber;
                this.changeDetectorRef.detectChanges();
            });
    }

    initContactInfo(contact: ContactInfoDto) {
        if (contact) {
            this.contactId = contact.id;
            this.orderDropdown.initOrderDataSource();
            this.initContactAddresses(contact.id);
            this.customer = contact.personContactInfo.fullName;
            this.isSendEmailAllowed = this.checkSendEmailAllowed(contact.groups);
            this.initContextMenuItems();
            let details = contact.personContactInfo.details,
                emailAddress = details.emails.length ? details.emails[0].emailAddress : undefined,
                address: ContactAddressDto = details.addresses[0];
            this.selectedContact = EntityContactInfo.fromJS({
                id: contact.id,
                name: this.customer,
                email: emailAddress,
                address: EntityAddressInfo.fromJS(address ? {
                    streetAddress: address.streetAddress,
                    city: address.city,
                    stateId: address.stateId,
                    stateName: address.stateName,
                    country: address.countryName,
                    zip: address.zip
                } : {}),
                isActive: true
            });
            this.initiatePaymentMethodsCheck();
        }
    }

    saveOptionsInit() {
        this.selectedOption = this.buttons[0].contextMenu.items.find((item: ContextMenuItem) => item.selected);
        this.status = this.selectedOption.data.status;
    }

    onSaveOptionSelectionChanged() {
        this.selectedOption = this.buttons[0].contextMenu.items.find((item: ContextMenuItem) => item.selected);
        this.status = this.selectedOption.data.status;
        this.save();
    }

    private setRequestCommonFields(data) {
        data.number = this.invoiceNo;
        data.orderNumber = this.orderNumber;
        data.date = this.getDate(this.date);
        data.dueDate = this.getDate(this.dueDate);
        data.subscriptionStartOn = this.getDate(this.startDate, true, '');
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
        data.forbiddenPaymentMethods = this.forbiddenPaymentMethods || undefined;
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
            data.couponCode = this.selectedCoupon ? this.selectedCoupon.code : null;
            data.grandTotal = this.balance;
            data.discountTotal = this.discountTotal;
            data.shippingTotal = this.shippingTotal;
            data.taxTotal = this.taxTotal;
            if (this.status == InvoiceStatus.Sent &&
                this.invoiceInfo.status != this.status
            )
                data.status = InvoiceStatus.Final;
            else
                data.status = InvoiceStatus[this.status];
            data.lines = this.lines.map((row, index: number) => {
                let description = row['description'] ? row['description'].split('\n').shift() : '';
                return new UpdateInvoiceLineInput({
                    id: row['id'],
                    quantity: row['quantity'],
                    rate: row['rate'],
                    total: row['total'],
                    unitId: row['unitId'] as ProductMeasurementUnit,
                    productCode: row['productCode'],
                    description: description + (row['details'] ? '\n' + row['details'] : ''),
                    sortOrder: index,
                    commissionableAmount: undefined
                });
            });
            subscription$ = this.invoiceProxy.update(data);
        } else {
            let data = new CreateInvoiceInput();
            this.setRequestCommonFields(data);
            data.contactId = this.contactId;
            if (!this.orderNumber && this.data && this.data.contactInfo && this.data.contactInfo['leadId']) {
                data.leadId = this.data.contactInfo['leadId'];
            }
            data.orderId = this.orderId;
            data.couponCode = this.selectedCoupon ? this.selectedCoupon.code : null;
            data.grandTotal = this.balance;
            data.discountTotal = this.discountTotal;
            data.shippingTotal = this.shippingTotal;
            data.taxTotal = this.taxTotal;
            data.status = InvoiceStatus[this.status];
            data.lines = this.lines.map((row, index) => {
                let description = row['description'] ? row['description'].split('\n').shift() : '';
                return new CreateInvoiceLineInput({
                    quantity: row['quantity'],
                    rate: row['rate'],
                    total: row['total'],
                    unitId: row['unitId'] as ProductMeasurementUnit,
                    productCode: row['productCode'],
                    description: description + (row['details'] ? '\n' + row['details'] : ''),
                    sortOrder: index,
                    commissionableAmount: undefined
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
            else if (this.status == InvoiceStatus.Sent && this.invoiceInfo.status != this.status)
                this.updateStatus(InvoiceStatus.Sent);
            this.afterSave();
        });
    }

    updateStatus(status?: InvoiceStatus, emailId?: number) {
        if (status)
            this.status = status;
        /** @todo Check why there is no status in data anywhere  */
        // if (this.status != this.data.status) {
        status || this.modalDialog.startLoading();
        this.invoicesService.updateStatus(this.invoiceId, this.status, emailId)
            .pipe(finalize(() => status || this.modalDialog.finishLoading()))
            .subscribe(() => {
                if (status)
                    this.data.refreshParent && this.data.refreshParent();
                else
                    this.afterSave();
            });
        //}
    }

    private afterSave(): void {
        let contact = this.data.contactInfo;
        this.data.refreshParent && this.data.refreshParent();
        if (this.status != InvoiceStatus.Draft && (!contact || contact.groups.some(group => group.isProspective)))
            (this.reuseService as CustomReuseStrategy).invalidate('leads');

        if (this.selectedOption.data.email)
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
            if (!isNaN(emailId)) {
                this.updateStatus(InvoiceStatus.Sent, emailId);
                this.dialog.closeAll();
            }
        });
    }

    private validateField(caption, value) {
        return value || this.notifyService.error(this.ls.l('RequiredField', caption));
    }

    save(): void {
        if (!this.invoiceNo)
            return this.invoiceNoComponent.instance.option('isValid', false);

        if (isNaN(this.contactId)) {
            this.notifyService.error(this.ls.l('RequiredField', this.ls.l('Client')));
            return;
        }

        if (!this.validateField(this.ls.l('Date'), this.date))
            return this.dateComponent.instance.option('isValid', false);

        if (!this.startDateComponent.instance.option('isValid'))
            return this.notifyService.error(this.ls.l('InvalidField', 'subscription Start'));

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
        return ['description', 'quantity', 'rate', 'unitId'][fulfilled ? 'every' : 'some'](field => line[field] != undefined);
    }

    onFieldFocusIn(event, cellData) {
        event.component.option('isValid', true);
        let value = event.component.option('value');
        if (cellData && (!this.lastProductPhrase || !(value && value.startsWith(this.lastProductPhrase)))) {
            if (cellData.data.isCrmProduct) {
                if (!this.products || !this.products.length || !this.products[0]['code'])
                    this.productsLookupRequest();
            } else {
                if (!this.products || !this.products.length || this.products[0]['code'])
                    this.invoiceProductsLookupRequest();
            }
            if (value && !this.products.some(item => item.description == value))
                this.products.push(<any>cellData.data);
        }
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
            let result: number;
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

    invoiceProductsLookupRequest(phrase = '', callback?, code?: string) {
        this.productProxy.getInvoiceProductsByPhrase(this.contactId, phrase, code, 10).subscribe(res => {
            if (!phrase || phrase == this.lastProductPhrase) {
                this.products = res.map((item: any) => {
                    item.details = item.description.split('\n').slice(1).join('\n');
                    item.caption = item.description.split('\n').shift();
                    return item;
                });
                callback && callback(res);
                this.changeDetectorRef.detectChanges();
            }
        });
    }

    productsLookupRequest(phrase = '', callback?, code?: string) {
        if (this.featureMaxProductCount)
            this.productProxy.getProductsByPhrase(this.contactId, phrase, code, 10).subscribe(res => {
                if (!phrase || phrase == this.lastProductPhrase) {
                    this.products = res.map((item: any) => {
                        item.details = item.description;
                        item.description = item.name;
                        item.caption = item.name;
                        return item;
                    });
                    callback && callback(res);
                    this.updateDisabledProducts();
                    this.changeDetectorRef.detectChanges();
                }
            });
    }

    productLookupItems($event, cellData, fromInvoice = true) {
        if (fromInvoice && cellData.data.productCode)
            return;

        let phrase = $event.event.target.value;
        if (this.lastProductPhrase && phrase.startsWith(this.lastProductPhrase) && this.lastProductCount == 0)
            return this.lastProductPhrase = phrase;

        this.lastProductPhrase = phrase;
        $event.component.option('opened', true);
        $event.component.option('noDataText', this.ls.l('LookingForItems'));

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            $event.component.option('opened', true);
            $event.component.option('noDataText', this.ls.l('LookingForItems'));

            (fromInvoice
                ? this.invoiceProductsLookupRequest
                : this.productsLookupRequest
            ).bind(this)(this.lastProductPhrase, res => {
                this.lastProductCount = res.length;
                if (!this.lastProductCount)
                    $event.component.option('noDataText', this.ls.l('NoItemsFound'));
            });
        }, 500);
    }

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            this.invoiceNo = this.newInvoiceInfo.nextInvoiceNumber;
            this.status = InvoiceStatus.Draft;
            this.customer = undefined;
            this.date = new Date();
            this.dueDate = undefined;
            this.startDate = undefined;
            this.description = '';
            this.notes = '';
            this.lines = [{ isCrmProduct: !!this.featureMaxProductCount }];
            this.showUpdatePaymentMethodButton = false;
            this.initForbiddenPaymentMethods(this.invoiceSettings.forbiddenPaymentMethods, true);
            this.changeDetectorRef.detectChanges();
        };

        if (forced)
            resetInternal();
        else
            this.messageService.confirm('', this.ls.l('DiscardConfirmation'), (confirmed) => {
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
        this.subTotal = this.balance = 0;
        this.lines.forEach(line => {
            let total = line['total'];
            if (total)
                this.subTotal = this.subTotal + total;
        });
        this.calcuateDiscount();
        this.balance = this.subTotal - this.discountTotal + this.shippingTotal + this.taxTotal;
        this.changeDetectorRef.detectChanges();
        this.initiatePaymentMethodsCheck();
    }

    calcuateDiscount() {
        let coupon = this.selectedCoupon;
        if (coupon) {
            let discountTotal = coupon.type == CouponDiscountType.Fixed ?
                this.subTotal < coupon.amountOff ? this.subTotal : coupon.amountOff :
                this.subTotal * (coupon.percentOff / 100);
            this.discountTotal = round(discountTotal, 2);
        }
        else {
            this.discountTotal = 0;
        }
    }

    selectInvoiceProduct(event, cellData) {
        let item = event.selectedItem;
        if (item && item.hasOwnProperty('rate')) {
            cellData.data.productId = undefined;
            cellData.data.productCode = undefined;
            cellData.data.units = undefined;
            cellData.data.unitId = cellData.data.unitId || item.unitId;
            cellData.data.rate = cellData.data.rate || item.rate;
            cellData.data.quantity = cellData.data.quantity || 1;
            cellData.data.details = item.details;
            this.changeDetectorRef.detectChanges();
        }
    }

    selectProduct(event, cellData) {
        if (!cellData.data.isCrmProduct)
            return this.selectInvoiceProduct(event, cellData);

        let item = event.selectedItem;
        if (item && item.hasOwnProperty('paymentOptions')
            && cellData.data.productCode != item.code
        ) {
            cellData.data.productId = item.id;
            cellData.data.productCode = item.code;
            cellData.data.description =
                cellData.data.description || item.name;
            cellData.data.units = item.paymentOptions;
            cellData.data.unitId = item.paymentOptions[0].unitId;
            cellData.data.rate = item.paymentOptions[0].price;
            cellData.data.quantity = 1;
            cellData.data.productType = item.type;
            cellData.data.details = item.details;
            this.updateDisabledProducts();
            this.checkSubscriptionsCount();
            this.checkReccuringSubscriptionIsSelected();
            this.changeDetectorRef.detectChanges();
        }
    }

    updateDisabledProducts() {
        this.products.forEach((product: any) => {
            product.disabled = false;
            this.lines.some((item: any) => {
                if (item.productCode && product.code == item.productCode)
                    return product.disabled = true;
            });
        });
    }

    checkSubscriptionsCount() {
        if (this.isStripeEnabled) {
            let subsLines = this.lines.filter(
                (line: any) => line.productType == 'Subscription' && (line.unitId == ProductMeasurementUnit.Month || line.unitId == ProductMeasurementUnit.Year || line.unitId == ProductMeasurementUnit.Custom)
            );

            this.stripeSubscriptionsLinesCount = subsLines.length;
        }
        else {
            this.stripeSubscriptionsLinesCount = 0;
        }
    }

    checkReccuringSubscriptionIsSelected(calculateBalance: boolean = true) {
        this.hasReccuringSubscription = this.lines.some((line: any) =>
            line.isCrmProduct &&
            line.productType == 'Subscription' &&
            (line.unitId == ProductMeasurementUnit.Month || line.unitId == ProductMeasurementUnit.Year || line.unitId == ProductMeasurementUnit.Custom)
        );
        this.hasSubscription = this.hasReccuringSubscription || this.lines.some((line: any) =>
            line.isCrmProduct && line.productType == 'Subscription' && line.unitId == ProductMeasurementUnit.Piece
        );
        if (!this.disabledForUpdate && (!this.hasSubscription && this.startDate))
            this.startDate = undefined;

        if (this.hasReccuringSubscription) {
            this.shippingTotal = 0;
            this.taxTotal = 0;
            if (calculateBalance)
                this.calculateBalance();
        }
    }

    selectCoupon(event) {
        this.selectedCoupon = event.selectedItem;
        this.calculateBalance();
    }

    checkSendEmailAllowed(contactGroup) {
        return this.contactsService.getFeatureCount(AppFeatures.CRMMaxCommunicationMessageCount) &&
            this.permission.checkCGPermission(contactGroup, 'ViewCommunicationHistory.SendSMSAndEmail');
    }

    selectContact(contact: EntityContactInfo) {
        if (contact.id != this.contactId) {
            this.customer = contact.name;
            this.contactId = contact.id;
            this.selectedContact = contact;
            this.isSendEmailAllowed = this.checkSendEmailAllowed([ContactGroup.Client]);
            this.initContextMenuItems();
            if (this.orderId && !this.data.invoice) {
                this.orderId = undefined;
                this.orderNumber = undefined;
            }
            this.orderDropdown.initOrderDataSource();
            this.initContactAddresses(this.contactId);
            this.initiatePaymentMethodsCheck();
            this.changeDetectorRef.detectChanges();
        }
    }

    openContactListDialog(event) {
        this.dialog.open(CustomerListDialogComponent, {
            minWidth: 350,
            position: DialogService.calculateDialogPosition(event, event.target)
        }).afterClosed().subscribe((customer: EntityContactInfo) => {
            if (customer) {
                this.selectContact(customer);
            }
        });
    }

    clearClient() {
        this.contactId = undefined;
        this.customer = undefined;
        this.selectedBillingAddress = undefined;
        this.selectedShippingAddress = undefined;
        this.initiatePaymentMethodsCheck();
        this.changeDetectorRef.detectChanges();
    }

    close() {
        this.dialogRef.close();
    }

    deleteInvoice() {
        if (this.invoiceId)
            this.messageService.confirm(
                this.ls.l('InvoiceDeleteWarningMessage', this.invoiceNo), '',
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

    onUnitOpened(event, cellData) {
        if (cellData.data.productCode &&
            cellData.data.productType == 'Subscription' &&
            !cellData.data.units[0].hasOwnProperty('price')
        ) {
            this.productsLookupRequest('', (products) => {
                if (products && products[0])
                    cellData.data.units = products[0].paymentOptions;
            }, cellData.data.productCode);
        }
    }

    onUnitChanged(event, cellData) {
        if (cellData.data.units) {
            let unit = cellData.data.units.find(
                item => item.unitId == event.value
            );
            if (unit)
                cellData.data.rate = unit.price;
        }
        this.checkSubscriptionsCount();
        this.checkReccuringSubscriptionIsSelected(false);
        this.calculateBalance();
    }

    allowDigitsOnly(event, exceptions = []) {
        let key = event.event.key;
        if (exceptions.indexOf(key) < 0 && key.length == 1 && isNaN(key)) {
            event.event.preventDefault();
            event.event.stopPropagation();
        }
    }

    addNewLine(component, isCrmProduct = false) {
        if (this.lines.length != this.getFilteredLines().length)
            this.lines[this.lines.length - 1].isCrmProduct = isCrmProduct;
        else
            this.lines.push({ isCrmProduct: isCrmProduct });

        if (isCrmProduct)
            this.productsLookupRequest();
        else
            this.invoiceProductsLookupRequest();

        component.instance.repaint();
        this.changeDetectorRef.detectChanges();
    }

    deleteLine(data, component) {
        if (data.rowIndex || this.lines.length > 1) {
            this.hideAddNew = true;
            setTimeout(() => {
                this.lines.splice(data.rowIndex, 1);
                this.checkSubscriptionsCount();
                this.checkReccuringSubscriptionIsSelected(false);
                this.calculateBalance();
                setTimeout(() => {
                    this.hideAddNew = false;
                    this.updateDisabledProducts();
                    if (!this.hasReccuringSubscription)
                        this.startDateComponent.instance.reset();
                    this.changeDetectorRef.detectChanges();
                }, 300);
            });
        } else {
            this.lines = [{ isCrmProduct: !!this.featureMaxProductCount }];
            this.startDateComponent.instance.reset();
            this.hasReccuringSubscription = false;
            this.updateDisabledProducts();
            this.changeDetectorRef.detectChanges();
        }
    }

    createClient() {
        if (!this.disabledForUpdate) {
            const dialogData: CreateEntityDialogData = {
                customerType: ContactGroup.Client
            };
            this.dialog.open(CreateEntityDialogComponent, {
                panelClass: 'slider',
                disableClose: true,
                closeOnNavigation: false,
                data: dialogData
            }).afterClosed().subscribe(data => {
                if (data) {
                    this.initContactInfo(ContactInfoDto.fromJS({
                        id: data.id,
                        personContactInfo: PersonContactInfoDto.fromJS({
                            fullName: [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' '),
                            details: ContactInfoDetailsDto.fromJS({
                                addresses: data.addresses,
                                emails: data.emailAddresses
                            })
                        })
                    }));
                    this.changeDetectorRef.detectChanges();
                }
            });
        }
    }

    openInvoiceSettings() {
        this.dialog.open(InvoiceSettingsDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false
        }).afterClosed()
            .subscribe(settings => {
                if (settings) {
                    this.invoiceSettings = settings;
                    this.changeDetectorRef.detectChanges();
                }
            });
    }

    onDateContentReady(event, showTime = false) {
        new Inputmask('mm/dd/yyyy', {
            showMaskOnHover: false,
            showMaskOnFocus: true
        }).mask(event.component.field());
    }

    onCustomDescriptionCreating(event) {
        if (!event.customItem)
            event.customItem = {
                caption: event.text,
                description: event.text
            };
        setTimeout(() => this.initiatePaymentMethodsCheck(1000));
    }

    getDetailsMaxLength(detail): Number {
        if (detail && detail.data && detail.data.description) {
            let description = detail.data.description.split('\n').shift();
            return this.MAX_DESCRIPTION_LENGTH - description.length;
        } else
            return this.MAX_DESCRIPTION_LENGTH;
    }

    showEditAddressDialog(event, field) {
        let person = new PersonInfoDto(),
            address = this.selectedContact.address;
        this.nameParser.parseIntoPerson(this.customer, person);
        let dialogData: any = Object.assign({}, this[field]) || {
            /*countryId: address.countryCode,*/
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
            this.isAddressDialogOpened = true;
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
                }
                this.isAddressDialogOpened = false;
                this.changeDetectorRef.detectChanges();
            });
            event.stopPropagation();
            event.preventDefault();
        }
    }

    initForbiddenPaymentMethods(forbiddenPaymentMethods, resetDisabled: boolean = false) {
        this.forbiddenPaymentMethods = forbiddenPaymentMethods || 0;
        this.paymentMethods.forEach(v => {
            v.checked = !((this.forbiddenPaymentMethods & v.value) == v.value);
            if (resetDisabled)
                v.disabled = false;
        });
    }

    hideNotConfiguredPaymentMethods() {
        this.paymentMethods.forEach(v => {
            v.visible = (this.invoiceSettings.configuredPaymentMethods & v.value) == v.value;
        });
    }

    paymentMethodChanged(event, value) {
        if (event.value) {
            this.forbiddenPaymentMethods &= ~value;
        }
        else {
            this.forbiddenPaymentMethods |= value;
        }
    }

    updatePaymentMethod() {
        if (!this.invoiceId)
            return;

        this.modalDialog.startLoading();
        this.invoiceProxy.updatePaymentMethods(new UpdatePaymentMethodsInput({
            invoiceId: this.invoiceId,
            forbiddenPaymentMethods: this.forbiddenPaymentMethods || undefined
        })).pipe(finalize(() => {
            this.modalDialog.finishLoading();
        })).subscribe(() => {
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
        });
    }

    initiatePaymentMethodsCheck(timeout = 1000) {
        if (this.paymentMethodsCheckLoading) {
            this.paymentMethodsCheckReload = true;
            return;
        }

        this.paymentMethodsCheckReload = false;
        this.paymentMethods.forEach(v => v.disabled = true);
        if (!this.contactId || this.lines.length == 0 || this.lines.some(v => (!v['productCode'] && !v['description']) || !v['unitId'] || !v['quantity'] || isNaN(v['rate'])))
            return;

        this.paymentMethodsCheckLoading = true;
        this.changeDetectorRef.markForCheck();
        clearTimeout(this.paymentMethodsCheckTimeout);

        let lines = this.lines.map((row, index: number) => {
            return new ApplicableCheckLine({
                quantity: row['quantity'],
                unitId: row['unitId'] as ProductMeasurementUnit,
                productId: row['productId']
            });
        });
        let input = new GetApplicablePaymentMethodsInput({
            contactId: this.contactId,
            subscriptionStartOn: this.getDate(this.startDate, true, ''),
            couponId: this.selectedCoupon ? this.selectedCoupon.id : null,
            discountTotal: this.discountTotal,
            shippingTotal: this.shippingTotal,
            taxTotal: this.taxTotal,
            lines: lines
        });
        this.paymentMethodsCheckTimeout = setTimeout(() => {
            this.invoiceProxy
                .getApplicablePaymentMethods(input)
                .subscribe(applicableMethods => {
                    this.paymentMethodsCheckLoading = false;
                    if (this.paymentMethodsCheckReload) {
                        setTimeout(() => this.initiatePaymentMethodsCheck(0));
                    }
                    else {
                        this.paymentMethods.forEach(v => v.disabled = (applicableMethods & v.value) != v.value);
                        this.changeDetectorRef.detectChanges();
                    }
                });
        }, timeout);
    }

    onStartDateOpened(event) {
        if (!this.startDate)
            this.startDate = this.hasSubscription ? this.tomorrowDate : undefined;
    }
}