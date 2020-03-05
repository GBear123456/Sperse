/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewChild
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SafeUrl } from '@angular/platform-browser';

/** Third party imports */
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import { DxoPagerComponent } from 'devextreme-angular/ui/nested';
import 'devextreme/data/odata/store';
import ODataStore from 'devextreme/data/odata/store';
import { Observable } from 'rxjs';
import { filter, takeUntil, tap, map } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';
import { ODataService } from '@shared/common/odata/odata.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProductsService } from '@root/bank-code/products/products.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { MemberSettingsServiceProxy, UpdateUserAffiliateCodeDto } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { GoalType } from '@app/shared/common/bank-code/goal-type.interface';
import { AvailableBankCodes } from '@root/bank-code/products/bank-pass/available-bank-codes.interface';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    selector: 'bank-pass',
    templateUrl: 'bank-pass.component.html',
    styleUrls: ['./bank-pass.component.less'],
    providers: [ LifecycleSubjectsService, MemberSettingsServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankPassComponent implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(MatTabGroup) matTabGroup: MatTabGroup;
    @ViewChild(DxoPagerComponent) pager: DxoPagerComponent;
    dataIsLoading = true;
    gridInitialized = false;
    totalCount: number;
    currentTabIndex = 0;
    searchValue: '';
    private readonly dataSourceURI = 'Lead';
    private readonly totalDataSourceURI = 'Lead/$count';
    dataSource = new DataSource({
        requireTotalCount: true,
        select: [
            'Id',
            'PhotoPublicId',
            'Name',
            'Email',
            'Phone',
            'CountryId',
            'State',
            'BankCode',
            'LeadDate'
        ],
        sort: [{ selector: 'Id', desc: true }],
        store: {
            key: 'Id',
            type: 'odata',
            url: this.getODataUrl(this.dataSourceURI),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                this.dataIsLoading = true;
                this.changeDetectorRef.detectChanges();
                this.transformRequest(request);
            },
            deserializeDates: false,
            paginate: true
        },
        onChanged: () => {
            this.dataIsLoading = false;
            this.gridInitialized = true;
            this.changeDetectorRef.detectChanges();
        }
    });
    totalDataSource = new DataSource({
        paginate: false,
        store: new ODataStore({
            url: this.getODataUrl(this.totalDataSourceURI),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                this.transformRequest(request);
            },
            onLoaded: (count: any) => {
                this.totalCount = count;
                this.changeDetectorRef.detectChanges();
            }
        })
    });
    formatting = AppConsts.formatting;
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass).pipe(
        tap((hasSubscription) => setTimeout(() => {
            if (hasSubscription) this.dataIsLoading = false;
            this.changeDetectorRef.detectChanges();
        }))
    );
    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('b-a-n-k-pass');
    userTimezone = DateHelper.getUserTimezone();
    accessCode$: Observable<string> = this.profileService.accessCode$;
    accessCodeValidationRules = [
        {
            type: 'pattern',
            pattern: AppConsts.regexPatterns.affiliateCode,
            message: this.ls.l('AccessCodeIsNotValid')
        },
        {
            type: 'stringLength',
            min: 4,
            message: this.ls.l('MinLengthIs', 4)
        },
        {
            type: 'stringLength',
            max: 30,
            message: this.ls.l('MaxLengthIs', 30)
        }
    ];
    goalTypes: GoalType[] = this.bankCodeService.goalTypes;
    workDaysPerWeekValues = [ 1, 2, 3, 4, 5, 6, 7 ];
    goalValues = [ 3, 4, 5 ];
    hasOverflowClass;
    bankCodeBadges = this.bankCodeService.bankCodeBadges;
    availableBankCodes$: Observable<AvailableBankCodes> = this.bankCodeService.getAvailableBankCodes();
    bankCodeGroups: string[][] = [
        [ 'BANK', 'BAKN', 'BNAK', 'BNKA', 'BKNA', 'BKAN' ],
        [ 'ABNK', 'ABKN', 'ANBK', 'ANKB', 'AKNB', 'AKBN' ],
        [ 'NABK', 'NAKB', 'NBAK', 'NBKA', 'NKBA', 'NKAB' ],
        [ 'KANB', 'KABN', 'KNAB', 'KNBA', 'KBNA', 'KBAN' ]
    ];
    showAi$: Observable<boolean> = this.route.queryParamMap.pipe(
        map((paramsMap: ParamMap) => {
            const showAi = paramsMap.get('show-ai');
            return showAi && showAi === 'true';
        })
    );

    constructor(
        private oDataService: ODataService,
        private changeDetectorRef: ChangeDetectorRef,
        private productsService: ProductsService,
        private renderer: Renderer2,
        private appSession: AppSessionService,
        private lifecycleSubjectService: LifecycleSubjectsService,
        private memberSettingsService: MemberSettingsServiceProxy,
        private httpClient: HttpClient,
        private route: ActivatedRoute,
        public bankCodeService: BankCodeService,
        public ls: AppLocalizationService,
        public httpInterceptor: AppHttpInterceptor,
        public profileService: ProfileService,
        @Inject(DOCUMENT) private document: any
    ) {}

    ngOnInit() {
        this.hasSubscription$.pipe(
            takeUntil(this.lifecycleSubjectService.destroy$),
            filter(Boolean)
        ).subscribe(() => {
            this.hasOverflowClass = this.document.body.classList.contains('overflow-hidden');
            if (this.hasOverflowClass) {
                this.renderer.removeClass(this.document.body, 'overflow-hidden');
            }
        });
        this.totalDataSource.load();
    }

    private transformRequest(request) {
        if (this.searchValue) {
            request.params.quickSearchString = this.searchValue;
        }
        request.params.contactGroupId = ContactGroup.Client;
        request.params.$count = true;
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
    }

    onIframeLoad(e) {
        if (e.target.src !== '') {
            this.dataIsLoading = false;
        }
    }

    getSubTitle(goal): Observable<string> {
        return goal.currentNumber$.pipe(map((value: number) => {
            return String(value || 0);
        }));
    }

    tabChanged(tabChangeEvent: MatTabChangeEvent): void {
        this.currentTabIndex = tabChangeEvent.index;
        if (this.currentTabIndex === 2) {
            this.dataIsLoading = true;
        }
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
        /** If selected tab is not leads */
        if (this.matTabGroup.selectedIndex !== 1) {
            this.matTabGroup.selectedIndex = 1;
        }
        this.searchValue = e.value;
        this.refresh();
    }

    private refresh() {
        this.dataGrid.instance.refresh();
        this.totalDataSource.load();
    }

    accessCodeChanged(accessCode: string) {
        this.profileService.updateAccessCode(accessCode);
        this.memberSettingsService.updateAffiliateCode(new UpdateUserAffiliateCodeDto({ affiliateCode: accessCode })).subscribe(
            () => {
                abp.notify.info(this.ls.l('AccessCodeUpdated'));
                this.appSession.user.affiliateCode = accessCode;
            },
            /** Update back if error comes */
            () => this.profileService.updateAccessCode(this.appSession.user.affiliateCode)
        );
    }

    isBankCodeActive(bankCode: string): Observable<boolean> {
        return this.availableBankCodes$.pipe(
            map((availableBankCodes: AvailableBankCodes) => !!(availableBankCodes && availableBankCodes[bankCode]))
        );
    }

    getBadgeImageName(index: number): Observable<string> {
        return this.bankCodeService.bankCodeLevel$.pipe(
            map((bankCodeLevel: number) => (index + 1) + '-' + ((index + 1) <= bankCodeLevel ? '1' : '0'))
        );
    }

    getInfoText(): string {
        let infoText = '';
        if (this.pager) {
            const from = this.pager.instance.pageIndex() * this.pager.instance.pageSize() + 1;
            const to = from + this.pager.instance.getVisibleRows().length - 1;
            infoText = `${from && to ? `Showing ${from} to ${to} of ` : ''}${this.totalCount} records`;
        }
        return infoText;
    }

    onContentReady() {
        this.changeDetectorRef.detectChanges();
    }

    ngOnDestroy() {
        if (this.hasOverflowClass) {
            this.renderer.addClass(this.document.body, 'overflow-hidden');
        }
        this.lifecycleSubjectService.destroy.next(null);
    }
}
