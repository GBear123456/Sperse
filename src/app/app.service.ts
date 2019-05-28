/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Subject, Observable } from 'rxjs';
import { publishReplay, refCount, map } from 'rxjs/operators';
import * as moment from 'moment';
import * as _ from 'underscore' ;

/** Application imports */
import { AppServiceBase } from '@shared/common/app-service-base';
import { PanelMenu } from 'app/shared/layout/panel-menu';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    InstanceServiceProxy,
    UserServiceProxy,
    ActivateUserForContactInput,
    SetupInput,
    GetUserInstanceInfoOutputStatus,
    TenantSubscriptionServiceProxy,
    ModuleSubscriptionInfoDtoModule,
    ModuleSubscriptionInfoDto
} from '@shared/service-proxies/service-proxies';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { NotifyService } from '@abp/notify/notify.service';

declare let require: any;

@Injectable()
export class AppService extends AppServiceBase {
    public topMenu: PanelMenu;
    public toolbarConfig: any = null;
    public toolbarIsHidden = false;
    public narrowingPageContentWhenFixedFilter = true;
    public hideSubscriptionCallback: Function;
    public showContactInfoPanel = false;
    public contactInfo: any;

    private toolbarSubject: Subject<undefined>;
    private expiredModule: Subject<string>;
    public moduleSubscriptions$: Observable<ModuleSubscriptionInfoDto[]>;
    private moduleSubscriptions: ModuleSubscriptionInfoDto[];
    public subscriptionIsFree$: Observable<boolean>;
    private permission: PermissionCheckerService;
    private feature: FeatureCheckerService;
    private instanceServiceProxy: InstanceServiceProxy;
    private userServiceProxy: UserServiceProxy;
    private notify: NotifyService;
    private appLocalizationService: AppLocalizationService;
    private _setToolbarTimeout: number;
    private _tenantSubscriptionProxy: TenantSubscriptionServiceProxy;
    private _subscriptionBarsClosed = {};
    private _subscriptionBarVisible: Boolean;

    constructor(injector: Injector) {
        super(
            injector,
            'Admin',
            [
                {
                    name: 'Admin',
                    showDescription: true,
                    showInDropdown: true,
                    footerItem: true,
                    isComingSoon: false
                },
                {
                    name: 'CFO',
                    showDescription: true,
                    showInDropdown: true,
                    focusItem: true,
                    uri: 'main',
                    isComingSoon: false
                },
                {
                    name: 'CFO',
                    showDescription: true,
                    showInDropdown: true,
                    footerItem: true,
                    uri: 'user',
                    isComingSoon: false
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
                    isComingSoon: false
                },
                {
                    name: 'PFM',
                    showDescription: true,
                    showInDropdown: true,
                    footerItem: true,
                    isComingSoon: false
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
                    isComingSoon: true
                },
                {
                    name: 'Slice',
                    showDescription: false,
                    showInDropdown: true,
                    focusItem: true,
                    isComingSoon: true
                },
                {
                    name: 'Store',
                    showDescription: false,
                    isComingSoon: true
                }
            ],
            {
                admin: require('./admin/module.config.json'),
                api: require('./api/module.config.json'),
                crm: require('./crm/module.config.json'),
                cfo: require('./cfo/module.config.json'),
                cfoPortal: require('./cfo-portal/module.config.json'),
                pfm: require('./pfm/module.config.json')
            },
        );

        this.permission = injector.get(PermissionCheckerService);
        this.feature = injector.get(FeatureCheckerService);
        this.instanceServiceProxy = injector.get(InstanceServiceProxy);
        this.userServiceProxy = injector.get(UserServiceProxy);
        this.notify = injector.get(NotifyService);
        this.appLocalizationService = injector.get(AppLocalizationService);
        this._tenantSubscriptionProxy = injector.get(TenantSubscriptionServiceProxy);

        this.toolbarSubject = new Subject<undefined>();
        if (this.isNotHostTenant()) {
            this.expiredModule = new Subject<string>();
            this.loadModeuleSubscriptions();
        }
    }

    loadModeuleSubscriptions() {
        this.moduleSubscriptions$ = this._tenantSubscriptionProxy.getModuleSubscriptions()
            .pipe(publishReplay(), refCount());
        this.moduleSubscriptions$.subscribe((res) => {
            this.moduleSubscriptions = res.sort((left, right) => {
                return left.endDate > right.endDate ? -1 : 1;
            });
            this.checkModuleExpired();
        });
        this.subscriptionIsFree$ = this.moduleSubscriptions$.pipe(
            map(subscriptions => this.checkSubscriptionIsFree(null, subscriptions))
        );
    }

    getModuleSubscription(name?: string, moduleSubscriptions = this.moduleSubscriptions) {
        let module = (name || this.getModule()).toUpperCase();
        if (moduleSubscriptions && ModuleSubscriptionInfoDtoModule[module])
            return _.find(moduleSubscriptions, (subscription) => {
                return subscription.module.includes(module);
            }) || { module: module, endDate: moment(new Date(0)) };
    }

    getSubscriptionName(module?: string) {
        let sub = this.getModuleSubscription(module);
        return sub && sub.module.replace('_', ' & ') || '';
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
        return Boolean(ModuleSubscriptionInfoDtoModule[module.toUpperCase()]);
    }

