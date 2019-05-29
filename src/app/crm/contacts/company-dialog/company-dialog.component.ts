/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
    Inject,
    ViewChild,
    ViewChildren,
    QueryList
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { MaskPipe } from 'ngx-mask';
import { DxSelectBoxComponent, DxDateBoxComponent, DxValidatorComponent } from '@root/node_modules/devextreme-angular';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { RootStore } from '@root/store';
import { CountriesStoreActions, CountriesStoreSelectors, OrganizationTypeStoreActions, OrganizationTypeSelectors } from '@app/store';
import { StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { CountryDto, CountryStateDto, OrganizationContactInfoDto, OrganizationContactServiceProxy, UpdateOrganizationInfoInput, NotesServiceProxy, CreateNoteInput, ContactPhotoServiceProxy, CreateContactPhotoInput, CreateNoteInputNoteType } from '@shared/service-proxies/service-proxies';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { StringHelper } from '@shared/helpers/StringHelper';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';

@Component({
    selector: 'company-dialog',
    templateUrl: './company-dialog.component.html',
    styleUrls: [ '../../../shared/form.less', './company-dialog.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ContactPhotoServiceProxy, MaskPipe]
})
export class CompanyDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxDateBoxComponent) calendarComponent: DxDateBoxComponent;
    @ViewChild(DxSelectBoxComponent) companyTypesSelect: DxSelectBoxComponent;
    @ViewChildren(DxValidatorComponent) validators: QueryList<DxValidatorComponent>;
    states$: Observable<CountryStateDto[]>;
    countries$: Observable<CountryDto[]>;
    companyTypes$: Observable<any[]>;
    companySizes: any = [
        { id: 0, name: '1 to 9', from: 1, to: 9 },
        { id: 1, name: '10 to 19', from: 10, to: 19 },
        { id: 2, name: '20 to 49', from: 20, to: 49 },
        { id: 3, name: '50 to 99', from: 50, to: 99 },
        { id: 4, name: '100 to 249', from: 100, to: 249 },
        { id: 5, name: '250 to 499', from: 250, to: 499 },
        { id: 6, name: '500 to 999', from: 500, to: 999 },
        { id: 7, name: '1,000 to 2,499', from: 1000, to: 2499 },
        { id: 8, name: '2,500 to 4,999', from: 2500, to: 4999 },
        { id: 9, name: '5,000 to 9,999', from: 5000, to: 9999 },
        { id: 10, name: '10,000 or more', from: 10000, to: null }
    ];
    company: any = {
        id: null,
        fullName: '',
        shortName: '',
        typeId: null,
        sizeId: null,
        annualRevenue: '',
        formedStateId: null,
        formedCountryId: 'US',
        industry: '',
        businessSicCode: '',
        description: '',
        logo: '',
        formedDate: null,
        ein: '',
        duns: '',
        ticker: '',
        notes: '',
        primaryPhoto: null
    };
    dunsRegex = AppConsts.regexPatterns.duns;
    einRegex = AppConsts.regexPatterns.ein;
    currentDate = new Date();
    title: string;
    buttons: IDialogButton[] = [
        {
            id: 'saveCompany',
            title: this.ls.l('Save'),
            class: 'primary saveButton',
            action: this.save.bind(this)
        },
        {
            id: 'deleteCompany',
            title: this.ls.l('Delete'),
            class: 'button-layout button-default delete-button',
            action: () => this.delete()
        }
    ];

    constructor(
        public dialog: MatDialog,
        private _organizationContactServiceProxy: OrganizationContactServiceProxy,
        private _notesService: NotesServiceProxy,
        private contactPhotoServiceProxy: ContactPhotoServiceProxy,
        private store$: Store<RootStore.State>,
        private changeDetectorRef: ChangeDetectorRef,
        private maskPipe: MaskPipe,
        private clientService: ContactsService,
        private notifyService: NotifyService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.modalDialog.buttons = this.buttons;

        const company: OrganizationContactInfoDto = this.data.company;
        this.title = this.company.fullName = company.fullName;
        this.company = { ...this.company, ...company.organization };
        this.company.id = company.id;
        if (this.company.sizeId === null) {
            let size = _.find(this.companySizes, size => size.to === company.organization.sizeTo && size.from === company.organization.sizeFrom);
            this.company.sizeId = size ? size.id : null;
        }
        this.company.primaryPhoto = company.primaryPhoto;
        this.data.placeholder = this.ls.l('Customer.CompanyName');
        this.loadOrganizationTypes();
        this.loadCountries();
        this.loadStates();
    }

    save() {
        if (this.validators.toArray().some(validator => !validator.instance.validate().isValid)
            || !this.calendarComponent.instance.option('isValid')
        ) {
            return false;
        }

        this.modalDialog.startLoading();
        this.title = this.company.companyName = this.company.fullName = this.data.title;
        let input = new UpdateOrganizationInfoInput(this.company);
        input.formedDate = this.company.formedDate ? this.getMomentFromDateWithoutTime(this.company.formedDate) : null;
        let size = _.find(this.companySizes, item => item.id === this.company.sizeId);
        if (size) {
            input.sizeFrom = size.from;
            input.sizeTo = size.to;
        }
        this._organizationContactServiceProxy.updateOrganizationInfo(input)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this.notifyService.success(this.ls.l('SavedSuccessfully'));
                this.modalDialog.close(true, {
                    company: this.company
                });
            });
        if (this.company.notes) {
            this.modalDialog.startLoading();
            this._notesService.createNote(CreateNoteInput.fromJS({
                contactId: this.company.id,
                text: this.company.notes,
                noteType: CreateNoteInputNoteType.Note,
            }))
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(
                () => this.clientService.invalidate('notes')
            );
        }
    }

    delete() {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: this.ls.l('CompanyRemovalConfirmationTitle'),
                message: this.ls.l('CompanyRemovalConfirmationMessage', this.company.fullName),
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                let personOrgRelationId = this.data.contactInfo.personContactInfo.orgRelationId;
                this._organizationContactServiceProxy.delete(this.company.id, personOrgRelationId).subscribe(() => {
                    this.notifyService.success(this.ls.l('SuccessfullyRemoved'));
                    this.modalDialog.close(true);
                });
            }
        });
    }

    private getMomentFromDateWithoutTime(date: any): moment.Moment {
        return date.getFullYear
            ? moment.utc(date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate())
            : moment.utc(date.format('YYYY-MM-DD'));
    }

    private loadCountries() {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.countries$ = this.store$.pipe(select(CountriesStoreSelectors.getCountries));
    }

    loadOrganizationTypes() {
        this.store$.dispatch(new OrganizationTypeStoreActions.LoadRequestAction(false));
        this.companyTypes$ = this.store$.pipe(select(OrganizationTypeSelectors.getOrganizationTypes));
    }

    loadStates(countryCode: string = this.company.formedCountryId) {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        this.states$ = this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode }));
    }

    showUploadPhotoDialog(event) {
        this.dialog.open(UploadPhotoDialogComponent, {
            data: { ...this.company, ...this.getCompanyPhoto(this.company) },
            hasBackdrop: true
        }).afterClosed()
            .pipe(filter(result => result))
            .subscribe(result => {
                if (result.clearPhoto) {
                    this.contactPhotoServiceProxy.clearContactPhoto(this.company.id)
                        .subscribe(() => {
                            this.handlePhotoChange(null);
                        });
                } else {
                    let base64OrigImage = StringHelper.getBase64(result.origImage);
                    let base64ThumbImage = StringHelper.getBase64(result.thumImage);

                    this.contactPhotoServiceProxy.createContactPhoto(
                        CreateContactPhotoInput.fromJS({
                            contactId: this.company.id,
                            original: base64OrigImage,
                            thumbnail: base64ThumbImage,
                            source: result.source
                        })
                    ).subscribe(() => {
                        this.handlePhotoChange(base64OrigImage);
                    });
                }
            });
        event.stopPropagation();
    }

    private handlePhotoChange(photo: string) {
        this.company.primaryPhoto = photo;
        this.changeDetectorRef.detectChanges();
    }

    private getCompanyPhoto(company): { source?: string } {
        return company.primaryPhoto ? { source: 'data:image/jpeg;base64,' + this.company.primaryPhoto } : {};
    }

    onInput(e, maxLength: number, mask?: string) {
        const inputElement = e.event.target;
        if (inputElement.value.length > maxLength)
            inputElement.value = inputElement.value.slice(0, maxLength);
        if (mask)
            inputElement.value = this.maskPipe.transform(inputElement.value, mask);
    }

    calendarOnKeyDown($event) {
        if (isNaN($event.event.key) && $event.event.key != '/' &&
          [8/*Backspace*/, 46 /*Delete*/, 37 /*ArrowLeft*/, 39 /*ArrowRight*/,
              38/*ArrowUp*/, 40/*ArrowDown*/].indexOf($event.event.keyCode) < 0
        ) {
            $event.event.stopPropagation();
            $event.event.preventDefault();
        }
    }
}
