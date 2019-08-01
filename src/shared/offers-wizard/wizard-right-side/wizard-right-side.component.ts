import { Component, OnInit, ViewChild } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';

@Component({
    selector: 'app-wizard-right-side',
    templateUrl: './wizard-right-side.component.html',
    styleUrls: ['./wizard-right-side.component.less'],
    providers: [ DialogService ]
})
export class WizardRightSideComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('SaveAndClose'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        public ls: AppLocalizationService,
    ) {
    }

    ngOnInit() {
        this.modalDialog.startLoading();
        this.modalDialog.finishLoading();
    }

    save(): void {}
}
