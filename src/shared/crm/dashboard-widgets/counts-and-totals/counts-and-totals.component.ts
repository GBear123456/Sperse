import { Component, Injector, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeadServiceProxy } from 'shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';

@Component({
    selector: 'counts-and-totals',
    templateUrl: './counts-and-totals.component.html',
    styleUrls: ['./counts-and-totals.component.less'],
    providers: [ LeadServiceProxy ]
})
export class CountsAndTotalsComponent extends AppComponentBase implements OnInit {

    @Output() onDataLoaded = new EventEmitter();

    constructor(
        injector: Injector,
        private _leadServiceProxy: LeadServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this._leadServiceProxy.getLeadStats().subscribe(result => {
            this.onDataLoaded.emit(result.data);
        });
    }
}
