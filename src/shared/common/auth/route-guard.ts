import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { Injectable } from '@angular/core';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild
} from '@angular/router';
import { AppConsts } from 'shared/AppConsts';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { CacheService } from 'ng2-cache-service';
import { CacheStoragesEnum } from 'ng2-cache-service/dist/src/enums/cache-storages.enum';

@Injectable()
export class RouteGuard implements CanActivate, CanActivateChild {

    constructor(
        private _feature: FeatureCheckerService,
        private _permissionChecker: PermissionCheckerService,
        private _router: Router,
        private _sessionService: AppSessionService,
        private _cacheService: CacheService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (state && (UrlHelper.isInstallUrl(state.url) || UrlHelper.isAccountModuleUrl(state.url) || UrlHelper.isPFMUrl(state.url))) {
            return true;
        }

        if (!this._sessionService.user) {
            this._router.navigate(['/account/login']);
            return false;
        }

        if ((!route.data || (!route.data['permission'] && !route.data['feature'])) && state.url !== '/') {
            return true;
        }

        if ((!route.data['permission'] || this._permissionChecker.isGranted(route.data['permission']))
            && (!route.data['feature'] || this._feature.isEnabled(route.data['feature'])) && state.url !== '/'
        ) {
            return true;
        }

        if ((route.data && route.data['permission'] && route.data['permission'] === 'Pages.Detect.Route') || state.url === '/')
            this._router.navigate([this.selectBestRoute()]);
        else
            this._router.navigate(['/app/access-denied']);

        return false;
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }

    selectBestRoute(): string {
        if (abp.session.multiTenancySide == abp.multiTenancy.sides.TENANT) {

            if (this._sessionService.userId !== null) {
                const lastModuleName = this._cacheService.get('lastVisitedModule_' + this._sessionService.userId);
                if (lastModuleName) {
                    return 'app/' + lastModuleName;
                }
            }

            if (!AppConsts.isMobile && this._feature.isEnabled('CRM') && this._permissionChecker.isGranted('Pages.CRM.BaseAccess')) {
                return 'app/crm';
            }

            if (this._feature.isEnabled('CFO')) {
                if (AppConsts.isMobile) {
                    return 'app/cfo';
                }

                if (this._permissionChecker.isGranted('Pages.CFO')) {

                    if (this._permissionChecker.isGranted('Pages.CFO.MainInstanceAccess'))
                        return '/app/cfo/main/';

                    if (this._feature.isEnabled('CFO.Partner'))
                        return '/app/cfo/user/';
                }
            }
        }

        if (abp.session.multiTenancySide == abp.multiTenancy.sides.HOST || this._feature.isEnabled('Admin')) {
            if (this._permissionChecker.isGranted('Pages.Tenants')) {
                return '/app/admin/tenants';
            }

            if (this._permissionChecker.isGranted('Pages.Administration.Host.Dashboard')) {
                return '/app/admin/hostDashboard';
            }
        }

        if ((abp.session.multiTenancySide == abp.multiTenancy.sides.HOST || this._feature.isEnabled('CRM'))
            && this._permissionChecker.isGranted('Pages.CRM')) {
            return '/app/crm/dashboard';
        }

        if ((abp.session.multiTenancySide == abp.multiTenancy.sides.HOST ||  this._feature.isEnabled('Admin'))
            && this._permissionChecker.isGranted('Pages.Administration.Users')) {
            return '/app/admin/users';
        }

        if (this._feature.isEnabled('CreditReportFeature')) {
            return '/personal-finance';
        }

        if (this._feature.isEnabled('Notification')) {
            return '/app/notifications';
        }

        return '/app/access-denied';
    }
}
