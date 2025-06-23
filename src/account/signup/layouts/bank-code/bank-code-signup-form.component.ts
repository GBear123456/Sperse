/** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, OnInit } from '@angular/core';
import { ActivationEnd, Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import capitalize from 'underscore.string/capitalize';
import { filter, takeUntil } from 'rxjs/operators';
import { DxValidatorComponent } from 'devextreme-angular/ui/validator';
import { MaskPipe } from 'ngx-mask';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { MemberSignupFormComponent } from '../member/member-signup-form.component';
import { ApplicationServiceProxy, SignUpMemberRequest } from '@shared/service-proxies/service-proxies';
import { LoginService, ExternalLoginProvider } from '@root/account/login/login.service';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { DxCheckBoxComponent } from 'devextreme-angular/ui/check-box';
import { ConditionsType } from '@shared/AppEnums';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-code-signup-form',
    templateUrl: './bank-code-signup-form.component.html',
    styleUrls: [
        './bank-code-signup-form.component.less'
    ],
    providers: [ ApplicationServiceProxy, LoginService, LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankCodeSignupFormComponent extends MemberSignupFormComponent implements OnInit {
    @ViewChild('agreeToReceiveCallsCheckBox') agreeToReceiveCallsCheckBox: DxCheckBoxComponent;
    isAgreedToReceiveCalls = false;

    ngOnInit() {
        super.ngOnInit();
    }

    externalLogin(provider: ExternalLoginProvider) {
        if (this.isAgreeWithTerms && this.isAgreedToReceiveCalls)
            this.loginService.externalAuthenticate(provider);
        else {
            this.agreeWithTermsCheckBox['validator'].instance.validate();
            this.agreeToReceiveCallsCheckBox['validator'].instance.validate();
        }
    }
}