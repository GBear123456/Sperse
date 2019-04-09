import {
    AfterViewChecked,
    Component,
    ChangeDetectionStrategy,
    ElementRef,
    EventEmitter,
    Injector,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { AppEditionExpireAction } from '@shared/AppEnums';
import { ComboboxItemDto, CommonLookupServiceProxy, CreateOrUpdateEditionDto, EditionEditDto, EditionServiceProxy } from '@shared/service-proxies/service-proxies';
import { FeatureTreeComponent } from '../shared/feature-tree.component';
import { finalize } from 'rxjs/operators';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';

@Component({
    selector: 'createOrEditEditionModal',
    templateUrl: './create-or-edit-edition-modal.component.html',
    styleUrls: [ '../../../shared/metronic/m-radio.less', './create-or-edit-edition-modal.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateOrEditEditionModalComponent extends AppModalDialogComponent implements AfterViewChecked, OnInit {

    @ViewChild('editionNameInput') editionNameInput: ElementRef;
    @ViewChild('modal') modal: ElementRef;
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

    constructor(
        injector: Injector,
        private _editionService: EditionServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy
    ) {
        super(injector);
        this.data.title = this.data.editionId ? '' : this.l('CreateNewEdition');
        this.data.buttons = [
            {
                title: this.l('Save'),
                class: 'primary',
                action: this.save.bind(this)
            }
        ];
        this._commonLookupService.getEditionsForCombobox(true).subscribe(editionsResult => {
            this.expiringEditions = editionsResult.items;
            this.expiringEditions.unshift(new ComboboxItemDto({ value: null, displayText: this.l('NotAssigned'), isSelected: true }));
            this._editionService.getEditionForEdit(this.data.editionId).pipe(finalize(() => this.active = true)).subscribe(editionResult => {
                this.edition = editionResult.edition;
                this.data.title = this.data.editionId ? this.l('EditEdition') + ' ' + this.edition.displayName : this.l('CreateNewEdition');
                this.editData = editionResult;
                this.expireAction = this.edition.expiringEditionId > 0 ? AppEditionExpireAction.AssignToAnotherEdition : AppEditionExpireAction.DeactiveTenant;
                this.isFree = !editionResult.edition.monthlyPrice && !editionResult.edition.annualPrice;
                this.isTrialActive = editionResult.edition.trialDayCount > 0;
                this.isWaitingDayActive = editionResult.edition.waitingDayAfterExpire > 0;
            });
        });
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

        this.saving = true;
        this._editionService.createOrUpdateEdition(input)
            .pipe(finalize(() => this.saving = false))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this.dialogRef.close();
    }
}
