/** Core imports */
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

/** Third party imports */

/** Application imports */
import { AppPermissionService } from '@shared/common/auth/permission.service';

@Injectable()
export class CrmContactGroupGuard implements CanActivate {
    constructor(
        private router: Router,
        private permissionChecker: AppPermissionService,
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (this.permissionChecker.getFirstAvailableCG())
            return true;
        else
            this.router.navigate(['/app/access-denied']);

        return false;
    }
}