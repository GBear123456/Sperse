import { Component, Inject, OnInit } from '@angular/core';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';
import { environment } from 'environments/environment';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-register-confirm',
    templateUrl: './register-confirm.component.html',
    styleUrls: ['./register-confirm.component.less']
})
export class RegisterConfirmComponent implements OnInit {
    agreeWithTerms = true;
    modalsData = {
        terms: { title: 'Terms of Use', bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/terms.html', downloadDisabled: true },
        privacy: { title: 'Privacy Policy', bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/policy.html', downloadDisabled: true },
        lender: { title: 'Lender Terms', bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/lender.html', downloadDisabled: true }
    };
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public ls: AppLocalizationService,
        public conditionsModalService: ConditionsModalService
    ) {}

    ngOnInit() {}

    openConditionsDialog(event, data: any) {
        event.preventDefault();
        this.conditionsModalService.openModal({
            panelClass: ['slider', 'footer-slider'],
            data: data
        });
    }
}
