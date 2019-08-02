/** Core imports */
import { Component, Inject, OnInit, ViewChild, Injector } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';

@Component({
    selector: 'app-wizard-right-side',
    templateUrl: './wizard-right-side.component.html',
    styleUrls: ['./wizard-right-side.component.less'],
    providers: [DialogService]
})
export class WizardRightSideComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    dialogRef: MatDialogRef<WizardRightSideComponent, any>;
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('SaveAndClose'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        injector: Injector,
        public ls: AppLocalizationService,
        public offersWizardService: OffersWizardService,
        private _offersService: OffersService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.offersWizardService.data = data;
        this.offersWizardService.dialogRef = this.dialogRef = <any>injector.get(MatDialogRef);
    }

    ngOnInit() {
        this.modalDialog.startLoading();
        this.modalDialog.finishLoading();
    }

    save(): void {
        this.offersWizardService.submitApplicationProfile().subscribe((res) => {
            res && this._offersService.loadMemberInfo();
        });
    }
}
