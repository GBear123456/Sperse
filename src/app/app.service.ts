/** Core imports */
import { Inject, Injectable, Injector } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { Subject, Observable } from 'rxjs';
import { publishReplay, refCount, map, first, filter } from 'rxjs/operators';
import * as moment from 'moment';
import * as _ from 'underscore' ;

/** Application imports */
import { AppStore } from '@app/store';
import { select, Store } from '@ngrx/store';
import { ContactGroup } from '@shared/AppEnums';
import { PipelinesStoreSelectors } from '@app/crm/store';
import { AppServiceBase } from '@shared/common/app-service-base';
import { PanelMenu } from '@app/shared/layout/top-bar/panel-menu';
import { AppConsts } from '@shared/AppConsts';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    PaymentPeriodType,
    InstanceServiceProxy,
    PersonContactServiceProxy,
    RegisterMemberInput,
    InstanceStatus,
    TenantSubscriptionServiceProxy,
    ModuleType,
    ModuleSubscriptionInfoDto,
    GetUserInstanceInfoOutput,
    PipelineDto
} from '@shared/service-proxies/service-proxies';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { FeatureCheckerService } from 'abp-ng2-module';
import { NotifyService } from 'abp-ng2-module';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { AdminConfig } from '@admin/admin.config';
import { ApiConfig } from '@app/api/api.config';
import { CrmConfig } from '@app/crm/crm.config';
import { CfoConfig } from '@app/cfo/cfo.config';
import { CfoPortalConfig } from '@app/cfo-portal/cfo-portal.config';
import { PfmConfig } from '@app/pfm/pfm.config';
import { BehaviorSubject } from '@node_modules/rxjs';
import { SliceConfig } from '@app/shared/common/slice/slice.config';
import { HubConfig } from '@app/hub/hub.config';

@Injectable()
export class AppService extends AppServiceBase {
    public topMenu: PanelMenu;
    public toolbarIsHidden: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public toolbarIsHidden$: Observable<boolean> = this.toolbarIsHidden.asObservable();
    public narrowingPageContentWhenFixedFilter = true;
    public hideSubscriptionCallback: Function;
    private showContactInfoPanel: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public showContactInfoPanel$: Observable<boolean> = this.showContactInfoPanel.asObservable();
    public clientSearchPhrase: BehaviorSubject<string> = new BehaviorSubject<string>('');
    public clientSearchToggle: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public contactInfo: any;

    private toolbarSubject: Subject<undefined>;
    public moduleSubscriptions$: Observable<ModuleSubscriptionInfoDto[]>;
    public moduleSubscriptions: ModuleSubscriptionInfoDto[];
    public subscriptionIsFree$: Observable<boolean>;
    private permission: AppPermissionService;
    public feature: FeatureCheckerService;
    private instanceServiceProxy: InstanceServiceProxy;
    private personContactServiceProxy: PersonContactServiceProxy;
    private notify: NotifyService;
    private appLocalizationService: AppLocalizationService;
    public tenantSubscriptionProxy: TenantSubscriptionServiceProxy;
    private subscriptionBarsClosed = {};
    private subscriptionBarVisible: Boolean;
    public isCfoLinkOrVerifyEnabled: boolean;
    public isClientSearchDisabled = true;
    public defaultSubscriptionModule = ModuleType.CRM;

