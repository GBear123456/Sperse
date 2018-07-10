import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'contact-info-panel',
  templateUrl: './contact-info-panel.component.html',
  styleUrls: ['./contact-info-panel.component.less']
})
export class ContactInfoPanelComponent extends AppComponentBase implements OnInit {
  @Input()
  data: any;

  person = {
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
  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit(): void {
    //  this.person = this.PersonService.getPersonInfo();
  }
}
