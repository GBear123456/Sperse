import { AppPermissionService } from '@shared/common/auth/permission.service';
import { Injectable } from '@angular/core';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild
} from '@angular/router';
import { TenantLoginInfoDtoCustomLayoutType } from '@shared/service-proxies/service-proxies';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { CacheService } from 'ng2-cache-service';

@Injectable()
export class RouteGuard implements CanActivate, CanActivateChild {

    constructor(
        private _feature: FeatureCheckerService,
        private _permissionChecker: AppPermissionService,
        private _router: Router,
        private _sessionService: AppSessionService,
        private _cacheService: CacheService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        let stateUrl = state && state.url.split('?').shift(),
            isStateRoot = stateUrl == '/';
        if (state && (UrlHelper.isInstallUrl(stateUrl) || UrlHelper.isAccountModuleUrl(stateUrl) || UrlHelper.isPFMUrl(stateUrl))) {
            return true;
        }

        if (!this._sessionService.user) {
            this._router.navigate(['/account/login']);
            return false;
        }

        if ((!route.data || (!route.data['permission'] && !route.data['feature'])) && !isStateRoot) {
            return true;
        }

        if ((!route.data['permission'] || this._permissionChecker.isGranted(route.data['permission']))
            && (!route.data['feature'] || this._feature.isEnabled(route.data['feature'])) && !isStateRoot
        ) {
            return true;
        }

        if ((route.data && route.data['permission'] && route.data['permission'] === 'Pages.Detect.Route') || isStateRoot)
            this._router.navigate([this.selectBestRoute()]);
        else
            this._router.navigate(['/app/access-denied']);

        return false;
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }

    selectBestRoute(): string {
        let route;
        if (abp.session.multiTenancySide == abp.multiTenancy.sides.TENANT) {
            let module = abp.setting.get('App.UserManagement.DefaultModuleType');
            route = this.getBestRouteForTenant(module);
            if (!route && module)
                route = this.getBestRouteForTenant();
        }
        else {
            route = this.getBestRouteForHost();
        }

        return route || '/app/access-denied';
    }

    getBestRouteForTenant(preferedModule = null): string {
        if (this._sessionService.userId !== null) {
            const lastModuleName = this._cacheService.get('lastVisitedModule_' + this._sessionService.tenantId + '_' + this._sessionService.userId);
            if (lastModuleName)
                return 'app/' + lastModuleName;
        }

        if ((!preferedModule || preferedModule == 'CRM') && this._feature.isEnabled('CRM') && this._permissionChecker.isGranted('Pages.CRM'))
            return 'app/crm';

        if ((!preferedModule || preferedModule == 'CFO') && this._feature.isEnabled('CFO') && this._permissionChecker.isGranted('Pages.CFO')) {
            if (this._permissionChecker.isGranted('Pages.CFO.MainInstanceAccess'))
                return '/app/cfo/main/';

            if (this._feature.isEnabled('CFO.Partner') && this._permissionChecker.isGranted('Pages.CFO.MemberAccess'))
                return '/app/cfo-portal/';
        }

        if ((!preferedModule || preferedModule == 'PFM') && this._feature.isEnabled('PFM') && this._permissionChecker.isGranted('Pages.PFM.Applications.ManageOffers'))
            return '/app/pfm/offers';

        if (!preferedModule && this._feature.isEnabled('Admin'))
        {
            if (this._permissionChecker.isGranted('Pages.Tenants'))
                return '/app/admin/tenants';

            if (this._permissionChecker.isGranted('Pages.Administration.Host.Dashboard'))
                return '/app/admin/hostDashboard';

            if (this._permissionChecker.isGranted('Pages.Administration.Users'))
                return '/app/admin/users';
        }

        if (!preferedModule)
        {
            if (this._feature.isEnabled('PFM.Applications'))
            return '/personal-finance';

            if (this._feature.isEnabled('PFM.CreditReport')) {
                return '/personal-finance/credit-report';
            }
        }

        let tenant = this._sessionService.tenant;
        if (tenant && tenant.customLayoutType == TenantLoginInfoDtoCustomLayoutType.BankCode)
            return '/code-breaker';

        return null;
    }

    getBestRouteForHost(): string {
        if (this._permissionChecker.isGranted('Pages.Tenants'))
            return '/app/admin/tenants';

        if (this._permissionChecker.isGranted('Pages.Administration.Host.Dashboard'))
            return '/app/admin/hostDashboard';

        if (this._permissionChecker.isGranted('Pages.CRM'))
            return '/app/crm/dashboard';

        if (this._permissionChecker.isGranted('Pages.Administration.Users'))
            return '/app/admin/users';

        return null;
    }
}
