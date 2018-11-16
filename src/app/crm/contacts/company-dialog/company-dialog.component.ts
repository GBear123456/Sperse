/** Core imports */
import { ChangeDetectionStrategy, Component, OnInit, Injector, ViewChild, EventEmitter, Output } from '@angular/core';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialog } from '@angular/material';
import { DxSelectBoxComponent } from '@root/node_modules/devextreme-angular';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { RootStore } from '@root/store';
import { CountriesStoreActions, CountriesStoreSelectors, OrganizationTypeStoreActions, OrganizationTypeSelectors } from '@app/store';
import { StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { CountryDto, CountryStateDto, OrganizationContactInfoDto, OrganizationContactServiceProxy, UpdateOrganizationInfoInput, NotesServiceProxy, CreateNoteInput, ContactPhotoDto, ContactPhotoServiceProxy, CreateContactPhotoInput } from '@shared/service-proxies/service-proxies';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { StringHelper } from '@shared/helpers/StringHelper';

@Component({
    selector: 'company-dialog',
    templateUrl: './company-dialog.component.html',
    styleUrls: ['./company-dialog.component.less'],
    //changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ContactPhotoServiceProxy]
})
export class CompanyDialogComponent extends ModalDialogComponent implements OnInit {
    @ViewChild(DxSelectBoxComponent) companyTypesSelect: DxSelectBoxComponent;

    states: CountryStateDto[];
    countries: CountryDto[];
    companyTypes: any[];
    companySizes: any = [
        { id: 0, name: '1 to 9' },
        { id: 1, name: '10 to 19' },
        { id: 2, name: '20 to 49' },
        { id: 3, name: '50 to 99' },
        { id: 4, name: '100 to 249' },
        { id: 5, name: '250 to 499' },
        { id: 6, name: '500 to 999' },
        { id: 7, name: '1,000 to 2,499' },
        { id: 8, name: '2,500 to 4,999' },
        { id: 9, name: '5,000 to 9,999' },
        { id: 10, name: '10,000 or more' }
    ];
    company: any = {
        id: null,
        fullName: '',
        shortName: '',
        companyType: null,
        companySize: this.companySizes[0].id,
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

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _organizationContactServiceProxy: OrganizationContactServiceProxy,
        private _notesService: NotesServiceProxy,
        private contactPhotoServiceProxy: ContactPhotoServiceProxy,
        private store$: Store<RootStore.State>
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
    }

    ngOnInit() {
        const company: OrganizationContactInfoDto = this.data.company;
        this.data.title = this.company.fullName = company.fullName;
        this.company = { ...this.company, ...company.organization };
        this.company.id = company.id;
        this.company.primaryPhoto = company.primaryPhoto;
        this.data.editTitle = true;
        this.data.titleClearButton = true;
        this.data.placeholder = this.l('Customer.CompanyName');
        this.data.buttons = [{
            id: 'saveCompany',
            title: this.l('Save'),
            class: 'primary saveButton',
            action: this.save.bind(this)
        }];
        this.loadOrganizationTypes();
        this.loadCountries();
        this.loadStates();
    }

    save() {
        this.company.companyName = this.company.fullName = this.data.title;
        let input = new UpdateOrganizationInfoInput(this.company);
        this._organizationContactServiceProxy.updateOrganizationInfo(input).subscribe(() => {
            this.notify.success(this.l('SavedSuccessfully'));
            this.close(true, {
                company: this.company
            });
        });
        if (this.company.notes) {
            this._notesService.createNote(CreateNoteInput.fromJS({
                contactId: this.company.id,
                text: this.company.notes,
                typeId: 'C',
            })).subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
            });
        }
    }
    
    private loadCountries() {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe(
            countries => this.countries = countries
        );
    }

    loadOrganizationTypes() {
        this.store$.dispatch(new OrganizationTypeStoreActions.LoadRequestAction(true));
        this.store$.pipe(select(OrganizationTypeSelectors.getOrganizationTypes)).subscribe(
            companyTypes => {
                this.companyTypes = companyTypes;
                if (!this.company.companyType) {
                    this.company.companyType = this.companyTypes[0].id;
                }
            }
        );
    }

    loadStates(countryCode: string = this.company.formedCountryId) {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode })).subscribe(
            states => this.states = states
        );
    }

    showUploadPhotoDialog(event) {
        this.dialog.open(UploadPhotoDialogComponent, {
            data: this.company,
            hasBackdrop: true
        }).afterClosed().subscribe(result => {
            if (result) {
                let base64OrigImage = StringHelper.getBase64(result.origImage),
                    base64ThumbImage = StringHelper.getBase64(result.thumImage);
                
                this.contactPhotoServiceProxy.createContactPhoto(
                    CreateContactPhotoInput.fromJS({
                        contactId: this.company.id,
                        originalImage: base64OrigImage,
                        thumbnail: base64ThumbImage
                    })
                ).subscribe(() => {
                    this.company.primaryPhoto = ContactPhotoDto.fromJS({
                        original: base64OrigImage,
                        thumbnail: base64ThumbImage
                    });
                });
            }
        });
        event.stopPropagation();
    }
}
