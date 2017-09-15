import { Component, OnInit } from '@angular/core';
import { CustomersServiceProxy, CustomerInfoDto } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.less']
})
export class ContactsComponent implements OnInit {
  data: {
    customerInfo: CustomerInfoDto
  };  
  
  constructor(
    private _customerService: CustomersServiceProxy
  ) { }

  ngOnInit() {
    this.data = this._customerService['data'];
  }
}
