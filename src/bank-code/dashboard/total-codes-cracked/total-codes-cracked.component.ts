import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-code-total-codes-cracked',
    templateUrl: './total-codes-cracked.component.html',
    styleUrls: ['./total-codes-cracked.component.less']
})
export class TotalCodesCrackedComponent implements OnChanges {
    @Input() level: number;
    @Input() values: number[];
    type = 'pie';
    data = {
        labels: [
            'Red',
            'Orange',
            'Yellow',
            'Blue'
        ],
        datasets: [
            {
                data: [],
                backgroundColor: [
                    '#104779',
                    '#f09e1f',
                    '#1b6634',
                    '#ac1f22',
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

    constructor(public ls: AppLocalizationService) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes && changes.values) {
            this.data.datasets[0].data = changes.values.currentValue;
        }
    }

}
