import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import range from 'lodash/range';

@Component({
    selector: 'bank-code-counters',
    templateUrl: './counters.component.html',
    styleUrls: [
        '../styles/card-body.less',
        '../styles/card-title.less',
        './counters.component.less'
    ],
    providers: [ DecimalPipe ]
})
export class CountersComponent implements OnChanges {
    @Input() crackedCodesNumbers: { percent: number, count: number }[];
    @Input() totalCrackedCodesNumber: string;
    myCodesCracked = [
        { percent: 90, outerColor: '#004a81', innerColor: '#91bfdd', title: '90%', subtitle: '4230' },
        { percent: 40, outerColor: '#ac1f22', innerColor: '#ce767f', title: '40%', subtitle: '930' },
        { percent: 48, outerColor: '#f09e1f', innerColor: '#ecd68a', title: '48%', subtitle: '2200' },
        { percent: 72, outerColor: '#1b6634', innerColor: '#87c796', title: '72%', subtitle: '4230' }
    ];
    codesCrackedAtAGlance = [
        { percent: 20.7, outerColor: '#004a81', innerColor: '#91bfdd', title: '20.7%', subtitle: '26,408' },
        { percent: 26.6, outerColor: '#ac1f22', innerColor: '#ce767f', title: '26.6%', subtitle: '33,932' },
        { percent: 36.1, outerColor: '#f09e1f', innerColor: '#ecd68a', title: '36.1%', subtitle: '46,087' },
        { percent: 16.5, outerColor: '#1b6634', innerColor: '#87c796', title: '16.5%', subtitle: '21,067' }
    ];
    range = range;
    constructor(
        private decimalPipe: DecimalPipe,
        public ls: AppLocalizationService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes && changes.crackedCodesNumbers && changes.crackedCodesNumbers.currentValue) {
            this.myCodesCracked.forEach((crackedCode, index: number) => {
                const value = changes.crackedCodesNumbers.currentValue[index];
                crackedCode.percent = value.percent;
                crackedCode.title = crackedCode.percent.toFixed() + '%';
                crackedCode.subtitle = this.decimalPipe.transform(value.count);
            });
        }
    }

    showComma(i: number): boolean {
        const numberReverseIndex = this.totalCrackedCodesNumber.length - i;
        return i !== 0 && numberReverseIndex !== this.totalCrackedCodesNumber.length && numberReverseIndex % 3 === 0;
    }

}
