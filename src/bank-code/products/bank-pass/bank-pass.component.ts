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
import { HttpClient } from '@angular/common/http';
import { SafeUrl } from '@angular/platform-browser';

/** Third party imports */
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import 'devextreme/data/odata/store';
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
    dataIsLoading = true;
    gridInitialized = false;
    totalCount: number;
    currentTabIndex = 0;
    searchValue: '';
    dataSourceURI = 'Lead';
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
            this.totalCount = this.dataSource.totalCount();
            this.dataIsLoading = false;
            this.gridInitialized = true;
            this.changeDetectorRef.detectChanges();
        }
    });
    formatting = AppConsts.formatting;
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass).pipe(
        tap((hasSubscription) => setTimeout(() => {
            if (hasSubscription) this.dataIsLoading = false;
            this.changeDetectorRef.detectChanges();
        }))
    );
    environmentLink$: Observable<SafeUrl> = this.productsService.getResourceLink('b-a-n-k-pass');
    userTimezone = '0000';
    accessCode$: Observable<string> = this.profileService.accessCode$;
    accessCodeValidationRules = [
        {
            type: 'pattern',
            pattern: AppConsts.regexPatterns.affiliateCode,
            message: this.ls.l('AccessCodeIsNotValid')
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

    constructor(
        private oDataService: ODataService,
        private changeDetectorRef: ChangeDetectorRef,
        private productsService: ProductsService,
        private renderer: Renderer2,
        private appSession: AppSessionService,
        private lifecycleSubjectService: LifecycleSubjectsService,
        private memberSettingsService: MemberSettingsServiceProxy,
        private httpClient: HttpClient,
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
        this.dataGrid.instance.refresh();
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

    ngOnDestroy() {
        if (this.hasOverflowClass) {
            this.renderer.addClass(this.document.body, 'overflow-hidden');
        }
        this.lifecycleSubjectService.destroy.next(null);
    }
}
