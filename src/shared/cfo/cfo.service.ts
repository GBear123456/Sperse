/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import capitalize from 'lodash/capitalize';

/** Application imports */
import { AppService } from '@app/app.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { CFOServiceBase } from 'shared/cfo/cfo-service-base';
import { InstanceServiceProxy, InstanceType, InstanceStatus, ContactServiceProxy, GetStatusOutput } from 'shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';
import { InstanceModel } from '@shared/cfo/instance.model';

@Injectable()
export class CFOService extends CFOServiceBase {
    instanceChanged: Subject<InstanceModel> = new Subject<InstanceModel>();
    instanceChanged$: Observable<InstanceModel> = this.instanceChanged.asObservable();
    instanceStatus$: Observable<boolean>;
    constructor(
        private _appService: AppService,
        private _appLocalizationService: AppLocalizationService,
        private _layoutService: LayoutService,
        private _instanceServiceProxy: InstanceServiceProxy,
        private _contactService: ContactServiceProxy,
        private _permission: AppPermissionService
    ) {
        super();
        this.statusActive = new BehaviorSubject<boolean>(false);
        _appService.subscribeModuleChange(config => {
            switch (config['code']) {
                case 'CFO':
                    if (this.hasStaticInstance) {
                        this.initialized = false;
                        this.hasStaticInstance = false;
                        this.instanceType = undefined;
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
                    } else
                        this.updateMenuItems();
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
            this.instanceType = instanceType;
            this.instanceChanged.next({
                instanceType: this.instanceType,
                instanceId: this.instanceId
            });
        }

        return changed;
    }

    get isInstanceAdmin() {
        return this.checkMemberAccessPermission('Manage.Administrate', !isNaN(parseInt(this.instanceType)) ||
            (this.instanceType == InstanceType.Main && this._permission.isGranted(AppPermissions.CFOMainInstanceAdmin)));
    }

    get isMainInstanceType() {
        return this.instanceType == InstanceType.Main;
    }

    get isMemberAccessManage() {
        return this.checkMemberAccessPermission('Manage', false);
    }

    get classifyTransactionsAllowed() {
        return this.checkMemberAccessPermission('ClassifyTransaction', this.isInstanceAdmin);
    }

    checkMemberAccessPermission(permission, defaultResult = true) {
        if (this.instanceType == InstanceType.User || this.instanceId)
            return this._permission.isGranted(AppPermissions.CFOMemberAccess + '.' + permission as AppPermissions);

        return defaultResult;
    }

    initContactInfo(userId) {
        this._contactService.getContactShortInfoForUser(userId).subscribe(response => {
            this._appService.contactInfo = response;
        });
    }

    instanceChangeProcess(invalidateServerCache: boolean = false): Observable<boolean> {
        if (this.instanceId) {
            this._appService.setContactInfoVisibility(true);
            this._layoutService.hideDefaultPageHeader();
        }
        if (!this.instanceStatus$)
            this.instanceStatus$ = this._instanceServiceProxy.getStatus(InstanceType[this.instanceType], this.instanceId, invalidateServerCache)
            .pipe(finalize(() => this.instanceStatus$ = undefined), map((data: GetStatusOutput) => {
                if (this.instanceId && data.userId)
                    this.initContactInfo(data.userId);
                const status = data.status == InstanceStatus.Active;
                this.statusActive.next(status);
                this.initialized = status && data.hasSyncAccounts;
                this.hasTransactions = this.initialized && data.hasTransactions;
                this.updateMenuItems();
                return this.hasTransactions;
            }));
        return this.instanceStatus$;
    }

    private updateMenuItems(disabled?: boolean) {
        setTimeout(() => {
            let menu = this._appService.topMenu;
            menu && menu.items.forEach((item, i) => {
                if (!i) {
                    if (!this.hasStaticInstance)
                        item.text = this._appLocalizationService.l(this.initialized ? 'Navigation_Dashboard'
                            : 'Navigation_Setup', AppConsts.localization.CFOLocalizationSourceName);
                } else if (i == 1) {
                    item.disabled = disabled == undefined ? !this.initialized : disabled;
                } else {
                    item.disabled = disabled == undefined ? !this.hasTransactions : disabled;
                }
            });
        });
    }
}
