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
import { finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { RootStore } from '@root/store';
import { CountriesStoreActions, CountriesStoreSelectors, OrganizationTypeStoreActions, OrganizationTypeSelectors } from '@app/store';
import { StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { CountryDto, CountryStateDto, OrganizationContactInfoDto, OrganizationContactServiceProxy, UpdateOrganizationInfoInput, NotesServiceProxy, CreateNoteInput, ContactPhotoServiceProxy, NoteType } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';

@Component({
    selector: 'company-dialog',
    templateUrl: './company-dialog.component.html',
    styleUrls: [ '../../../shared/common/styles/form.less', './company-dialog.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ContactPhotoServiceProxy, MaskPipe]
})
export class CompanyDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild(DxDateBoxComponent) calendarComponent: DxDateBoxComponent;
    @ViewChild(DxSelectBoxComponent) companyTypesSelect: DxSelectBoxComponent;
    @ViewChildren(DxValidatorComponent) validators: QueryList<DxValidatorComponent>;
    states$: Observable<CountryStateDto[]>;
    countries$: Observable<CountryDto[]> = this.store$.pipe(select(CountriesStoreSelectors.getCountries));
    companyTypes$: Observable<any[]> = this.store$.pipe(select(OrganizationTypeSelectors.getOrganizationTypes));
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
        fullName: null,
        shortName: null,
        typeId: null,
        sizeId: null,
        annualRevenue: null,
        formedStateId: null,
        formedCountryId: 'US',
        industry: null,
        businessSicCode: null,
        description: null,
        logo: null,
        formedDate: null,
        ein: null,
        duns: null,
        ticker: null,
        notes: null,
        primaryPhoto: null,
        affiliateCode: null
    };
    manageAllowed = this.contactService.checkCGPermission(this.data.contactInfo.groupId);
    dunsRegex = AppConsts.regexPatterns.duns;
    einRegex = AppConsts.regexPatterns.ein;
    affiliateRegex = /^[a-zA-Z0-9_-]*$/;
    currentDate = new Date();
    title: string;
    buttons: IDialogButton[] = [
        {
            id: 'saveCompany',
            title: this.ls.l('Save'),
            class: 'primary saveButton',
            action: this.save.bind(this),
            disabled: !this.manageAllowed
        },
        {
            id: 'deleteCompany',
            title: this.ls.l('Delete'),
            class: 'button-layout button-default delete-button',
            action: () => this.delete(),
            disabled: !this.manageAllowed
        }
    ];

    constructor(
        private organizationContactServiceProxy: OrganizationContactServiceProxy,
        private notesService: NotesServiceProxy,
        private contactPhotoServiceProxy: ContactPhotoServiceProxy,
        private store$: Store<RootStore.State>,
        private changeDetectorRef: ChangeDetectorRef,
        private maskPipe: MaskPipe,
        private contactService: ContactsService,
        private notifyService: NotifyService,
        public ls: AppLocalizationService,
        public dialog: MatDialog,
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
        this.company.companyName = this.company.fullName = this.title;
        let input = new UpdateOrganizationInfoInput(_.mapObject(this.company, val => {
            return val || null;
        }));
        input.formedDate = this.company.formedDate ? this.getMomentFromDateWithoutTime(this.company.formedDate) : null;
        let size = _.find(this.companySizes, item => item.id === this.company.sizeId);
        if (size) {
            input.sizeFrom = size.from;
            input.sizeTo = size.to;
        }
        this.organizationContactServiceProxy.updateOrganizationInfo(input)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this.contactService.invalidateUserData();
                this.notifyService.success(this.ls.l('SavedSuccessfully'));
                this.modalDialog.close(true, {
                    company: this.company
                });
            });
        if (this.company.notes) {
            this.modalDialog.startLoading();
            this.notesService.createNote(CreateNoteInput.fromJS({
                contactId: this.company.id,
                text: this.company.notes,
                noteType: NoteType.Note,
            }))
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(
                () => this.contactService.invalidate('notes')
            );
        }
    }

    delete() {
        abp.message.confirm(
            this.ls.l('CompanyRemovalConfirmationMessage', this.company.fullName),
            (result) => {
                if (result) {
                    let personOrgRelationId = this.data.contactInfo.personContactInfo.orgRelationId;
                    this.organizationContactServiceProxy.delete(this.company.id, personOrgRelationId).subscribe(() => {
                        this.dialog.closeAll();
                        this.notifyService.success(this.ls.l('SuccessfullyRemoved'));
                        let contactInfo = this.data.contactInfo;
                        this.contactService.updateLocation(contactInfo.Id, contactInfo['leadId'],
                            undefined, contactInfo.personContactInfo.userId);
                        this.data.invalidate.emit({
                            contactId: contactInfo.id,
                            leadId: contactInfo['leadId'],
                            companyId: undefined,
                            userId: contactInfo.personContactInfo.userId
                        });
                    });
                }
            }
        );
    }

    private getMomentFromDateWithoutTime(date: any): moment.Moment {
        return date.getFullYear
            ? moment.utc(date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate())
            : moment.utc(date.format('YYYY-MM-DD'));
    }

    private loadCountries() {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
    }

    loadOrganizationTypes() {
        this.store$.dispatch(new OrganizationTypeStoreActions.LoadRequestAction(false));
    }

    loadStates(countryCode: string = this.company.formedCountryId) {
        if (countryCode) {
            this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
            this.states$ = this.store$.pipe(select(StatesStoreSelectors.getCountryStates, { countryCode: countryCode }));
        }
    }

    showUploadPhotoDialog(e) {
        if (this.manageAllowed)
            this.contactService.showUploadPhotoDialog(this.company, e).subscribe((photo: string) => {
                this.company.primaryPhoto = photo;
                this.changeDetectorRef.detectChanges();
            });
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