    subscriptionStatusBarIsHidden(): boolean {
        let module = this.getModule();
        if (!ModuleSubscriptionInfoDtoModule[module.toUpperCase()])
            return true;

        if (!this._subscriptionBarVisible)
            this._subscriptionBarVisible = !this.showContactInfoPanel &&
                (this.subscriptionIsExpiringSoon() || this.subscriptionInGracePeriod());

        return this._subscriptionBarsClosed[module] || !this._subscriptionBarVisible;
    }

    subscriptionIsExpiringSoon(name?: string): boolean {
        let sub = this.getModuleSubscription(name);
        if (this.hasRecurringBilling(sub))
            return false;

        if (this.isNotHostTenant() && sub && sub.endDate) {
            let diff = sub.endDate.diff(moment().utc(), 'days', true);
            return (diff > 0) && (diff <= AppConsts.subscriptionExpireNootifyDayCount);
        }
        return false;
    }

    checkSubscriptionIsFree(name?: string, moduleSubscriptions = this.moduleSubscriptions): boolean {
        let sub = this.getModuleSubscription(name, moduleSubscriptions);
        return sub && !sub.endDate;
    }

    subscriptionInGracePeriod(name?: string): boolean {
        let sub = this.getModuleSubscription(name);
        if (this.hasRecurringBilling(sub))
            return false;

        if (this.isNotHostTenant() && sub && sub.endDate) {
            let diff = moment().utc().diff(sub.endDate, 'days', true);
            return (diff > 0) && (diff <= AppConsts.subscriptionGracePeriod);
        }
        return false;
    }

    getSubscriptionExpiringDayCount(name?: string): number {
        let sub = this.getModuleSubscription(name);
        return sub && sub.endDate && Math.round(moment(
            sub.endDate).diff(moment().utc(), 'days', true));
    }

    getGracePeriodDayCount(name?: string) {
        let sub = this.getModuleSubscription(name);
        return sub && sub.endDate && Math.round(moment(sub.endDate)
            .add(AppConsts.subscriptionGracePeriod, 'days').diff(moment().utc(), 'days', true));
    }

    isNotHostTenant() {
        return abp.session.multiTenancySide == abp.multiTenancy.sides.TENANT;
    }

    hasModuleSubscription(name?: string) {
        name = (name || this.getModule()).toUpperCase();
        let module = this.getModuleSubscription(name);
        return !this.isNotHostTenant() || !module || !module.endDate ||
            this.hasRecurringBilling(module) || (module.endDate > moment().utc());
    }

    hasRecurringBilling(module) {
        return module && module.hasRecurringBilling && (moment(module.endDate).add(
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
        this._subscriptionBarVisible = undefined;
        if (this.checkModuleExpired(name)
            && !this.subscriptionInGracePeriod(name)
        ) {
            name = this.getDefaultModule();
            params = {};
        }

        super.switchModule(name, params);
    }

    expiredModuleSubscribe(callback) {
        this.expiredModule.asObservable().subscribe(callback);
    }

    updateToolbar(config) {
        clearTimeout(this._setToolbarTimeout);
        this._setToolbarTimeout = setTimeout(() => { this.toolbarConfig = config; });
    }

    setContactInfoVisibility(value: boolean) {
        this.showContactInfoPanel = value;
    }

    canSendVerificationRequest() {
        return this.permission.isGranted('Pages.CRM.ActivateUserForContact') &&
            this.permission.isGranted('Pages.CFO.ClientActivation');
    }

    requestVerification(contactId: number): Observable<number> {
        const observable = new Observable<number>((observer) => {
            abp.message.confirm(
                'Please confirm user activation',
                (isConfirmed) => {
                    if (isConfirmed) {
                        let request = new ActivateUserForContactInput();
                        request.contactId = contactId;
                        this.userServiceProxy.activateUserForContact(request).subscribe(result => {
                            let setupInput = new SetupInput();
                            setupInput.userId = result.userId;
                            this.instanceServiceProxy.setupAndGrantPermissionsForUser(setupInput).subscribe(() => {
                                abp.notify.info('User was activated and email sent successfully');
                                observer.next(result.userId);
                            }, () => { }, observer.complete);
                        }, () => observer.complete());
                    } else
                        observer.complete();
                }
            );
        });

        return observable;
    }

    redirectToCFO(userId) {
        this.instanceServiceProxy.getUserInstanceInfo(userId).subscribe(result => {
            if (result && result.id && (result.status === GetUserInstanceInfoOutputStatus.Active))
                window.open(AppConsts.appBaseUrl + '/app/cfo/' + result.id + '/start');
            else
                this.notify.error(this.appLocalizationService.ls(AppConsts.localization.CRMLocalizationSourceName, 'CFOInstanceInactive'));
        });
    }

    get isCfoLinkOrVerifyEnabled() {
        return this.feature.isEnabled('CFO.Partner')
               && !this.feature.isEnabled('PFM')
               && (
                   this.permission.isGranted('Pages.CFO.ClientInstanceAdmin')
                   || this.canSendVerificationRequest
               );
    }

    isCFOAvailable(userId) {
        return userId != null;
    }

    checkCFOClientAccessPermission() {
        return this.permission.isGranted('Pages.CFO.ClientInstanceAdmin');
    }

    toolbarSubscribe(callback) {
        return this.toolbarSubject.asObservable().subscribe(callback);
    }

    toolbarRefresh() {
        this.toolbarSubject.next();
    }
}
