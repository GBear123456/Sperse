import {Component, Injector, OnInit} from '@angular/core';
import {CFOComponentBase} from '@app/cfo/shared/common/cfo-component-base';

@Component({
    selector: 'app-categorization-status',
    templateUrl: './categorization-status.component.html',
    styleUrls: ['./categorization-status.component.less']
})
export class CategorizationStatusComponent extends CFOComponentBase implements OnInit {
    private categorySynchData = [
        {transactionType: 'Classified transactions', count: 15125, percents: 75},
        {transactionType: 'Unclassified transactions', count: 5125, percents: 25}
    ];
    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }

}
