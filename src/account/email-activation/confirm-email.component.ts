import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AccountServiceProxy, ActivateEmailInput, ResolveTenantIdInput } from '@shared/service-proxies/service-proxies';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { isEqual } from 'lodash';

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
        private _appSessionService: AppSessionService

    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.waitMessage = this.l('PleaseWaitToConfirmYourEmailMessage');

        if (this._activatedRoute.snapshot.queryParams['c']) {
            this.model.c = this._activatedRoute.snapshot.queryParams['c'];

            this._accountService.resolveTenantId(new ResolveTenantIdInput({ c: this.model.c })).subscribe((tenantId) => {
                if (isEqual(tenantId, {})) tenantId = null; // hack for host tenant
                this.activateEmail(tenantId);
            });
        } else {
            this.model.userId = this._activatedRoute.snapshot.queryParams['userId'];
            this.model.confirmationCode = this._activatedRoute.snapshot.queryParams['confirmationCode'];
            let tenantId = this.parseTenantId(this._activatedRoute.snapshot.queryParams['tenantId']);

            this.activateEmail(tenantId);
        }
    }

    activateEmail(tenantId) {
        if (this._appSessionService.changeTenantIfNeeded(tenantId)) {
            return; //changeTenantIfNeeded will reload page
        }

        this._accountService.activateEmail(this.model)
            .subscribe(() => {
                this.notify.success(this.l('YourEmailIsConfirmedMessage'));
                this._router.navigate(['/']);
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
