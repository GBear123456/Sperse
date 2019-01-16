/** Core imports */
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';

/** Third party imports */
import * as moment from 'moment';

/** Application imports */
import { AppLocalizationService } from 'app/shared/common/localization/app-localization.service';
import { OffersLayoutComponent } from '@root/personal-finance/shared/offers/offers-layout.component';

@Component({
    templateUrl: './credit-score.component.html',
    styleUrls: [ './credit-score.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditScoreComponent {
    @ViewChild(OffersLayoutComponent) offersComponent: OffersLayoutComponent;
    bureauAmount = '3';
    logoes: string[] = [
        'transunion',
        'equifax',
        'experian'
    ];
    advantages = [
        this.ls.l('CreditScore_InstantlyAccessYourCreditScores'),
        this.ls.l('CreditScore_SecureOnlineDelivery'),
        this.ls.l('CreditScore_DailyBureauCreditMonitoring'),
        this.ls.l('CreditScore_RoadsideAssistance')
    ];
    descriptionTitle = this.ls.l('CreditScore_DescriptionTitle');
    descriptionText = this.ls.l('CreditScore_DescriptionContent');
    currentDate = moment().format('MMM DD, YYYY');

    constructor(public ls: AppLocalizationService) {}

}
