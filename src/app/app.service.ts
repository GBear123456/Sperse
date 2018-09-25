import { Injectable, Injector } from '@angular/core';

import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { NotifyService } from '@abp/notify/notify.service';

import { AppServiceBase } from '@shared/common/app-service-base';
import { PanelMenu } from 'app/shared/layout/panel-menu';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InstanceServiceProxy, UserServiceProxy, ActivateUserForContactInput, SetupInput, TenantHostType,
    GetUserInstanceInfoOutputStatus, TenantSubscriptionServiceProxy, ModuleSubscriptionInfoDtoModule } from '@shared/service-proxies/service-proxies';

import { Subscription, Subject } from 'rxjs';
import * as moment from 'moment';

import * as _ from 'underscore' ;

declare let require: any;

@Injectable()
export class AppService extends AppServiceBase {
    public topMenu: PanelMenu;

    public toolbarConfig: any = null;
    public toolbarIsHidden  = false;
    public narrowingPageContentWhenFixedFilter = true;
    public showContactInfoPanel = false;
    public contactInfo: any;

    private expiredModule: Subject<string>;
    private moduleSubscriptions: any;
    private permission: PermissionCheckerService;
    private feature: FeatureCheckerService;
    private instanceServiceProxy: InstanceServiceProxy;
    private userServiceProxy: UserServiceProxy;
    private notify: NotifyService;
    private appLocalizationService: AppLocalizationService;
    private _setToolbarTimeout: number;
    private _tenantSubscriptionProxy: TenantSubscriptionServiceProxy;

    constructor(injector: Injector) {
        super(
            injector,
            'Admin',
            [
                'Admin',
                'API',
                'CFO',
                'CRM',
                'PersonalFinance',
                'Cloud',
                'Forms',
                'HR',
                'HUB',
                'Slice',
                'Store'
            ],
            {
                admin: require('./admin/module.config.json'),
                api: require('./api/module.config.json'),
                crm: require('./crm/module.config.json'),
                cfo: require('./cfo/module.config.json'),
                personalfinance: require('../personal-finance/module.config.json')
            },
        );

        this.permission = injector.get(PermissionCheckerService);
        this.feature = injector.get(FeatureCheckerService);
        this.instanceServiceProxy = injector.get(InstanceServiceProxy);
        this.userServiceProxy = injector.get(UserServiceProxy);
        this.notify = injector.get(NotifyService);
        this.appLocalizationService = injector.get(AppLocalizationService);
        this._tenantSubscriptionProxy = injector.get(TenantSubscriptionServiceProxy);

        if (this.isNotHostTenant()) {
            this.expiredModule = new Subject<string>();
            this.loadModeuleSubscriptions();
        }
    }

    loadModeuleSubscriptions() {
        this._tenantSubscriptionProxy.getModuleSubscriptions().subscribe((res) => {
            this.moduleSubscriptions = res;
            this.checkModuleExpired();
        });
    }

    getModuleSubscription(name = undefined) {
        let module = (name || this.getModule()).toUpperCase();
        if (this.moduleSubscriptions && ModuleSubscriptionInfoDtoModule[module]) {
            let subscription = {module: module};
            return _.find(this.moduleSubscriptions,
                subscription) || subscription;
        }
    }

    subscriptionIsExpiringSoon(name = undefined): boolean {
        let sub = this.getModuleSubscription(name);
        if (this.isNotHostTenant() && sub && sub.endDate) {
            let diff = sub.endDate.diff(moment().utc(), 'days', true);
            return (diff > 0) && (diff <= AppConsts.subscriptionExpireNootifyDayCount);
        }
        return false;
    }

    subscriptionInGracePeriod(name = undefined): boolean {
        let sub = this.getModuleSubscription(name);
        if (this.isNotHostTenant() && sub && sub.endDate) {
            let diff = moment().utc().diff(sub.endDate, 'days', true);
            return (diff > 0) && (diff <= AppConsts.subscriptionGracePeriod);
        }
        return false;
    }

    getSubscriptionExpiringDayCount(): number {
        let sub = this.getModuleSubscription();
        return sub && sub.endDate && Math.round(moment(
            sub.endDate).diff(moment().utc(), 'days', true));
    }

    getGracePeriodDayCount() {
        let sub = this.getModuleSubscription();
        return sub && sub.endDate && Math.round(moment(sub.endDate)
            .add(AppConsts.subscriptionGracePeriod, 'days').diff(moment().utc(), 'days', true));
    }

    isNotHostTenant() {
        return abp.session.multiTenancySide == abp.multiTenancy.sides.TENANT;
    }

    hasModuleSubscription(name = undefined) {
        name = (name || this.getModule()).toUpperCase();
        let module = this.getModuleSubscription(name);
        return !this.isNotHostTenant() || !module || 
            !module.endDate || (module.endDate > moment().utc());
    }

    checkModuleExpired(name = undefined) {
        name = name || this.getModule();
        let expired = !this.hasModuleSubscription(name);
        if (expired)
            this.expiredModule.next(name);
        return expired;
    }

    switchModule(name: string, params: {}) {
        if (this.checkModuleExpired(name)
            && !this.subscriptionInGracePeriod(name)
        ) {
            let module = this.getModule();
            name = ModuleSubscriptionInfoDtoModule[module] ? this.getDefaultModule() : module;
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
        return this.feature.isEnabled('CFO.Partner') &&
            this.permission.isGranted('Pages.CRM.ActivateUserForContact') &&
            this.permission.isGranted('Pages.CFO.ClientActivation');
    }

    requestVerification(contactId: number) {
        abp.message.confirm(
            'Please confirm user activation',
            (isConfirmed) => {
                if (isConfirmed) {
                    let request = new ActivateUserForContactInput();
                    request.contactId = contactId;
                    request.tenantHostType = <any>TenantHostType.PlatformUi;
                    this.userServiceProxy.activateUserForContact(request).subscribe(result => {
                        let setupInput = new SetupInput({ userId: result.userId });
                        this.instanceServiceProxy.setupAndGrantPermissionsForUser(setupInput).subscribe(result => {
                            abp.notify.info('User was activated and email sent successfully');
                        });
                    });
                }
            }
        );
    }

    redirectToCFO(userId) {
        this.instanceServiceProxy.getUserInstanceInfo(userId).subscribe(result => {
            if (result && result.id && (result.status === GetUserInstanceInfoOutputStatus.Active))
                window.open(abp.appPath + 'app/cfo/' + result.id + '/start');
            else
                this.notify.error(this.appLocalizationService.ls(AppConsts.localization.CRMLocalizationSourceName, 'CFOInstanceInactive'));
        });
    }

    isCFOAvailable(userId) {
        return ((userId != null) && this.checkCFOClientAccessPermission());
    }

    private checkCFOClientAccessPermission() {
        return this.permission.isGranted('Pages.CFO.ClientInstanceAdmin');
    }
}
