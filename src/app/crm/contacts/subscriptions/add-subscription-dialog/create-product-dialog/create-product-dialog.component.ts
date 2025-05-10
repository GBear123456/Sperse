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
import { Clipboard } from '@angular/cdk/clipboard';

/** Third party imports */
import { NgxFileDropEntry } from 'ngx-file-drop';
import { CacheService } from 'ng2-cache-service';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { DxTextAreaComponent, DxValidationGroupComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import { Observable, of, zip } from 'rxjs';
import * as moment from 'moment';
import { map, switchMap, finalize, first, filter, publishReplay, refCount, tap } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { findIana } from 'windows-iana';
import * as QRCodeStyling from 'qr-code-styling-new';
import { BrainCircuit, Calendar, ChevronDown, CreditCard, FileText, GraduationCap, Heart, Image, Key, Link2, Mail, MessageSquare, Package, Phone, Plus, Send, Truck, Video, Webhook } from 'lucide-angular';

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
    TimingServiceProxy,
    EmailTemplateType,
    ProductDonationDto,
    ProductDonationSuggestedAmountDto,
    TenantPaymentSettingsServiceProxy,
    RecommendedProductInfo,
    ProductInventoryInfo,
    AddInventoryTopupInput
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MessageService, NotifyService, PermissionCheckerService } from 'abp-ng2-module';
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
import { EventDurationTypes, EventDurationHelper } from '@shared/crm/helpers/event-duration-types.enum';
import { round } from 'lodash';
import { AppPermissions } from '../../../../../../shared/AppPermissions';

@Pipe({ name: 'FilterAssignments' })
export class FilterAssignmentsPipe implements PipeTransform {
    transform(products: ProductDto[], excludeIds: number[], type: ProductType, excludeType: ProductType) {
        return products && products.filter(product =>
            excludeIds.indexOf(product.id) == -1 &&
            (!type || product.type == type) &&
            (!excludeType || product.type != excludeType)
        );
    }
}

