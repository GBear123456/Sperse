import {Component, OnInit, Injector} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'app-privacy-protection',
    templateUrl: './privacy-protection.component.html',
    styleUrls: ['./privacy-protection.component.less']
})
export class PrivacyProtectionComponent extends AppComponentBase implements OnInit {
    privacyList = [
        {title: 'Directmail.com National Do Not Mail List', url: 'http://www.directmail.com/directory/mail_preference/'},
        {title: 'Direct Mail from the Direct Marketing Association', url: 'https://www.dmachoice.org/dma/member/regist.action'},
        {title: 'Valpak Removal', url: 'http://www.coxtarget.com/mailsuppression/s/DisplayMailSuppressionForm'},
        {title: 'Stop Junk Email', url: 'http://www.ims-dm.com/cgi/optoutemps.php'},
        {title: 'Stop Junk Phone Calls (even to your cell phone)', url: 'https://www.donotcall.gov/register/reg.aspx'},
        {title: 'Stop Pre-Approved Credit Offers', url: 'https://www.optoutprescreen.com/opt_form.cgi'},
        {title: 'Stop Acxiom from selling your name to marketers', url: 'http://www.acxiom.com/about_us/privacy/consumer_information/opt_out_request_form/Pages/Opt-OutRequestForm.aspx'}
    ];

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }

}
