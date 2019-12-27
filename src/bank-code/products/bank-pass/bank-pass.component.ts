/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Renderer2,
    ViewChild,
    Inject,
    OnInit,
    OnDestroy
} from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import 'devextreme/data/odata/store';
import { Observable } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';
import { ODataService } from '@shared/common/odata/odata.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProductsService } from '@root/bank-code/products/products.service';
import { DOCUMENT } from '@angular/common';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';

@Component({
    selector: 'bank-pass',
    templateUrl: 'bank-pass.component.html',
    styleUrls: ['./bank-pass.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankPassComponent implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    totalCount: number;
    searchValue: '';
    dataSourceURI = 'Lead';
    gridPagerConfig = DataGridService.defaultGridPagerConfig;
    dataSource = new DataSource({
        requireTotalCount: true,
        store: {
            key: 'Id',
            type: 'odata',
            url: this.getODataUrl(this.dataSourceURI),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                this.dataIsLoading = true;
                this.changeDetectorRef.detectChanges();
                if (this.searchValue) {
                    request.params.quickSearchString = this.searchValue;
                }
                request.params.contactGroupId = ContactGroup.Client;
                const queryParams = UrlHelper.getQueryParameters();
                if (queryParams['user-key']) {
                    request.headers['user-key'] = queryParams['user-key'];
                    if (queryParams['tenantId']) {
                        request.params['tenantId'] = queryParams['tenantId'];
                    }
                } else {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
            },
            deserializeDates: false,
            paginate: true
        },
        onChanged: () => {
            this.dataIsLoading = false;
            this.totalCount = this.dataSource.totalCount();
            this.changeDetectorRef.detectChanges();
        }
    });
    formatting = AppConsts.formatting;
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass);
    dataIsLoading = false;
    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('b-a-n-k-pass');
    userTimezone = '0000';
    accessCode$: Observable<string> = this.profileService.accessCode$;
    goalTypes = [
        {
            text: this.ls.l('Daily'),
            number: 3,
            currentNumber: 1,
            innerColor: '#91bfdd',
            outerColor: '#004a81'
        },
        {
            text: this.ls.l('Weekly'),
            number: 15,
            currentNumber: 10,
            innerColor: '#ce767f',
            outerColor: '#ac1f22'
        },
        {
            text: this.ls.l('Monthly'),
            number: 60,
            currentNumber: 29,
            innerColor: '#ecd68a',
            outerColor: '#f09e1e'
        },
        {
            text: this.ls.l('Quarterly'),
            number: 120,
            currentNumber: 29,
            innerColor: '#87c796',
            outerColor: '#1b6634'
        },
        {
            text: this.ls.l('Annual'),
            number: 720,
            currentNumber: 348,
            innerColor: '#c8c0e1',
            outerColor: '#004a81'
        },
        {
            text: this.ls.l('Lifetime'),
            number: 1000,
            currentNumber: 850,
            innerColor: '#ddbcdb',
            outerColor: '#b142ab'
        }
    ];
    workDaysPerWeekValues = [ 1, 2, 3, 4, 5, 6, 7 ];
    goalValues = [ 3, 4, 5 ];
    hasOverflowClass;

    constructor(
        private oDataService: ODataService,
        private changeDetectorRef: ChangeDetectorRef,
        private productsService: ProductsService,
        private renderer: Renderer2,
        private lifecycleSubjectService: LifecycleSubjectsService,
        public ls: AppLocalizationService,
        public httpInterceptor: AppHttpInterceptor,
        public profileService: ProfileService,
        @Inject(DOCUMENT) private document: any
    ) {}

    ngOnInit() {
        this.hasSubscription$
            .pipe(
                takeUntil(this.lifecycleSubjectService.destroy$),
                filter(Boolean)
            )
            .subscribe(() => {
                this.hasOverflowClass = this.document.body.classList.contains('overflow-hidden');
                if (this.hasOverflowClass) {
                    this.renderer.removeClass(this.document.body, 'overflow-hidden');
                }
            });
    }

    getQuickSearchParam() {
        return this.searchValue ? { name: 'quickSearchString', value: this.searchValue } : null;
    }

    getODataUrl(uri: string, filter?: Object, instanceData = null) {
        const searchParam = this.getQuickSearchParam();
        const params = searchParam && [searchParam];
        return this.oDataService.getODataUrl(uri, filter, instanceData, params);
    }

    searchValueChange(e) {
        if (e.value !== this.searchValue) {
            this.searchValue = e.value;
            this.dataGrid.instance.getDataSource().load();
        }
    }

    ngOnDestroy() {
        if (this.hasOverflowClass) {
            this.renderer.addClass(this.document.body, 'overflow-hidden');
        }
        this.lifecycleSubjectService.destroy.next(null);
    }
}