@Component({
    selector: 'create-product-dialog',
    templateUrl: './create-product-dialog.component.html',
    styleUrls: [
        '../../subscriptions-base.less',
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
        ProductResourceServiceProxy,
        TenantPaymentSettingsServiceProxy
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateProductDialogComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild(DxValidationGroupComponent) validationGroup: DxValidationGroupComponent;
    @ViewChild(DxTextAreaComponent) descriptionHtmlComponent: DxTextAreaComponent;
    @ViewChild("canvas", { static: true }) canvas: ElementRef;

    readonly Plus = Plus;
    readonly Link2 = Link2;
    readonly CreditCard = CreditCard;
    readonly FileText = FileText;
    readonly Key = Key;
    readonly GraduationCap = GraduationCap;
    readonly Image = Image;
    readonly Video = Video;
    readonly MessageSquare = MessageSquare;
    readonly Send = Send;
    readonly Phone = Phone;
    readonly Calendar = Calendar;
    readonly Mail = Mail;
    readonly Webhook = Webhook;
    readonly BrainCircuit = BrainCircuit;
    readonly Heart = Heart;
    readonly Truck = Truck;
    readonly Package = Package;
    readonly ChevronIcon = ChevronDown;


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

    qrCode;

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

    tabs = {
        options: [
            {
                type: 'Product',
                name: this.ls.l('Product')
            }, {
                type: 'Deliverables',
                name: this.ls.l('Deliverables')
            }
        ],
        toggleTab: this.toggleTab.bind(this),
    }

    selectedTab = this.tabs.options[0].type;

    toggleTab(selected) {
        this.selectedTab = selected;
        this.changeDetection.detectChanges();
    }

    fulfillmentGroups: any = [
        {
          title: "Digital Access",
          items: [
            {
              id: "subscription",
              label: "Access Subscription Features",
              description: "Configure subscription-based access to content or features",
              icon: Link2,
              color: "#2563EB",
              component: 'subscription-feature',
            },
            {
              id: "credits",
              label: "User Credits",
              description: "Manage user credit system for content access",
              icon: CreditCard,
              color: "#059669",
              fields: [
                {
                  id: "creditAmount",
                  label: "Credit Amount",
                  type: "number",
                  className: "col-span-1",
                },
                {
                  id: "creditExpiry",
                  label: "Credit Expiration",
                  type: "select",
                  className: "col-span-1",
                  options: [
                    { value: "never", label: "Never" },
                    { value: "daily", label: "Every Day" },
                    { value: "weekly", label: "Every Week" },
                    { value: "monthly", label: "Every Month" },
                    { value: "yearly", label: "Every Year" },
                  ],
                  defaultValue: "never",
                },
              ],
              gridCols: "grid-cols-2 gap-4",
            },
            {
              id: "digital",
              label: "Digital Downloadable Product",
              description: "Provide access to downloadable digital content",
              icon: FileText,
              color: "#2DD4BF",
              component: 'digital-upload',
            },
            {
              id: "license",
              label: "License Key Delivery",
              description: "Generate and deliver software license keys",
              icon: Key,
              color: "#DC2626",
              fields: [
                { id: "licenseFormat", label: "License Format", type: "text" },
                { id: "licenseRules", label: "License Rules", type: "textarea" },
              ],
            },
            {
              id: "course",
              label: "Digital Course",
              description: "Grant access to online courses",
              icon: GraduationCap,
              color: "#FF6B6B",
              fields: [
                { id: "coursePlatformUrl", label: "Platform URL", type: "url" },
                { id: "courseId", label: "Course ID", type: "text" },
              ],
            },
            {
              id: "feedAccess",
              label: "Access to Feed Content",
              description: "Grant access to exclusive feed content including pictures, polls, and discussions",
              icon: Image,
              color: "#8B5CF6",
              fields: [
                { id: "feedUrl", label: "Feed URL", type: "url" },
                {
                  id: "feedAccessLevel",
                  label: "Access Level",
                  type: "select",
                  options: [
                    { value: "basic", label: "Basic" },
                    { value: "premium", label: "Premium" },
                    { value: "vip", label: "VIP" },
                  ],
                },
              ],
            },
            {
              id: "videoAccess",
              label: "Access to Video Content or Live Stream",
              description: "Provide access to exclusive video content or live streams",
              icon: Video,
              color: "#EF4444",
              fields: [
                {
                  id: "contentType",
                  label: "Content Type",
                  type: "select",
                  options: [
                    { value: "preRecorded", label: "Pre-recorded Videos" },
                    { value: "liveStream", label: "Live Stream" },
                    { value: "both", label: "Both Pre-recorded and Live" },
                  ],
                },
                {
                  id: "videoLibraryUrl",
                  label: "Video Library URL",
                  type: "url",
                  showWhen: "contentType",
                  showWhenValue: ["preRecorded", "both"],
                },
                {
                  id: "liveStreamUrl",
                  label: "Live Stream URL",
                  type: "url",
                  showWhen: "contentType",
                  showWhenValue: ["liveStream", "both"],
                },
                {
                  id: "videoAccessDuration",
                  label: "Access Duration",
                  type: "select",
                  options: [
                    { value: "1month", label: "1 Month" },
                    { value: "3months", label: "3 Months" },
                    { value: "6months", label: "6 Months" },
                    { value: "1year", label: "1 Year" },
                    { value: "lifetime", label: "Lifetime" },
                  ],
                },
                {
                  id: "scheduleInfo",
                  label: "Live Stream Schedule",
                  type: "textarea",
                  showWhen: "contentType",
                  showWhenValue: ["liveStream", "both"],
                },
              ],
            },
          ],
        },
        {
          title: "Community Access",
          items: [
            {
              id: "discord",
              label: "Discord Member Roles",
              description: "Manage Discord roles and server access",
              icon: MessageSquare,
              color: "#5865F2",
              hoverColor: "rgb(71 82 196)",
              component: 'discord-roles-selector',
            },
            {
              id: "telegram",
              label: "Telegram Channel Access",
              description: "Grant access to Telegram channels",
              icon: Send,
              color: "#229ED9",
              hoverColor: "rgb(26 141 195)",
              component: 'telegram-channel-selector',
            },
            {
              id: "slack",
              label: "Slack Channel Access",
              description: "Grant access to Slack channels",
              icon: MessageSquare,
              color: "#E01E5A",
              hoverColor: "rgb(201 28 80)",
              component: 'slack-channel-selector',
            },
            {
              id: "whatsapp",
              label: "WhatsApp",
              description: "Send automated WhatsApp messages",
              icon: Phone,
              color: "#25D366",
              fields: [
                { id: "whatsappNumber", label: "Business Number", type: "text" },
                { id: "whatsappApiKey", label: "API Key", type: "password" },
              ],
            },
          ],
        },
        {
          title: "Event and Meeting Access",
          items: [
            {
              id: "event",
              label: "Event Ticketing",
              description: "Manage event registration and access",
              icon: Calendar,
              color: "#F59E0B",
              fields: [
                {
                  id: "location",
                  label: "Location",
                  type: "section",
                  description: "Help people in the area discover your event and let attendees know where to show up.",
                  fields: [
                    {
                        id: "locationType",
                        type: "radio",
                        options: [
                            { value: ProductEventLocation.Online, label: "Online" },
                            { value: ProductEventLocation.InPerson, label: "In-Person" },
                            { value: ProductEventLocation.ToBeAnnounced, label: "To be announced" },
                        ],
                    },
                  ],
                },
                {
                    id: "address",
                    label: "Venue Location",
                    type: "address",
                },
                {
                  id: "dateAndTime",
                  label: "Date and time",
                  type: "section",
                  description: "Tell event-goers when your event starts and ends so they can make plans to attend.",
                  fields: [
                    {
                      id: "eventType",
                      type: "radio",
                      options: [
                        { value: "single", label: "Single Event" },
                        { value: "recurring", label: "Recurring Event" },
                      ],
                    },
                  ],
                },
                {
                    id: "duration",
                    type: "duration",
                    columns: 4,
                    description: "Single event happens once and can last multiple days",
                    fields: [
                        {
                            id: "date",
                            label: "Date",
                            type: "date",
                        },
                        {
                            id: "time",
                            label: "Time",
                            type: "time",
                        },
                        {
                            id: "duration",
                            label: "Duration",
                            type: "number",
                        },
                        {
                            id: "durationType",
                            label: "",
                            type: "select",
                        },
                    ]
                },
                {
                  id: "settings",
                  type: "grid",
                  columns: 2,
                  fields: [
                    {
                      id: "timezone",
                      label: "Time Zone",
                      type: "select",
                      options: [],
                    },
                    {
                      id: "language",
                      label: "Event Page Language",
                      type: "select",
                      options: [],
                    },
                  ],
                },
              ],
            },
            {
              id: "meeting",
              label: "Online Meeting Link",
              description: "Configure video meeting access",
              icon: Video,
              color: "#2563EB",
              fields: [
                {
                  id: "settings",
                  type: "grid",
                  columns: 2,
                  fields: [
                    {
                      id: "platform",
                      label: "Platform",
                      type: "select",
                      options: [
                        { value: "zoom", label: "Zoom" },
                        { value: "meet", label: "Google Meet" },
                        { value: "teams", label: "Microsoft Teams" },
                        { value: "custom", label: "Custom" },
                      ],
                    },
                    {
                      id: "meetingLink",
                      label: "Meeting Link",
                      type: "url",
                    },
                    {
                      id: "meetingId",
                      label: "Meeting ID",
                      type: "text",
                    },
                    {
                      id: "meetingPassword",
                      label: "Meeting Password",
                      type: "password",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: "Additional Options",
          items: [
            {
              id: "mailchimp",
              label: "MailChimp Audience",
              description: "Add customers to MailChimp audiences",
              icon: Mail,
              color: "#FFE01B",
              fields: [{ id: "mailchimpAudienceId", label: "Audience ID", type: "text" }],
            },
            {
              id: "webhook",
              label: "Webhook Actions",
              description: "Send data to external systems via webhooks",
              icon: Webhook,
              color: "#6B7280",
              fields: [
                { id: "successWebhookUrl", label: "Success Webhook URL", type: "url" },
                { id: "failureWebhookUrl", label: "Failure Webhook URL", type: "url" },
              ],
            },
            {
              id: "redirect",
              label: "Redirect Link",
              description: "Configure URL redirections",
              icon: Link2,
              color: "#4A4A4A",
              fields: [
                { id: "destinationUrl", label: "Destination URL", type: "url" },
                { id: "trackClicks", label: "Track Clicks", type: "switch" },
              ],
            },
            {
              id: "gpt",
              label: "GPT Access",
              description: "Configure AI model access",
              icon: BrainCircuit,
              color: "#10A37F",
              fields: [
                { id: "gptModelId", label: "Model ID", type: "text" },
                { id: "gptApiKey", label: "API Key", type: "password" },
                { id: "gptSystemPrompt", label: "System Prompt", type: "textarea" },
              ],
            },
            {
              id: "donation",
              label: "Donation Support",
              description: "Configure donation options",
              icon: Heart,
              color: "#EC4899",
              fields: [
                { id: "suggestedAmount", label: "Suggested Amount", type: "number" },
                { id: "allowRecurring", label: "Allow Recurring", type: "switch" },
              ],
            },
          ],
        },
        {
          title: "Physical Product Delivery",
          items: [
            {
              id: "standardDelivery",
              label: "Standard Delivery",
              description: "Delivered within 3-5 business days",
              icon: Truck,
              color: "#4ade80",
              fields: [
                { id: "price", label: "Price", type: "number" },
                { id: "estimatedDays", label: "Estimated Days", type: "number" },
              ],
            },
            {
              id: "expressDelivery",
              label: "Express Delivery",
              description: "Delivered within 1-2 business days",
              icon: Package,
              color: "#f472b6",
              fields: [
                { id: "price", label: "Price", type: "number" },
                { id: "estimatedDays", label: "Estimated Days", type: "number" },
              ],
            },
          ],
        },
    ]

    deliverablesData: any = {};

    handleChange = (field: string, value: any) => {
        this.deliverablesData[field] = value;
        console.log(this.deliverablesData)
    }

    isHostTenant = !abp.session.tenantId;
    product: CreateProductInput | UpdateProductInput;
    amountFormat: string = '';
    amountNullableFormat: string = '';
    products$: Observable<ProductDto[]> = null;
    suspendCurrencyChanged = false;
    readonly addNewItemId = -1;
    isPublicProductsEnabled = this.feature.isEnabled(AppFeatures.CRMPublicProducts);
    isSubscriptionManagementEnabled = this.feature.isEnabled(AppFeatures.CRMSubscriptionManagementSystem);
    showDowngrade = this.isHostTenant;
    hasViewCredits = this.feature.isEnabled(AppFeatures.CRMContactCredits) && this.permission.isGranted(AppPermissions.CRMContactCredits);
    hasManageCredits = this.feature.isEnabled(AppFeatures.CRMContactCredits) && this.permission.isGranted(AppPermissions.CRMContactCreditsManage);
    enableCreditTopUpBySubscription = this.setting.getBoolean('CRM.ContactCredits.EnableTopUpBySubscription');
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
    billingCyclesEnable = [
        { key: false, displayValue: this.ls.l('Forever') },
        { key: true, displayValue: this.ls.l('Limited') }
    ];
    gracePeriodDefaultValue: number;
    customGroup: string;
    isCommissionsEnabled = this.feature.isEnabled(AppFeatures.CRMCommissions);
    title: string;
    image: string = null;
    imageChanged: boolean = false;
    isOneTime = false;
    EmailTemplateType = EmailTemplateType;

    eventLocation = ProductEventLocation;
    eventDurationTypes = EventDurationHelper.eventDurationDataSource;
    languages: LanguageDto[] = [];
    timezones: any[] = [];
    eventAddress: string;
    eventDuration: number;
    eventDurationType: EventDurationTypes;
    eventDate: Date;
    eventTime: Date;

    storedCurrentQuantity: number = undefined;
    topupQuantity: number;

    productTaxCodeDataSource: DataSource = new DataSource({
        pageSize: 10,
        byKey: (key) => {
            return this.productProxy.getStripeProductTaxCode(key).toPromise();
        },
        load: (loadOptions) => {
            return loadOptions.hasOwnProperty('searchValue') ?
                this.productProxy.getStripeProductTaxCodes(loadOptions.searchValue || '', loadOptions.take, loadOptions.skip).toPromise() :
                Promise.resolve([]);
        }
    });

    constructor(
        private elementRef: ElementRef,
        private store$: Store<RootStore.State>,
        private timingService: TimingServiceProxy,
        private productProxy: ProductServiceProxy,
        productGroupProxy: ProductGroupServiceProxy,
        private notify: NotifyService,
        private message: MessageService,
        private clipboard: Clipboard,
        private changeDetection: ChangeDetectorRef,
        memberServiceProxy: MemberServiceServiceProxy,
        public contactsService: ContactsService,
        private domSanitizer: DomSanitizer,
        public dialogRef: MatDialogRef<CreateProductDialogComponent>,
        private productResourceProxy: ProductResourceServiceProxy,
        private documentProxy: DocumentTemplatesServiceProxy,
        private tenantPaymentSettings: TenantPaymentSettingsServiceProxy,
        public ls: AppLocalizationService,
        public dialog: MatDialog,
        private setting: SettingService,
        private feature: FeatureCheckerService,
        private permission: PermissionCheckerService,
        private cacheHelper: CacheHelper,
        private cacheService: CacheService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.addPanelClass('new-product');
        this.title = ls.l(this.isReadOnly ? 'Product' : data.product ? 'EditProduct' : 'AddProduct');
        if (data.product && data.product.id) {
            this.image = data.product.imageUrl;
            this.product = new UpdateProductInput(data.product);
            this.initSubscriptionOptions();
            let options = data.product.productSubscriptionOptions;
            this.defaultProductUri = this.product.publicName;
            if (options && options[0]) {
                this.isFreePriceType = !options[0].fee && !options[0].customerChoosesPrice;
                this.onFrequencyChanged({ value: options[0].frequency }, options[0]);
            } else
                this.isFreePriceType = !data.product.customerChoosesPrice && !data.product.price;
            this.initCollections();
        } else {
            this.product = new CreateProductInput(data.product);
            if (!this.product.type) {
                this.product.type = this.defaultProductType;
                if (this.isPublicProductsEnabled)
                    this.product.publicName = this.defaultProductUri;
                this.addUpgradeToProduct();
                this.addRecommendedProduct();
            }
            if (!this.product.currencyId)
                this.product.currencyId = SettingsHelper.getCurrency();

            this.initEventProps();
            this.initDonationProps();
        }

        this.initProductInventory();
        this.initCurrencyFields();

        if (this.product.publishDate)
            this.publishDate = DateHelper.addTimezoneOffset(new Date(this.product.publishDate), true);

        this.initProductResources();
        this.initProductEvent();

        productGroupProxy.getProductGroups().subscribe((groups: ProductGroupInfo[]) => {
            this.productGroups = groups;
            this.detectChanges();
        });

        memberServiceProxy.getAll(false).subscribe((services: MemberServiceDto[]) => {
            this.services = services;
            this.checkAddManageOption(this.services);
            this.detectChanges();
        });

        if (!this.isHostTenant && this.isSubscriptionManagementEnabled) {
            this.tenantPaymentSettings.getSubscriptionSettings().subscribe(result => {
                this.showDowngrade = result.enableClientSubscriptionAutomaticCancel;
                this.detectChanges();
            });
        }

        this.gracePeriodDefaultValue = this.setting.getInt('App.OrderSubscription.DefaultSubscriptionGracePeriodDayCount');
        this.initEventDataSources();
    }

    ngOnInit() {
        if (!this.data.product || !this.product.productSubscriptionOptions)
            this.addNewPaymentPeriod();

        let contextMenu = this.buttons[0].contextMenu;
        if (this.cacheService.exists(contextMenu.cacheKey))
            this.selectedOption = contextMenu.items[this.cacheService.get(contextMenu.cacheKey)];
        else
            this.selectedOption = contextMenu.items[contextMenu.defaultIndex];

        this.generateQr();
    }

    initCurrencyFields() {
        this.amountFormat = getCurrencySymbol(this.product.currencyId, 'narrow') + ' #,##0.##';
        this.amountNullableFormat = getCurrencySymbol(this.product.currencyId, 'narrow') + ' #,###.##';
        this.products$ = this.productProxy.getProducts(undefined, this.product.currencyId, false, undefined).pipe(
            publishReplay(),
            refCount(),
            map((products: ProductDto[]) => {
                return this.data.product && this.data.product.id ?
                    products.filter((product: ProductDto) => product.id != this.data.product.id) : products
            })
        );
    }

    initCollections() {
        this.initCollection(this.product.productUpgradeAssignments, () => this.addUpgradeToProduct());
        this.initCollection(this.product.recommendedProducts, () => this.addRecommendedProduct());
    }

    initCollection(collection: any[], initMethod: () => void) {
        if (!collection || !collection.length)
            initMethod();
    }

    initSubscriptionOptions() {
        if (!this.product.productSubscriptionOptions)
            return;

        this.product.productSubscriptionOptions.forEach(option => {
            option['gracePeriodEnabled'] = !!option.gracePeriodDayCount;
            option['trialEnabled'] = !!option.trialDayCount;
            option['billingCyclesEnabled'] = !!option.cycles;
        })
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

        if (this.product.productEvent.durationMinutes) {
            let durationInfo = EventDurationHelper.ParseDuration(this.product.productEvent.durationMinutes);
            this.eventDurationType = durationInfo.eventDurationType;
            this.eventDuration = durationInfo.eventDuration;
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
        this.deliverablesData.event_address = new AddressInfoDto();
        this.deliverablesData.event_locationType = ProductEventLocation.Online;
        this.deliverablesData.event_eventType = 'single';
        this.deliverablesData.event_timezone = this.setting.get('Abp.Timing.TimeZone');
        this.deliverablesData.event_language = 'en';
    }

    initDonationProps() {
        if (this.product.productDonation)
            return;

        this.product.productDonation = new ProductDonationDto();
        this.product.productDonation.productDonationSuggestedAmounts = [];
    }

    initEventDataSources() {
        this.initLanguages();
        this.initTimezones();
    }

    initLanguages() {
        this.store$.dispatch(new LanguagesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(LanguagesStoreSelectors.getLanguages),
            filter(x => !!x),
            first()
        ).subscribe(languages => {
            this.languages = languages;
            this.fulfillmentGroups[2].items[0].fields[4].fields[1].options = languages
            this.changeDetection.markForCheck();
        });
    }

    initTimezones() {
        this.timingService.getTimezones(AppTimezoneScope.Application).subscribe(res => {
            res.items.splice(0, 1);
            this.timezones = res.items;
            this.fulfillmentGroups[2].items[0].fields[4].fields[0].options = res.items
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

    initProductInventory() {
        if (!this.product.productInventory) {
            this.product.productInventory = new ProductInventoryInfo(
                {
                    isActive: false,
                    canSellOutOfStock: false,
                    initialQuantity: null
                });
        }

        this.storedCurrentQuantity = this.product.productInventory['currentQuantity'];
    }

    ngAfterViewInit() {
        setTimeout(() => this.descriptionHtmlComponent.instance.repaint());
    }

    saveProduct() {
        if (this.product.type != ProductType.Digital) {
            this.productFiles = [];
            this.productLinks = [];
            this.productTemplates = [];
        }

        if (this.product.type == ProductType.Subscription) {
            let options = this.product.productSubscriptionOptions;
            if (!options || !options.length)
                return this.notify.error(this.ls.l('SubscriptionPaymentOptionsAreRequired'));
            this.product.unit = undefined;
            this.product.price = undefined;
            this.product.customerChoosesPrice = false;
            this.product.credits = undefined;
        } else {
            this.product.productServices = undefined;
            this.product.productSubscriptionOptions = undefined;
            this.product.productUpgradeAssignments = undefined;
            this.product.downgradeProductId = undefined;
            this.product.creditsTopUpProductId = undefined;

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

                let recommendedProducts = this.product.recommendedProducts;
                if (recommendedProducts && recommendedProducts.length == 1 && !recommendedProducts[0].recommendedProductId)
                    this.product.recommendedProducts = undefined;

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

                    this.product.productEvent.durationMinutes = this.eventDuration ? this.eventDuration * this.eventDurationType : undefined;
                }

                if (this.product.type == ProductType.Donation) {
                    this.product.commissionableAmount = null;
                    this.product.maxCommissionRate = null;
                    this.product.maxCommissionRateTier2 = null;
                    this.product.credits = null;

                    this.product.productInventory.isActive = false;
                    this.product.productInventory.initialQuantity = null;
                } else {
                    this.product.productDonation = null;

                    if (this.product.type != ProductType.General)
                        this.product.productInventory.initialQuantity = round(this.product.productInventory.initialQuantity, 0);
                }

                if (!this.product.customerChoosesPrice) {
                    this.product.minCustomerPrice = null;
                    this.product.maxCustomerPrice = null;
                }

                if (this.product instanceof UpdateProductInput) {
                    this.productProxy.updateProduct(this.product).pipe(
                        switchMap(() => this.getUpdateProductImageObservable((<any>this.product).id))
                    ).subscribe(() => {
                        this.notify.info(this.ls.l('SavedSuccessfully'));
                        if (this.selectedOption.data.close)
                            this.dialogRef.close();
                        else
                            this.productProxy.getProductInfo((<any>this.product).id).subscribe((product: any) => {
                                this.product = new UpdateProductInput({ id: (<any>this.product).id, ...product });
                                this.initSubscriptionOptions();
                                this.initProductInventory();
                                this.initProductResources();
                                this.initCollections();
                                this.detectChanges();
                            });
                    });
                }
                else {
                    this.productProxy.createProduct(this.product).pipe(
                        switchMap((res) => zip(of(res), this.getUpdateProductImageObservable(res.productId)))
                    ).subscribe(([res,]) => {
                        this.notify.info(this.ls.l('SavedSuccessfully'));
                        if (this.selectedOption.data.close)
                            this.dialogRef.close();
                        else
                            this.productProxy.getProductInfo(res.productId).subscribe((product: any) => {
                                this.product = new UpdateProductInput({ id: res.productId, ...product });
                                this.initSubscriptionOptions();
                                this.initProductInventory();
                                this.initProductResources();
                                this.initCollections();
                                this.detectChanges();
                            });
                    });
                }
            }
        });
    }

    onCurrencyChanged(event) {
        if (this.suspendCurrencyChanged) {
            this.suspendCurrencyChanged = false;
            return;
        }

        if (this.product.downgradeProductId || this.product.creditsTopUpProductId ||
            this.product.recommendedProducts.some(v => !!v.recommendedProductId) ||
            this.product.productUpgradeAssignments.some(v => !!v.upgradeProductId)) {
            this.message.confirm('Changing currency will clear recommended, upgrade, downgrade, topup products', '', (isConfirmed) => {
                if (isConfirmed) {
                    this.initCurrencyFields();
                    this.product.downgradeProductId = null;
                    this.product.creditsTopUpProductId = null;
                    this.product.recommendedProducts = [new RecommendedProductInfo()];
                    this.product.productUpgradeAssignments = [new ProductUpgradeAssignmentInfo()];
                    this.detectChanges();
                } else {
                    this.suspendCurrencyChanged = true;
                    this.product.currencyId = event.previousValue;
                    this.detectChanges();
                }
            });
        }
        else {
            this.initCurrencyFields();
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
        let option = new ProductSubscriptionOptionInfo();
        option['gracePeriodEnabled'] = false;
        option['trialEnabled'] = false;
        option['billingCyclesEnabled'] = false;

        this.product.productSubscriptionOptions.push(
            option
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

    addRecommendedProduct() {
        if (!this.product.recommendedProducts)
            this.product.recommendedProducts = [];
        if (this.product.recommendedProducts.some(item => !item.recommendedProductId))
            return;
        this.product.recommendedProducts.push(
            new RecommendedProductInfo()
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

    removeRecommendedProduct(index, option) {
        if (index)
            this.product.recommendedProducts.splice(index, 1);
        else
            option.recommendedProductId = undefined;
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

    onFrequencyChanged(event, option: ProductSubscriptionOptionInfo, customPeriodValidator?) {
        this.isOneTime = event.value == RecurringPaymentFrequency.OneTime;

        if (this.isOneTime) {
            option.commissionableSignupFeeAmount = undefined;
            option.trialDayCount = undefined;
            option.signupFee = undefined;
            option.signUpCredits = undefined;
            option.customPeriodType = CustomPeriodType.Days;
        } else if (customPeriodValidator) {
            if (event.value == RecurringPaymentFrequency.Custom) {
                option.customPeriodType = CustomPeriodType.Days;
            } else {
                option.customPeriodCount = undefined;
                option.customPeriodType = undefined;
                customPeriodValidator.instance.reset();
            }
        }

        if ([RecurringPaymentFrequency.OneTime, RecurringPaymentFrequency.LifeTime].indexOf(event.value) != -1) {
            option['billingCyclesEnabled'] = false;
            option.cycles = undefined;
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
                            isPeriodValid = event.value <= 1095;
                            break;
                        case CustomPeriodType.Weeks:
                            isPeriodValid = event.value <= 156;
                            break;
                        case CustomPeriodType.Months:
                            isPeriodValid = event.value <= 36;
                            break;
                        case CustomPeriodType.Years:
                            isPeriodValid = event.value <= 3;
                            break;
                    }
                }

                return isPeriodValid;
            }
            return true;
        };
    }

    validateGeneralPrice() {
        return (event) => {
            if (this.product.customerChoosesPrice) {
                if (event.value) {
                    if (this.product.minCustomerPrice > 0 && event.value < this.product.minCustomerPrice)
                        return false;
                    if (this.product.maxCustomerPrice > 0 && event.value > this.product.maxCustomerPrice)
                        return false;

                    return event.value > 0;
                }

                return true;
            }
            return (this.isFreePriceType && !event.value) || event.value > 0;
        }
    }

    validateFee(option) {
        return (event) => {
            if (option.customerChoosesPrice) {
                if (event.value) {
                    if (option.minCustomerPrice > 0 && event.value < option.minCustomerPrice)
                        return false;
                    if (option.maxCustomerPrice > 0 && event.value > option.maxCustomerPrice)
                        return false;

                    return event.value > 0;
                }

                return true;
            }

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
            maintainAspectRatio: false,
            maxSizeBytes: AppConsts.maxImageSize
        };
        this.dialog.open(UploadPhotoDialogComponent, {
            data: uploadPhotoData,
            maxWidth: AppConsts.maxImageDialogWidth,
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

    getRecommendedIds(option): number[] {
        if (this.product && this.product.recommendedProducts)
            return this.product.recommendedProducts.map(
                item => option.recommendedProductId == item.recommendedProductId ? undefined : item.recommendedProductId
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

    getQrCodeStyling(width?: number, height?: number, margin?: number) {
        return new QRCodeStyling.default({
            width: width,
            height: height,
            margin: margin,
            data: this.baseUrl + '/p/' + this.tenantId + '/' + (this.product.publicName || ''),
            //image: './assets/common/icons/publishedProfile/SperserLogoForQr.png',
            dotsOptions: {
                //gradient: {
                //    colorStops: [{ offset: 0, color: '#7631ab' }, { offset: 1, color: 'black' }],
                //    rotation: 90,
                //    type: 'linear'
                //},
                type: 'square'
            },
            cornersDotOptions: {
                type: 'square'
            },
            imageOptions: {
                hideBackgroundDots: false,
                crossOrigin: 'anonymous',
                margin: 1
            }
        });
    }

    generateQr() {
        while (this.canvas?.nativeElement.firstChild) {
            this.canvas?.nativeElement.removeChild(this.canvas?.nativeElement.lastChild);
        }

        if (!QRCodeStyling || !this.product.publicName) {
            return;
        }

        this.qrCode = this.getQrCodeStyling(75, 75, 0);
        this.qrCode.append(this.canvas?.nativeElement);
    }

    downloadQr() {
        if (this.qrCode) {
            let qr = this.getQrCodeStyling(300, 300, 5);
            qr.download({ name: 'qr-' + this.product.publicName, extension: 'png' });
        }
    }

    updateProductUrl(value) {
        if (this.isPublicProductsEnabled) {
            this.defaultProductUri = this.product.publicName = value;
            this.generateQr();
        }
    }

    disabledValidationCallback() {
        return true;
    }

    onProductCodeChanged(event) {
        if (this.isPublicProductsEnabled && !this.defaultProductUri && (!this.data.product || !this.data.product.id)) {
            this.product.publicName = event.value.replace(/[^a-zA-Z0-9-._~]+/gim, '');
            this.generateQr();
        }
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
        if (!this.isReadOnly && this.uploadFileUrl)
            this.openImageSelector();
    }

    togglePriceType() {
        if (this.isReadOnly)
            return;

        if (this.isFreePriceType = !this.isFreePriceType) {
            this.product.price = undefined;
            if (!this.product.stripeXref)
                this.product.customerChoosesPrice = false;
            let options = this.product.productSubscriptionOptions;
            if (options && options[0]) {
                options[0].fee = 0;
                options[0].customerChoosesPrice = false;
                options[0].minCustomerPrice = undefined;
                options[0].maxCustomerPrice = undefined;
                options[0].commissionableFeeAmount = undefined;
                options[0].trialDayCount = undefined;
                options[0].signupFee = undefined;
                options[0].signUpCredits = undefined;
                options[0].commissionableSignupFeeAmount = undefined;
            }
        }
    }

    getSliderValue() {
        return Number(!this.isFreePriceType) * 50;
    }

    showDocumentsDialog() {
        if (this.isReadOnly)
            return;

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
            case ProductType.Donation:
                this.product.unit = ProductMeasurementUnit.Unit;
                if (this.isFreePriceType)
                    this.togglePriceType();
                this.initDonationProps();
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
            isEditAllowed: !this.isReadOnly,
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

    addNewSuggestedAmountFields() {
        this.product.productDonation.productDonationSuggestedAmounts.push(
            new ProductDonationSuggestedAmountDto()
        );
    }

    removeSuggestedAmountFields(index) {
        this.product.productDonation.productDonationSuggestedAmounts.splice(index, 1);
        this.detectChanges();
    }

    addInventoryTopup() {
        if (this.topupQuantity && this.product instanceof UpdateProductInput) {
            let productId = (<any>this.product).id;
            this.productProxy.addInventoryTopup(new AddInventoryTopupInput({ productId: productId, quantity: this.topupQuantity }))
                .subscribe(() => {
                    this.notify.info(this.ls.l('SavedSuccessfully'));
                    this.topupQuantity = undefined;
                    this.productProxy.getProductInfo(productId).subscribe((product: any) => {
                        this.storedCurrentQuantity = product.productInventory.currentQuantity;
                        this.detectChanges();
                    });
                });
        }
    }

    copyTextToClipboard(text) {
        this.clipboard.copy(text);
        this.notify.info(this.ls.l('SavedToClipboard'));
    }

    ngOnDestroy() {
        if (this.productFiles && this.productFiles.length)
            this.productFiles.forEach(file => {
                if (!file.id && file.fileId)
                    this.productResourceProxy.deleteProductFile(file.fileId).subscribe(() => { });
            });
    }
}