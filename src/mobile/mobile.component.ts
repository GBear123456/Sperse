import { Component, ViewContainerRef, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from './mobile.service';

@Component({
    templateUrl: './mobile.component.html',
    styleUrls: ['./mobile.component.less']
})
export class AppComponent extends AppComponentBase implements OnInit {

    private viewContainerRef: ViewContainerRef;

    installationMode = false;


    public constructor(
        injector: Injector,
        viewContainerRef: ViewContainerRef,
        public appService: AppService
    ) {
        super(injector);
        this.viewContainerRef = viewContainerRef; // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)
    }

    ngOnInit(): void {
        this.appService.initModule();
    }

}
