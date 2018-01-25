import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CustomerInfoDto, UserServiceProxy, ActivateUserForContactInput } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'details-header',
    templateUrl: './details-header.component.html',
    styleUrls: ['./details-header.component.less'],
    providers: [UserServiceProxy]
})
export class DetailsHeaderComponent extends AppComponentBase implements OnInit {
    @Input()
    data: CustomerInfoDto;

    person = {
        id: 1,
        first_name: 'Matthew',
        second_name: 'Robertson',
        rating: 7,
        person_photo_url: 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png',
        approved_sum: '45000',
        requested_sum_min: '100000',
        requested_sum_max: '245000',
        profile_created: '6/6/2016',
        lead_owner_photo_url: 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png',
        lead_owner_name: 'R.Hibbert'
    };
    constructor(
        injector: Injector,
        private userServiceProxy: UserServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        //  this.person = this.PersonService.getPersonInfo();
    }

    requestVerification() {
        abp.message.confirm(
            'Please confirm user activation',
            (isConfirmed) => {
                if (isConfirmed) {
                    let request = new ActivateUserForContactInput();
                    request.contactId = this.data.primaryContactInfo.id;
                    this.userServiceProxy.activateUserForContact(request).subscribe(result => {
                        abp.notify.info('User was activated and email sent successfully');
                    });
                }
            }
        );
    }
}
