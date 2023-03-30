/** Core imports */
import { Injectable } from '@angular/core';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot
} from '@angular/router';

/** Third party imports */
import { SettingService } from 'abp-ng2-module';

/** Application imports */
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class TenantSideRouteGuard implements CanActivate {

    constructor(
        private router: Router,
        private settingService: SettingService,
        private sessionService: AppSessionService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (!route.data) {
            return true;
        }

        let isHost = !this.sessionService.tenantId,
            isSignUpPagesEnabled: boolean = this.settingService.getBoolean('App.UserManagement.IsSignUpPageEnabled');
        if (!isHost && (route.data.hostOnly || !isSignUpPagesEnabled)) {
            this.router.navigate([route.data.tenantRedirect ? route.data.tenantRedirect : '/app/access-denied'], {
                queryParams: location.href.includes(AppConsts.defaultDomain) ? {tenantId: this.sessionService.tenantId} : {}
            });
            return false;
        }
        return true;
    }
}