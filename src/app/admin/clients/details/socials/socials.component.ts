import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CustomersServiceProxy, CustomerInfoDto } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'socials',
  templateUrl: './socials.component.html',
  styleUrls: ['./socials.component.less']
})
export class SocialsComponent extends AppComponentBase implements OnInit {
  data: {
    customerInfo: CustomerInfoDto
  };  

  LINK_TYPES = {
    F: 'facebook',
    G: 'google-plus',
    L: 'linkedin',
    P: 'pinterest',
    T: 'twitter'
  }
  
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
