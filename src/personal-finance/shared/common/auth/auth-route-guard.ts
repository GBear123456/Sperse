/** Application imports */
import { Injectable } from '@angular/core';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild
} from '@angular/router';

/** Application imports */
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { AppFeatures } from '@shared/AppFeatures';

@Injectable()
export class CreditReportsRouteGuard implements CanActivate, CanActivateChild {

    constructor(
        private featureChecker: FeatureCheckerService,
        private permissionChecker: AppPermissionService,
        private router: Router,
        private sessionService: AppSessionService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (!this.featureChecker.isEnabled(AppFeatures.PFM)) {
            this.router.navigate(['/']);
            return false;
        }

        return true;
    }

    isPublicSection(route) {
        return route.data && route.data.isPublic;
    }

    checkLoansSectionForDemoUser(url) {
        return this.sessionService.isLendspaceDemoUser && ['personal', 'auto', 'business'].every(
            item => url.indexOf('/personal-finance/offers/' + item + '-loans') < 0
        );
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (UrlHelper.isPfmAppUrl(state.url)) {
            if (this.featureChecker.isEnabled(AppFeatures.PFMApplications)
                || this.featureChecker.isEnabled(AppFeatures.PFMCreditReport))
                this.router.navigate([this.sessionService.user ? '/personal-finance/home' : '/account/login']);
            else
                this.router.navigate(['/']);
            return false;
        } else if (this.sessionService.user) {
            if (!route.data || !route.data['permission']
                || this.permissionChecker.isGranted(route.data['permission'])
            ) {
                if (this.checkLoansSectionForDemoUser(state.url)) {
                    this.router.navigate(['/personal-finance/offers/personal-loans']);
                    return false;
                }
                return true;
            } else {
                this.router.navigate(['/app/access-denied']);
                return false;
            }
        } else if (UrlHelper.isPfmSignUpUrl(state.url) || this.isPublicSection(route)) {
            return true;
        } else {
            sessionStorage.setItem('redirectUrl', location.origin + state.url);
            this.router.navigate(['/account/login']);
            return false;
        }
    }

}
