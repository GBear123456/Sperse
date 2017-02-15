import { Injectable } from '@angular/core';
import { PermissionCheckerService } from "@abp/auth/permission-checker.service";
import { AppSessionService } from '@shared/common/session/app-session.service';

import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild
} from '@angular/router';

@Injectable()
export class AuthRouteGuard implements CanActivate, CanActivateChild {

    constructor(
        private _permissionChecker: PermissionCheckerService,
        private _router: Router,
        private _sessionService: AppSessionService,
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (!route.data || !route.data["permission"]) {
            return true;
        }

        if (this._permissionChecker.isGranted(route.data["permission"])) {
            return true;
        }

        const bestRoute = this.selectBestRoute();
        if (!bestRoute) {
            return true;
        }

        this._router.navigate([bestRoute]);
        return false;
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }

    selectBestRoute(): string {
        if (!this._sessionService.user) {
            return '/login';
        }

        if (this._permissionChecker.isGranted('Pages.Tenant.Dashboard')) {
            return '/dashboard';
        }

        if (this._permissionChecker.isGranted('Pages.Tenants')) {
            return '/admin/tenants';
        }

        if (this._permissionChecker.isGranted('Pages.Administration.Users')) {
            return '/admin/users';
        }

        return null;
    }
}