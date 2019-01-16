import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { CreditScoreItem } from '@root/personal-finance/shared/offers/filters/interfaces/score-filter.interface';

@Component({
    selector: 'score-filter',
    templateUrl: './score-filter.component.html',
    styleUrls: ['./score-filter.component.less']
})
export class ScoreFilterComponent implements OnInit {
    @Input() items: CreditScoreItem[];
    @Output() selectionChange: EventEmitter<CreditScoreItem> = new EventEmitter<CreditScoreItem>();
    constructor() { }

    ngOnInit() {
    }

    onChoose(creditScore: CreditScoreItem) {
        this.items.forEach(item => item.checked = false);
        creditScore.checked = true;
        this.selectionChange.emit(creditScore);
    }

}
