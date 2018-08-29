import { Injectable, Injector } from '@angular/core';

import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { NotifyService } from '@abp/notify/notify.service';

import { AppServiceBase } from '@shared/common/app-service-base';
import { PanelMenu } from 'app/shared/layout/panel-menu';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InstanceServiceProxy, UserServiceProxy, ActivateUserForContactInput, SetupInput, TenantHostType,
    GetUserInstanceInfoOutputStatus } from '@shared/service-proxies/service-proxies';
declare let require: any;

@Injectable()
export class AppService extends AppServiceBase {
    public topMenu: PanelMenu;

    public toolbarConfig: any = null;
    public toolbarIsHidden  = false;
    public narrowingPageContentWhenFixedFilter = true;
    public showContactInfoPanel = false;
    public contactInfo: any;

    private permission: PermissionCheckerService;
    private feature: FeatureCheckerService;
    private instanceServiceProxy: InstanceServiceProxy;
    private userServiceProxy: UserServiceProxy;
    private notify: NotifyService;
    private appLocalizationService: AppLocalizationService;
    private _setToolbarTimeout: number;

    constructor(injector: Injector) {
        super(
            injector,
            'CRM',
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
