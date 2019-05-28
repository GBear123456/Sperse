import { Injectable } from '@angular/core';
import { AppService } from '@app/app.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { CFOServiceBase } from 'shared/cfo/cfo-service-base';
import { InstanceServiceProxy, InstanceType, GetStatusOutputStatus, ContactServiceProxy } from 'shared/service-proxies/service-proxies';
import { Subject, Subscription, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { BehaviorSubject } from '@node_modules/rxjs';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';

@Injectable()
export class CFOService extends CFOServiceBase {
    instanceTypeChanged: Subject<string> = new Subject<null>();
    instanceTypeChanged$: Observable<string> = this.instanceTypeChanged.asObservable();
    getStatusSubscription: Subscription;
    constructor(
        private _appService: AppService,
        private _appLocalizationService: AppLocalizationService,
        private _layoutService: LayoutService,
        private _instanceServiceProxy: InstanceServiceProxy,
        private _contactService: ContactServiceProxy,
        private _permission: PermissionCheckerService
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
                        if (this._appService.topMenu) {
                            this._appService.topMenu.items
                                .forEach((item, i) => {
                                    if (i != 0) {
                                        item.disabled = true;
                                    }
                                });
                        }
                        if (this.instanceType !== undefined) {
                            this.instanceChangeProcess();
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
                        this.instanceChangeProcess();
                    }
            }
        });
    }

    get isInstanceAdmin() {
        return this.checkMemberAccessPermission('Manage.Administrate', !isNaN(parseInt(this.instanceType)) ||
            (this.instanceType == InstanceType.Main && this._permission.isGranted('Pages.CFO.MainInstanceAdmin')));
    }

    get isMemberAccessManage() {
        return this.checkMemberAccessPermission('Manage', false);
    }

    checkMemberAccessPermission(permission, defaultResult = true) {
        if (this.instanceType == InstanceType.User && !this.instanceId)
            return this._permission.isGranted('Pages.CFO.MemberAccess.' + permission);

        return defaultResult;
    }

    initContactInfo(userId) {
        this._contactService.getContactShortInfoForUser(userId).subscribe(response => {
            this._appService.contactInfo = response;
        });
    }

    instanceChangeProcess(callback: any = null, invalidateServerCache: boolean = false) {
        if (this.instanceId != null) {
            this._appService.setContactInfoVisibility(true);
            this._layoutService.hideDefaultPageHeader();
        }
        if (!this.getStatusSubscription) {
            this.getStatusSubscription = this._instanceServiceProxy.getStatus(InstanceType[this.instanceType], this.instanceId, invalidateServerCache)
            .pipe(finalize(() => this.getStatusSubscription = undefined))
            .subscribe((data) => {
                if (this.instanceId && data.userId)
                    this.initContactInfo(data.userId);
                const status = data.status == GetStatusOutputStatus.Active;
                this.statusActive.next(status);
                this.initialized = status && data.hasSyncAccounts;
                this.hasTransactions = this.initialized && data.hasTransactions;
                !this.hasStaticInstance && this.updateMenuItems();
                callback && callback.call(this, this.hasTransactions);
            });
        }
    }

    private updateMenuItems() {
        this._appService.topMenu.items
            .forEach((item, i) => {
                if (i == 0) {
                    item.text = this._appLocalizationService.l(this.initialized ? 'Navigation_Dashboard' : 'Navigation_Setup', AppConsts.localization.CFOLocalizationSourceName);
                } else if (i == 1) {
                    item.disabled = !this.initialized;
                } else {
                    item.disabled = !this.hasTransactions;
                }
            });
    }
}