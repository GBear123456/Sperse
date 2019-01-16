import { Component, Inject, OnInit } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';

import { ConditionsModalComponent } from 'shared/common/conditions-modal/conditions-modal.component';
import { AppConsts } from 'shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-register-confirm',
    templateUrl: './register-confirm.component.html',
    styleUrls: ['./register-confirm.component.less']
})
export class RegisterConfirmComponent implements OnInit {
    agreeWithTerms = true;
    modalsData = {
        terms: { title: 'Terms of Use', bodyUrl: AppConsts.LENDSPACE_DOMAIN + '/documents/terms.html', downloadDisabled: true },
        privacy: { title: 'Privacy Policy', bodyUrl: AppConsts.LENDSPACE_DOMAIN + '/documents/policy.html', downloadDisabled: true },
        lender: { title: 'Lender Terms', bodyUrl: AppConsts.LENDSPACE_DOMAIN + '/documents/lender.html', downloadDisabled: true }
    };
    constructor(
        private dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {}

    openConditionsDialog(event, data: any) {
        event.preventDefault();
        this.dialog.open(ConditionsModalComponent, {panelClass: ['slider', 'footer-slider'], data: data});
    }
}
