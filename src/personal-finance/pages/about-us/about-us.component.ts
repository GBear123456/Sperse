import {Component, Injector, OnInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'app-about-us',
    templateUrl: './about-us.component.html',
    styleUrls: ['./about-us.component.less']
})
export class AboutUsComponent extends AppComponentBase implements OnInit {

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }

}