    constructor(
        injector: Injector,
        public layoutService: LayoutService,
        private store$: Store<AppStore.State>,
        @Inject(DOCUMENT) private document: Document,
    ) {
        super(
            injector,
            'Admin',
            [
                {
                    name: 'Admin',
                    showDescription: true,
                    showInDropdown: true,
                    focusItem: true,
                    isComingSoon: false
                },
                {
                    name: 'CFO',
                    showDescription: true,
                    showInDropdown: true,
                    uri: 'main',
                    isComingSoon: false
                },
                {
                    name: 'CFO',
                    showDescription: true,
                    showInDropdown: true,
                    footerItem: true,
                    uri: 'user',
                    isComingSoon: false,
                    isMemberPortal: true
                },
                {
                    name: 'CRM',
                    showDescription: true,
                    showInDropdown: true,
                    focusItem: true,
                    isComingSoon: false
                },
                {
                    name: 'PFM',
                    showDescription: true,
                    showInDropdown: true,
                    isComingSoon: false
                },
                {
                    name: 'API',
                    showDescription: true,
                    showInDropdown: true,
                    focusItem: true,
                    isComingSoon: false
                },
                {
                    name: 'PFM',
                    showDescription: true,
                    showInDropdown: true,
                    footerItem: true,
                    isComingSoon: false,
                    isMemberPortal: true
                },
                {
                    name: 'BankCode',
                    showDescription: false,
                    showInDropdown: true,
                    footerItem: true,
                    isComingSoon: false,
                    isMemberPortal: true
                },
                {
                    name: 'Cloud',
                    showDescription: true,
                    isComingSoon: true
                },
                {
                    name: 'Forms',
                    showDescription: false,
                    isComingSoon: true
                },
                {
                    name: 'HR',
                    showDescription: false,
                    isComingSoon: true
                },
                {
                    name: 'HUB',
                    showDescription: false,
                    showInDropdown: true,
                    isComingSoon: false
                },
                {
                    name: 'Slice',
                    showDescription: false,
                    showInDropdown: true,
                    isComingSoon: true,
                    focusItem: false
                },
                {
                    name: 'Store',
                    showDescription: false,
                    isComingSoon: true
                },
                {
                    name: 'MemberPortal',
                    showDescription: false,
                    showInDropdown: true,
                    footerItem: true,
                    isMemberPortal: true
                }
            ],
            {
                admin: new AdminConfig(),
                api: new ApiConfig(),
                crm: new CrmConfig(),
                cfo: new CfoConfig(),
                cfoPortal: new CfoPortalConfig(),
                pfm: new PfmConfig(),
                slice: new SliceConfig(),
                hub: new HubConfig()
            },
        );

        this.store$.pipe(
            select(PipelinesStoreSelectors.getPipelines({
                purpose: AppConsts.PipelinePurposeIds.lead
            })),
            filter((pipelines: PipelineDto[]) => !!pipelines),
            map((pipelines: PipelineDto[]) => {
                return pipelines.map((pipeline: PipelineDto) => {
                    let contactGroup = Object.keys(ContactGroup).find(
                        key => ContactGroup[key] == pipeline.contactGroupId
                    );
                    return {
                        title: pipeline.name,
                        route: '/app/crm/leads',
                        permission: AppPermissions['CRM' + contactGroup + 's'],
                        params: {pipelineId: pipeline.id, contactGroup: contactGroup}
                    };
                });
            }), first()
        ).subscribe((leadsMenuItems: any[]) => {
            this.getModuleConfig('CRM').navigation.find(
                item => item.text == 'Leads'
            ).items = leadsMenuItems;
            this.initModule();
        });

        this.permission = injector.get(AppPermissionService);
        this.feature = injector.get(FeatureCheckerService);
        this.instanceServiceProxy = injector.get(InstanceServiceProxy);
        this.personContactServiceProxy = injector.get(PersonContactServiceProxy);
        this.notify = injector.get(NotifyService);
        this.appLocalizationService = injector.get(AppLocalizationService);
        this.tenantSubscriptionProxy = injector.get(TenantSubscriptionServiceProxy);
        this.isCfoLinkOrVerifyEnabled = this.feature.isEnabled(AppFeatures.CFOPartner)
            && !this.feature.isEnabled(AppFeatures.PFM)
            && this.permission.isGranted(AppPermissions.CFOMembersAdministration)
            && !!this.appSession.application.modules["CFO"];

        this.toolbarSubject = new Subject<undefined>();
        if (!this.isHostTenant && abp.session.userId) {
            this.loadModuleSubscriptions();
        }
        this.toolbarIsHidden$.subscribe((hidden: boolean) => {
            this.document.body.classList[hidden ? 'add' : 'remove']('toolbar-hidden');
        });
    }

    loadModuleSubscriptions() {
        this.moduleSubscriptions$ = this.tenantSubscriptionProxy.getModuleSubscriptions()
            .pipe(map(subs => {
                if (subs.some(sub => sub.statusId !== 'C'))
                    return subs.filter(sub => sub.statusId != 'C');
                return subs;
            }), publishReplay(), refCount());
        this.moduleSubscriptions$.subscribe((res: ModuleSubscriptionInfoDto[]) => {
            this.moduleSubscriptions = res.sort((left: ModuleSubscriptionInfoDto, right: ModuleSubscriptionInfoDto) => {
                const isLeftSignupGroup = left.productGroup && this.checkSignUpOrMainGroups(left.productGroup),
                    isRightSignupGroup = right.productGroup && this.checkSignUpOrMainGroups(right.productGroup);
                if (isLeftSignupGroup && isRightSignupGroup ||
                    !isLeftSignupGroup && !isRightSignupGroup
                ) return left.endDate > right.endDate ? -1 : 1;
                else if (isLeftSignupGroup)
                    return -1;
                else
                    return 1;
            });
        });
        this.subscriptionIsFree$ = this.moduleSubscriptions$.pipe(
            map(subscriptions => this.checkSubscriptionIsFree())
        );
    }

