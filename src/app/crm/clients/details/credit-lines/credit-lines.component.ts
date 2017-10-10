import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'credit-lines',
  templateUrl: './credit-lines.component.html',
  styleUrls: ['./credit-lines.component.less']
})
export class CreditLinesComponent implements OnInit {

  banks = [
    {
      'name': 'Bank of America',
      'amount': '40000',
      'status': 'success'
    },
    {
      'name': 'Citi Bank',
      'amount': '4000',
      'status': 'success'
    },
    {
      'name': 'Elan Bank',
      'amount': '3000',
      'status': 'success'
    },
    {
      'name': 'Discover Bank',
      'amount': '-',
      'status': 'unsuccess'
    },
    {
      'name': 'Discover Bank',
      'amount': '1000',
      'status': 'pending'
    }
  ];
  statuses = {
      'success_amount': 0,
      'unsuccess_amount': 0,
      'pending_amount': 0
  };
  credit_lines_colupsed = false;

  constructor(
  ) { }

  ngOnInit() {
//    this.banks = this.FinancialService.getBanksCreditLines();
//    this.statuses = this.getStatuses(this.banks);
  }

  getStatuses(banks){
      for (var i = 0; i < banks.length; i++) {
          if (banks[i].status === 'success')
              this.statuses.success_amount += 1;
          if (banks[i].status === 'unsuccess')
              this.statuses.unsuccess_amount  += 1;
          if (banks[i].status === 'pending')
              this.statuses.pending_amount  += 1;
      }
      return this.statuses;
  }

  getCheckStyle(status) {
      var style = '';
      switch (status) {
        case 'success':
           style = 'check'; break;
        case 'unsuccess':
           style = 'times'; break;
        case 'pending':
           style = 'square'; break;
        default:
           style = 'square';
      }
      return style;
  }

  changeColupsStatus() {
      this.credit_lines_colupsed = !this.credit_lines_colupsed;
  }    
}
