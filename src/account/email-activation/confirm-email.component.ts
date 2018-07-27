import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AccountServiceProxy, ActivateEmailInput, ResolveTenantIdInput } from '@shared/service-proxies/service-proxies';
import { accountModuleAnimation } from '@shared/animations/routerTransition';

@Component({
    template: `
        <div [@routerTransition] class="login-wraper">
            <p class="col-12 text-center">{{waitMessage}}</p>
        </div>`,
    animations: [accountModuleAnimation()]
})
export class ConfirmEmailComponent extends AppComponentBase implements OnInit {

    waitMessage: string;

    model: ActivateEmailInput = new ActivateEmailInput();

    constructor(
        injector: Injector,
        private _accountService: AccountServiceProxy,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _appSessionService: AppSessionService

    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.waitMessage = this.l('PleaseWaitToConfirmYourEmailMessage');

        this.model.c = this._activatedRoute.snapshot.queryParams['c'];

        this._accountService.resolveTenantId(new ResolveTenantIdInput({ c: this.model.c })).subscribe((tenantId) => {
            if (this._appSessionService.changeTenantIfNeeded(tenantId)) {
                return; //changeTenantIfNeeded will reload page
            }

            this._accountService.activateEmail(this.model)
                .subscribe(() => {
                    this.notify.success(this.l('YourEmailIsConfirmedMessage'));
                    this._router.navigate(['account/login']);
                });
        });
    }


    parseTenantId(tenantIdAsStr?: string): number {
        let tenantId = !tenantIdAsStr ? undefined : parseInt(tenantIdAsStr, 10);
        if (tenantId === NaN) {
            tenantId = undefined;
        }

        return tenantId;
    }
}
