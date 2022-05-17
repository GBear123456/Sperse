/** Core imports  */
import { Component, ElementRef, Injector, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { filter, pluck, takeUntil, tap, map } from 'rxjs/operators';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { CFOService } from '@shared/cfo/cfo.service';
import {
    SyncServiceProxy,
    InstanceServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { FeatureCheckerService } from 'abp-ng2-module';
import { PfmIntroComponent } from '@root/personal-finance/shared/pfm-intro/pfm-intro.component';
import { AppFeatures } from '@shared/AppFeatures';

@Component({
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChildren('content') set contentElements(elements: QueryList<any>) {
        this.contentElement = elements.first && elements.first.nativeElement;
    }
    private contentElement: ElementRef;

    isStartDisabled = false;
    isInstanceInfoLoaded = false;

    defaultSection = 'summary';
    sectionName$: Observable<string>;
    currentSectionName: string;

    menuItems = [
        { name: 'Accounts', sectionName: 'accounts' },
        { name: 'Overview', sectionName: 'summary' },
        { name: 'Budgeting', sectionName: 'spending' },
        { name: 'Transactions', sectionName: 'transactions' },
        { name: 'Holdings', sectionName: 'holdings' },
        { name: 'Allocation', sectionName: 'allocation' },
        { name: 'Goals', sectionName: 'goals' }
    ];

    features = AppFeatures;

    constructor(
        injector: Injector,
        public cfoService: CFOService,
        private syncService: SyncServiceProxy,
        private instanceServiceProxy: InstanceServiceProxy,
        private dialog: MatDialog,
        public featureCheckerService: FeatureCheckerService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.sectionName$ = this._activatedRoute.params.pipe(
            takeUntil(this.destroy$),
            pluck('sectionName'),
            /** If section name is in menuItems array - use it, else - default section */
            map((sectionName: string) => sectionName && this.menuItems.some(item => item.sectionName === sectionName) ? sectionName : this.defaultSection),
            tap(sectionName => this.currentSectionName = sectionName)
        );
        if (this.appSession.userId)
            this.checkInstanceChangeProcess();
    }

    private checkInstanceChangeProcess() {
        this.cfoService.instanceChangeProcess().subscribe(() => {
            this.isInstanceInfoLoaded = true;
        });
    }

    openPfmIntro() {
        const dialogConfig = {
            height: '650px',
            width: '900px',
            id: 'pfm-intro',
            panelClass: 'pfm-intro'
        };
        const dialogRef = this.dialog.open(PfmIntroComponent, dialogConfig);
        dialogRef.afterClosed().pipe(filter(start => !!start)).subscribe(() => {
            this.onStart();
        });
    }

    onStart(): void {
        this.isStartDisabled = true;
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        document.querySelector('body').classList.remove('finance-page');
    }

}
