import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MdDialog, MdDialogRef } from '@angular/material';
import { CustomersServiceProxy, CustomerInfoDto } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'addresses',
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.less']
})
export class AddressesComponent extends AppComponentBase implements OnInit {
  data: any[] = [];

  constructor(
    injector: Injector,
    private _customerService: CustomersServiceProxy
  ) { 
    super(injector);
  }

  ngOnInit() {
    this.data = this._customerService['data'];
  }
}
