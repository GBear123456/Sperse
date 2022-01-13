/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    OnDestroy,
    OnInit,
    Optional,
    Renderer2,
    ViewChild
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SafeUrl } from '@angular/platform-browser';

/** Third party imports */
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import { DxoPagerComponent } from 'devextreme-angular/ui/nested';
import 'devextreme/data/odata/store';
import ODataStore from 'devextreme/data/odata/store';
import { Observable, of, zip } from 'rxjs';
import { filter, takeUntil, tap, map } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';
import { AppPermissions } from '@shared/AppPermissions';
import { ODataService } from '@shared/common/odata/odata.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProductsService } from '@root/bank-code/products/products.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import {
    BANKCodeServiceProxy,
    ContactServiceProxy,
    MemberSettingsServiceProxy,
    CreateOrEditLeadInput
} from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { GoalType } from '@app/shared/common/bank-code/goal-type.interface';
import { AvailableBankCodes } from '@root/bank-code/products/bank-pass/available-bank-codes.interface';
import { DateHelper } from '@shared/helpers/DateHelper';
import { Param } from '@shared/common/odata/param.model';
import { InstanceModel } from '@shared/cfo/instance.model';
import { ExportService } from '@shared/common/export/export.service';
import { ExportGoogleSheetService } from '@shared/common/export/export-google-sheets/export-google-sheets';
import { CreateEntityDialogComponent } from '@shared/common/create-entity-dialog/create-entity-dialog.component';
import { MessageService } from 'abp-ng2-module';
import { NotifyService } from 'abp-ng2-module';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { FiltersService } from '@shared/filters/filters.service';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { BankPassContactDto } from '@root/bank-code/products/bank-pass/contact-dto.type';
import { BankPassFields } from '@root/bank-code/products/bank-pass/bank-pass-fields.enum';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { FieldDependencies } from '@app/shared/common/data-grid.service/field-dependencies.interface';
import { CreateEntityDialogData } from '@shared/common/create-entity-dialog/models/create-entity-dialog-data.interface';

