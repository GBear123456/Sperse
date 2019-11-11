import {AfterViewInit, Component, QueryList, ViewChildren} from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    ShapeOptions,
    LineProgressComponent
} from 'angular2-progressbar';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements AfterViewInit {
    @ViewChildren(LineProgressComponent) progressBars: QueryList<any>;
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
        0.67, 0.28, 0.88, 0.56, 0.34
    ];

    dailyGoal: ShapeOptions = {
        strokeWidth: 2,
        easing: 'easeInOut',
        duration: 1400,
        color: '#ac1f22',
        trailColor: 'rgba(149, 148, 148, 0.35)',
        trailWidth: 2,
        to: '68%',
        svgStyle: { width: '100%' }
    };
    weeklyGoal: ShapeOptions = {
        strokeWidth: 2,
        easing: 'easeInOut',
        duration: 1400,
        color: '#104779',
        trailColor: 'rgba(149, 148, 148, 0.35)',
        trailWidth: 2,
        to: '28%',
        svgStyle: { width: '100%' }
    };
    monthlyGoal: ShapeOptions = {
        strokeWidth: 2,
        easing: 'easeInOut',
        duration: 1400,
        color: '#f09e1f',
        trailColor: 'rgba(149, 148, 148, 0.35)',
        trailWidth: 2,
        to: '88%',
        svgStyle: { width: '100%' }
    };
    quarterlyGoal: ShapeOptions = {
        strokeWidth: 2,
        easing: 'easeInOut',
        duration: 1400,
        color: '#1b6634',
        trailColor: 'rgba(149, 148, 148, 0.35)',
        trailWidth: 2,
        svgStyle: { width: '100%' }
    };
    annualyGoal: ShapeOptions = {
        strokeWidth: 2,
        easing: 'easeInOut',
        duration: 1400,
        color: '#615ba5',
        trailColor: 'rgba(149, 148, 148, 0.35)',
        trailWidth: 2,
        svgStyle: { width: '100%' }
    };

    constructor(
        public ls: AppLocalizationService
    ) { }

    ngAfterViewInit() {
        this.progressBars.forEach((i, index) => {
            i.animate(this.goalProgress[index]);
        });
    }
}
