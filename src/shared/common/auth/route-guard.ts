/** Core imports */
import { Injectable } from '@angular/core';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild
} from '@angular/router';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { LayoutType, UserGroup } from '@shared/service-proxies/service-proxies';
import { FeatureCheckerService } from 'abp-ng2-module';
import { CacheService } from 'ng2-cache-service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';

@Injectable()
export class RouteGuard implements CanActivate, CanActivateChild {

    constructor(
        private authService: AppAuthService,
        private feature: FeatureCheckerService,
        private permissionChecker: AppPermissionService,
        private router: Router,
        private sessionService: AppSessionService,
        private cacheService: CacheService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        let stateUrl = state && state.url.split('?').shift(),
            isStateRoot = stateUrl == '/';

        if (state && (UrlHelper.isInstallUrl(stateUrl) || UrlHelper.isAccountModuleUrl(stateUrl) || UrlHelper.isPFMUrl(stateUrl))
            || UrlHelper.isPublicUrl(stateUrl)
        ) {
            return true;
        }

        if (!this.sessionService.user) {
            let tenant = this.sessionService.tenant,
                // uri = '/account/' + (tenant && tenant.customLayoutType == LayoutType.BankCode ? 'signup' : 'login');
                uri = '/account/login';
            if (abp.session.impersonatorTenantId) {
                location.pathname = uri;
                location.search = '';
            } else
                this.router.navigate([uri]);
            return false;
        }

        if ((!route.data || (!route.data['permission'] && !route.data['feature'] && !route.data['layoutType'])) && !isStateRoot) {
            return true;
        }

        if ((!route.data['permission'] || this.permissionChecker.isGranted(route.data['permission']))
            && (!route.data['feature'] || this.feature.isEnabled(route.data['feature']))
            && (!route.data['layoutType'] || !this.sessionService.tenant || this.sessionService.tenant.customLayoutType === route.data['layoutType'])
            && !isStateRoot
        ) {
            return true;
        }

        if ((route.data && route.data['permission'] && route.data['permission'] === 'Detect.Route') || isStateRoot) {
            let bestRoute = this.selectBestRoute();
            if (bestRoute)
                this.router.navigate([bestRoute]);
        } else
            this.router.navigate(['/app/access-denied']);

        return false;
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }

    selectBestRoute(): string {
        let bestRoute = (abp.session.multiTenancySide == abp.multiTenancy.sides.TENANT ?
            this.getBestRouteForTenant('CRM') : this.getBestRouteForHost());
        return bestRoute === null ? '/app/access-denied' : bestRoute;
    }

    getBestRouteForTenant(preferedModule = null): string {
        let tenant = this.sessionService.tenant,
            user = this.sessionService.user;

        if (user && !user.groups.some(group => group === UserGroup.Member)) {
            const lastModuleName = this.cacheService.get('lastVisitedModule_' + (tenant && tenant.id) + '_' + user.id);
            if (lastModuleName)
                return 'app/' + lastModuleName;
        }

        if (tenant && (tenant.customLayoutType == LayoutType.BankCode || tenant.customLayoutType == LayoutType.Rapid)) {
            if (AppConsts.appMemberPortalUrl && this.authService.checkCurrentTopDomainByUri()) {
                this.authService.setTokenBeforeRedirect();
                location.href = AppConsts.appMemberPortalUrl;
                return '';
            } else {
                if (tenant.customLayoutType == LayoutType.BankCode && 
                    !(tenant.isWhiteLabel && tenant.name.toLowerCase() == 'ascira')
                ) {
                    return '/code-breaker';
                }
            }
        }

        if ((!preferedModule || preferedModule == 'CRM') && this.feature.isEnabled(AppFeatures.CRM) && this.permissionChecker.isGranted(AppPermissions.CRM))
            return 'app/crm';

        if ((!preferedModule || preferedModule == 'CFO') && this.feature.isEnabled(AppFeatures.CFO) && this.permissionChecker.isGranted(AppPermissions.CFO)) {
            if (this.permissionChecker.isGranted(AppPermissions.CFOMainInstanceAccess))
                return '/app/cfo/main/';

            if (this.feature.isEnabled(AppFeatures.CFOPartner) && this.permissionChecker.isGranted(AppPermissions.CFOMemberAccess))
                return '/app/cfo-portal/';
        }

        if ((!preferedModule || preferedModule == 'PFM') && this.feature.isEnabled(AppFeatures.PFM) && this.permissionChecker.isGranted(AppPermissions.PFMApplicationsManageOffers))
            return '/app/pfm/offers';

        if (!preferedModule && this.feature.isEnabled(AppFeatures.Admin)) {
            if (this.permissionChecker.isGranted(AppPermissions.Tenants))
                return '/app/admin/tenants';

            if (this.permissionChecker.isGranted(AppPermissions.AdministrationHostDashboard))
                return '/app/admin/hostDashboard';

            if (this.permissionChecker.isGranted(AppPermissions.AdministrationUsers))
                return '/app/admin/users';
        }

        if (!preferedModule) {
            if (this.feature.isEnabled(AppFeatures.PFMApplications))
                return '/personal-finance';

            if (this.feature.isEnabled(AppFeatures.PFMCreditReport)) {
                return '/personal-finance/home';
            }
        }

        return null;
    }

    getBestRouteForHost(): string {
        if (this.permissionChecker.isGranted(AppPermissions.Tenants))
            return '/app/admin/tenants';

        if (this.permissionChecker.isGranted(AppPermissions.AdministrationHostDashboard))
            return '/app/admin/hostDashboard';

        if (this.permissionChecker.isGranted(AppPermissions.CRM))
            return '/app/crm/dashboard';

        if (this.permissionChecker.isGranted(AppPermissions.AdministrationUsers))
            return '/app/admin/users';

        return null;
    }
}
