import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'bank-code-counters',
    templateUrl: './counters.component.html',
    styleUrls: ['./counters.component.less']
})
export class CountersComponent implements OnInit {
    myCodesCracked = [
        { percent: 90, outerColor: '#004a81', innerColor: '#91bfdd', title: '90%', subtitle: '4230' },
        { percent: 40, outerColor: '#ac1f22', innerColor: '#ce767f', title: '40%', subtitle: '930' },
        { percent: 48, outerColor: '#f09e1f', innerColor: '#ecd68a', title: '48%', subtitle: '2200' },
        { percent: 72, outerColor: '#1b6634', innerColor: '#87c796', title: '72%', subtitle: '4230' }
    ];
    codesCrackedAtAGlance = [
        { percent: 85, outerColor: '#004a81', innerColor: '#91bfdd', title: '85%', subtitle: '4230' },
        { percent: 63, outerColor: '#ac1f22', innerColor: '#ce767f', title: '63%', subtitle: '455' },
        { percent: 77, outerColor: '#f09e1f', innerColor: '#ecd68a', title: '77%', subtitle: '6335' },
        { percent: 57, outerColor: '#1b6634', innerColor: '#87c796', title: '57%', subtitle: '7433' }
    ];
    constructor() {
    }

    ngOnInit() {
    }

}
