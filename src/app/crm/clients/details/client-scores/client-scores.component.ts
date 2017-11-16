import { Component, OnInit } from '@angular/core';

//import { FinancialService } from '../../services/financial/financial.service';

@Component({
    selector: 'client-scores',
    templateUrl: './client-scores.component.html',
    styleUrls: ['./client-scores.component.less']
})
export class ClientScoresComponent implements OnInit {

    scores = {
        experian_score: {
            'amount': 803,
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

    constructor(//private FinancialService: FinancialService
    ) {}

    ngOnInit() {
        //this.scores = this.FinancialService.getPersonScores();
    }

}