    checkSignUpOrMainGroups(group: string): Boolean {
        return this.checkGroupIncluded([
            AppConsts.PRODUCT_GROUP_SIGNUP, 
            AppConsts.PRODUCT_GROUP_MAIN
        ], group);
    }

    checkGroupIncluded(groups: string[], group: string): Boolean {
        return groups.includes(group.toLowerCase());
    }    

    checkSubscriptionsGroups(
        productGroups: string[]
    ) {
        return this.moduleSubscriptions.some(item => item.productGroup && this.checkGroupIncluded(productGroups, item.productGroup));
    }

    getModuleSubscription(
        name: string = this.defaultSubscriptionModule, 
        productGroups: string[] = [AppConsts.PRODUCT_GROUP_SIGNUP, AppConsts.PRODUCT_GROUP_MAIN],
        hasCrmFeature: boolean = true
    ): ModuleSubscriptionInfoDto {
        let module = name.toUpperCase(), 
            moduleSubscriptions: ModuleSubscriptionInfoDto[] = this.moduleSubscriptions && productGroups.length ?
                this.moduleSubscriptions.filter(item => item.productGroup && this.checkGroupIncluded(productGroups, item.productGroup)) :
                this.moduleSubscriptions,
            subscription;

        if (hasCrmFeature && moduleSubscriptions)
            moduleSubscriptions = moduleSubscriptions.filter(item => item.hasCrmFeature);

        if (moduleSubscriptions && moduleSubscriptions.length) {
            subscription = _.find(moduleSubscriptions, (subscription: ModuleSubscriptionInfoDto) => {
                return subscription.module.includes(module) && subscription.statusId == 'A';
            });
            if (!subscription)
                subscription = _.find(moduleSubscriptions, (subscription: ModuleSubscriptionInfoDto) => {
                    return subscription.module.includes(module) && subscription.statusId == 'D';
                });
            if (!subscription)
                subscription = _.find(moduleSubscriptions, (subscription: ModuleSubscriptionInfoDto) => {
                    return subscription.module.includes(module) && subscription.statusId == 'C';
                });
        }
        return subscription || { 
            module: module, 
            productName: module, 
            endDate: moment(new Date(0)),
            statusId: 'C'
        };
    }

    getSubscriptionName(module: string = this.defaultSubscriptionModule) {
        let sub = this.getModuleSubscription(module);
        return sub && sub.productName;
    }

    getSubscriptionStatusByModuleName(moduleName: string = this.defaultSubscriptionModule) {
        return this.getSubscriptionStatusBySubscription(this.getModuleSubscription(moduleName));
    }

    getSubscriptionStatusBySubscription(subscription: ModuleSubscriptionInfoDto) {
        return subscription.isTrial
                ? this.appLocalizationService.l('trial')
                : this.appLocalizationService.l('subscription');
    }

    subscriptionIsLocked(name: string = this.defaultSubscriptionModule) {
        const subscription = this.getModuleSubscription(name);
        return subscription && subscription.isLocked;
    }

    getSubscriptionTrackingCode(name: string = this.defaultSubscriptionModule) {
        const subscription = this.getModuleSubscription(name);
        return subscription && subscription.trackingCode;
    }

    isOneTimeExpirationSoon(name: string = this.defaultSubscriptionModule): boolean {
        let sub = this.getModuleSubscription(name);
        return sub.paymentPeriodType == PaymentPeriodType.OneTime && this.subscriptionIsExpiringSoon(name);
    }

    subscriptionIsExpiringSoon(name: string = this.defaultSubscriptionModule): boolean {
        let sub = this.getModuleSubscription(name);
        if (!this.isHostTenant && sub && sub.endDate) {
            let diff = sub.endDate.diff(moment().utc(), 'days', true);
            return (diff > 0) && (diff <= AppConsts.subscriptionExpireNootifyDayCount);
        }
        return false;
    }

    checkSubscriptionIsFree(
        name: string = this.defaultSubscriptionModule
    ): boolean {
        let sub = this.getModuleSubscription(name);
        return sub && !sub.endDate;
    }

    checkSubscriptionIsTrial(
        name: string = this.defaultSubscriptionModule
    ): boolean {
        let sub = this.getModuleSubscription(name);
        return sub && sub.statusId != 'C' && sub.isTrial;
    }

    subscriptionInGracePeriod(
        name: string = this.defaultSubscriptionModule,
        productGroups?: string[]
    ): boolean {
        let sub = this.getModuleSubscription(name, productGroups);
        return this.subscriptionInGracePeriodBySubscription(sub);
    }

    subscriptionInGracePeriodBySubscription(sub: ModuleSubscriptionInfoDto): boolean {
        if (!this.isHostTenant && sub && !sub.isLocked && sub.endDate) {
            let diff = moment().utc().diff(sub.endDate, 'days', true);
            return (diff > 0) && (diff <= this.getGracePeriod(sub));
        }
        return false;
    }

