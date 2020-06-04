import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CrackedCode } from './cracked-code.interface';
import { CrackedNumber } from './cracked-number.interface';
import { CrackedCodeColor } from './cracked-code-color.type';

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
    @Input() contactCrackedCodesNumbers: CrackedNumber[];
    @Input() allCrackedCodesNumbers: CrackedNumber[];
    @Input() contactTotalCrackedCodesNumbers: string;
    @Input() allTotalCrackedCodesNumbers: string;
    crackedCodesColors: CrackedCodeColor[] = [
        { outerColor: '#004a81', innerColor: '#91bfdd' },
        { outerColor: '#ac1f22', innerColor: '#ce767f' },
        { outerColor: '#f09e1f', innerColor: '#ecd68a' },
        { outerColor: '#1b6634', innerColor: '#87c796' }
    ];
    myCodesCracked: CrackedCode[];
    codesCrackedAtAGlance: CrackedCode[];
    constructor(
        private decimalPipe: DecimalPipe,
        public ls: AppLocalizationService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes) {
            if (changes.contactCrackedCodesNumbers && changes.contactCrackedCodesNumbers.currentValue) {
                this.myCodesCracked = this.getCodesCracked(changes.contactCrackedCodesNumbers.currentValue);
            }
            if (changes.allCrackedCodesNumbers && changes.allCrackedCodesNumbers.currentValue) {
                this.codesCrackedAtAGlance = this.getCodesCracked(changes.allCrackedCodesNumbers.currentValue);
            }
        }
    }

    private getCodesCracked(crackedNumbers: CrackedNumber[]) {
        return this.crackedCodesColors.map((crackedCodeColor: CrackedCodeColor, index: number) => {
            const value = crackedNumbers[index];
            return {
                ...crackedCodeColor,
                percent: value.percent,
                title: value.percent.toFixed() + '%',
                subtitle: this.decimalPipe.transform(value.count)
            };
        });
    }

}
