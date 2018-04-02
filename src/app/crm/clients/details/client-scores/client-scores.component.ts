import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
//import { FinancialService } from '../../services/financial/financial.service';

@Component({
    selector: 'client-scores',
    templateUrl: './client-scores.component.html',
    styleUrls: ['./client-scores.component.less']
})
export class ClientScoresComponent extends AppComponentBase implements OnInit {

    scores = {
        experian_score: {
            'amount': 1000,
            'label': 'Experian Score'
        },
        equifax_score: {
            'amount': 809,
            'label': 'Equifax Score'
        },
        transunion_score: {
            'amount': 799,
            'label': 'TransUnion Score'
        }
    };

    constructor(
        injector: Injector
        //private FinancialService: FinancialService
    ) {
        super(injector);
    }

    ngOnInit() {
        //this.scores = this.FinancialService.getPersonScores();
    }

}