    getGracePeriod(sub: ModuleSubscriptionInfoDto) {
        return sub.endDate && sub.finalEndDate ? sub.finalEndDate.diff(sub.endDate, 'days', true) : 0;
    }

    getSubscriptionExpiringDayCount(name: string = this.defaultSubscriptionModule): number {
        let sub = this.getModuleSubscription(name);
        return sub && sub.endDate && Math.round(moment(sub.endDate)
            .diff(moment().utc(), 'days', true));
    }

    getGracePeriodDayCount(name: string = this.defaultSubscriptionModule) {
        let sub = this.getModuleSubscription(name);
        return this.getGracePeriodDayCountBySubscription(sub);
    }

    getGracePeriodDayCountBySubscription(sub) {
        return sub && !sub.isLocked && sub.endDate && Math.round(moment(sub.endDate)
            .add(this.getGracePeriod(sub), 'days').diff(moment().utc(), 'days', true));
    }

    hasModuleSubscription(
        name: string = this.defaultSubscriptionModule,
        productGroups?: string[],
        hasCrmFeature: boolean = true
    ) {
        name = name && name.toUpperCase();
        let module = this.getModuleSubscription(name, productGroups, hasCrmFeature);

        if (module && ['D', 'C'].includes(module.statusId))
            return false;

        return this.isHostTenant || !module || !module.endDate ||
            this.hasRecurringBilling(module) || (module.endDate > moment().utc());
    }

    hasRecurringBilling(module: ModuleSubscriptionInfoDto): boolean {
        return module && module.hasRecurringBilling && (moment(module.endDate).add(
            AppConsts.subscriptionRecurringBillingPeriod, 'days') > moment().utc());
    }

    hasUnconventionalSubscription() {
        let sub = this.getModuleSubscription();
        if (!sub.productId) {
            let hasActiveSubscription = this.hasModuleSubscription('', [], false);

            sub = this.getModuleSubscription('', [], false);
            if (sub.productId)
                return hasActiveSubscription &&
                    this.feature.isEnabled(AppFeatures.CRM);
            else 
                return hasActiveSubscription;
        }
        return false;
    }

    switchModule(name: string, params = {}) {
        this.subscriptionBarVisible = undefined;

        this.layoutService.checkSetModuleSettings(name);

        super.switchModule(name, params);
    }

    setContactInfoVisibility(value: boolean) {
        this.showContactInfoPanel.next(value);
    }

    canSendVerificationRequest() {
        return this.permission.isGranted(AppPermissions.CFOMembersAdministrationNewMemberRegistration);
    }

    requestVerification(contactId: number): Observable<number> {
        return new Observable<number>((observer) => {
            abp.message.confirm(
                'Please confirm user activation', '',
                (isConfirmed) => {
                    if (isConfirmed) {
                        let request = new RegisterMemberInput();
                        request.contactId = contactId;
                        request.channelCode = 'CRM';
                        this.instanceServiceProxy.registerMember(request).subscribe((result) => {
                            abp.notify.info('User was activated and email sent successfully');
                            observer.next(result.userId);
                        }, () => { }, observer.complete);
                    } else
                        observer.complete();
                }
            );
        });
    }

    redirectToCFO(userId: number) {
        this.instanceServiceProxy.getUserInstanceInfo(userId).subscribe((result: GetUserInstanceInfoOutput) => {
            if (result && result.id && (result.status === InstanceStatus.Active))
                window.open(AppConsts.appBaseUrl + '/app/cfo/' + result.id + '/start');
            else
                this.notify.error(this.appLocalizationService.ls(AppConsts.localization.CRMLocalizationSourceName, 'CFOInstanceInactive'));
        });
    }

    checkCFOClientAccessPermission() {
        return this.permission.isGranted(AppPermissions.CFOMembersAdministrationAllMemberInstancesAdmin);
    }

    toolbarToggle() {
        this.toolbarIsHidden.next(!this.toolbarIsHidden.value);
    }

    toolbarRefresh() {
        this.toolbarSubject.next();
    }

    isFeatureEnable(featureName: AppFeatures | string): boolean {
        return this.isHostTenant || !featureName || featureName.split('&').every(item => {
            let itemValue: any = this.feature.getValue(item);
            if (isNaN(itemValue))
                return this.feature.isEnabled(item);
            else {
                return !!parseFloat(itemValue);
            }
        });
    }

    getFeatureCount(feature: AppFeatures, forced = false) {
        return !forced && this.isHostTenant ? AppConsts.infinityFeatureCount : +abp.features.getValue(feature);
    }
}