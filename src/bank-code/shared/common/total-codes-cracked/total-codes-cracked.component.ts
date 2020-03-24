import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';

@Component({
    selector: 'bank-code-total-codes-cracked',
    templateUrl: './total-codes-cracked.component.html',
    styleUrls: [
        '../styles/card-title.less',
        '../styles/card-text-footer.less',
        './total-codes-cracked.component.less'
    ]
})
export class TotalCodesCrackedComponent implements OnChanges {
    @Input() level: number;
    @Input() values: number[];
    @Input() total: number;
    type = 'pie';
    data = {
        labels: [
            this.bankCodeService.bankCodeConfig[BankCodeLetter.B].definition,
            this.bankCodeService.bankCodeConfig[BankCodeLetter.A].definition,
            this.bankCodeService.bankCodeConfig[BankCodeLetter.N].definition,
            this.bankCodeService.bankCodeConfig[BankCodeLetter.K].definition,
        ],
        datasets: [
            {
                data: [],
                backgroundColor: [
                    this.bankCodeService.bankCodeConfig[BankCodeLetter.B].background,
                    this.bankCodeService.bankCodeConfig[BankCodeLetter.A].background,
                    this.bankCodeService.bankCodeConfig[BankCodeLetter.N].background,
                    this.bankCodeService.bankCodeConfig[BankCodeLetter.K].background
                ],
                label: 'Dataset 1',
                borderWidth: '12px',
                weight: 500,
            }
        ]
    };
    options = {
        legend: {
            display: false
        },
        responsive: true,
        aspectRatio: 1,
        plugins: {
            labels: {
                fontSize: 14,
                fontColor: 'white',
            }
        }
    };

    constructor(
        private bankCodeService: BankCodeService,
        public ls: AppLocalizationService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes && changes.values) {
            this.data.datasets[0].data = changes.values.currentValue;
        }
    }

    get badgeImageName() {
        return (this.level === 0 ? 1 : this.level) + '-' + (this.level === 0 ? '0' : '1');
    }

}
