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

    isPublicSection(route) {
        return route.data && route.data.isPublic;
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (UrlHelper.isPfmAppUrl(state.url)) {
            if (this._featureChecker.isEnabled('PFM.Applications'))                
                this._router.navigate([this._sessionService.user ? '/personal-finance/home' : '/account/login']);
            else
                this._router.navigate([this.selectBestRoute()]);
            return false;
        } else if (this._sessionService.user) {
            if (!route.data || !route.data['permission']
                || this._permissionChecker.isGranted(route.data['permission'])
            ) {
                if (this._sessionService.isLendspaceDemoUser && state.url.indexOf('offers/personal-loans') < 0) {
                    this._router.navigate(['/personal-finance/offers/personal-loans']);
                    return false;
                }                
        
                return true;
            } else {
                this._router.navigate(['/app/access-denied']);
                return false;
            }
        } else if (UrlHelper.isPfmSignUpUrl(state.url) || this.isPublicSection(route)) {
            return true;
        } else {
            sessionStorage.setItem('redirectUrl', location.origin + state.url);
            this._router.navigate(['/account/login']);
            return false;
        }
    }

    selectBestRoute(): string {
        if (this._featureChecker.isEnabled('PFM.Applications'))
            return '/personal-finance/home';

        if (this._featureChecker.isEnabled('PFM.CreditReport'))
            return '/personal-finance/credit-report';

        return '/';
    }
}
