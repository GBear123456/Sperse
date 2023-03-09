/** Core imports */
import { Injectable } from '@angular/core';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot
} from '@angular/router';

/** Application imports */
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class TenantSideRouteGuard implements CanActivate {

    constructor(
        private router: Router,
        private sessionService: AppSessionService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (!route.data) {
            return true;
        }

        let isHost = !this.sessionService.tenantId;
        if (!isHost && route.data.hostOnly) {
            this.router.navigate([route.data.tenantRedirect ? route.data.tenantRedirect : '/app/access-denied']);
            return false;
        }

        return true;
    }
}