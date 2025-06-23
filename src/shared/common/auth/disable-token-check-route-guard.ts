/** Core imports */
import { Injectable } from '@angular/core';
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot
} from '@angular/router';

/** Third party imports */

/** Application imports */
import { AppAuthService } from '@shared/common/auth/app-auth.service';

@Injectable()
export class DisableTokenCheckRouteGuard implements CanActivate {

    constructor(
        private authService: AppAuthService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        this.authService.stopTokenCheck();
        return true;
    }
}