import {Component, Injector, OnInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'app-contact-us',
    templateUrl: './contact-us.component.html',
    styleUrls: ['./contact-us.component.less']
})
export class ContactUsComponent extends AppComponentBase implements OnInit {

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }

}
