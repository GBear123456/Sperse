/** Core imports */
import { Component, OnInit, ViewChild, AfterViewInit, Inject, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { formatPercent } from '@angular/common';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard';
import { CacheService } from 'ng2-cache-service';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { MatDialog } from '@angular/material/dialog';
import { MatTabGroup, MatTabHeader } from '@angular/material/tabs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, ReplaySubject, BehaviorSubject, combineLatest, of } from 'rxjs';
import { first, map, takeUntil, finalize, switchMap, distinctUntilChanged, filter } from 'rxjs/operators';
import { DxScrollViewComponent } from 'devextreme-angular/ui/scroll-view';
import * as moment from 'moment-timezone';

/** Application imports */
import { DateHelper } from '@shared/helpers/DateHelper';
import { NotifyService } from 'abp-ng2-module';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { ODataService } from '@shared/common/odata/odata.service';
import {
    VerificationChecklistItemType, VerificationChecklistItem,
    VerificationChecklistItemStatus
} from '../../verification-checklist/verification-checklist.model';
import { CreateActivityDialogComponent } from '@app/crm/activity/create-activity-dialog/create-activity-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    UpdateLeadStagePointInput, UpdateOrderStagePointInput, LeadServiceProxy, OrderServiceProxy,
    ContactServiceProxy, ContactInfoDto, LeadInfoDto, ContactLastModificationInfoDto, PipelineDto,
    UpdateContactAffiliateCodeInput, UpdateContactXrefInput, UpdateContactCustomFieldsInput, StageDto,
    GetSourceContactInfoOutput, UpdateAffiliateContactInput, UpdateContactAffiliateRateInput,
    ActivityType, CommissionTier, UpdateAffiliateIsAdvisorInput, TenantPaymentSettingsServiceProxy,
    CommissionSettings, ActivityServiceProxy, ContactAffiliateCodeDto, ContactAffiliateCodeServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { ContactsService } from '../../contacts.service';
import { AppFeatures } from '@shared/AppFeatures';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppService } from '@app/app.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppPermissions } from '@shared/AppPermissions';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { AffiliateHistoryDialogComponent } from './affiliate-history-dialog/affiliate-history-dialog.component';
import { CrmService } from '@app/crm/crm.service';
import { ContactGroup } from '@shared/AppEnums';
import { FeatureCheckerService } from 'abp-ng2-module';
import { PermissionCheckerService } from 'abp-ng2-module';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';

