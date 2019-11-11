import { AfterViewInit, Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements AfterViewInit {
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
                data: [
                    5,
                    10,
                    4,
                    6,
                ],
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
    goalProgress = [
        { name: this.ls.l('Daily goal'), class: 'daily-goal', progress: 67 },
        { name: this.ls.l('Weekly goal'), class: 'weekly-goal', progress: 28 },
        { name: this.ls.l('Monthly goal'), class: 'monthly-goal', progress: 88 },
        { name: this.ls.l('Quarterly goal'), class: 'quarterly-goal', progress: 56 },
        { name: this.ls.l('Annualy goal'), class: 'annualy-goal', progress: 34 }
    ];

    constructor(
        public ls: AppLocalizationService
    ) { }

    ngAfterViewInit() {}
}
