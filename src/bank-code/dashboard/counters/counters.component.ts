import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-code-counters',
    templateUrl: './counters.component.html',
    styleUrls: ['./counters.component.less']
})
export class CountersComponent {
    myCodesCracked = [
        { percent: 90, outerColor: '#004a81', innerColor: '#91bfdd', title: '90%', subtitle: '4230' },
        { percent: 40, outerColor: '#ac1f22', innerColor: '#ce767f', title: '40%', subtitle: '930' },
        { percent: 48, outerColor: '#f09e1f', innerColor: '#ecd68a', title: '48%', subtitle: '2200' },
        { percent: 72, outerColor: '#1b6634', innerColor: '#87c796', title: '72%', subtitle: '4230' }
    ];
    codesCrackedAtAGlance = [
        { percent: 20.7, outerColor: '#004a81', innerColor: '#91bfdd', title: '20.7%', subtitle: '26408' },
        { percent: 26.6, outerColor: '#ac1f22', innerColor: '#ce767f', title: '26.6%', subtitle: '33932' },
        { percent: 36.1, outerColor: '#f09e1f', innerColor: '#ecd68a', title: '36.1%', subtitle: '46087' },
        { percent: 16.5, outerColor: '#1b6634', innerColor: '#87c796', title: '16.5%', subtitle: '21067' }
    ];
    constructor(public ls: AppLocalizationService) {}

}
