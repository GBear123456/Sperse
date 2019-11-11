/** Core imports */
import { Injectable } from '@angular/core';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild
} from '@angular/router';

/** Application imports */
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { CacheService } from 'ng2-cache-service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';

@Injectable()
export class RouteGuard implements CanActivate, CanActivateChild {

    constructor(
        private feature: FeatureCheckerService,
        private permissionChecker: AppPermissionService,
        private router: Router,
        private sessionService: AppSessionService,
        private cacheService: CacheService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        let stateUrl = state && state.url.split('?').shift(),
            isStateRoot = stateUrl == '/';
        if (state && (UrlHelper.isInstallUrl(stateUrl) || UrlHelper.isAccountModuleUrl(stateUrl) || UrlHelper.isPFMUrl(stateUrl))) {
            return true;
        }

        if (!this.sessionService.user) {
            let tenant = this.sessionService.tenant;
            this.router.navigate(['/account/' + (tenant && tenant.customLayoutType == LayoutType.BankCode ? 'signup' : 'login')]);
            return false;
        }

        if ((!route.data || (!route.data['permission'] && !route.data['feature'])) && !isStateRoot) {
            return true;
        }

        if ((!route.data['permission'] || this.permissionChecker.isGranted(route.data['permission']))
            && (!route.data['feature'] || this.feature.isEnabled(route.data['feature'])) && !isStateRoot
        ) {
            return true;
        }

        if ((route.data && route.data['permission'] && route.data['permission'] === 'Detect.Route') || isStateRoot)
            this.router.navigate([this.selectBestRoute()]);
        else
            this.router.navigate(['/app/access-denied']);

        return false;
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }

    selectBestRoute(): string {
        return (abp.session.multiTenancySide == abp.multiTenancy.sides.TENANT ?
            this.getBestRouteForTenant() : this.getBestRouteForHost())  || '/app/access-denied';
    }

    getBestRouteForTenant(preferedModule = null): string {
        if (this.sessionService.userId !== null) {
            const lastModuleName = this.cacheService.get('lastVisitedModule_' + this.sessionService.tenantId + '_' + this.sessionService.userId);
            if (lastModuleName)
                return 'app/' + lastModuleName;
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

        let tenant = this.sessionService.tenant;
        if (tenant && tenant.customLayoutType == LayoutType.BankCode)
            return '/code-breaker';

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
