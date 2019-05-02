/** Core imports */
import {
    AfterViewChecked,
    Component,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    ElementRef,
    EventEmitter,
    Inject,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppEditionExpireAction } from '@shared/AppEnums';
import { ComboboxItemDto, CommonLookupServiceProxy, CreateOrUpdateEditionDto, EditionEditDto, EditionServiceProxy } from '@shared/service-proxies/service-proxies';
import { FeatureTreeComponent } from '../shared/feature-tree.component';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'createOrEditEditionModal',
    templateUrl: './create-or-edit-edition-modal.component.html',
    styleUrls: [ '../../../shared/metronic/m-radio.less', './create-or-edit-edition-modal.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateOrEditEditionModalComponent implements AfterViewChecked, OnInit {
    @ViewChild('editionNameInput') editionNameInput: ElementRef;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    saving = false;
    edition: EditionEditDto = new EditionEditDto();
    expiringEditions: ComboboxItemDto[] = [];
    expireAction: AppEditionExpireAction = AppEditionExpireAction.DeactiveTenant;
    expireActionEnum: typeof AppEditionExpireAction = AppEditionExpireAction;
    isFree = false;
    isTrialActive = false;
    isWaitingDayActive = false;
    featureTree: FeatureTreeComponent;
    editData;
    active = false;
    title: string;
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private _editionService: EditionServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy,
        private _changeDetectorRef: ChangeDetectorRef,
        private _notifyService: NotifyService,
        private _dialogRef: MatDialogRef<CreateOrEditEditionModalComponent>,
        private _changeDetector: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {
        this.title = this.data.editionId ? '' : this.ls.l('CreateNewEdition');
    }

    ngOnInit() {
        this.modalDialog.startLoading();
        this._commonLookupService.getEditionsForCombobox(true).subscribe(
            editionsResult => {
                this.expiringEditions = editionsResult.items;
                this.expiringEditions.unshift(new ComboboxItemDto({ value: null, displayText: this.ls.l('NotAssigned'), isSelected: true }));
                this._changeDetectorRef.detectChanges();
                this._editionService.getEditionForEdit(this.data.editionId).pipe(finalize(() => {
                    this.active = true;
                    this.modalDialog.finishLoading();
                    this._changeDetectorRef.detectChanges();
                })).subscribe(editionResult => {
                    this.edition = editionResult.edition;
                    this.title = this.data.editionId ? this.ls.l('EditEdition') + ' ' + this.edition.displayName : this.ls.l('CreateNewEdition');
                    this.editData = editionResult;
                    this.expireAction = this.edition.expiringEditionId > 0 ? AppEditionExpireAction.AssignToAnotherEdition : AppEditionExpireAction.DeactiveTenant;
                    this.isFree = !editionResult.edition.monthlyPrice && !editionResult.edition.annualPrice;
                    this.isTrialActive = editionResult.edition.trialDayCount > 0;
                    this.isWaitingDayActive = editionResult.edition.waitingDayAfterExpire > 0;
                    this._changeDetectorRef.detectChanges();
                });
            },
        () => this.modalDialog.finishLoading()
        );
    }

    ngAfterViewChecked(): void {
        //Temporary fix for: https://github.com/valor-software/ngx-bootstrap/issues/1508
        $('tabset ul.nav').addClass('m-tabs-line');
        $('tabset ul.nav li a.nav-link').addClass('m-tabs__link');
    }

    resetPrices() {
        this.edition.annualPrice = undefined;
        this.edition.monthlyPrice = undefined;
    }

    removeExpiringEdition() {
        this.edition.expiringEditionId = null;
    }

    save(): void {
        const input = new CreateOrUpdateEditionDto();
        input.edition = this.edition;
        input.featureValues = this.featureTree.getGrantedFeatures();
        this.modalDialog.startLoading();
        this._editionService.createOrUpdateEdition(input)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this._dialogRef.close();
    }
}
