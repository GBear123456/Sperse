/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MaskPipe } from 'ngx-mask';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';
import { CountryStateDto } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'app-wizard-home-info-step',
    templateUrl: './wizard-home-info-step.component.html',
    styleUrls: ['./wizard-home-info-step.component.less'],
    providers: [MaskPipe]
})
export class WizardHomeInfoStepComponent implements OnInit {
    countryCode = 'US';
    zipRegex = AppConsts.regexPatterns.zipUsPattern;
    states$: Observable<CountryStateDto[]> = this.store$.pipe(
        select(StatesStoreSelectors.getState, { countryCode: this.countryCode }),
        filter(Boolean)
    );

    constructor(
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public offersWizardService: OffersWizardService,
        private store$: Store<RootStore.State>,
        private maskPipe: MaskPipe
    ) {}

    ngOnInit() {
        this.getStates();
    }

    getStates(): void {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.countryCode));
    }

    onInput(e, maxLength: number, mask?: string) {
        const inputElement = e.event.target;
        if (inputElement.value.length > maxLength)
            inputElement.value = inputElement.value.slice(0, maxLength);
        if (mask)
            inputElement.value = this.maskPipe.transform(inputElement.value, mask);
    }

}
