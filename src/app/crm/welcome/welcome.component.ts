/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    AfterViewInit,
    ViewChild,
    OnInit,
    ChangeDetectorRef
} from '@angular/core';
import { RouteReuseStrategy, ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { CacheService } from 'ng2-cache-service';
import { Observable, Subject, ReplaySubject, combineLatest } from 'rxjs';
import { filter, first, takeUntil, map, delay } from 'rxjs/operators';

/** Application imports */
import { AppStore } from '@app/store';
import { AppConsts } from '@shared/AppConsts';
import { AppService } from '@app/app.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ModuleType, LayoutType } from '@shared/service-proxies/service-proxies';
import { CrmIntroComponent } from '../shared/crm-intro/crm-intro.component';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CreateProductDialogComponent } from '@app/crm/contacts/subscriptions/add-subscription-dialog/create-product-dialog/create-product-dialog.component';
import { PaymentWizardComponent } from '@app/shared/common/payment-wizard/payment-wizard.component';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    templateUrl: './welcome.component.html',
    styleUrls: ['./welcome.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeComponent implements AfterViewInit, OnInit {

    showLoadingSpinner = true;
    private introAcceptedCacheKey: string = this.cacheHelper.getCacheKey('CRMIntro', 'IntroAccepted');
    dialogConfig = new MatDialogConfig();
    isGrantedOrders = this.permission.isGranted(AppPermissions.CRMOrders);
    hasAnyCGPermission: boolean = !!this.permission.getFirstAvailableCG();
    localization = AppConsts.localization.CRMLocalizationSourceName;

    constructor(
        public router: Router,
        private appService: AppService,
        private appSessionService: AppSessionService,
        private changeDetectorRef: ChangeDetectorRef,
        private lifeCycleSubject: LifecycleSubjectsService,
        private activatedRoute: ActivatedRoute,
        public cacheHelper: CacheHelper,
        private cacheService: CacheService,
        public ui: AppUiCustomizationService,
        public permission: AppPermissionService,
        public ls: AppLocalizationService,
        public dialog: MatDialog
    ) {}

    ngOnInit() {
    }

    ngAfterViewInit(): void {
    }

    openIntroDialog() {
        if (this.appService.isHostTenant)
            return;

        let tenant = this.appSessionService.tenant;
        if (!tenant || !tenant.customLayoutType || tenant.customLayoutType == LayoutType.Default) {
            this.dialogConfig.height = '650px';
            this.dialogConfig.width = '900px';
            this.dialogConfig.id = 'crm-intro';
            this.dialogConfig.panelClass = ['crm-intro', 'setup'];
            this.dialogConfig.data = { alreadyStarted: false };
            this.dialog.open(CrmIntroComponent, this.dialogConfig).afterClosed().subscribe(() => {
                /** Mark accepted cache with true when user closed intro and don't want to see it anymore) */
                this.cacheService.set(this.introAcceptedCacheKey, 'true');
            });
        }
    }

    activate() {
        this.lifeCycleSubject.activate.next();
        this.showLoadingSpinner = false;
        this.ui.overflowHidden(true);
        this.appService.isClientSearchDisabled = true;
        this.appService.toolbarIsHidden.next(true);
        this.changeDetectorRef.markForCheck()
    }

    subscribeToRefreshParam() {
        this.activatedRoute.queryParams
            .pipe(
                takeUntil(this.lifeCycleSubject.deactivate$),
                filter(params => !!params['refresh'])
            )
            .subscribe(() => {
                //this.refresh() 
            });
    }

    invalidate() {
        this.lifeCycleSubject.activate$.pipe(first()).subscribe(() => {
            //this.refresh(false);
        });
    }

    openProductDialog() {
        const dialogData = {
            fullHeigth: true,
            product: undefined,
            isReadOnly: !this.permission.isGranted(AppPermissions.CRMProductsManage)
        };
        this.dialog.open(CreateProductDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: dialogData
        }).afterClosed().subscribe(product => {
            if (product)
                this.router.navigate(['app/crm/products'])
        });        
    }

    openPaymentWizardDialog() {
        this.dialog.closeAll();
        this.dialog.open(PaymentWizardComponent, {
            height: '800px',
            width: '1200px',
            id: 'payment-wizard',
            panelClass: ['payment-wizard', 'setup'],
            data: {
                showSubscriptions: false
            }
        });
    }

    deactivate() {
        this.ui.overflowHidden();        
        this.appService.toolbarIsHidden.next(false);
        this.lifeCycleSubject.deactivate.next();
        this.dialog.closeAll();
    }
}