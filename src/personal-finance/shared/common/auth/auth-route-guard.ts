import { Injectable } from '@angular/core';
import { PermissionCheckerService } from "@abp/auth/permission-checker.service";
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild
} from '@angular/router';

@Injectable()
export class CreditReportsRouteGuard implements CanActivate, CanActivateChild {

    constructor(
        private _featureChecker: FeatureCheckerService,
        private _permissionChecker: PermissionCheckerService,
        private _router: Router,
        private _sessionService: AppSessionService,
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (!this._featureChecker.isEnabled('CreditReportFeature')) {
            this._router.navigate(['/']);
            return false;
        }

        return true;
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (!this._sessionService.user) {
            this._router.navigate(['/account/login']);
            return false;
        }

        if (!route.data || !route.data["permission"]) {
            return true;
        }

        if (this._permissionChecker.isGranted(route.data["permission"])) {
            return true;
        }

        this._router.navigate([this.selectBestRoute()]);
        return false;
    }

    selectBestRoute(): string {
        return '/personal-finance';
    }
}
