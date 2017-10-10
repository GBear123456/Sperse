import { Component, OnInit } from '@angular/core';
//import { FinancialService } from '../../services/financial/financial.service';

@Component({
  selector: 'total-approved',
  templateUrl: './total-approved.component.html',
  styleUrls: ['./total-approved.component.less']
})
export class TotalApprovedComponent implements OnInit {

  total = {
    total_approved: '99,999',
    total_founded: '40,000',
    invoiced_amount: '4,000',
    amount_paid: '3,000',
    amount_due: '1,000'
  };

  constructor(
    //private FinancialService: FinancialService
  ) { }

  ngOnInit() {
//    this.total = this.FinancialService.getTotalFinance()
  }

}
