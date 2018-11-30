import { Injectable } from '@angular/core';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';

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
        if (!this._featureChecker.isEnabled('PFM')) {
            this._router.navigate(['/']);
            return false;
        }

        return true;
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (UrlHelper.isPfmAppUrl(state.url)) {
            if (this._featureChecker.isEnabled('PFM.Applications')) {
                if (this._sessionService.user) {
                    this._router.navigate(['/personal-finance/offers/personal-loans']);
                    return false;
                } else {
                    return true;
                }
            }

            this._router.navigate([this.selectBestRoute()]);
            return false;
        } else if (this._sessionService.user) {
            if (!route.data || !route.data['permission']
                || this._permissionChecker.isGranted(route.data['permission'])
            )
                return true;
            else {
                this._router.navigate(['/app/access-denied']);
                return false;
            }
        } else {
            sessionStorage.setItem('redirectUrl', location.origin + state.url);
            this._router.navigate(['/account/login']);
            return false;
        }
    }

    selectBestRoute(): string {
        if (this._featureChecker.isEnabled('PFM.Applications'))
            return '/personal-finance';

        if (this._featureChecker.isEnabled('PFM.CreditReport'))
            return '/personal-finance/credit-report';

        return '/';
    }
}
