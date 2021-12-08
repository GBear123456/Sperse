import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { ProfileServiceProxy, VerifySmsCodeInputDto } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { AppLocalizationService } from '../../common/localization/app-localization.service';

@Component({
    selector: 'smsVerificationModal',
    templateUrl: './sms-verification-modal.component.html'
})
export class SmsVerificationModalComponent {
    @ViewChild('smsVerificationModal') modal: ModalDirective;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    public active = false;
    public saving = false;
    public verifyCode: VerifySmsCodeInputDto = new VerifySmsCodeInputDto();

    constructor(
        private profileService: ProfileServiceProxy,
        public ls: AppLocalizationService
    ) {}

    show(): void {
        this.active = true;
        this.modal.show();
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    save(): void {
        this.saving = true;
        this.profileService.verifySmsCode(this.verifyCode)
            .pipe(finalize(() => this.saving = false))
            .subscribe(() => {
                this.close();
                this.modalSave.emit(null);
            });
    }
}
