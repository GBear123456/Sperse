/** Core imports */
import { ChangeDetectionStrategy, Component, OnInit, Injector, ViewChild } from '@angular/core';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

/** Third party imports */
import { Store, select } from '@ngrx/store';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { RootStore } from '@root/store';
import { CountriesStoreActions, CountriesStoreSelectors, OrganizationTypeStoreActions, OrganizationTypeSelectors } from '@app/store';
import { StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { CountryDto, CountryStateDto, OrganizationContactInfoDto } from '@shared/service-proxies/service-proxies';
import { DxSelectBoxComponent } from '@root/node_modules/devextreme-angular';

@Component({
    selector: 'company-dialog',
    templateUrl: './company-dialog.component.html',
    styleUrls: ['./company-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
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
        fullName: '',
        shortName: '',
        companyType: null,
        companySize: this.companySizes[0].id,
        annualRevenue: '',
        state: null,
        countryCode: 'US',
        industry: '',
        businessSicCode: '',
        productsAndServices: '',
        logo: '',
        foundedIn: '',
        ein: '',
        duns: '',
        stockSymbol: '',
        notes: ''
    };

    constructor(
        injector: Injector,
        private store$: Store<RootStore.State>
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
    }

    ngOnInit() {
        const company: OrganizationContactInfoDto = this.data.company;
        this.data.title = this.company.fullName = company.fullName;
        this.company = { ...this.company, ...company.organization };
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

    save() {}

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

    loadStates(countryCode: string = this.company.countryCode) {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode })).subscribe(
            states => this.states = states
        );
    }

    fileDropped(e) {
        console.log('file droped', e);
    }

    fileChangeListener(e) {
        console.log('file selected', e);
    }
}
