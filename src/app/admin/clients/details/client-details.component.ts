import { Component, Input, Injector, OnInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { Router } from '@angular/router';

@Component({
  selector: 'client-details',
  templateUrl: './client-details.component.html',
  styleUrls: ['./client-details.component.less']
})
export class ClientDetailsComponent extends AppComponentBase implements OnInit, OnDestroy {
  @Input()
  clientId: number;

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
      {
          'label': 'Contact Information',
          'route': 'contact-information'
      },
      {
          'label': 'Lead Information',
          'route': 'lead-information',
      },
      {
          'label': 'Questionnaire',
          'route': 'questionnaire'
      },
      {
          'label': 'Application Status',
          'route': 'application-status'
      },
      {
          'label': 'Referral History',
          'route': 'referal-history'
      },
      {
          'label': 'Payment Information',
          'route': 'payment-information'
      },
      {
          'label': 'Activity Logs',
          'route': 'activity-logs'
      },
      {
          'label': 'Notes',
          'route': 'notes'
      }
  ];

  private rootComponent: any;

  constructor(
    injector: Injector,
    private _router: Router,
    private _filtersService: FiltersService
  ) {
    super(injector);

    this._filtersService.enabled = false;
    this.rootComponent = this.getRootComponent();
  }

  close(event) {
    this._router.navigate(['app/admin/clients']);
  }

  ngOnInit() {
    this.rootComponent.overflowHidden(true);
    this.rootComponent.pageHeaderFixed();   
  }

  ngOnDestroy() {
    this._filtersService.enabled = true;
    this.rootComponent.overflowHidden();
    this.rootComponent.pageHeaderFixed(true);
  }
}
