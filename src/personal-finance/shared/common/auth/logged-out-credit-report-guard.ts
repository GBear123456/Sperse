import { CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class LoggedOutCreditReportGuard implements CanActivate {
    constructor(
        private sessionService: AppSessionService,
        private router: Router
    ) {}

    canActivate() {
        if (this.sessionService.userId) {
            this.router.navigate(['personal-finance/credit-report']);
        }
        return true;
    }
}
