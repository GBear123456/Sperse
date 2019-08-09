/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

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
    states$: Observable<CountryStateDto[]> = this.store$.pipe(
        select(StatesStoreSelectors.getState, { countryCode: this.countryCode }),
        filter(Boolean)
    );

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
    }
}
