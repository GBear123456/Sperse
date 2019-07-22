/** Core imports */
import { Component, ViewChild, ViewContainerRef, Directive, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { takeUntil } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from 'shared/AppConsts';
import { BankCodeLayoutService } from './bank-code-layout.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Directive({
    selector: '[ad-header-host]'
})
export class AdHeaderHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: 'bank-code-header.component.html',
    styleUrls: ['bank-code-header.component.less'],
    selector: 'bank-code-header'
})
export class BankCodeHeaderComponent implements OnInit, OnDestroy {
    @ViewChild(AdHeaderHostDirective) adHeaderHost: AdHeaderHostDirective;

    loggedUserId = abp.session.userId;
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    currentDate = new Date();

    constructor(
        private layoutService: BankCodeLayoutService,
        private router: Router,
        private lifecycleService: LifecycleSubjectsService,
        public sessionService: AppSessionService
    ) {}

    ngOnInit() {
        this.layoutService.headerSubject$
            .pipe(takeUntil(this.lifecycleService.destroy$))
            .subscribe((component) => {
                setTimeout(() => {
                    this.adHeaderHost.viewContainerRef.clear();
                    this.adHeaderHost.viewContainerRef.createComponent(component);
                });
            });
    }

    logoClick() {
        this.router.navigate(['/code-breaker']);
    }

    ngOnDestroy() {
        this.lifecycleService.destroy.next();
    }
}