@Component({
    selector: 'bank-pass',
    templateUrl: 'bank-pass.component.html',
    styleUrls: ['./bank-pass.component.less'],
    providers: [ BANKCodeServiceProxy, LifecycleSubjectsService, MemberSettingsServiceProxy, ExportService, ExportGoogleSheetService ],
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
    private readonly dataSourceURI = 'Contact';
    private readonly totalDataSourceURI = 'Contact/$count';
    readonly bankPassFields: KeysEnum<BankPassContactDto> = BankPassFields;
    private fieldsDependencies: FieldDependencies = {
        location: [
            this.bankPassFields.CountryId,
            this.bankPassFields.State
        ]
    }
    dataSource = new DataSource({
        requireTotalCount: true,
        sort: [{ selector: this.bankPassFields.Id, desc: true }],
        store: new ODataStore({
            key: this.bankPassFields.Id,
            url: this.getODataUrl(
                this.dataSourceURI,
                [
                    this.bankCodeService.getSourceFilters(),
                    FiltersService.filterByParentId()
                ]
            ),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                /** To avoid double spinner after export to excel */
                if (request.params.hasOwnProperty('$top')) {
                    this.dataIsLoading = true;
                    this.changeDetectorRef.detectChanges();
                }
                request.params.isActive = true;
                request.params.$select = DataGridService.getSelectFields(
                    this.dataGrid,
                    [ this.bankPassFields.Id ],
                    this.fieldsDependencies
                );
                this.transformRequest(request);
            },
            deserializeDates: false
        }),
        onChanged: () => {
            this.dataIsLoading = false;
            this.gridInitialized = true;
            this.changeDetectorRef.detectChanges();
        }
    });
    totalDataSource = new DataSource({
        paginate: false,
        store: new ODataStore({
            url: this.getODataUrl(
                this.totalDataSourceURI,
                [
                    this.bankCodeService.getSourceFilters()
                ]
            ),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                this.transformRequest(request);
            },
            onLoaded: (count: any) => {
                if (!isNaN(count)) {
                    this.totalCount = count;
                    this.changeDetectorRef.detectChanges();
                }
            }
        })
    });
    formatting = AppConsts.formatting;
    hasConnectSubscription$: Observable<boolean> = zip(
        this.profileService.checkServiceSubscription(BankCodeServiceType.Connect),
        this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPassOnly),
    ).pipe(map((res: boolean[]) => res.some(Boolean)));
    hasSubscription$: Observable<boolean> = zip(
        this.profileService.checkServiceSubscription(BankCodeServiceType.BANKVault),
        this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass),
        this.profileService.checkServiceSubscription(BankCodeServiceType.StarterKitPro).pipe(
            map((enabled: boolean) => enabled && this.profileService.isAscira)
        ),
        this.hasConnectSubscription$
    ).pipe(
        map((res: boolean[]) => res.some(Boolean)),
        tap((hasSubscription: boolean) => setTimeout(() => {
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
            max: AppConsts.maxAffiliateCodeLength,
            message: this.ls.l('MaxLengthIs', AppConsts.maxAffiliateCodeLength)
        }
    ];
    goalTypes: GoalType[] = this.bankCodeService.goalTypes;
    workDaysPerWeekValues = [ 1, 2, 3, 4, 5, 6, 7 ];
    goalValues = [ 3, 4, 5 ];
    hasOverflowClass;
    bankCodeBadges = this.bankCodeService.bankCodeBadges;
    contactAvailableBankCodes$: Observable<AvailableBankCodes> = this.bankCodeService.contactAvailableBankCodes$;
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
    bankCodeLevel$ = this.bankCodeService.bankCodeLevel$;
    bankFunnelLink = 'https://www.dropbox.com/s/bktc65pq15d513t/BANKPASS%20Swipe%20Copy.pdf';
    showBankFunnels: boolean = location.href.indexOf('successfactory.com') < 0;
    contactBankCodesGroupsCountsWithPercents$ = this.bankCodeService.contactBankCodesGroupsCountsWithPercents$;
    contactBankCodeTotalCount$: Observable<string> = this.bankCodeService.contactBankCodeTotalCount$;

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
        private exportService: ExportService,
        private dialog: MatDialog,
        private bankCodeServiceProxy: BANKCodeServiceProxy,
        private messageService: MessageService,
        private contactServiceProxy: ContactServiceProxy,
        private notifyService: NotifyService,
        private permissionService: AppPermissionService,
        public bankCodeService: BankCodeService,
        public ls: AppLocalizationService,
        public httpInterceptor: AppHttpInterceptor,
        public profileService: ProfileService,
        @Inject(DOCUMENT) private document: any,
        @Inject('shared') @Optional() private shared: boolean
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
            this.totalDataSource.load();
        });
    }

    private transformRequest(request) {
        if (this.searchValue) {
            request.params.quickSearchString = this.searchValue;
        }
        request.params.isActive = true;
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

    tabChanged(tabChangeEvent: MatTabChangeEvent): void {
        this.currentTabIndex = tabChangeEvent.index;
        if (this.currentTabIndex === 2) {
            this.dataIsLoading = true;
        }
    }

    getQuickSearchParam(): Param {
        return this.searchValue ? { name: 'quickSearchString', value: this.searchValue } : null;
    }

    getODataUrl(uri: string, filter?: Object, instanceData: InstanceModel = null) {
        const searchParam = this.getQuickSearchParam();
        const params: Param[] = searchParam && [searchParam];
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

    refresh() {
        if (this.dataGrid) {
            this.dataGrid.instance.refresh();
        }
        this.totalDataSource.load();
    }

    accessCodeChanged(accessCode: string) {
        this.profileService.updateAccessCode(accessCode);
    }

    isBankCodeActive(bankCode: string): Observable<boolean> {
        return this.contactAvailableBankCodes$.pipe(
            map((availableBankCodes: AvailableBankCodes) => !!(availableBankCodes && availableBankCodes[bankCode]))
        );
    }

    getBadgeImageName(index: number): Observable<string> {
        return this.bankCodeLevel$.pipe(
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

    exportToExcel() {
        this.exportService.exportToXLS('all', this.dataGrid);
    }

    openAddLeadDialog() {
        const dialogData: CreateEntityDialogData = {
            refreshParent: () => this.refresh(),
            createMethod: this.bankCodeServiceProxy.createOrUpdateLead.bind(this.bankCodeServiceProxy),
            createModel: CreateOrEditLeadInput,
            isInLeadMode: true,
            customerType: ContactGroup.Client,
            hideToolbar: true,
            hideCompanyField: true,
            hideLinksField: true,
            hideNotesField: true,
            hidePhotoArea: true,
            hideSaveAndExtend: true,
            disallowMultipleItems: true,
            dontCheckSimilarEntities: true
        }
        this.dialog.open(CreateEntityDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            id: 'create-bank-code-lead-dialog',
            data: dialogData
        });
    }

    create(createData) {
        this.bankCodeServiceProxy.createOrUpdateLead(new CreateOrEditLeadInput(createData)).subscribe();
    }

    onContentReady() {
        this.changeDetectorRef.detectChanges();
    }

    deleteContact(contact: BankPassContactDto) {
        ContactsHelper.showConfirmMessage(
            this.ls.l('BankCodeLeadDeleteWarningMessage'),
            (isConfirmed: boolean, [ forceDelete ]: boolean[]) => {
                if (isConfirmed) {
                    this.contactServiceProxy.deleteContact(contact.Id, forceDelete, false).subscribe(() => {
                        this.refresh();
                        if (this.dataGrid && this.dataGrid.instance) {
                            this.dataGrid.instance.deselectAll();
                        }
                        this.notifyService.success(this.ls.l('SuccessfullyDeleted'));
                    });
                }
            },
            [{
                text: this.ls.l('ForceDelete'),
                visible: this.permissionService.isGranted(AppPermissions.CRMForceDeleteEntites), 
                checked: false
            }]
        );
    }

    getContactPhotoUrl(contact: BankPassContactDto) {
        return this.profileService.getContactPhotoUrl(contact.PhotoPublicId);
    }

    onGridOptionChanged(event) {
        DataGridService.refreshIfColumnsVisibilityStatusChange(event);
    }

    ngOnDestroy() {
        if (this.hasOverflowClass) {
            this.renderer.addClass(this.document.body, 'overflow-hidden');
        }
        this.lifecycleSubjectService.destroy.next(null);
    }
}
