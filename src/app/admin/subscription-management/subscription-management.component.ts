import { AfterViewChecked, Component, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EditionPaymentType } from '@shared/AppEnums';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ApplicationInfoDto, CreateInvoiceDto, InvoiceServiceProxy, PaymentServiceProxy, TenantLoginInfoDto, UserLoginInfoDto } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';

@Component({
    templateUrl: './subscription-management.component.html',
    animations: [appModuleAnimation()]
})

export class SubscriptionManagementComponent extends AppComponentBase implements OnInit, OnDestroy, AfterViewChecked {

    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;

    loading: boolean;
    user: UserLoginInfoDto = new UserLoginInfoDto();
    tenant: TenantLoginInfoDto = new TenantLoginInfoDto();
    application: ApplicationInfoDto = new ApplicationInfoDto();
    editionPaymentType: EditionPaymentType = EditionPaymentType;

    filterText = '';
    private rootComponent;

    constructor(
        injector: Injector,
        private _paymentServiceProxy: PaymentServiceProxy,
        private _appSessionService: AppSessionService,
        private _invoiceServiceProxy: InvoiceServiceProxy,
        private _activatedRoute: ActivatedRoute
    ) {
        super(injector);
        this.filterText = this._activatedRoute.snapshot.queryParams['filterText'] || '';
        this.rootComponent = this.getRootComponent();
        this.rootComponent.pageHeaderFixed();
    }

    ngAfterViewChecked(): void {
        //Temporary fix for: https://github.com/valor-software/ngx-bootstrap/issues/1508
        $('tabset ul.nav').addClass('m-tabs-line');
        $('tabset ul.nav li a.nav-link').addClass('m-tabs__link');
    }

    ngOnInit(): void {
        this.getSettings();
    }

    ngOnDestroy() {
        this.rootComponent.pageHeaderFixed(true);
    }

    createOrShowInvoice(paymentId: number, invoiceNo: string): void {
        if (invoiceNo) {
            window.open('/app/admin/invoice/' + paymentId, '_blank');
        } else {
            this._invoiceServiceProxy.createInvoice(new CreateInvoiceDto({ subscriptionPaymentId: paymentId })).subscribe(() => {
                this.getPaymentHistory();
                window.open('/app/admin/invoice/' + paymentId, '_blank');
            });
        }
    }

    getSettings(): void {
        this.loading = true;
        this._appSessionService.init().then(() => {
            this.loading = false;
            this.user = this._appSessionService.user;
            this.tenant = this._appSessionService.tenant;
            this.application = this._appSessionService.application;
        });
    }

    getPaymentHistory(event?: LazyLoadEvent) {
        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);

            return;
        }

        this.primengTableHelper.showLoadingIndicator();

        this._paymentServiceProxy.getPaymentHistory(
            this.primengTableHelper.getSorting(this.dataTable),
            this.primengTableHelper.getMaxResultCount(this.paginator, event),
            this.primengTableHelper.getSkipCount(this.paginator, event)
        ).subscribe(result => {
            this.primengTableHelper.totalRecordsCount = result.totalCount;
            this.primengTableHelper.records = result.items;
            this.primengTableHelper.hideLoadingIndicator();
        });
    }
}
