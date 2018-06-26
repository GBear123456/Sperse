import { Component, ViewContainerRef, OnInit, AfterViewInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppService } from './mobile.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';

@Component({
    templateUrl: './mobile.component.html',
    styleUrls: ['./mobile.component.less']
})
export class AppComponent extends AppComponentBase implements OnInit, AfterViewInit {

    private viewContainerRef: ViewContainerRef;

    installationMode: boolean = false;


    public constructor(
        injector: Injector,
        viewContainerRef: ViewContainerRef,
        private _appSessionService: AppSessionService,
        public appService: AppService
    ) {
        super(injector);
        this.viewContainerRef = viewContainerRef; // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)
    }

    ngOnInit(): void {
        this.appService.initModule();
    }

    ngAfterViewInit(): void {
        if (mApp.initialized) {
            return;
        }
        
        mApp.init();
        mLayout.init();
        mApp.initialized = true;
    }
}
