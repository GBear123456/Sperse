import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: 'footer.component.html',
    styleUrls: ['footer.component.less'],
    selector: 'footer'
})
export class FooterComponent extends AppComponentBase implements OnInit {
    currentYear = new Date().getFullYear();

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit(): void {
    }
}
