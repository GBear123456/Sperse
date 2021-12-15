/** Core imports */
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import capitalize from 'lodash/capitalize';

/** Application imports */
import { AppService } from '@app/app.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { CFOServiceBase } from 'shared/cfo/cfo-service-base';
import {
    InstanceServiceProxy,
    InstanceType,
    InstanceStatus,
    ContactServiceProxy,
    GetStatusOutput,
    ContactShortInfo
} from 'shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';
import { InstanceModel } from '@shared/cfo/instance.model';
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppFeatures } from '@shared/AppFeatures';
import { ConfigInterface } from '@app/shared/common/config.interface';

@Injectable()
export class CFOService extends CFOServiceBase {
    instance: ReplaySubject<InstanceModel> = new ReplaySubject<InstanceModel>(1);
    instance$: Observable<InstanceModel> = this.instance.asObservable();
    instanceStatus$: Observable<boolean>;
    currentInstanceStatus: ReplaySubject<GetStatusOutput> = new ReplaySubject<GetStatusOutput>(1);
    currentInstanceStatus$: Observable<GetStatusOutput> = this.currentInstanceStatus.asObservable();
    constructor(
        private router: Router,
        private appService: AppService,
        private layoutService: LayoutService,
        private appLocalizationService: AppLocalizationService,
        private instanceServiceProxy: InstanceServiceProxy,
        private contactService: ContactServiceProxy,
        private permission: AppPermissionService,
        private feature: FeatureCheckerService
    ) {
        super();
        this.statusActive = new BehaviorSubject<boolean>(false);
        this.statusActive$ = this.statusActive.asObservable();
        appService.subscribeModuleChange((config: ConfigInterface) => {
            switch (config.code) {
                case 'CFO':
                    if (this.hasStaticInstance) {
                        this.initialized = false;
                        this.hasStaticInstance = false;
                        //this.instanceType = undefined;
                    }
                    if (this.initialized === undefined) {
                        this.updateMenuItems(true);
                        if (this.instanceType !== undefined) {
                            this.instanceChangeProcess().subscribe();
                        }
                    } else
                        this.updateMenuItems();
                    break;
                case 'CFOP':
                    if (this.instanceType != InstanceType.User) {
                        this.initialized = false;
                        this.instanceId = undefined;
                        this.instanceType = InstanceType.User;
                        this.hasStaticInstance = true;
                        this.instanceChangeProcess().subscribe();
                    } else {
                        this.statusActive.next(true);
                        this.updateMenuItems();
                    }
            }
        });
        this.instance$.subscribe((instance: InstanceModel) => {
            if (instance) {
                this.instanceType = instance.instanceType;
                this.instanceId = instance.instanceId;
            }
        });
    }

    checkInstanceChanged(params) {
        let instance = params['instance'];
        if (instance === undefined)
            return false;

        let instanceId = parseInt(instance) || undefined,
            instanceType = instanceId ? undefined : (instance && capitalize(instance) || undefined),
            changed = instanceType !== this.instanceType || instanceId !== this.instanceId;

        if (changed) {
            this.instanceId = instanceId;
            this.instanceType = InstanceType[instanceType];
            this.instance.next({
                instanceType: this.instanceType,
                instanceId: this.instanceId
            });
        }

        return changed;
    }

    get isInstanceAdmin() {
        return this.checkMemberAccessPermission(
            'Manage.Administrate'
        );
    }

    get isMainInstanceType() {
        return this.instanceType == InstanceType.Main;
    }

    get isMemberAccessManage() {
        return this.checkMemberAccessPermission(
            'Manage'
        );
    }

    /**
     * @param {boolean} requireAllDepartmentsAccess
     * @return {boolean}
     */
    classifyTransactionsAllowed(requireAllDepartmentsAccess = true): boolean {
        return this.checkMemberAccessPermission(
            'ClassifyTransaction',
            this.permission.isGranted(AppPermissions.CFOMainInstanceAccessClassifyTransactions)
                && (!requireAllDepartmentsAccess || this.hasAllDepartmentsPermission)
        );
    }

    get accessAllDepartments() {
        return !this.isMainInstanceType
               || this.permission.isGranted(AppPermissions.CFOMainInstanceAdmin)
               || this.hasAllDepartmentsPermission;
    }

    get hasAllDepartmentsPermission(): boolean {
        return !this.feature.isEnabled(AppFeatures.CFODepartmentsManagement)
               || this.permission.isGranted(AppPermissions.CFOMainInstanceAccessAccessAllDepartments);
    }

    checkMemberAccessPermission(userInstancePermission?, mainInstanceAccessible = false) {
        if (this.instanceId)
            return this.permission.isGranted(AppPermissions.CFOMembersAdministrationAllMemberInstancesAdmin);

        if (this.instanceType == InstanceType.User)
            return this.permission.isGranted(AppPermissions.CFOMemberAccessManageAdministrate)
                   || this.permission.isGranted(AppPermissions.CFOMemberAccess + '.' + userInstancePermission as AppPermissions);

        return this.permission.isGranted(AppPermissions.CFOMainInstanceAdmin) || mainInstanceAccessible;
    }

    initContactInfo(userId) {
        this.contactService.getContactShortInfoForUser(userId).subscribe((response: ContactShortInfo) => {
            this.appService.contactInfo = response;
        });
    }

    instanceChangeProcess(invalidateServerCache: boolean = false): Observable<boolean> {
        if (this.instanceId)
            this.layoutService.displayDefaultPageHeader();
        if (!this.instanceStatus$)
            this.instanceStatus$ = this.instanceServiceProxy
                .getStatus(InstanceType[this.instanceType], this.instanceId, invalidateServerCache)
                .pipe(
                    finalize(() => this.instanceStatus$ = undefined),
                    map((data: GetStatusOutput) => {
                        this.currentInstanceStatus.next(data);
                        this.userId = data.userId;
                        if (this.instanceId && data.userId && data.userId != abp.session.userId) {
                            this.appService.setContactInfoVisibility(true);
                            this.initContactInfo(data.userId);
                        } else
                            this.layoutService.displayDefaultPageHeader(true);
                        const status = data.status == InstanceStatus.Active;
                        this.statusActive.next(status);
                        this.initialized = status && data.hasSyncAccounts;
                        this.hasCategorizationSupported = data.hasCategorizationSupported;
                        this._initialized.next(this.initialized);
                        this.hasTransactions = this.initialized && data.hasTransactions;
                        this.hasAccountsAccess.next(data.hasAccountsAccess);
                        this.updateMenuItems();
                        return this.hasTransactions;
                    })
                );
        return this.instanceStatus$;
    }

    private updateMenuItems(disabled?: boolean) {
        setTimeout(() => {
            let menu = this.appService.topMenu;
            menu && menu.items.forEach((item, index) => {
                let uri = item.route.split('/').pop(),
                    isAccounts = (uri == 'linkaccounts'),
                    isStatements = (uri == 'statements'),
                    isStats = (uri == 'stats');
                if (index) {
                    if (isAccounts || isStatements || isStats)
                        item.visible = this.accessAllDepartments;
                    item.disabled = disabled == undefined ? !(isAccounts
                        ? this.initialized : this.hasTransactions) : disabled;
                } else if (!this.hasStaticInstance)
                    item.text = this.appLocalizationService.l(this.initialized ? 'Navigation_Dashboard'
                        : 'Navigation_Setup', AppConsts.localization.CFOLocalizationSourceName);
            });
        });
    }
}
