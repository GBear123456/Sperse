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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, switchMap, tap } from 'rxjs/operators';

/** Application imports */
import { AppEditionExpireAction } from '@shared/AppEnums';
import { DxNumberBoxComponent } from 'devextreme-angular/ui/number-box';
import {
    ComboboxItemDto,
    CommonLookupServiceProxy,
    CreateOrUpdateEditionDto,
    EditionEditDto,
    EditionServiceProxy,
    GetEditionEditOutput, SubscribableEditionComboboxItemDtoListResultDto
} from '@shared/service-proxies/service-proxies';
import { FeatureTreeComponent } from '../../shared/feature-tree.component';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'createOrEditEditionModal',
    templateUrl: './create-or-edit-edition-modal.component.html',
    styleUrls: [
        '../../../shared/common/styles/checkbox-radio.less',
        './create-or-edit-edition-modal.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateOrEditEditionModalComponent implements AfterViewChecked, OnInit {
    @ViewChild('editionNameInput') editionNameInput: ElementRef;
    @ViewChild('monthlyPriceInput') monthlyPriceInput: DxNumberBoxComponent;
    @ViewChild('annualPriceInput') annualPriceInput: DxNumberBoxComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(FeatureTreeComponent) featureTree: FeatureTreeComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    saving = false;
    edition: EditionEditDto = new EditionEditDto();
    expiringEditions: ComboboxItemDto[] = [];
    expireAction: AppEditionExpireAction = AppEditionExpireAction.DeactiveTenant;
    expireActionEnum: typeof AppEditionExpireAction = AppEditionExpireAction;
    isFree = false;
    isTrialActive = false;
    isWaitingDayActive = false;
    editData;
    active = false;
    title: string = this.data.editionId ? '' : this.ls.l('CreateNewEdition');
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private editionService: EditionServiceProxy,
        private commonLookupService: CommonLookupServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private notifyService: NotifyService,
        private dialogRef: MatDialogRef<CreateOrEditEditionModalComponent>,
        private changeDetector: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this.commonLookupService.getEditionsForCombobox(true).pipe(
            tap((editionsResult: SubscribableEditionComboboxItemDtoListResultDto) => {
                this.expiringEditions = editionsResult.items;
                this.expiringEditions.unshift(new ComboboxItemDto({
                    value: null,
                    displayText: this.ls.l('NotAssigned'),
                    isSelected: true
                }));
                this.changeDetectorRef.detectChanges();
            }),
            switchMap(() => this.editionService.getEditionForEdit(this.data.editionId).pipe(
                finalize(() => {
                    this.active = true;
                    this.modalDialog.finishLoading();
                    this.changeDetectorRef.detectChanges();
                })
            ))
        ).subscribe(
        (editionResult: GetEditionEditOutput) => {
                this.edition = editionResult.edition;
                this.title = this.data.editionId ? this.ls.l('EditEdition') + ' ' + this.edition.displayName : this.ls.l('CreateNewEdition');
                this.editData = editionResult;
                this.expireAction = this.edition.expiringEditionId > 0 ? AppEditionExpireAction.AssignToAnotherEdition : AppEditionExpireAction.DeactiveTenant;
                this.isFree = !editionResult.edition.monthlyPrice && !editionResult.edition.annualPrice;
                this.isTrialActive = editionResult.edition.trialDayCount > 0;
                this.isWaitingDayActive = editionResult.edition.waitingDayAfterExpire > 0;
                this.changeDetectorRef.detectChanges();
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

    checkSetFieldValid(input) {
        input.instance.option('isValid', Boolean(input.instance.option('value')));
    }

    save(): void {
        if (!this.isFree && (!this.edition.monthlyPrice || !this.edition.annualPrice)) {
            this.checkSetFieldValid(this.monthlyPriceInput);
            this.checkSetFieldValid(this.annualPriceInput);
            return ;
        }

        const input = new CreateOrUpdateEditionDto();
        input.edition = this.edition;
        input.featureValues = this.featureTree.getGrantedFeatures();
        this.modalDialog.startLoading();
        this.editionService.createOrUpdateEdition(input)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
                this.dialogRef.close(true);
                this.modalSave.emit(null);
            });
    }

}
