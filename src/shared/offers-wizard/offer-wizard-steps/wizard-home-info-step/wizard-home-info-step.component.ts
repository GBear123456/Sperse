/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';
import { CountryStateDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-wizard-home-info-step',
    templateUrl: './wizard-home-info-step.component.html',
    styleUrls: ['./wizard-home-info-step.component.less']
})
export class WizardHomeInfoStepComponent implements OnInit {
    countryCode = 'US';
    states: CountryStateDto[];

    constructor(
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public offersWizardService: OffersWizardService,
        private store$: Store<RootStore.State>
    ) {}

    ngOnInit() {
        this.getStates();
    }

    getStates(): void {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: this.countryCode }))
            .subscribe(result => {
                if (result) {
                    this.states = result;
                }
            });
    }
}