@Component({
    templateUrl: 'personal-details-dialog.html',
    styleUrls: ['personal-details-dialog.less'],
    providers: [ContactAffiliateCodeServiceProxy]
})
export class PersonalDetailsDialogComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(SourceContactListComponent) sourceComponent: SourceContactListComponent;
    @ViewChild('checklistScroll') checklistScroll: DxScrollViewComponent;
    @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
    showChecklistTab = !!this.appService.getFeatureCount(AppFeatures.CRMMaxChecklistPointCount);
    showOverviewTab = abp.features.isEnabled(AppFeatures.PFMCreditReport);
    verificationChecklist: VerificationChecklistItem[];
    contactInfo: ContactInfoDto;
    leadInfo: LeadInfoDto;
    stageColor: string;
    configMode: boolean;
    overviewPanelSetting = {
        clientScores: true,
        totalApproved: true,
        verification: true
    };

    private readonly TAB_INDEX_GENERAL = 0;
    private readonly TAB_INDEX_OVERVIEW = 1;
    private readonly TAB_INDEX_ACTIVITY = 2;

    public cellDuration = 15;
    public scheduleView = 'agenda';
    public activityTypes = ActivityType;
    public agendaUserDataSource: DataSource;
    public agendaContactDataSource: DataSource;
    private agendaDataSourceURI = 'Activity';
    public scheduleDate = new Date();
    public timezone = 'Etc/UTC';
    public resources: any[] = [
        {
            fieldExpr: 'type',
            useColorAsDefault: true,
            allowMultiple: false,
            dataSource: [
                {
                    text: this.ls.l('Event'),
                    id: ActivityType.Event,
                    color: '#727bd2'
                },
                {
                    text: this.ls.l('Task'),
                    id: ActivityType.Task,
                    color: '#32c9ed'
                }
            ],
            label: this.ls.l('Type')
        }
    ];

    private NoName = `<${this.ls.l('ClientNoName')}>`;

    private slider: any;
    private readonly ident = 'PersonalDetailsDialog';
    private stripeCustomerId: ReplaySubject<string> = new ReplaySubject(1);
    stripeCustomerId$: Observable<string> = this.stripeCustomerId.asObservable();
    private isAdvisor: ReplaySubject<boolean> = new ReplaySubject(null);
    isAdvisor$: Observable<boolean> = this.isAdvisor.asObservable();
    affiliateValidationRules = [
        {
            type: 'pattern',
            pattern: AppConsts.regexPatterns.affiliateCode,
            message: this.ls.l('AffiliateCodeIsNotValid')
        },
        {
            type: 'stringLength',
            max: AppConsts.maxAffiliateCodeLength,
            message: this.ls.l('MaxLengthIs', AppConsts.maxAffiliateCodeLength)
        }
    ];
    affiliateRateValidationRules = [
        {
            type: 'pattern',
            pattern: AppConsts.regexPatterns.affiliateRateZeroBase,
            message: this.ls.l('InvalidAffiliateRate')
        },
        {
            type: 'stringLength',
            max: AppConsts.maxAffiliateRateZeroBaseLength,
            message: this.ls.l('MaxLengthIs', AppConsts.maxAffiliateRateZeroBaseLength)
        }
    ];
    xrefValidationRules = [
        {
            type: 'stringLength',
            max: 255,
            message: this.ls.l('MaxLengthIs', 255)
        }];
    selectedTabIndex = 0;
    lastModificationInfo: ContactLastModificationInfoDto;
    formatting = AppConsts.formatting;
    checklistLeadDataSource = [];
    checklistOrderDataSource = [];
    contactLeadsDataSource: DataSource;
    contactOrdersDataSource: DataSource;
    checklistLeadId: number;
    checklistOrderId: number;
    sourceContactInfo$: Observable<GetSourceContactInfoOutput>;
    refreshSourceContactInfo: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    checklistSources = [];
    manageAllowed = false;
    defaultAffiliateRateStr;
    defaultAffiliateRateTier2Str;
    affiliateRateInitil;
    affiliateRate;
    affiliateRate2Initil;
    affiliateRate2;
    CommissionTier = CommissionTier;
    hasCommissionsFeature: boolean = this.featureCheckerService.isEnabled(AppFeatures.CRMCommissions);
    hasBankCodeFeature: boolean = this.featureCheckerService.isEnabled(AppFeatures.CRMBANKCode);
    hasCommissionsManagePermission: boolean = this.permissionCheckerService.isGranted(AppPermissions.CRMAffiliatesCommissionsManage);
    affiliateManageAllowed = this.permissionCheckerService.isGranted(AppPermissions.CRMAffiliatesManage);
    isCRMGranted = this.permissionCheckerService.isGranted(AppPermissions.CRM);
    formatPercentValue = formatPercent;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private leadProxy: LeadServiceProxy,
        private clipboardService: ClipboardService,
        private notifyService: NotifyService,
        private cacheHelper: CacheHelper,
        private cacheService: CacheService,
        private contactProxy: ContactServiceProxy,
        private contactAffiliateCodeProxy: ContactAffiliateCodeServiceProxy,
        private elementRef: ElementRef,
        private contactsService: ContactsService,
        private pipelineService: PipelineService,
        private profileService: ProfileService,
        private oDataService: ODataService,
        private loadingService: LoadingService,
        private orderProxy: OrderServiceProxy,
        private itemDetailsService: ItemDetailsService,
        private activityServiceProxy: ActivityServiceProxy,
        private featureCheckerService: FeatureCheckerService,
        private permissionCheckerService: PermissionCheckerService,
        private tenantPaymentSettingsService: TenantPaymentSettingsServiceProxy,
        public permissionChecker: AppPermissionService,
        public ls: AppLocalizationService,
        public userManagementService: UserManagementService,
        public dialogRef: MatDialogRef<PersonalDetailsDialogComponent>,
        public dialog: MatDialog,
        public appService: AppService,
        public appSession: AppSessionService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        if (abp.clock.provider.supportsMultipleTimezone)
            this.timezone = abp.timing.timeZoneInfo.iana.timeZoneId;

        this.dialogRef.beforeClosed().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '157px',
                right: '-100vw'
            });
        });

        if (this.hasCommissionsFeature) {
            this.tenantPaymentSettingsService.getCommissionSettings().subscribe((res: CommissionSettings) => {
                if (res.defaultAffiliateRate !== null)
                    this.defaultAffiliateRateStr = formatPercent(res.defaultAffiliateRate, 'en-US', '1.0-2');
                if (res.defaultAffiliateRateTier2 !== null)
                    this.defaultAffiliateRateTier2Str = formatPercent(res.defaultAffiliateRateTier2, 'en-US', '1.0-2');
            });
        }

        contactsService.contactInfoSubscribe((contactInfo: ContactInfoDto) => {
            if (contactInfo && contactInfo.id) {
                this.contactInfo = contactInfo;
                this.affiliateRateInitil = this.affiliateRate =
                    this.contactInfo.affiliateRate === null ? null : this.contactInfo.affiliateRate;
                this.affiliateRate2Initil = this.affiliateRate2 =
                    this.contactInfo.affiliateRateTier2 === null ? null : this.contactInfo.affiliateRateTier2;
                this.manageAllowed = this.permissionChecker.checkCGPermission(contactInfo.groups);

                if (!contactInfo.affiliateCodes.length)
                    contactInfo.affiliateCodes = [new ContactAffiliateCodeDto()];
                else
                    contactInfo.affiliateCodes.sort((a, b) => a.id == contactInfo.primaryAffiliateCodeId ? -1 : b.id == contactInfo.primaryAffiliateCodeId ? 1 : 0);
                if (!contactInfo.personContactInfo.xrefs.length)
                    contactInfo.personContactInfo.xrefs = [''];
                if (contactInfo.personContactInfo.stripeCustomerId)
                    this.getCheckStripeSettings().subscribe((isEnabled: boolean) => {
                        if (isEnabled)
                            this.stripeCustomerId.next(contactInfo.personContactInfo.stripeCustomerId);
                    });
                this.contactProxy.getContactLastModificationInfo(
                    contactInfo.id
                ).subscribe((lastModificationInfo: ContactLastModificationInfoDto) => {
                    this.lastModificationInfo = lastModificationInfo;
                });

                if (this.hasBankCodeFeature) {
                    this.isAdvisor.next(contactInfo.affiliateIsAdvisor);
                }
            }
        }, this.ident);

        contactsService.leadInfoSubscribe(leadInfo => {
            if (leadInfo && (!this.leadInfo || this.leadInfo.id != leadInfo.id)) {
                this.leadInfo = leadInfo;
                this.initContactLeadsDataSource();
                this.initContactOrdersDataSource();
                this.initChecklistByLead(this.leadInfo).subscribe(
                    () => this.initChecklistSources());
                this.stageColor = this.pipelineService.getStageColorByName(leadInfo.stage, ContactGroup.Client);
            }
        }, this.ident);

        if (this.showOverviewTab) {
            contactsService.verificationSubscribe(
                this.initVerificationChecklist.bind(this)
            );

            let key = this.cacheHelper.getCacheKey(
                abp.session.userId.toString(), this.ident
            );

            if (this.cacheService.exists(key))
                this.overviewPanelSetting = this.cacheService.get(key);
        }
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0', 'without-shadow');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '155px',
            right: '-100vw'
        });

        this.sourceContactInfo$ = combineLatest(
            this.contactsService.leadInfo$.pipe(
                filter(Boolean),
                map((leadInfo: LeadInfoDto) => leadInfo.contactGroupId),
                distinctUntilChanged()
            ),
            this.contactsService.contactId$.pipe(distinctUntilChanged()),
            this.refreshSourceContactInfo.asObservable()
        ).pipe(
            switchMap(([contactGroupId, contactId,]: [string, number, null]) =>
                this.contactProxy.getSourceContactInfo(contactId)
            )
        );
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize('425px', 'calc(100vh - 218px)');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: '218px',
                    right: '0px'
                });
            }, 100);
            (this.tabGroup?._tabHeader as MatTabHeader).updatePagination();
        });
    }

    getCheckStripeSettings(): Observable<boolean> {
        let storageKey = 'stripeIsConnected' + this.appSession.tenantId,
            isConnected = sessionStorage.getItem(storageKey);
        if (isConnected != null)
            return of(!!isConnected);
        else if (
            abp.features.isEnabled(AppFeatures.CRMPayments) && (
                this.permissionCheckerService.isGranted(AppPermissions.CRMSettingsConfigure) ||
                this.permissionCheckerService.isGranted(AppPermissions.AdministrationTenantSettings) ||
                this.permissionCheckerService.isGranted(AppPermissions.AdministrationHostSettings)
            )
        )
            return this.tenantPaymentSettingsService.getStripeSettings(false, false).pipe(map(res => {
                isConnected = (res.apiKey || res.isConnectedAccountSetUpCompleted ? 'true' : '');
                sessionStorage.setItem(storageKey, isConnected);
                return !!isConnected;
            }));
        else
            return of(false);
    }

    updateAffiliateRate(value: number, valueProp, valueInitialProp, tier) {
        ContactsHelper.showConfirmMessage(
            this.ls.l(value >= 0 ? 'ChangeCommissionRate' : 'ClearCommissionRate'),
            (isConfirmed: boolean, [updatePending]: boolean[]) => {
                if (isConfirmed) {
                    this[valueProp] = value >= 0 ? value : null;
                    this.contactProxy.updateAffiliateRate(new UpdateContactAffiliateRateInput({
                        contactId: this.contactInfo.id,
                        updatePendingCommissions: updatePending,
                        affiliateRate: this[valueProp],
                        commissionTier: tier
                    })).subscribe(() => {
                        this[valueInitialProp] = this[valueProp];
                        this.notifyService.info(this.ls.l('SavedSuccessfully'));
                    }, () => {
                        this[valueProp] = this[valueInitialProp];
                    });
                } else
                    this[valueProp] = this[valueInitialProp];
            },
            [{ text: this.ls.l('AssignCommissionRateForPending'), visible: true, checked: true }]
        );
    }

    initChecklistByOrder(order: any): Observable<any> {
        let orderId = order.id || order.Id;
        if (orderId == this.checklistOrderId)
            return of(this.checklistOrderDataSource);

        this.checklistOrderId = order.id || order.Id;
        return this.initChecklistDataSource(
            AppConsts.PipelinePurposeIds.order,
            this.ls.l('Post-sale Checklist'),
            order.Stage,
            order.contactGroupId || order.ContactGroupId
        ).pipe(
            switchMap((dataSource: any[]) => this.loadChecklistPoints(dataSource, true))
        );
    }

    initChecklistByLead(lead: any): Observable<any> {
        let leadId = lead.id || lead.Id;
        if (leadId == this.checklistLeadId)
            return of(this.checklistLeadDataSource);

        this.checklistLeadId = leadId;
        return this.initChecklistDataSource(
            AppConsts.PipelinePurposeIds.lead,
            this.ls.l('Pre-sale Checklist'),
            lead.stage || lead.Stage,
            lead.contactGroupId || lead.ContactGroupId
        ).pipe(
            switchMap((dataSource: any[]) => this.loadChecklistPoints(dataSource))
        );
    }

    loadChecklistPoints(dataSource, isOrder = false): Observable<any> {
        let stages = dataSource[0].items;
        if (!stages || !stages.length) {
            if (isOrder)
                this.checklistOrderDataSource = [];
            else
                this.checklistLeadDataSource = [];
            return of([]);
        }

        if (isOrder)
            return this.orderProxy.getStageChecklistPoints(
                this.checklistOrderId, stages.map(item => item.key)
            ).pipe(map(checklist => {
                return this.checklistOrderDataSource = this.initSelectedChecklist(checklist, stages, dataSource);
            }));
        else
            return this.leadProxy.getStageChecklistPoints(
                this.checklistLeadId, stages.map(item => item.key)
            ).pipe(map(checklist => {
                return this.checklistLeadDataSource = this.initSelectedChecklist(checklist, stages, dataSource);
            }));
    }

    initSelectedChecklist(checklist, stages, dataSource) {
        let selectedCount = 0;
        checklist.forEach(item => {
            stages.some(stage => {
                if (stage.key == item.stageId) {
                    (stage.items || []).some(point => {
                        if (point.id == item.id) {
                            point.date = item.completionTime;
                            if (point.selected = item.isDone)
                                selectedCount++;
                            return true;
                        }
                    });
                    return true;
                }
            });
        });
        dataSource[0].total = checklist.length;
        dataSource[0].progress = selectedCount;
        return dataSource;
    }

    initAgendaDataSource() {
        if (this.contactInfo.personContactInfo.userId)
            this.agendaUserDataSource = new DataSource({
                paginate: false,
                requireTotalCount: false,
                key: 'id',
                load: (options) => {
                    let filterStartDate = this.getStartDate(),
                        filterEndDate = this.getEndDate();
                    return this.activityServiceProxy.getAll(
                        this.contactInfo.personContactInfo.userId,
                        undefined,
                        filterStartDate,
                        filterEndDate
                    ).toPromise().then(response => {
                        return response.map((item: any) => {
                            item.displayEndDate = this.isSameDate(filterEndDate, item.endDate) ? item.endDate : filterEndDate;
                            item.fieldTimeZone = 'Etc/UTC';
                            return item;
                        });
                    });
                }
            });

        this.agendaContactDataSource = new DataSource({
            paginate: false,
            requireTotalCount: false,
            key: 'id',
            load: (options) => {
                let filterStartDate = this.getStartDate(),
                    filterEndDate = this.getEndDate();
                return this.activityServiceProxy.getAll(
                    undefined,
                    this.contactInfo.id,
                    filterStartDate,
                    filterEndDate
                ).toPromise().then(response => {
                    return response.map((item: any) => {
                        item.displayEndDate = this.isSameDate(filterEndDate, item.endDate) ? item.endDate : filterEndDate;
                        item.fieldTimeZone = 'Etc/UTC';
                        return item;
                    });
                });
            }
        });
    }

    getDateWithTimezone(value) {
        return new Date(moment(value).format('YYYY-MM-DD HH:mm:ss'));
    }

    initContactLeadsDataSource() {
        if (this.contactInfo && this.contactInfo.id && !this.contactLeadsDataSource)
            this.contactLeadsDataSource = new DataSource({
                paginate: false,
                requireTotalCount: false,
                store: new ODataStore({
                    key: 'Id',
                    url: this.oDataService.getODataUrl('Lead'),
                    version: AppConsts.ODataVersion,
                    beforeSend: (request) => {
                        request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        request.params.$select = ['Id', 'Name', 'Stage', 'LeadDate', 'ContactGroupId'];
                        request.params.$filter = 'CustomerId eq ' + this.contactInfo.id;
                        request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    }
                })
            });
    }

    initContactOrdersDataSource() {
        if (this.contactInfo && this.contactInfo.id && !this.contactOrdersDataSource) {
            this.contactOrdersDataSource = new DataSource({
                paginate: false,
                requireTotalCount: false,
                store: new ODataStore({
                    key: 'Id',
                    url: this.oDataService.getODataUrl('Order'),
                    version: AppConsts.ODataVersion,
                    beforeSend: (request) => {
                        request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        request.params.$select = ['Id', 'Number', 'Name', 'Stage', 'OrderDate', 'ContactGroupId'];
                        request.params.$filter = 'ContactId eq ' + this.contactInfo.id + ' and LeadId eq ' + this.checklistLeadId;
                        request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    },
                    onLoaded: (data: any[]) => {
                        if (data.length) {
                            let params = (this.route.queryParams as BehaviorSubject<Params>).getValue(),
                                orderId = params && params['orderId'] && parseInt(params['orderId']),
                                order = orderId ? data.filter(item => item.Id == orderId)[0] : data[0];
                            if (!order)
                                order = data[0];
                            this.initChecklistByOrder(order).subscribe(
                                () => this.initChecklistSources());
                        } else
                            this.checklistOrderId = null;
                    }
                })
            });
        }
    }

    initChecklistDataSource(
        purposeId: string,
        rootName: string,
        stageName: string,
        contactGroupId: ContactGroup = ContactGroup.Client
    ): Observable<any> {
        return this.pipelineService.getPipelineDefinitionObservable(
            purposeId, purposeId == AppConsts.PipelinePurposeIds.order ? undefined : contactGroupId
        ).pipe(
            filter(Boolean), first(),
            takeUntil(this.dialogRef.beforeClosed()),
            map((pipeline: PipelineDto) => {
                let rootItem: any = {
                    id: 'root',
                    text: rootName.toUpperCase(),
                    selected: false,
                    expanded: true,
                    disabled: false,
                    items: []
                };
                pipeline.stages.forEach((stage: StageDto) => {
                    if (stage.checklistPoints)
                        rootItem.items.push({
                            key: stage.id,
                            id: 'stage-' + stage.id,
                            text: stage.name,
                            selected: false,
                            expanded: true,
                            disabled: false,
                            items: stage.checklistPoints.sort((prev, next) => {
                                return prev.sortOrder > next.sortOrder ? 1 : -1;
                            }).map(point => {
                                return {
                                    id: point.id,
                                    text: point.name,
                                    disabled: stage.name != stageName,
                                    sortOrder: point.sortOrder
                                };
                            })
                        });
                });
                return [rootItem];
            })
        );
    }

    getTabContentHeight(subtract = 0) {
        return innerHeight - 290 - subtract + 'px';
    }

    initVerificationChecklist(): void {
        let person = this.contactInfo.personContactInfo.person;
        let contactDetails = this.contactInfo.personContactInfo.details;
        this.verificationChecklist = [
            this.getVerificationChecklistItem(
                VerificationChecklistItemType.Identity,
                person && person.identityConfirmationDate
                    ? VerificationChecklistItemStatus.success
                    : VerificationChecklistItemStatus.unsuccess
            ),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.emails, VerificationChecklistItemType.Email),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.phones, VerificationChecklistItemType.Phone),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.addresses, VerificationChecklistItemType.Address),
            this.getVerificationChecklistItem(VerificationChecklistItemType.Employment),
            this.getVerificationChecklistItem(VerificationChecklistItemType.Income)
        ];
    }

    private getVerificationChecklistItem(type: VerificationChecklistItemType,
        status?: VerificationChecklistItemStatus, confirmedCount?, totalCount?): VerificationChecklistItem {
        return {
            type: type,
            status: status,
            confirmedCount: confirmedCount,
            totalCount: totalCount
        } as VerificationChecklistItem;
    }

    private getVerificationChecklistItemByMultipleValues(items: any[],
        type: VerificationChecklistItemType
    ): VerificationChecklistItem {
        let confirmedCount = 0;
        items.forEach(i => {
            if (i.isConfirmed)
                confirmedCount++;
        });
        return this.getVerificationChecklistItem(
            type,
            confirmedCount > 0 ? VerificationChecklistItemStatus.success
                : VerificationChecklistItemStatus.unsuccess,
            confirmedCount,
            items.length
        );
    }

    toggleSectionVisibility(event, section) {
        event.stopPropagation();
        this.overviewPanelSetting[section] = event.target.checked;
        this.cacheService.set(this.cacheHelper.getCacheKey(
            abp.session.userId.toString(), this.ident
        ), this.overviewPanelSetting);
    }

    toggleConfigMode() {
        this.configMode = !this.configMode;
    }

    deleteItem(item) {
        switch (item) {
            case this.ls.l('AffiliateRate'):
                this.updateAffiliateRate(undefined, 'affiliateRate', 'affiliateRateInitil', CommissionTier.Tier1);
                break;
            case this.ls.l('AffiliateRateTier2'):
                this.updateAffiliateRate(undefined, 'affiliateRate2', 'affiliateRate2Initil', CommissionTier.Tier2);
                break;
        }
    }

    addEmptyAffiliateCode() {
        this.contactInfo.affiliateCodes.push(new ContactAffiliateCodeDto());
    }

    updateAffiliateCode(value, i) {
        value = value.trim();
        if (!value)
            return;
        if (this.contactInfo.affiliateCodes[i].id) {
            this.notifyService.info('Edit is not supported');
            return;
        }

        this.contactAffiliateCodeProxy.createAffiliateCode(new UpdateContactAffiliateCodeInput({
            contactId: this.contactInfo.personContactInfo.id,
            affiliateCode: value
        })).subscribe((res) => {
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.contactInfo.affiliateCodes[i].affiliateCode = value;
            this.contactInfo.affiliateCodes[i].id = res.id;
        });
    }

    deleteAffiliateCode(i) {
        this.contactAffiliateCodeProxy.deleteAffiliateCode(this.contactInfo.personContactInfo.id, this.contactInfo.affiliateCodes[i].id)
            .subscribe(() => {
                this.notifyService.info(this.ls.l('SuccessfullyDeleted'));
                this.contactInfo.affiliateCodes.splice(i, 1);
            });
    }

    updateIsAdvisor($event) {
        if (!$event.event)
            return;

        this.contactProxy.updateAffiliateIsAdvisor(new UpdateAffiliateIsAdvisorInput({
            contactId: this.contactInfo.id,
            isAdvisor: $event.value
        })).subscribe(() => {
        });
    }

    updateXref(value, index) {
        let xrefs = this.contactInfo.personContactInfo.xrefs.slice(0);
        xrefs[index] = value.trim();
        xrefs = xrefs.filter(x => !!x);

        this.contactProxy.updateXref(new UpdateContactXrefInput({
            contactId: this.contactInfo.personContactInfo.id,
            xref: null,
            xrefs: xrefs
        })).subscribe(() => {
            if (!xrefs.length)
                xrefs.push('');
            this.contactInfo.personContactInfo.xrefs = xrefs;
        });
    }

    updateCustomField(value, property) {
        if (value)
            value = value.trim();
        let initialValue = this.contactInfo.personContactInfo[property];
        this.contactInfo.personContactInfo[property] = value;

        this.contactProxy.updateCustomFields(new UpdateContactCustomFieldsInput({
            contactId: this.contactInfo.personContactInfo.id,
            customField1: this.contactInfo.personContactInfo.customField1,
            customField2: this.contactInfo.personContactInfo.customField2,
            customField3: this.contactInfo.personContactInfo.customField3,
            customField4: this.contactInfo.personContactInfo.customField4,
            customField5: this.contactInfo.personContactInfo.customField5
        })).subscribe(null, () => this.contactInfo.personContactInfo[property] = initialValue);
    }

    saveToClipboard(event, value) {
        this.clipboardService.copyFromContent(value);
        this.notifyService.info(this.ls.l('SavedToClipboard'));
        event.stopPropagation();
    }

    close() {
        this.contactsService.closeSettingsDialog();
        setTimeout(() => this.dialogRef.close(), 100);
    }

    getThumbnailSrc(thumbnailId?: string) {
        return this.profileService.getContactPhotoUrl(thumbnailId, true);
    }

    startLoading() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
    }

    finishLoading() {
        this.loadingService.finishLoading(this.elementRef.nativeElement);
    }

    onChecklistChanged(event, isOrder = false) {
        this.startLoading();
        let top = this.checklistScroll.instance.scrollTop();
        (isOrder ? this.orderProxy.updateStagePoint(new UpdateOrderStagePointInput({
            pointId: event.itemData.id,
            orderId: this.checklistOrderId,
            isDone: event.itemData.selected
        })) :
            this.leadProxy.updateLeadStagePoint(new UpdateLeadStagePointInput({
                pointId: event.itemData.id,
                leadId: this.checklistLeadId,
                isDone: event.itemData.selected
            }))
        ).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            let dataSource = isOrder ? this.checklistOrderDataSource :
                this.checklistLeadDataSource;
            dataSource[0].progress += (event.itemData.selected ? 1 : -1);
            this.loadChecklistPoints(
                dataSource, isOrder
            ).subscribe(() => {
                this.initChecklistSources();
                setTimeout(() => {
                    this.checklistScroll.instance.scrollTo(top);
                });
            });
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
        });
    }

    onLeadChanged(event) {
        if (this.checklistLeadId && event.selectedItem && event.selectedItem.Id != this.checklistLeadId) {
            this.startLoading();
            this.initChecklistByLead(event.selectedItem).pipe(
                finalize(() => this.finishLoading())
            ).subscribe(() => {
                this.initChecklistSources();
                if (this.contactOrdersDataSource)
                    this.contactOrdersDataSource.reload();
            });
        }
    }

    onContentReady(event) {
        let cmp = event.component,
            items = cmp.option('items'),
            isVisible = !!items.length;
        cmp.option('visible', isVisible);
        if (isVisible && !cmp.option('value'))
            cmp.option('value', items[0].Id);
    }

    onSelectInitialized(event) {
        setTimeout(() => event.component.repaint(), 2000);
    }

    onOrderChanged(event: any) {
        if (event.selectedItem && event.selectedItem.Id != this.checklistOrderId) {
            this.startLoading();
            let top = this.checklistScroll.instance.scrollTop();
            this.initChecklistByOrder(event.selectedItem).pipe(
                finalize(() => this.finishLoading())
            ).subscribe(() => {
                this.initChecklistSources();
                setTimeout(() => {
                    this.checklistScroll.instance.scrollTo(top);
                });
            });
        }
    }

    initChecklistSources() {
        if (this.checklistSources.length)
            this.checklistSources.forEach((source, isOrder) => {
                source.checklistId = isOrder ? this.checklistOrderId : this.checklistLeadId;
                source.checklistDataSource = isOrder ? this.checklistOrderDataSource : this.checklistLeadDataSource;
            });
        else {
            this.checklistSources = [{
                checklistId: this.checklistLeadId,
                onChange: this.onLeadChanged.bind(this),
                checklistDataSource: this.checklistLeadDataSource,
                contactDataSource: this.contactLeadsDataSource
            }];

            if (this.permissionChecker.isGranted(AppPermissions.CRMOrders))
                this.checklistSources.push({
                    checklistId: this.checklistOrderId,
                    onChange: this.onOrderChanged.bind(this),
                    checklistDataSource: this.checklistOrderDataSource,
                    contactDataSource: this.contactOrdersDataSource
                });
        }
    }

    openContactDetails(contactId: number) {
        if (contactId) {
            this.contactProxy.isAccessible(contactId).subscribe((isAccessible: boolean) => {
                if (isAccessible) {
                    /** Clear data source to avoid wrong navigating after opening the contact */
                    this.itemDetailsService.setItemsSource(
                        this.contactsService.getCurrentItemType(this.route.snapshot.queryParams),
                        null
                    );
                    setTimeout(() => this.router.navigate(
                        CrmService.getEntityDetailsLink(contactId),
                        { queryParams: this.route.snapshot.queryParams }
                    ));
                } else {
                    this.notifyService.error(this.ls.l('NoPermissionError'));
                }
            });
        }
    }

    onSourceContactChanged(contact?) {
        ContactsHelper.showConfirmMessage(
            this.ls.l(contact ? 'ReassignAffiliateContact' : 'ClearAffiliateContact'),
            (isConfirmed: boolean, [updatePending]: boolean[]) => {
                if (isConfirmed) {
                    this.contactProxy.updateAffiliateContact(
                        new UpdateAffiliateContactInput({
                            contactId: this.contactInfo.id,
                            updatePendingCommissions: this.hasCommissionsFeature
                                && this.hasCommissionsManagePermission && updatePending,
                            affiliateContactId: contact ? contact.id : null
                        })
                    ).subscribe(() => {
                        this.refreshSourceContactInfo.next(null);
                        this.notifyService.info(this.ls.l('SavedSuccessfully'));
                    });
                }
            },
            [{
                text: this.ls.l('AssignAffiliateContactForPending'),
                visible: this.hasCommissionsFeature && this.hasCommissionsManagePermission && !!contact,
                checked: !!contact
            }]
        );
        contact && this.sourceComponent.toggle();
    }

    openSourceContactList(event) {
        if (this.affiliateManageAllowed) {
            this.sourceComponent.leadId =
                this.leadInfo && this.leadInfo.id;
            this.sourceComponent.toggle();
            event.stopPropagation();
        }
    }

    removeSourceContact(event) {
        event.stopPropagation();
        this.onSourceContactChanged();
    }

    showAffiliateHistory(event) {
        event.stopPropagation();
        this.dialog.open(AffiliateHistoryDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                contactId: this.contactInfo.id
            }
        }).afterClosed().subscribe(() => {
        });
    }

    getStartDate() {
        return DateHelper.removeTimezoneOffset(new Date(this.scheduleDate), true, 'from');
    }

    getEndDate() {
        return DateHelper.removeTimezoneOffset(new Date(this.scheduleDate), true, 'to');
    }

    onSelectedTabChange(event) {
        if (event.index == this.TAB_INDEX_ACTIVITY && !this.agendaContactDataSource)
            this.initAgendaDataSource();
    }

    isSameDate(start, end) {
        if (start && end)
            return moment(start).format('MMM DD') == moment(end).format('MMM DD');
        return true;
    }

    onAppointmentFormOpening(event) {
        event.component.hideAppointmentTooltip();
        event.component.hideAppointmentPopup(false);
        this.showActivityDialog(event.appointmentData);
    }

    showActivityDialog(appointment) {
        this.dialog.open(CreateActivityDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                readOnly: true,
                appointment: {
                    Id: appointment.id,
                    AllDay: appointment.allDay,
                    StartDate: appointment.startDate,
                    EndDate: appointment.endDate,
                    Title: appointment.title,
                    Description: appointment.description,
                    Type: appointment.type
                }
            }
        });
    }

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.ident);
    }
}