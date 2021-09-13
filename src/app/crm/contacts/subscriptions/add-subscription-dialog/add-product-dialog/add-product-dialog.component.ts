/** Core imports */
import {
    AfterViewInit,
    Component,
    ElementRef,
    Inject,
    OnInit,
    ViewChild,
    ChangeDetectionStrategy,
    ChangeDetectorRef
} from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

/** Application imports */
import {
    InvoiceSettings,
    ProductServiceProxy,
    ProductGroupServiceProxy,
    MemberServiceServiceProxy,
    MemberServiceDto,
    ProductServiceInfo,
    CreateProductInput,
    ProductGroupInfo,
    ProductDto,
    ProductType,
    UpdateProductInput,
    RecurringPaymentFrequency,
    ProductSubscriptionOptionInfo,
    ProductMeasurementUnit
} from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { DxValidationGroupComponent } from '@root/node_modules/devextreme-angular';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AddMemberServiceDialogComponent } from '../add-member-service-dialog/add-member-service-dialog.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { SettingService } from 'abp-ng2-module/dist/src/settings/setting.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';

@Component({
    selector: 'add-product-dialog',
    templateUrl: './add-product-dialog.component.html',
    styleUrls: [
        '../../../../../../shared/common/styles/close-button.less',
        '../../../../../shared/common/styles/form.less',
        './add-product-dialog.component.less'
    ],
    providers: [ProductServiceProxy, ProductGroupServiceProxy, MemberServiceServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddProductDialogComponent implements AfterViewInit, OnInit {
    @ViewChild(DxValidationGroupComponent, { static: false }) validationGroup: DxValidationGroupComponent;
    private slider: any;
    product: CreateProductInput | UpdateProductInput;
    amountFormat$: Observable<string> = this.invoicesService.settings$.pipe(filter(Boolean),
        map((settings: InvoiceSettings) => getCurrencySymbol(settings.currency, 'narrow') + ' #,##0.##')
    );
    amountNullableFormat$: Observable<string> = this.invoicesService.settings$.pipe(filter(Boolean),
        map((settings: InvoiceSettings) => getCurrencySymbol(settings.currency, 'narrow') + ' #,###.##')
    );

    readonly addNewItemId = -1;
    productTypes: string[] = Object.keys(ProductType);
    defaultProductType = ProductType.Subscription;
    productGroups: ProductGroupInfo[];
    services: MemberServiceDto[];
    productUnits = Object.keys(ProductMeasurementUnit).map(
        key => this.ls.l('ProductMeasurementUnit_' + key)
    );
    frequencies = Object.keys(RecurringPaymentFrequency);
    gracePeriodDefaultValue: number;
    customGroup: string;
    isCommissionsEnabled = this.feature.isEnabled(AppFeatures.CRMCommissions);          //&& this.permission.isGranted(AppPermissions.CRMAffiliatesCommissions);

    constructor(
        private elementRef: ElementRef,
        private productProxy: ProductServiceProxy,
        private productGroupProxy: ProductGroupServiceProxy,
        private notify: NotifyService,
        private permission: AppPermissionService,
        private invoicesService: InvoicesService,
        private changeDetection: ChangeDetectorRef,
        private memberServiceProxy: MemberServiceServiceProxy,
        private userManagementService: UserManagementService,
        public dialogRef: MatDialogRef<AddProductDialogComponent>,
        public ls: AppLocalizationService,
        public dialog: MatDialog,
        private setting: SettingService,
        private feature: FeatureCheckerService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: this.data.fullHeigth ? '0px' : '75px',
                right: '-100vw'
            });
        });

        if (data.product && data.product.id) {
            this.product = new UpdateProductInput(data.product);
        } else {
            this.product = new CreateProductInput(data.product);
            if (!this.product.type) {
                this.product.type = this.defaultProductType;
            }
        }
        productGroupProxy.getProductGroups().subscribe((groups: ProductGroupInfo[]) => {
            this.productGroups = groups;
            this.detectChanges();
        });

        memberServiceProxy.getAll(false).subscribe((services: MemberServiceDto[]) => {
            this.services = services;
            this.checkAddManageOption(this.services);
            this.detectChanges();
        });

        this.gracePeriodDefaultValue = this.setting.getInt('App.OrderSubscription.DefaultSubscriptionGracePeriodDayCount');
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: this.data.fullHeigth ? '0px' : '75px',
            right: '-100vw'
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

    ngAfterViewInit() {
        this.slider.classList.remove('hide');
        this.dialogRef.updateSize(undefined, '100vh');
            this.dialogRef.updatePosition({
                top: this.data.fullHeigth ? '0px' : '75px',
                right: '0px'
            });
    }

    saveProduct() {
        if (this.product.type == this.defaultProductType) {
            let services = this.product.productServices,
                options = this.product.productSubscriptionOptions;
            if (!services || !services.length)
                return this.notify.error(this.ls.l('SubscriptionServicesAreRequired'));
            if (!options || !options.length)
                return this.notify.error(this.ls.l('SubscriptionPaymentOptionsAreRequired'));
            this.product.unit = undefined;
            this.product.price = undefined;
        } else {
            this.product.productServices = undefined;
            this.product.productSubscriptionOptions = undefined;
        }

        if (this.validationGroup.instance.validate().isValid) {
            if (!this.product.groupId)
                this.product.groupName = this.customGroup;

            if (this.product.productSubscriptionOptions)
                this.product.productSubscriptionOptions.forEach(item => {
                    if (item.trialDayCount == null || isNaN(item.trialDayCount))
                        item.trialDayCount = 0;
                });

            if (this.product instanceof UpdateProductInput)
                this.productProxy.updateProduct(this.product).subscribe(() => {
                    this.notify.info(this.ls.l('SavedSuccessfully'));
                    this.dialogRef.close();
                });
            else
                this.productProxy.createProduct(this.product).subscribe(res => {
                    this.notify.info(this.ls.l('SavedSuccessfully'));
                    this.dialogRef.close(new ProductDto({
                        id: res.productId,
                        name: this.product.name,
                        code: this.product.code,
                        paymentPeriodTypes: this.product.productSubscriptionOptions &&
                            this.product.productSubscriptionOptions.map(item => item.frequency)
                    }));
                });
        }
    }

    close() {
        this.dialogRef.close();
    }

    addNewServiceFields() {
        if (!this.product.productServices)
            this.product.productServices = [];
        this.product.productServices.push(
            new ProductServiceInfo()
        );
    }

    removeServiceFields(index) {
        let service = this.product.productServices[index];
        this.services.some(item => {
            if (service.memberServiceId == item.id) {
                item['disabled'] = false;
                return true;
            }
        });
        this.product.productServices.splice(index, 1);
        this.detectChanges();
    }

    addNewPaymentPeriod() {
        if (!this.product.productSubscriptionOptions)
            this.product.productSubscriptionOptions = [];
        if (this.product.productSubscriptionOptions.some(item => !item.frequency))
            return ;
        this.product.productSubscriptionOptions.push(
            new ProductSubscriptionOptionInfo()
        );
    }

    removePaymentPeriod(index) {
        this.product.productSubscriptionOptions.splice(index, 1);
    }

    getServiceLevels(serviceId) {
        let service = (this.services || []).find(item => item.id == serviceId);
        return service ? service.memberServiceLevels : [];
    }

    getFrequencies(selected) {
        let options = this.product.productSubscriptionOptions;
        return options ? this.frequencies.filter(item => {
            return selected.frequency == item ||
                !options.some(option => option.frequency == item);
        }) : this.frequencies;
    }

    onServiceChanged(event, service) {
        if (!event.value)
            return;
        let selectedItem = event.component.option('selectedItem');
        if (selectedItem) {
            service.memberServiceLevelId = undefined;
            if (selectedItem.id == this.addNewItemId)
                return this.showAddMemberServiceDialog(event.component, event.previousValue);

            selectedItem['disabled'] = true;
            if (event.previousValue)
                this.services.some(item => {
                    if (event.previousValue == item.id) {
                        item['disabled'] = false;
                        return true;
                    }
                });
        }
        this.detectChanges();
    }

    showAddMemberServiceDialog(service: ProductServiceInfo, component: any) {
        let memberService = this.services.find(item => item.id == service.memberServiceId);
        if (memberService)
            this.dialog.open(AddMemberServiceDialogComponent, {
                panelClass: 'slider',
                disableClose: true,
                closeOnNavigation: false,
                data: {
                    service: memberService
                }
            }).afterClosed().subscribe((service: MemberServiceDto) => {
                if (service) {
                    component.instance.repaint();
                    this.detectChanges();
                }
            });
    }

    showAddServiceProductDialog(component, previousValue: string) {
        this.dialog.open(AddMemberServiceDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false
        }).afterClosed().subscribe((service: MemberServiceDto) => {
            if (service) {
                this.services.splice(this.services.length - 1, 0, service);
                setTimeout(() => component.option('value', service.id));
                this.detectChanges();
            } else
                component.option('value', previousValue);
        });
    }

    onCustomGroupCreating(event) {
        if (!event.customItem)
            event.customItem = {
                id: null,
                name: this.customGroup = event.text
            };
    }

    validateTrialDayCount(option) {
        return (event) => {
            return !option.signupFee || event.value && event.value > 0;
        };
    }

    validateFee(option) {
        return (event) => {
            return option.frequency == RecurringPaymentFrequency.LifeTime
                || event.value && event.value > 0;
        };
    }

    detectChanges() {
        this.changeDetection.markForCheck();
    }
}