import { Component, ElementRef, ViewChild } from '@angular/core';
import { AppTenantAvailabilityState } from '@shared/AppEnums';
import { AccountServiceProxy, IsTenantAvailableInput, IsTenantAvailableOutput } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';
import { MessageService } from 'abp-ng2-module';
import { AppLocalizationService } from '../../app/shared/common/localization/app-localization.service';

@Component({
    selector: 'tenantChangeModal',
    templateUrl: './tenant-change-modal.component.html'
})
export class TenantChangeModalComponent {
    @ViewChild('tenantChangeModal') modal: ModalDirective;
    @ViewChild('tenancyNameInput') tenancyNameInput: ElementRef;

    tenancyName = '';
    active = false;
    saving = false;

    constructor(
        private accountService: AccountServiceProxy,
        private messageService: MessageService,
        public ls: AppLocalizationService
    ) {}

    show(tenancyName: string): void {
        this.tenancyName = tenancyName;
        this.active = true;
        this.modal.show();
    }

    onShown(): void {
        $(this.tenancyNameInput.nativeElement).focus().select();
    }

    save(): void {

        if (!this.tenancyName) {
            abp.multiTenancy.setTenantIdCookie(undefined);
            this.close();
            location.reload();
            return;
        }

        let input = new IsTenantAvailableInput();
        input.tenancyName = this.tenancyName;

        this.saving = true;
        this.accountService.isTenantAvailable(input)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe((result: IsTenantAvailableOutput) => {
                switch (result.state) {
                    case AppTenantAvailabilityState.Available:
                        abp.multiTenancy.setTenantIdCookie(result.tenantId);
                        this.close();
                        location.reload();
                        return;
                    case AppTenantAvailabilityState.InActive:
                        this.messageService.warn(this.ls.l('TenantIsNotActive', this.tenancyName));
                        break;
                    case AppTenantAvailabilityState.NotFound: //NotFound
                        this.messageService.warn(this.ls.l('ThereIsNoTenantDefinedWithName{0}', this.tenancyName));
                        break;
                }
            });
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }
}
