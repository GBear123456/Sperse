import { Component, ViewContainerRef, OnInit, AfterViewInit, Injector } from '@angular/core';
import { AppComponentBase } from 'shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { SubscriptionStartType } from '@shared/AppEnums';
import { SetupService } from './setup.service';

@Component({
    templateUrl: './setup.component.html',
    styleUrls: ['./setup.component.less']
})
export class SetupComponent extends AppComponentBase implements OnInit, AfterViewInit {

    private viewContainerRef: ViewContainerRef;
    subscriptionStartType = SubscriptionStartType;

    public constructor(
        injector: Injector,
        viewContainerRef: ViewContainerRef,
        private _appSessionService: AppSessionService,
        public setupService: SetupService
    ) {
        super(injector);
        this.viewContainerRef = viewContainerRef; // You need this small hack in order to catch application root view container ref (required by ng2 bootstrap modal)
    }

    ngOnInit(): void {
        this.setupService.initModule();
    }

    ngAfterViewInit(): void {
        mApp.init();
        mApp.initComponents();
        mLayout.init();
    }
}
