import { Component, Input, Injector, OnInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CustomersServiceProxy, CustomerInfoDto, ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { Router, ActivatedRoute } from '@angular/router';
import { MdDialog } from '@angular/material';

@Component({
  selector: 'client-details',
  templateUrl: './client-details.component.html',
  styleUrls: ['./client-details.component.less'],
  host: {
    '(document:click)': "closeEditDialogs($event)"
  }  
})
export class ClientDetailsComponent extends AppComponentBase implements OnInit, OnDestroy {
  customerInfo: CustomerInfoDto;
  primaryContact: ContactInfoDto;
  
  person: any = {
    id: 1,
    first_name: 'Matthew',
    second_name: 'Robertson',
    rating: 7,
    person_photo_url : 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png',
    approved_sum: '45000',
    requested_sum_min: '100000',
    requested_sum_max: '245000',
    profile_created: '6/6/2016',
    lead_owner_photo_url: 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png',
    lead_owner_name: 'R.Hibbert'
  };

  navLinks = [
    {'label': 'Contact Information','route': 'contact-information'},
    {'label': 'Lead Information', 'route': 'lead-information',},
    {'label': 'Questionnaire', 'route': 'questionnaire'},
    {'label': 'Documents', 'route': 'required-documents'},
    {'label': 'Application Status', 'route': 'application-status'},
    {'label': 'Referral History', 'route': 'referal-history'},
    {'label': 'Payment Information', 'route': 'payment-information'},
    {'label': 'Activity Logs', 'route': 'activity-logs'},
    {'label': 'Notes', 'route': 'notes'}
  ];

  private rootComponent: any;
  private paramsSubscribe: any;

  constructor(
    injector: Injector,
    private _router: Router,
    private _dialog: MdDialog,
    private _route: ActivatedRoute,
    private _customerService: CustomersServiceProxy
  ) {
    super(injector);

    _customerService['data'] = {customerInfo: null};
    this.rootComponent = this.getRootComponent();    
    this.paramsSubscribe = this._route.params.subscribe(params => {
      _customerService.getCustomerInfo(params['clientId'])
        .subscribe(responce => {
          _customerService['data'].customerInfo = responce;
          this.primaryContact = responce.primaryContactInfo;
          this.customerInfo = responce;
        }
      );
    });
  }

  close(event) {
    this._dialog.closeAll();
    this._router.navigate(['app/crm/clients']);
  }

  closeEditDialogs(event) {
    if (!event.target.closest('md-dialog-container, .dx-popup-wrapper'))
      this._dialog.closeAll();
  }

  ngOnInit() {
    this.rootComponent.overflowHidden(true);
    this.rootComponent.pageHeaderFixed();   
  }

  ngOnDestroy() {
    this.paramsSubscribe.unsubscribe();

    this.rootComponent.overflowHidden();
    this.rootComponent.pageHeaderFixed(true);
  }
}
