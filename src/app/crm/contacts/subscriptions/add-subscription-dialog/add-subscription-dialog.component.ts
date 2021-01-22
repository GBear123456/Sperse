/** Core imports */
import {
    AfterViewInit,
    Component,
    ElementRef,
    Inject,
    OnInit,
    ViewChild
} from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import {
    InvoiceSettings,
    LayoutType,
    OrderSubscriptionServiceProxy,
    SubscriptionInput,
    UpdateOrderSubscriptionInput,
    ServiceProductServiceProxy,
    ServiceProductDto,
    ProductServiceProxy,
    ProductDto
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { DxValidationGroupComponent } from '@root/node_modules/devextreme-angular';
import { OrderDropdownComponent } from '@app/crm/shared/order-dropdown/order-dropdown.component';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { AddProductDialogComponent } from './add-product-dialog/add-product-dialog.component';
import { AddServiceProductDialogComponent } from './add-service-product-dialog/add-service-product-dialog.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    selector: 'add-subscription-dialog',
    templateUrl: './add-subscription-dialog.component.html',
    styleUrls: [
        '../../../../../shared/common/styles/close-button.less',
        '../../../../shared/common/styles/form.less',
        './add-subscription-dialog.component.less'
    ],
    providers: [ServiceProductServiceProxy, ProductServiceProxy]
})
export class AddSubscriptionDialogComponent implements AfterViewInit, OnInit {
    @ViewChild(DxValidationGroupComponent, { static: false }) validationGroup: DxValidationGroupComponent;
    @ViewChild(OrderDropdownComponent, { static: true }) orderDropdownComponent: OrderDropdownComponent;
    today = new Date();
    private slider: any;
    isBankCodeLayout: boolean = this.userManagementService.isLayout(LayoutType.BankCode);
    readonly addNewItemId = -1;
    products: ProductDto[];
    serviceTypes: ServiceProductDto[] = null;
    subscription: UpdateOrderSubscriptionInput = new UpdateOrderSubscriptionInput({
        contactId: this.data.contactId,
        leadId: this.data.leadId,
        orderNumber: this.data.orderNumber,
        subscriptions: [
            new SubscriptionInput({
                name: this.data.name,
                code: this.data.code,
                level: this.data.level,
                startDate: this.data.startDate,
                endDate: this.data.endDate,
                amount: this.data.amount
            })
        ],
        productId: undefined,
        paymentPeriodType: undefined,
        orderId: undefined,
        updateThirdParty: false
    });
    amountFormat$: Observable<string> = this.invoicesService.settings$.pipe(
        map((settings: InvoiceSettings) => getCurrencySymbol(settings.currency, 'narrow') + ' #,##0.##')
    );

