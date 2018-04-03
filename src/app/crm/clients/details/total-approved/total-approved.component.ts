import { Component, OnInit } from '@angular/core';

//import { FinancialService } from '../../services/financial/financial.service';

@Component({
    selector: 'total-approved',
    templateUrl: './total-approved.component.html',
    styleUrls: ['./total-approved.component.less']
})
export class TotalApprovedComponent implements OnInit {

    total = {
        total_approved: '0',
        total_founded: '0',
        invoiced_amount: '0',
        amount_paid: '0',
        amount_due: '0'
    };

    constructor(//private FinancialService: FinancialService
    ) { }

    ngOnInit() {
//    this.total = this.FinancialService.getTotalFinance()
    }

}
