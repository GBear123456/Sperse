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
import { Observable, of, zip } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';

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
    ProductMeasurementUnit,
    SetProductImageInput,
    ProductUpgradeAssignmentInfo
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { DxValidationGroupComponent } from '@root/node_modules/devextreme-angular';
import { InvoicesService, } from '@app/crm/contacts/invoices/invoices.service';
import { AddMemberServiceDialogComponent } from '../add-member-service-dialog/add-member-service-dialog.component';
import { AppFeatures } from '@shared/AppFeatures';
import { FeatureCheckerService, SettingService } from 'abp-ng2-module';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { UploadPhotoData } from '@app/shared/common/upload-photo-dialog/upload-photo-data.interface';
import { UploadPhotoResult } from '@app/shared/common/upload-photo-dialog/upload-photo-result.interface';
import { StringHelper } from '@shared/helpers/StringHelper';

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
    @ViewChild(DxValidationGroupComponent) validationGroup: DxValidationGroupComponent;
    private slider: any;
    product: CreateProductInput | UpdateProductInput;
    amountFormat$: Observable<string> = this.invoicesService.settings$.pipe(filter(Boolean),
        map((settings: InvoiceSettings) => getCurrencySymbol(settings.currency, 'narrow') + ' #,##0.##')
    );
    amountNullableFormat$: Observable<string> = this.invoicesService.settings$.pipe(filter(Boolean),
        map((settings: InvoiceSettings) => getCurrencySymbol(settings.currency, 'narrow') + ' #,###.##')
    );    
    products$: Observable<ProductDto[]> = this.productProxy.getProducts(ProductType.Subscription).pipe(
        map((products: ProductDto[]) => {
            return this.data.product && this.data.product.id ? 
                products.filter((product: ProductDto) => product.id != this.data.product.id) : products
        })
    );
    readonly addNewItemId = -1;
    productTypes: string[] = Object.keys(ProductType);
    defaultProductType = ProductType.Subscription;
    productGroups: ProductGroupInfo[];
    services: MemberServiceDto[];
    productUnits = Object.keys(ProductMeasurementUnit).map(
        key => this.ls.l('ProductMeasurementUnit_' + key)
    );
    recurringPaymentFrequency = RecurringPaymentFrequency;
    frequencies = Object.keys(RecurringPaymentFrequency);
    gracePeriodDefaultValue: number;
    customGroup: string;
    isCommissionsEnabled = this.feature.isEnabled(AppFeatures.CRMCommissions);
    title: string;
    isReadOnly = true;
    image: string = null;
    imageChanged: boolean = false;
    isOneTime = false;   

    constructor(
        private elementRef: ElementRef,
        private productProxy: ProductServiceProxy,
        productGroupProxy: ProductGroupServiceProxy,
        private notify: NotifyService,
        private invoicesService: InvoicesService,
        private changeDetection: ChangeDetectorRef,
        memberServiceProxy: MemberServiceServiceProxy,
        public dialogRef: MatDialogRef<AddProductDialogComponent>,
        public ls: AppLocalizationService,
        public dialog: MatDialog,
        private setting: SettingService,
        private feature: FeatureCheckerService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.beforeClosed().subscribe(() => {
            this.dialogRef.updatePosition({
                top: this.data.fullHeigth ? '0px' : '75px',
                right: '-100vw'
            });
        });

        this.isReadOnly = !!data.isReadOnly;
        this.title = ls.l(this.isReadOnly ? 'Product' : data.product ? 'EditProduct' : 'AddProduct');
        if (data.product && data.product.id) {
            this.image = data.product.imageUrl;
            this.product = new UpdateProductInput(data.product);
            let options = data.product.productSubscriptionOptions;
            if (options && options[0])
                this.checkOneTimeOption({value: options[0].frequency});
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
        if (!this.isReadOnly) {
            let addNewItemElement: any = {
                id: this.addNewItemId
            };
            addNewItemElement.code = addNewItemElement.name = '+ ' + this.ls.l('Add new');
            options.push(addNewItemElement);
        }
    }

    ngAfterViewInit() {
        this.slider.classList.remove('hide');
        this.dialogRef.updateSize(undefined, this.data.fullHeigth ? '100vh' : 'calc(100vh - 75px)');
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

            if (this.product instanceof UpdateProductInput) {
                this.productProxy.updateProduct(this.product).pipe(
                    switchMap(() => this.getUpdateProductImageObservable((<any>this.product).id))
                ).subscribe(() => {
                    this.notify.info(this.ls.l('SavedSuccessfully'));
                    this.dialogRef.close();
                });
            }
            else {
                this.productProxy.createProduct(this.product).pipe(
                    switchMap((res) => zip(of(res), this.getUpdateProductImageObservable(res.productId)))
                ).subscribe(([res,]) => {
                    this.notify.info(this.ls.l('SavedSuccessfully'));
                    this.dialogRef.close(new ProductDto({
                        id: res.productId,
                        group: this.product.groupName,
                        name: this.product.name,
                        code: this.product.code,
                        paymentPeriodTypes: this.product.productSubscriptionOptions &&
                            this.product.productSubscriptionOptions.map(item => item.frequency)
                    }));
                });
            }
        }
    }

    getUpdateProductImageObservable(productId: number) {
        return this.imageChanged ? this.productProxy.setProductImage(new SetProductImageInput({
            image: this.image,
            productId: productId
        })) : of(null);
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

    addUpgradeToProduct() {
        if (!this.product.productUpgradeAssignments)
            this.product.productUpgradeAssignments = [];
        if (this.product.productUpgradeAssignments.some(item => !item.upgradeProductId))
            return ;
        this.product.productUpgradeAssignments.push(
            new ProductUpgradeAssignmentInfo()
        );
    }

    removePaymentPeriod(index) {
        this.product.productSubscriptionOptions.splice(index, 1);
        if (this.isOneTime && !this.product.productSubscriptionOptions.length) {
            this.isOneTime = false;
            this.detectChanges();
        }
    }

    removeUpgradeToProduct(index) {
        this.product.productUpgradeAssignments.splice(index, 1);
        this.detectChanges();
    }

    getServiceLevels(serviceId) {
        let service = (this.services || []).find(item => item.id == serviceId);
        return service ? service.memberServiceLevels : [];
    }

    getFrequencies(selected) {
        let options = this.product.productSubscriptionOptions,
            frequencies = options ? this.frequencies.filter(item => {
            return selected.frequency == item ||
                !options.some(option => option.frequency == item);
        }) : this.frequencies;

        if (options.length > 1)
            return frequencies.filter(item => item != RecurringPaymentFrequency.OneTime);

        return frequencies;
    }

    checkOneTimeOption(event) {
        this.isOneTime = event.value == RecurringPaymentFrequency.OneTime;
        let options = this.product.productSubscriptionOptions[0];

        if (this.isOneTime) {
            options.commissionableSignupFeeAmount = undefined;
            options.trialDayCount = undefined;
            options.signupFee = undefined;
        } else
            options.activeDayCount = undefined;
        
        this.detectChanges();
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

    showEditMemberServiceDialog(service: ProductServiceInfo, component: any) {
        let memberService = this.services.find(item => item.id == service.memberServiceId);
        if (memberService)
            this.dialog.open(AddMemberServiceDialogComponent, {
                panelClass: 'slider',
                disableClose: true,
                closeOnNavigation: false,
                data: {
                    service: memberService,
                    isReadOnly: this.isReadOnly
                }
            }).afterClosed().subscribe((service: MemberServiceDto) => {
                if (service) {
                    component.instance.repaint();
                    this.detectChanges();
                }
            });
    }

    showAddMemberServiceDialog(component, previousValue: string) {
        this.dialog.open(AddMemberServiceDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                isReadOnly: this.isReadOnly
            }
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

    validatePeriodDayCount(option) {
        return (event) => {
            return !this.isOneTime || event.value && event.value > 0;
        };
    }

    validateFee(option) {
        return (event) => {
            return option.frequency == RecurringPaymentFrequency.OneTime
                || option.frequency == RecurringPaymentFrequency.LifeTime
                || event.value && event.value > 0;
        };
    }

    getProductImage(showDefault: boolean) {
        if (this.image) {
            if (this.imageChanged)
                return 'data:image/jpeg;base64,' + this.image;
            else
                return this.image;
        }
        return showDefault ?  './assets/common/images/product.png' : null;
    }

    openImageSelector() {
        if (this.isReadOnly)
            return;

        const uploadPhotoData: UploadPhotoData = {
            source: this.getProductImage(false),
            maxSizeBytes: 1048576,
            title: this.ls.l('AddProductImage')
        };
        this.dialog.open(UploadPhotoDialogComponent, {
            data: uploadPhotoData,
            hasBackdrop: true
        }).afterClosed().subscribe((result: UploadPhotoResult) => {
            if (result) {
                this.imageChanged = true;
                this.image = result.origImage ? StringHelper.getBase64(result.origImage) : null;
                this.detectChanges();
            }
        });
    }

    checkShowAmountChangeWarrning() {
        let product = this.data.product,
            message = '';
        if (product && product.hasExternalReference)
            message = this.ls.l('ExternalRefferenceWarning') + '\n';

        if (product && product.hasIncompletedInvoices)
            message += '\n' + this.ls.l('IncompletedInvoicesWarning');

        if (message)
            abp.message.warn(message, this.ls.l('Important'));
    }

    detectChanges() {
        this.changeDetection.markForCheck();
    }
}