import {Component, Injector, OnInit} from '@angular/core';
import {CFOComponentBase} from '@app/cfo/shared/common/cfo-component-base';

@Component({
    selector: 'app-accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent extends CFOComponentBase implements OnInit {
    private accountsData = [
        {value: '46', name: 'TotalAccounts', isDetail: true},
        {value: '65', name: 'TotalPortfolios', isDetail: false},
        {value: '$1,337,656.46', name: 'NetWorth', isDetail: false}
    ];
    
    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }

}
