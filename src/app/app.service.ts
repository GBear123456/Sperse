/** Core imports */
import { Inject, Injectable, Injector } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { Subject, Observable } from 'rxjs';
import { publishReplay, refCount, map, first } from 'rxjs/operators';
import * as moment from 'moment';
import * as _ from 'underscore' ;

/** Application imports */
import { AppServiceBase } from '@shared/common/app-service-base';
import { PanelMenu } from '@app/shared/layout/top-bar/panel-menu';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    InstanceServiceProxy,
    PersonContactServiceProxy,
    RegisterMemberInput,
    InstanceStatus,
    TenantSubscriptionServiceProxy,
    ModuleType,
    ModuleSubscriptionInfoDto,
    GetUserInstanceInfoOutput
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
    private expiredModule: Subject<string>;
    public moduleSubscriptions$: Observable<ModuleSubscriptionInfoDto[]>;
    public moduleSubscriptions: ModuleSubscriptionInfoDto[];
    public paymentLink$: Observable<string>;
    public subscriptionIsFree$: Observable<boolean>;
    private permission: AppPermissionService;
    public feature: FeatureCheckerService;
    private instanceServiceProxy: InstanceServiceProxy;
    private personContactServiceProxy: PersonContactServiceProxy;
    private notify: NotifyService;
    private appLocalizationService: AppLocalizationService;
    private tenantSubscriptionProxy: TenantSubscriptionServiceProxy;
    private subscriptionBarsClosed = {};
    private subscriptionBarVisible: Boolean;
    public isCfoLinkOrVerifyEnabled: boolean;
    public isClientSearchDisabled = true;

    constructor(
        injector: Injector,
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

        this.permission = injector.get(AppPermissionService);
        this.feature = injector.get(FeatureCheckerService);
        this.instanceServiceProxy = injector.get(InstanceServiceProxy);
        this.personContactServiceProxy = injector.get(PersonContactServiceProxy);
        this.notify = injector.get(NotifyService);
        this.appLocalizationService = injector.get(AppLocalizationService);
        this.tenantSubscriptionProxy = injector.get(TenantSubscriptionServiceProxy);
        this.isCfoLinkOrVerifyEnabled = this.feature.isEnabled(AppFeatures.CFOPartner)
            && !this.feature.isEnabled(AppFeatures.PFM)
            && this.permission.isGranted(AppPermissions.CFOMembersAdministration);

        this.toolbarSubject = new Subject<undefined>();
        if (!this.isHostTenant && abp.session.userId) {
            this.expiredModule = new Subject<string>();
            this.loadModuleSubscriptions();
        }
        this.toolbarIsHidden$.subscribe((hidden: boolean) => {
            this.document.body.classList[hidden ? 'add' : 'remove']('toolbar-hidden');
        });
    }

    loadModuleSubscriptions() {
        this.moduleSubscriptions$ = this.tenantSubscriptionProxy.getModuleSubscriptions()
            .pipe(map(subs => {
                if (subs.every(sub => sub.statusId == 'C'))
                    return subs.filter(sub => sub.isUpgradable);
                else
                    return subs.filter(sub => sub.statusId != 'C');
            }), publishReplay(), refCount());
        this.moduleSubscriptions$.subscribe((res: ModuleSubscriptionInfoDto[]) => {
            this.moduleSubscriptions = res.sort((left: ModuleSubscriptionInfoDto, right: ModuleSubscriptionInfoDto) => {
                return left.endDate > right.endDate ? -1 : 1;
            });
            this.checkModuleExpired();
        });
        this.subscriptionIsFree$ = this.moduleSubscriptions$.pipe(
            map(subscriptions => this.checkSubscriptionIsFree(null, subscriptions))
        );

        this.paymentLink$ = this.tenantSubscriptionProxy.getStripePaymentLinkForFirstInvoice();
    }

    checkAllSubscriptionsExpired() {
        this.moduleSubscriptions$.pipe(first()).subscribe((subs: ModuleSubscriptionInfoDto[]) => {
            if (!subs.filter(sub => sub.isUpgradable).some(sub => this.hasModuleSubscription(sub.module))) {
                if (!subs.length || subs.some(sub => sub.module == ModuleType.CFO_CRM))
                    this.expiredModule.next(ModuleType.CFO_CRM);
                else if (subs.some(sub => sub.module.includes(ModuleType.CRM)))
                    this.expiredModule.next(ModuleType.CRM);
                else if (subs.some(sub => sub.module.includes(ModuleType.CFO)))
                    this.expiredModule.next(ModuleType.CFO);
            }
        });
    }

    getModuleSubscription(name?: string, moduleSubscriptions: ModuleSubscriptionInfoDto[] = this.moduleSubscriptions): ModuleSubscriptionInfoDto {
        let module = (name || this.getModule()).toUpperCase();
        if (moduleSubscriptions && ModuleType[module])
            return _.find(moduleSubscriptions, (subscription: ModuleSubscriptionInfoDto) => {
                return subscription.module.includes(module)
                    || (module === 'CRM' && subscription.module === ModuleType.CFO_Partner);
            }) || { module: module, endDate: moment(new Date(0)) };
    }

    getSubscriptionName(module?: string) {
        let sub = this.getModuleSubscription(module);
        return sub && sub.module.replace('_', ' & ') || '';
    }

    getSubscriptionStatusByModuleName(moduleName: string) {
        return this.getSubscriptionStatusBySubscription(this.getModuleSubscription(moduleName));
    }

    getSubscriptionStatusBySubscription(subscription: ModuleSubscriptionInfoDto) {
        return subscription.isTrial
                ? this.appLocalizationService.l('trial')
                : this.appLocalizationService.l('subscription');
    }

    subscriptionIsLocked(name?: string) {
        const subscription = this.getModuleSubscription(name);
        return subscription && subscription.isLocked;
    }

    getSubscriptionTrackingCode(name?: string) {
        const subscription = this.getModuleSubscription(name);
        return subscription && subscription.trackingCode;
    }

    checkModuleSubscriptionEnabled() {
        let module = this.getModule();
        return Boolean(ModuleType[module.toUpperCase()]);
    }

    subscriptionStatusBarIsHidden(): boolean {
        let module = this.getModule();
        if (!ModuleType[module.toUpperCase()])
            return true;

        if (!this.subscriptionBarVisible)
            this.subscriptionBarVisible = !this.showContactInfoPanel.value &&
                (this.subscriptionIsExpiringSoon() || this.subscriptionInGracePeriod());

        return this.subscriptionBarsClosed[module] || !this.subscriptionBarVisible;
    }

    subscriptionIsExpiringSoon(name?: string): boolean {
        let sub = this.getModuleSubscription(name);
        if (this.hasRecurringBilling(sub))
            return false;

        if (!this.isHostTenant && sub && sub.endDate) {
            let diff = sub.endDate.diff(moment().utc(), 'days', true);
            return (diff > 0) && (diff <= AppConsts.subscriptionExpireNootifyDayCount);
        }
        return false;
    }

    checkSubscriptionIsFree(name?: string, moduleSubscriptions: ModuleSubscriptionInfoDto[] = this.moduleSubscriptions): boolean {
        let sub = this.getModuleSubscription(name, moduleSubscriptions);
        return sub && !sub.endDate;
    }

    subscriptionInGracePeriod(name?: string): boolean {
        let sub = this.getModuleSubscription(name);
        if (this.hasRecurringBilling(sub))
            return false;

        if (!this.isHostTenant && sub && !sub.isLocked && sub.endDate) {
            let diff = moment().utc().diff(sub.endDate, 'days', true);
            return (diff > 0) && (diff <= this.getGracePeriod(sub));
        }
        return false;
    }

    getGracePeriod(subscription: ModuleSubscriptionInfoDto) {
        return subscription.isLocked ? 0 :
            (subscription && subscription.hasRecurringBilling
              ? AppConsts.subscriptionRecurringBillingPeriod
              : 0
            ) + AppConsts.subscriptionGracePeriod;
    }

    getSubscriptionExpiringDayCount(name?: string): number {
        let sub = this.getModuleSubscription(name);
        return sub && sub.endDate && Math.round(moment(sub.endDate)
            .diff(moment().utc(), 'days', true));
    }

    getGracePeriodDayCount(name?: string) {
        let sub = this.getModuleSubscription(name);
        return sub && !sub.isLocked && sub.endDate && Math.round(moment(sub.endDate)
            .add(AppConsts.subscriptionGracePeriod, 'days').diff(moment().utc(), 'days', true));
    }

    hasModuleSubscription(name?: string) {
        name = (name || this.getModule()).toUpperCase();
        let module = this.getModuleSubscription(name);

        if (module && module.statusId == 'C')
            return false;

        return this.isHostTenant || !module || !module.endDate ||
            this.hasRecurringBilling(module) || (module.endDate > moment().utc());
    }

    hasRecurringBilling(module: ModuleSubscriptionInfoDto): boolean {
        return module && module.hasRecurringBilling && !module.isLocked && (moment(module.endDate).add(
            AppConsts.subscriptionRecurringBillingPeriod, 'days') > moment().utc());
    }

    checkModuleExpired(name?: string) {
        name = name || this.getModule();
        let expired = !this.hasModuleSubscription(name);
        if (expired)
            this.expiredModule.next(name);

        return expired;
    }

    switchModule(name: string, params = {}) {
        this.subscriptionBarVisible = undefined;
        if (this.checkModuleExpired(name)
            && !this.subscriptionInGracePeriod(name)
        ) {
            name = this.getDefaultModule();
            params = {};
        }

        super.switchModule(name, params);
    }

    expiredModuleSubscribe(callback) {
        if (this.expiredModule)
            this.expiredModule.asObservable().subscribe(callback);
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

    isFeatureEnable(featureName: AppFeatures): boolean {
        return this.isHostTenant || !featureName || this.feature.isEnabled(featureName);
    }
}