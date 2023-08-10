/** Core imports */
import {
    AfterViewInit,
    Component,
    ElementRef,
    Inject,
    OnInit,
    ViewChild,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    PipeTransform,
    Pipe
} from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { CacheService } from 'ng2-cache-service';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { DxValidatorComponent, DxTextAreaComponent, DxValidationGroupComponent } from 'devextreme-angular';
import { Observable, of, zip } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

/** Application imports */
import {
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
    ProductUpgradeAssignmentInfo,
    CustomPeriodType
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { AddMemberServiceDialogComponent } from '../add-member-service-dialog/add-member-service-dialog.component';
import { AppFeatures } from '@shared/AppFeatures';
import { FeatureCheckerService, SettingService } from 'abp-ng2-module';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { UploadPhotoData } from '@app/shared/common/upload-photo-dialog/upload-photo-data.interface';
import { UploadPhotoResult } from '@app/shared/common/upload-photo-dialog/upload-photo-result.interface';
import { StringHelper } from '@shared/helpers/StringHelper';
import { SettingsHelper } from '@shared/common/settings/settings.helper';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { ContextMenuItem } from '@shared/common/dialogs/modal/context-menu-item.interface';
import { AppConsts } from '@shared/AppConsts';

@Pipe({ name: 'FilterAssignments' })
export class FilterAssignmentsPipe implements PipeTransform {
    transform(products: ProductDto[], excludeIds: number[]) {
        return products && products.filter(product => excludeIds.indexOf(product.id) == -1);
    }
}

@Component({
    selector: 'create-product-dialog',
    templateUrl: './create-product-dialog.component.html',
    styleUrls: [
        '../../../../../../shared/common/styles/close-button.less',
        '../../../../../shared/common/styles/form.less',
        './create-product-dialog.component.less'
    ],
    providers: [CacheHelper, ProductServiceProxy, ProductGroupServiceProxy, MemberServiceServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateProductDialogComponent implements AfterViewInit, OnInit {
    @ViewChild(DxValidationGroupComponent) validationGroup: DxValidationGroupComponent;
    @ViewChild(DxTextAreaComponent) descriptionHtmlComponent: DxTextAreaComponent;
    @ViewChild('customPeriodValidator') customPeriodValidator: DxValidatorComponent;

    private slider: any;

    isFreePriceType = false;
    baseUrl = AppConsts.remoteServiceBaseUrl;

    publicNameValidationRules = [
        { type: 'pattern', pattern: AppConsts.regexPatterns.sitePath, message: this.ls.l('UrlIsNotValid') }
    ];

    uploadFileUrl: string;
    tenantId = abp.session.tenantId || 0;
    defaultProductUri = '';

    trialEnabled: boolean = false;
    gracePeriodEnabled: boolean = false;
    enableCommissions: boolean = true;
    isReadOnly = !!this.data.isReadOnly;
    saveButtonId = 'saveProductOptions';
    selectedOption: ContextMenuItem;
    buttons: IDialogButton[] = [
        {
            id: this.saveButtonId,
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.saveProduct.bind(this),
            disabled: this.isReadOnly,
            contextMenu: {
                items: [
                    {
                        text: this.ls.l('Save'),
                        selected: true,
                        disabled: this.isReadOnly,
                        data: {
                            close: false
                        }
                    },
                    {
                        text: this.ls.l('SaveAndClose'),
                        selected: false,
                        disabled: this.isReadOnly,
                        data: {
                            close: true
                        }
                    }
                ],
                defaultIndex: 0,
                selectedIndex: undefined,
                cacheKey: this.cacheHelper.getCacheKey('save_option_active_index', 'CreateProductDialog')
            }
        }
    ];

    isHostTenant = !abp.session.tenantId;
    product: CreateProductInput | UpdateProductInput;
    amountFormat: string = getCurrencySymbol(SettingsHelper.getCurrency(), 'narrow') + ' #,##0.##';
    amountNullableFormat: string = getCurrencySymbol(SettingsHelper.getCurrency(), 'narrow') + ' #,###.##';
    products$: Observable<ProductDto[]> = this.productProxy.getProducts(ProductType.Subscription).pipe(
        map((products: ProductDto[]) => {
            return this.data.product && this.data.product.id ?
                products.filter((product: ProductDto) => product.id != this.data.product.id) : products
        })
    );
    readonly addNewItemId = -1;
    isSubscriptionManagementEnabled = this.feature.isEnabled(AppFeatures.CRMSubscriptionManagementSystem);
    productTypes: string[] = Object.keys(ProductType).filter(item => item == 'Subscription' ? this.isSubscriptionManagementEnabled : true);
    defaultProductType = this.isSubscriptionManagementEnabled ? ProductType.Subscription : ProductType.General;
    productType = ProductType;
    productGroups: ProductGroupInfo[];
    services: MemberServiceDto[];
    productUnits = Object.keys(ProductMeasurementUnit).map(
        key => this.ls.l('ProductMeasurementUnit_' + key)
    );
    recurringPaymentFrequency = RecurringPaymentFrequency;
    frequencies = Object.keys(RecurringPaymentFrequency);
    customPeriodTypes = Object.keys(CustomPeriodType);
    gracePeriodDefaultValue: number;
    customGroup: string;
    isCommissionsEnabled = this.feature.isEnabled(AppFeatures.CRMCommissions);
    title: string;
    image: string = null;
    imageChanged: boolean = false;
    isOneTime = false;

    constructor(
        private elementRef: ElementRef,
        private productProxy: ProductServiceProxy,
        productGroupProxy: ProductGroupServiceProxy,
        private notify: NotifyService,
        private changeDetection: ChangeDetectorRef,
        memberServiceProxy: MemberServiceServiceProxy,
        public dialogRef: MatDialogRef<CreateProductDialogComponent>,
        public ls: AppLocalizationService,
        public dialog: MatDialog,
        private setting: SettingService,
        private feature: FeatureCheckerService,
        private cacheHelper: CacheHelper,
        private cacheService: CacheService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.addPanelClass('new-product');
        this.title = ls.l(this.isReadOnly ? 'Product' : data.product ? 'EditProduct' : 'AddProduct');
        if (data.product && data.product.id) {
            this.image = data.product.imageUrl;
            this.product = new UpdateProductInput(data.product);
            let options = data.product.productSubscriptionOptions;
            this.defaultProductUri = this.product.publicName;
            if (options && options[0]) {
                this.isFreePriceType = !options[0].fee;
                this.onFrequencyChanged({ value: options[0].frequency }, options[0]);
            } else 
                this.isFreePriceType = !data.product.price;
            if (!this.product.productUpgradeAssignments || !this.product.productUpgradeAssignments.length)
                this.addUpgradeToProduct();
        } else {
            this.product = new CreateProductInput(data.product);
            if (!this.product.type) {
                this.product.type = this.defaultProductType;
                this.product.publicName = this.defaultProductUri;
                this.addUpgradeToProduct();
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
        if (!this.data.product || !this.data.product.id)
            this.addNewPaymentPeriod();

        let contextMenu = this.buttons[0].contextMenu;
        if (this.cacheService.exists(contextMenu.cacheKey))
            this.selectedOption = contextMenu.items[this.cacheService.get(contextMenu.cacheKey)];
        else
            this.selectedOption = contextMenu.items[contextMenu.defaultIndex];
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
        setTimeout(() => this.descriptionHtmlComponent.instance.repaint());
    }

    saveProduct() {
        if (this.product.type == ProductType.Subscription) {
            let options = this.product.productSubscriptionOptions;
            if (!options || !options.length)
                return this.notify.error(this.ls.l('SubscriptionPaymentOptionsAreRequired'));
            this.product.unit = undefined;
            this.product.price = undefined;
        } else {
            this.product.productServices = undefined;
            this.product.productSubscriptionOptions = undefined;
            this.product.productUpgradeAssignments = undefined;
            this.product.downgradeProductId = undefined;
        }

        if (this.isFreePriceType) {
            this.product.price = 0;            
        }

        if (this.validationGroup.instance.validate().isValid) {
            if (!this.product.groupId)
                this.product.groupName = this.customGroup;

            if (this.product.productSubscriptionOptions)
                this.product.productSubscriptionOptions.forEach(item => {
                    if (item.trialDayCount == null || isNaN(item.trialDayCount))
                        item.trialDayCount = 0;
                });

            let upgradeProducts = this.product.productUpgradeAssignments;
            if (upgradeProducts && upgradeProducts.length == 1 && !upgradeProducts[0].upgradeProductId)
                this.product.productUpgradeAssignments = undefined;

            if (this.product instanceof UpdateProductInput) {
                this.productProxy.updateProduct(this.product).pipe(
                    switchMap(() => this.getUpdateProductImageObservable((<any>this.product).id))
                ).subscribe(() => {
                    this.notify.info(this.ls.l('SavedSuccessfully'));
                    if (this.selectedOption.data.close)
                        this.dialogRef.close();
                });
            }
            else {
                this.productProxy.createProduct(this.product).pipe(
                    switchMap((res) => zip(of(res), this.getUpdateProductImageObservable(res.productId)))
                ).subscribe(([res,]) => {
                    this.notify.info(this.ls.l('SavedSuccessfully'));
                    this.product = new UpdateProductInput({id: res.productId, ...this.product});
                    if (this.selectedOption.data.close)
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
            return;
        this.product.productSubscriptionOptions.push(
            new ProductSubscriptionOptionInfo()
        );
    }

    addUpgradeToProduct() {
        if (!this.product.productUpgradeAssignments)
            this.product.productUpgradeAssignments = [];
        if (this.product.productUpgradeAssignments.some(item => !item.upgradeProductId))
            return;
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

    removeUpgradeToProduct(index, option) {
        if (index)
            this.product.productUpgradeAssignments.splice(index, 1);
        else
            option.upgradeProductId = undefined;
        this.detectChanges();
    }

    getServiceLevels(serviceId) {
        let service = (this.services || []).find(item => item.id == serviceId);
        return service ? service.memberServiceLevels : [];
    }

    getFrequencies(selected, index) {
        let options = this.product.productSubscriptionOptions,
            frequencies = options ? this.frequencies.filter(item => {
                return selected.frequency == item ||
                    !options.some(option => option.frequency == item);
            }) : this.frequencies;

        if (!index && this.isFreePriceType)
            return frequencies.filter(item => 
                [RecurringPaymentFrequency.LifeTime, RecurringPaymentFrequency.OneTime].includes(RecurringPaymentFrequency[item]));

        if (options.length > 1)
            return frequencies.filter(item => item != RecurringPaymentFrequency.OneTime);

        return frequencies;
    }

    onFrequencyChanged(event, option: ProductSubscriptionOptionInfo) {
        this.isOneTime = event.value == RecurringPaymentFrequency.OneTime;

        if (this.isOneTime) {
            option.commissionableSignupFeeAmount = undefined;
            option.trialDayCount = undefined;
            option.signupFee = undefined;
            option.customPeriodType = CustomPeriodType.Days;
        } else if (event.value != RecurringPaymentFrequency.Custom) {
            option.customPeriodCount = undefined;
            option.customPeriodType = undefined;

            if (this.customPeriodValidator)
                this.customPeriodValidator.instance.reset();
        }

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
            if (option.frequency && !this.isOneTime)
                return !option.signupFee || event.value && event.value > 0;
            return true;
        };
    }

    validatePeriodDayCount(option: ProductSubscriptionOptionInfo) {
        return (event) => {
            if (this.isOneTime || (option.frequency && option.frequency == RecurringPaymentFrequency.Custom))
                return event.value && event.value > 0;
            return true;
        };
    }

    validateCustomPeriodDayCount(option: ProductSubscriptionOptionInfo) {
        return (event) => {
            if (this.isOneTime || (option.frequency && option.frequency == RecurringPaymentFrequency.Custom)) {
                let isPeriodValid = true;
                if (option.frequency == RecurringPaymentFrequency.Custom && option.customPeriodType) {
                    switch (option.customPeriodType) {
                        case CustomPeriodType.Days:
                            isPeriodValid = event.value <= 365;
                            break;
                        case CustomPeriodType.Weeks:
                            isPeriodValid = event.value <= 52;
                            break;
                        case CustomPeriodType.Months:
                            isPeriodValid = event.value <= 12;
                            break;
                    }
                }

                return isPeriodValid;
            }
            return true;
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
        return showDefault ? './assets/common/images/product.png' : null;
    }

    openImageSelector(source?: string) {
        if (this.isReadOnly)
            return;

        let imageSource = source || this.getProductImage(false);
        const uploadPhotoData: UploadPhotoData = {
            fileUrl: imageSource ? undefined : this.uploadFileUrl,
            source: imageSource,
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

    getAssignementIds(option): number[] {
        if (this.product && this.product.productUpgradeAssignments)
            return this.product.productUpgradeAssignments.map(
                item => option.upgradeProductId == item.upgradeProductId ? undefined : item.upgradeProductId
            ).filter(Boolean);
        else
            return [];
    }

    detectChanges() {
        this.changeDetection.markForCheck();
    }

    getProductUnits() {
        if (this.product.type == ProductType.General)
            return this.productUnits.filter(unit => unit != this.ls.l('ProductMeasurementUnit_OneTime'));
        else
            return this.productUnits;
    }

    onSaveOptionSelectionChanged() {
        this.selectedOption = this.buttons[0].contextMenu.items.find((item: ContextMenuItem) => item.selected);
        this.saveProduct();
    }

    updateProductUrl(value) {
        this.defaultProductUri = this.product.publicName = value;
    }

    disabledValidationCallback() {
        return true;
    }

    onProductCodeChanged(event) {
        if (!this.defaultProductUri && (!this.data.product || !this.data.product.id))
            this.product.publicName = event.value.replace(/[^a-zA-Z0-9-._~]+/, '');
    }

    fileSelected($event) {
        if ($event.target.files.length)
            this.fileDropped($event.target.files);
    }

    fileDropped(event) {
        const file = event[0];
        if (file.fileEntry)
            file.fileEntry['file'](this.loadFileContent.bind(this));
        else
            this.loadFileContent(file);
    }

    loadFileContent(file) {
        let reader: FileReader = new FileReader();
        let image = new Image();
        reader.onload = (loadEvent: any) => {
            this.openImageSelector(loadEvent.target.result);
        };
        reader.readAsDataURL(file);
    }

    addExternalLogo() {
        if (this.uploadFileUrl)
            this.openImageSelector();
    }

    togglePriceType() {
        if (this.isFreePriceType = !this.isFreePriceType) {
            this.product.price = 0;
            let options = this.product.productSubscriptionOptions;
            if (options && options[0]) {
                options[0].fee = undefined;
                options[0].commissionableFeeAmount = undefined;
                options[0].trialDayCount = undefined;
                options[0].signupFee = undefined;
                options[0].commissionableSignupFeeAmount = undefined;
            }
        }
    }

    getSliderValue() {
        return Number(!this.isFreePriceType) * 50;
    }
}