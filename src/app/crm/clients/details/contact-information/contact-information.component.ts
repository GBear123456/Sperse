import { Component, OnInit, Injector } from '@angular/core';
import { CustomersServiceProxy, CustomerInfoDto } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'contact-information',
  templateUrl: './contact-information.component.html',
  styleUrls: ['./contact-information.component.less']
})
export class ContactInformationComponent implements OnInit {
  public data: {
    customerInfo: CustomerInfoDto
  };

  constructor(
    injector: Injector,
    private _customerService: CustomersServiceProxy
  ) {
  }

  ngOnInit() {
    this.data = this._customerService['data'];
  }
}
