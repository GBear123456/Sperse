/** Core imports */
import {
    Component,
    Inject,
    ViewChild,
    Injector,
    ViewChildren,
    QueryList,
    OnDestroy
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTabGroup } from '@angular/material/tabs';
import { Observable } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';
import { GetApplicationDetailsOutput } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-wizard-right-side',
    templateUrl: './wizard-right-side.component.html',
    styleUrls: ['./wizard-right-side.component.less'],
    providers: [ DialogService ]
})
export class WizardRightSideComponent implements OnDestroy {
    private static readonly tabsNumber = 6;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    private tabHeader: HTMLElement;
    @ViewChildren(MatTabGroup) set matTabGroup(elements: QueryList<MatTabGroup>) {
        if (elements.first && elements.first._elementRef) {
            this.tabHeader = elements.first._elementRef.nativeElement.querySelector('.mat-tab-header');
            this.tabHeader.addEventListener(
                'click',
                this.handleTabHeaderPaginationClick
            );
        }
    }
    private dialogRef: MatDialogRef<WizardRightSideComponent, any>;
    selectedIndex = 0;
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('SaveAndClose'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];
    applicationDetails$: Observable<GetApplicationDetailsOutput> = this.offersWizardService.applicationDetails$;

    constructor(
        injector: Injector,
        private offersWizardService: OffersWizardService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.offersWizardService.data = data;
        this.offersWizardService.dialogRef = this.dialogRef = <any>injector.get(MatDialogRef);
    }

    handleTabHeaderPaginationClick = (e) => {
        if (e.target.closest('.mat-tab-header-pagination')) {
            const prevButton = e.target.closest('.mat-tab-header-pagination-before');
            const nextButton = e.target.closest('.mat-tab-header-pagination-after');
            if (prevButton && this.selectedIndex !== 0) {
                this.selectedIndex -= 1;
                if (this.selectedIndex !== 0) {
                    prevButton.classList.remove('mat-tab-header-pagination-disabled');
                } else {
                    prevButton.classList.add('mat-tab-header-pagination-disabled');
                }
            }
            if (nextButton && this.selectedIndex !== (WizardRightSideComponent.tabsNumber - 1)) {
                this.selectedIndex += 1;
                if (this.selectedIndex !== (WizardRightSideComponent.tabsNumber - 1)) {
                    nextButton.classList.remove('mat-tab-header-pagination-disabled');
                } else {
                    nextButton.classList.add('mat-tab-header-pagination-disabled');
                }
            }
        }
    }

    save(): void {
        this.offersWizardService.checkIfEmailChanged();
    }

    calculateScrolableHeight() {
        return window.innerHeight - 172;
    }

    ngOnDestroy() {
        this.tabHeader.removeEventListener('click', this.handleTabHeaderPaginationClick);
    }
}