    constructor(
        private elementRef: ElementRef,
        private orderSubscriptionProxy: OrderSubscriptionServiceProxy,
        private serviceProductProxy: ServiceProductServiceProxy,
        private productProxy: ProductServiceProxy,
        private notify: NotifyService,
        private contactsService: ContactsService,
        private userManagementService: UserManagementService,
        private invoicesService: InvoicesService,
        private permission: AppPermissionService,
        public dialogRef: MatDialogRef<AddSubscriptionDialogComponent>,
        public ls: AppLocalizationService,
        public dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '75px',
                right: '-100vw'
            });
        });
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '75px',
            right: '-100vw'
        });
        this.orderDropdownComponent.initOrderDataSource();

        this.productProxy.getProducts().subscribe((products: ProductDto[]) => {
            this.products = products;
            this.checkAddManageOption(this.products);
        });
        this.serviceProductProxy.getAll(false).subscribe(result => {
            this.serviceTypes = result;
            this.checkAddManageOption(this.serviceTypes);
        });
    }

    ngAfterViewInit() {
        this.slider.classList.remove('hide');
        this.dialogRef.updateSize(undefined, '100vh');
        this.dialogRef.updatePosition({
            top: '75px',
            right: '0px'
        });
    }

    checkAddManageOption(options) {
        if (this.permission.isGranted(AppPermissions.CRMOrdersManage)) {
            let addNewItemElement: any = {
                id: this.addNewItemId
            };
            addNewItemElement.code = addNewItemElement.name = '+ ' + this.ls.l('Add new');
            options.push(addNewItemElement);
        }
    }

    saveSubscription() {
        if (this.validationGroup.instance.validate().isValid) {
            const subscriptionInput = new UpdateOrderSubscriptionInput(this.subscription);
            subscriptionInput.updateThirdParty = false;
            subscriptionInput.subscriptions = subscriptionInput.subscriptions.map((subscription: SubscriptionInput) => {
                let sub = new SubscriptionInput(subscription);
                if (sub.startDate)
                    sub.startDate = DateHelper.removeTimezoneOffset(new Date(sub.startDate), true, 'from');
                if (sub.endDate)
                    sub.endDate = DateHelper.removeTimezoneOffset(new Date(sub.endDate), true, 'to');
                if (this.isBankCodeLayout && sub.code === BankCodeServiceType.BANKVault)
                    subscriptionInput.updateThirdParty = true;
                return sub;
            });
            this.orderSubscriptionProxy.update(subscriptionInput).subscribe(() => {
                this.notify.info(this.ls.l('SavedSuccessfully'));
                this.contactsService.invalidate('subscriptions');
                this.dialogRef.close();
            });
        }
    }

    close() {
        this.dialogRef.close();
    }

    addNewSubscriptionFields() {
        this.subscription.subscriptions.push(
            new SubscriptionInput()
        );
    }

    onProductChanged(event, sub: SubscriptionInput) {
        if (!event.value)
            return;

        let selectedItem: ProductDto = event.component.option('selectedItem');
        if (selectedItem.id == this.addNewItemId)
            this.showAddProductDialog(event.component, event.previousValue);
        else
            this.subscription.productId = selectedItem.id;
    }

    onServiceLevelChanged(event, sub: SubscriptionInput) {
        let selectedItem = event.component.option('selectedItem');
        if (selectedItem) {
            sub.level = selectedItem.code;
            sub.amount = selectedItem.monthlyFee ? selectedItem.monthlyFee :
                sub['serviceProduct'].monthlyFee ? sub['serviceProduct'].monthlyFee : null;

            sub.startDate = selectedItem.activationTime ? (selectedItem.activationTime < this.today ? this.today : selectedItem.activationTime) : sub['serviceProduct'].activationTime;
            sub['maxStartDate'] = selectedItem.deactivationTime ? selectedItem.deactivationTime : sub['serviceProduct'].deactivationTime;
        } else {
            this.setServiceProduct(sub['serviceProduct'], sub);
        }
    }

    setServiceProduct(item: ServiceProductDto, sub: SubscriptionInput) {
        sub['serviceProduct'] = item;
        sub.name = item.name;
        sub.amount = item.monthlyFee ? item.monthlyFee : null;
        sub.startDate = item.activationTime < this.today ? this.today : item.activationTime;
        sub.endDate = null;
        sub['maxStartDate'] = item.deactivationTime;

        sub.level = null;
        sub['levels'] = item.serviceProductLevels.length ? item.serviceProductLevels : null;
    }

    onStartDateChanged(subscription) {
        subscription.endDate = null;
    }

    showAddProductDialog(component, previousValue: string) {
        this.dialog.open(AddProductDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                title: this.ls.l('EditTemplate'),
                templateType: 'Contact',
                saveTitle: this.ls.l('Save')
            }
        }).afterClosed().subscribe((product: ProductDto) => {
            if (product)
                this.products.splice(this.products.length - 1, 0, product);
            component.option('value', product ? product.id : previousValue);
        });
    }

    removeSubscriptionFields(index) {
        this.subscription.subscriptions.splice(index, 1);
    }
}
