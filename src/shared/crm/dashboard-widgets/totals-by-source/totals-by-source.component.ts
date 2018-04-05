import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'totals-by-source',
    templateUrl: './totals-by-source.component.html',
    styleUrls: ['./totals-by-source.component.less'],
    providers: []
})
export class TotalsBySourceComponent extends AppComponentBase implements OnInit {
    totalsData: any = [
        { type: "Oranges", yield: 10 },
        { type: "Apples",  yield: 15 },
        { type: "Bananas", yield: 9 }
    ];

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() {

    }
}