/** Core imports */
import {
    AfterViewInit,
    Component,
    ElementRef,
    Inject,
    OnInit,
    ViewChild,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    PipeTransform,
    Pipe
} from '@angular/core';
import { getCurrencySymbol } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

/** Third party imports */
import { NgxFileDropEntry } from 'ngx-file-drop';
import { CacheService } from 'ng2-cache-service';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { DxValidatorComponent, DxTextAreaComponent, DxValidationGroupComponent } from 'devextreme-angular';
import { Observable, of, zip } from 'rxjs';
import * as moment from 'moment';
import { map, switchMap, finalize, first, filter } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { findIana } from 'windows-iana';

/** Application imports */
import {
    ProductServiceProxy,
    ProductResourceServiceProxy,
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
    DocumentTemplatesServiceProxy,
    CustomPeriodType,
    ProductResourceDto,
    ProductEventDto,
    AddressInfoDto,
    ProductEventLocation,
    LanguageDto,
    TimingServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { FeatureCheckerService, SettingService } from 'abp-ng2-module';
import { AddMemberServiceDialogComponent } from '../add-member-service-dialog/add-member-service-dialog.component';
import { AppFeatures } from '@shared/AppFeatures';
import { AppTimezoneScope } from '@shared/AppEnums';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { UploadPhotoData } from '@app/shared/common/upload-photo-dialog/upload-photo-data.interface';
import { UploadPhotoResult } from '@app/shared/common/upload-photo-dialog/upload-photo-result.interface';
import { StringHelper } from '@shared/helpers/StringHelper';
import { SettingsHelper } from '@shared/common/settings/settings.helper';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { ContextMenuItem } from '@shared/common/dialogs/modal/context-menu-item.interface';
import { DateHelper } from '@shared/helpers/DateHelper';
import { ContactsService } from '../../../contacts.service';
import { AppConsts } from '@shared/AppConsts';
import { LanguagesStoreSelectors, RootStore, LanguagesStoreActions } from '@root/store';
import { EditAddressDialog } from '../../../edit-address-dialog/edit-address-dialog.component';

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
    providers: [
        CacheHelper,
        ProductServiceProxy,
        ProductGroupServiceProxy,
        MemberServiceServiceProxy,
        DocumentTemplatesServiceProxy,
        ProductResourceServiceProxy
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateProductDialogComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild(DxValidationGroupComponent) validationGroup: DxValidationGroupComponent;
    @ViewChild(DxTextAreaComponent) descriptionHtmlComponent: DxTextAreaComponent;
    @ViewChild('customPeriodValidator') customPeriodValidator: DxValidatorComponent;

    isFreePriceType = false;
    baseUrl = AppConsts.remoteServiceBaseUrl;

    publishDate: Date;
    maxFilesCount = 25;
    productTemplates: ProductResourceDto[] = [];
    productFiles: ProductResourceDto[] = [];
    productLinks: ProductResourceDto[] = [];
    resourceLinkUrl: string;
    resourceLinkName: string;

    nameRegexPattern = AppConsts.regexPatterns.linkName;
    urlRegexPattern = AppConsts.regexPatterns.url;
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
    products$: Observable<ProductDto[]> = this.productProxy.getProducts(ProductType.Subscription, false).pipe(
        map((products: ProductDto[]) => {
            return this.data.product && this.data.product.id ?
                products.filter((product: ProductDto) => product.id != this.data.product.id) : products
        })
    );
    readonly addNewItemId = -1;
    isPublicProductsEnabled = this.feature.isEnabled(AppFeatures.CRMPublicProducts);
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

    eventLocation = ProductEventLocation;
    eventDurations: any[] = [];
    languages: LanguageDto[] = [];
    timezones: any[] = [];
    eventAddress: string;
    eventDate: Date;
    eventTime: Date;

    constructor(
        private elementRef: ElementRef,
        private store$: Store<RootStore.State>,
        private timingService: TimingServiceProxy,
        private productProxy: ProductServiceProxy,
        productGroupProxy: ProductGroupServiceProxy,
        private notify: NotifyService,
        private changeDetection: ChangeDetectorRef,
        memberServiceProxy: MemberServiceServiceProxy,
        public contactsService: ContactsService,
        private domSanitizer: DomSanitizer,
        public dialogRef: MatDialogRef<CreateProductDialogComponent>,
        private productResourceProxy: ProductResourceServiceProxy,
        private documentProxy: DocumentTemplatesServiceProxy,
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
            if (this.product.publishDate)
                this.publishDate = DateHelper.addTimezoneOffset(new Date(this.product.publishDate), true);
            this.initProductResources();
            this.initProductEvent();
        } else {
            this.product = new CreateProductInput(data.product);
            if (!this.product.type) {
                this.product.type = this.defaultProductType;
                if (this.isPublicProductsEnabled)
                    this.product.publicName = this.defaultProductUri;
                this.addUpgradeToProduct();
            }
            this.initEventProps();
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
        this.initEventDataSources();
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

    initProductResources() {
        let resources = this.product.productResources;
        if (resources && resources.length) {
            this.productFiles = [];
            this.productLinks = [];
            this.productTemplates = [];
            resources.forEach(resource => {
                if (resource.fileId)
                    this.productFiles.push(resource);
                else
                    this.productLinks.push(resource);
            });
        }
    }

    initProductEvent() {
        if (!this.product.productEvent)
            return;

        this.setEventAddressString();

        if (this.product.productEvent.time) {
            let baseDateMomentUtc = this.product.productEvent.date ? moment(new Date(this.product.productEvent.date)).utc() : moment().utc();
            let timeArr = this.product.productEvent.time.split(':');
            baseDateMomentUtc.set({ hour: timeArr[0], minute: timeArr[1] });
            let baseDate = DateHelper.addTimezoneOffset(baseDateMomentUtc.toDate(), false, findIana(this.product.productEvent.timezone)[0]);
            this.eventDate = this.product.productEvent.date ? DateHelper.removeTimezoneOffset(new Date(baseDate)) : undefined;
            this.eventTime = baseDate;
        } else {
            this.eventDate = this.product.productEvent.date ? new Date(this.product.productEvent.date) : undefined;
            this.eventTime = undefined;
        }
    }

    initEventProps() {
        if (this.product.productEvent)
            return;

        this.product.productEvent = new ProductEventDto();
        this.product.productEvent.location = ProductEventLocation.Online;
        this.product.productEvent.timezone = this.setting.get('Abp.Timing.TimeZone');
        this.product.productEvent.languageId = 'en';
        this.product.productEvent.address = new AddressInfoDto();
    }

    initEventDataSources() {
        this.initEventDurations();
        this.initLanguages();
        this.initTimezones();
    }

    initEventDurations() {
        let durations = [];
        for (var i = 15; i <= 1440; i += 5) {
            let hour = Math.floor(i / 60);
            let min = i % 60;
            let displayValue = hour ? `${hour}H ` : '';
            displayValue += min ? `${min}Min` : '';
            durations.push({
                hour: hour,
                minutes: min,
                displayValue: displayValue,
                totalMinutes: i
            });
        }
        this.eventDurations = durations;
        this.changeDetection.markForCheck();
    }

    initLanguages() {
        this.store$.dispatch(new LanguagesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(LanguagesStoreSelectors.getLanguages),
            filter(x => !!x),
            first()
        ).subscribe(languages => {
            this.languages = languages;
            this.changeDetection.markForCheck();
        });
    }

    initTimezones() {
        this.timingService.getTimezones(AppTimezoneScope.Application).subscribe(res => {
            res.items.splice(0, 1);
            this.timezones = res.items;
            this.changeDetection.markForCheck();
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

            if (this.isFreePriceType) {
                this.product.price = 0;
                this.detectChanges();
            }
        }

        this.resourceLinkUrl = '';
        setTimeout(() => {
            if (this.validationGroup.instance.validate().isValid) {
                if (!this.product.groupId)
                    this.product.groupName = this.customGroup;

                if (this.product.productSubscriptionOptions)
                    this.product.productSubscriptionOptions.forEach(item => {
                        if (item.trialDayCount == null || isNaN(item.trialDayCount))
                            item.trialDayCount = 0;
                    });

                this.product.publishDate = this.publishDate ? DateHelper.removeTimezoneOffset(new Date(this.publishDate), true, '') : undefined;

                let upgradeProducts = this.product.productUpgradeAssignments;
                if (upgradeProducts && upgradeProducts.length == 1 && !upgradeProducts[0].upgradeProductId)
                    this.product.productUpgradeAssignments = undefined;

                if (this.productTemplates.length || this.productFiles.length || this.productLinks.length)
                    this.product.productResources = this.productTemplates.concat(this.productFiles, this.productLinks).map((item: any) => {
                        if (item.fileId)
                            item.url = undefined;
                        return new ProductResourceDto(item);
                    });

                if (this.product.type == ProductType.Digital && (!this.product.productResources || !this.product.productResources.length))
                    return this.notify.error(this.ls.l('DigitalProductError'));

                if (this.product.type != ProductType.Event)
                    this.product.productEvent = undefined;
                if (this.product.type == ProductType.Event) {
                    if (this.eventTime) {
                        let ianaTimezone = findIana(this.product.productEvent.timezone)[0];
                        if (this.eventDate) {
                            let date = new Date(this.eventDate);
                            date.setHours(this.eventTime.getHours(), this.eventTime.getMinutes(), 0, 0);
                            DateHelper.removeTimezoneOffset(date, false, '', ianaTimezone);
                            let utc = moment(date).utc();
                            this.product.productEvent.date = DateHelper.getDateWithoutTime(date);
                            this.product.productEvent.time = `${utc.hours()}:${utc.minutes()}`;
                        } else {
                            let date = this.eventTime;
                            DateHelper.removeTimezoneOffset(date, false, '', ianaTimezone)
                            let utc = moment(date).utc();
                            this.product.productEvent.date = undefined;
                            this.product.productEvent.time = `${utc.hours()}:${utc.minutes()}`;
                        }
                    } else {
                        this.product.productEvent.date = this.eventDate ? DateHelper.removeTimezoneOffset(this.eventDate, false, 'from') : undefined;
                        this.product.productEvent.time = undefined;
                    }
                }

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
                        if (this.selectedOption.data.close)
                            this.dialogRef.close(new ProductDto({
                                id: res.productId,
                                group: this.product.groupName,
                                name: this.product.name,
                                code: this.product.code,
                                type: this.product.type,
                                isPublished: this.product.isPublished,
                                paymentPeriodTypes: this.product.productSubscriptionOptions &&
                                    this.product.productSubscriptionOptions.map(item => item.frequency)
                            }));
                        else
                            this.productProxy.getProductInfo(res.productId).subscribe((product: any) => {
                                this.product = new UpdateProductInput({ id: res.productId, ...product });
                                this.initProductResources();
                                this.detectChanges();
                            });
                    });
                }
            }
        });
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
            title: this.ls.l('AddProductImage'),
            fileUrl: imageSource ? undefined : this.uploadFileUrl,
            source: imageSource,
            maxSizeBytes: AppConsts.maxImageSize
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
        if (this.isPublicProductsEnabled)
            this.defaultProductUri = this.product.publicName = value;
    }

    disabledValidationCallback() {
        return true;
    }

    onProductCodeChanged(event) {
        if (this.isPublicProductsEnabled && !this.defaultProductUri && (!this.data.product || !this.data.product.id))
            this.product.publicName = event.value.replace(/[^a-zA-Z0-9-._~]+/gim, '');
    }

    fileSelected($event) {
        if ($event.target.files.length)
            this.fileDropped($event.target.files);
    }

    addResources(files: NgxFileDropEntry[]) {
        if (files.length) {
            if (this.productFiles.length + this.productTemplates.length + files.length > this.maxFilesCount) {
                this.notify.warn(`Exceeded ${this.maxFilesCount} file limit`);
                return;
            }

            files.forEach((file: NgxFileDropEntry) => {
                if (file.fileEntry)
                    file.fileEntry['file'](this.uploadFile.bind(this));
                else
                    this.uploadFile(file);
            });
        }
    }

    uploadFile(file) {
        if (file.size > 100 * 1024 * 1024)
            return this.notify.warn(this.ls.l('FilesizeLimitWarn', 100));

        let resource: any = {
            name: file.name
        };

        resource.url = this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
        resource.loader = this.sendResource(file, resource).subscribe((res: any) => {
            if (res) {
                if (res.result)
                    resource.fileId = res.result;
                else {
                    resource.progress = res.loaded == res.total ? 0 :
                        Math.round(res.loaded / res.total * 100);
                    this.detectChanges();
                }
            }
        }, res => {
            this.productFiles = this.productFiles.filter(item => item.name != file.name);
            this.notify.error(res.error.message);
            this.detectChanges();
        }, () => {
            resource.loader = undefined;
            this.detectChanges();
        });
        this.productFiles.push(resource);
        this.detectChanges();
    }

    sendResource(file, resource) {
        return new Observable(subscriber => {
            let xhr = new XMLHttpRequest(),
                formData = new FormData();
            formData.append('file', file);
            xhr.open('POST', AppConsts.remoteServiceBaseUrl + '/api/services/CRM/ProductResource/SaveProductFile');
            xhr.setRequestHeader('Authorization', 'Bearer ' + abp.auth.getToken());

            xhr.upload.addEventListener('progress', event => {
                subscriber.next(event);
            });

            xhr.addEventListener('load', () => {
                let responce = JSON.parse(xhr.responseText);
                if (xhr.status === 200)
                    subscriber.next(responce);
                else
                    subscriber.error(responce);
                subscriber.complete();
            });
            resource.xhr = xhr;
            xhr.send(formData);
        });
    }

    fileDropped(event) {
        const file = event[0];
        if (file.fileEntry)
            file.fileEntry['file'](file => this.loadFileContent(file));
        else
            this.loadFileContent(file);
    }

    loadFileContent(file) {
        let reader: FileReader = new FileReader();
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
            this.product.price = undefined;
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

    showDocumentsDialog() {
        if (this.productFiles.length + this.productTemplates.length >= this.maxFilesCount) {
            this.notify.warn(`Exceeded ${this.maxFilesCount} file limit`);
            return;
        }

        this.contactsService.showTemplateDocumentsDialog(undefined, () => {
        }, false, true, undefined, false).afterClosed().subscribe(files => {
            if (files && files.length) {
                this.productTemplates = this.productTemplates.concat(
                    files.map(item => {
                        let fileId = item.key.split('_').shift();
                        if (this.productTemplates.every(temp => temp.fileId != fileId)) {
                            let parent = item.pathInfo.pop();
                            return <any>{
                                parent: parent && parent.key,
                                url: undefined,
                                fileId: fileId,
                                name: item.name
                            };
                        }
                    }).filter(Boolean)
                );
                this.detectChanges();
            }
        });
    }

    onProductTypeChanged(productType: ProductType) {
        let options = this.product.productSubscriptionOptions;
        switch (productType) {
            case ProductType.Subscription:
                if (!options || !options.length)
                    this.addNewPaymentPeriod();
                break;
            case ProductType.Digital:
                this.product.unit = ProductMeasurementUnit.Unit;
                break;
            case ProductType.Event:
                this.product.unit = ProductMeasurementUnit.Unit;
                this.initEventProps();
                break;
        }

        this.product.type = productType;
        this.detectChanges();
    }

    onPublishDateOpened() {
        if (!this.publishDate) {
            this.publishDate = DateHelper.addTimezoneOffset(moment().utcOffset(0, true).toDate());
            this.detectChanges();
        }
    }

    templateClick(event, resource) {
        if (!resource.url) {
            abp.ui.setBusy();
            this.documentProxy.getUrl(resource.parent, resource.name, false).pipe(
                finalize(() => abp.ui.clearBusy())
            ).subscribe(res => {
                resource.url = res.url;
                window.open(res.url, '_blank');
            });

            event.stopPropagation();
            event.preventDefault();
        }
    }

    removeTemplate(index) {
        if (index != undefined) {
            this.productTemplates.splice(index, 1);
            this.detectChanges();
        }
    }

    fileClick(event, resource) {
        if (!resource.url && resource.id) {
            abp.ui.setBusy();
            this.productResourceProxy.getProductFileLink(resource.id).pipe(
                finalize(() => abp.ui.clearBusy())
            ).subscribe(res => {
                resource.url = res;
                window.open(res, '_blank');
            });

            event.stopPropagation();
            event.preventDefault();
        }
    }

    removeFile(resource, index?) {
        if (index != undefined) {
            this.productFiles.splice(index, 1);
            if (resource.fileId)
                this.productResourceProxy.deleteProductFile(
                    resource.fileId).subscribe(() => { });
            this.detectChanges();
        }
    }

    addLink(resourceLinkNameCmp, resourceLinkCmp) {
        if (this.resourceLinkUrl &&
            resourceLinkCmp.instance.option('isValid') &&
            this.productLinks.every(link => link.url != this.resourceLinkUrl) &&
            resourceLinkNameCmp.instance.option('isValid')
        ) {
            this.productLinks.push(
                new ProductResourceDto({
                    id: undefined,
                    url: this.resourceLinkUrl,
                    fileId: undefined,
                    name: this.resourceLinkName
                })
            );
            this.resourceLinkUrl = '';
            this.resourceLinkName = '';
            this.detectChanges();
        }
    }

    removeLink(index) {
        if (index != undefined) {
            this.productLinks.splice(index, 1);
            this.changeDetection.markForCheck();
        }
    }

    onIsPublishedChanged() {
        if (this.product.isPublished && !this.publishDate) {
            this.publishDate = DateHelper.addTimezoneOffset(moment().utcOffset(0, true).toDate());
        }
    }

    editAddress() {
        let data = {
            streetAddress: this.product.productEvent.address.streetAddress,
            city: this.product.productEvent.address.city,
            stateId: this.product.productEvent.address.stateId,
            stateName: this.product.productEvent.address.stateName,
            countryId: this.product.productEvent.address.countryId,
            countryName: this.product.productEvent.address.countryName,
            neighborhood: this.product.productEvent.address.neighborhood,
            zip: this.product.productEvent.address.zip,
            isCompany: false,
            isDeleteAllowed: false,
            showType: false,
            showNeighborhood: false,
            editDialogTitle: 'Update address',
            formattedAddress: '',
            isEditAllowed: true,
            disableDragging: true,
            hideComment: true,
            hideCheckboxes: true
        };

        this.dialog.open(EditAddressDialog, {
            data: data,
            hasBackdrop: true
        }).afterClosed().subscribe((saved: boolean) => {
            if (saved) {
                this.product.productEvent.address.streetAddress = data.streetAddress;
                this.product.productEvent.address.city = data.city;
                this.product.productEvent.address.stateId = data.stateId;
                this.product.productEvent.address.stateName = data.stateName;
                this.product.productEvent.address.countryId = data.countryId;
                this.product.productEvent.address.countryName = data.countryName;
                this.product.productEvent.address.neighborhood = data.neighborhood;
                this.product.productEvent.address.zip = data.zip;
                this.setEventAddressString();
                this.detectChanges();
            }
        });
    }

    clearAddress(event) {
        event.stopPropagation();
        event.preventDefault();

        this.product.productEvent.address.streetAddress = null;
        this.product.productEvent.address.city = null;
        this.product.productEvent.address.stateId = null;
        this.product.productEvent.address.stateName = null;
        this.product.productEvent.address.countryId = null;
        this.product.productEvent.address.countryName = null;
        this.product.productEvent.address.neighborhood = null;
        this.product.productEvent.address.zip = null;
        this.setEventAddressString();
        this.detectChanges();
    }

    setEventAddressString() {
        if (!this.product || !this.product.productEvent || !this.product.productEvent.address)
            return;

        let addr = this.product.productEvent.address;
        this.eventAddress = [addr.streetAddress, addr.city, addr.stateName, addr.countryName, addr.zip].filter(x => !!x).join(', ');
    }

    ngOnDestroy() {
        if (this.productFiles && this.productFiles.length)
            this.productFiles.forEach(file => {
                if (!file.id && file.fileId)
                    this.productResourceProxy.deleteProductFile(file.fileId).subscribe(() => { });
            });
    }
}