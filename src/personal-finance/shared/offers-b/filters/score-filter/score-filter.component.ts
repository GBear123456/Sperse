import { Component, Output, Input, EventEmitter } from '@angular/core';
import { CreditScoreItem } from '@root/personal-finance/shared/offers-b/filters/interfaces/score-filter.interface';
import { GetMemberInfoResponseCreditScore } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'score-filter',
    templateUrl: './score-filter.component.html',
    styleUrls: ['./score-filter.component.less']
})
export class ScoreFilterComponent {
    @Output() selectionChange: EventEmitter<CreditScoreItem> = new EventEmitter<CreditScoreItem>();
    @Input() items: CreditScoreItem[];
    @Input() set selected (selectedValue: GetMemberInfoResponseCreditScore) {
        this.items.some(item => {
            if (item.value === selectedValue) {
                item.checked = true;
                return true;
            }
        });
    }

    onChoose(creditScore: CreditScoreItem) {
        this.items.forEach(item => item.checked = false);
        creditScore.checked = true;
        this.selectionChange.emit(creditScore);
    }

}
