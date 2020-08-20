/** Core imports */
import { Component, OnInit, ViewChild, AfterViewInit, Inject, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard';
import { CacheService } from 'ng2-cache-service';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { map, takeUntil, first, finalize, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { DxScrollViewComponent } from 'devextreme-angular/ui/scroll-view';

/** Application imports */
import { DateHelper } from '@shared/helpers/DateHelper';
import { NotifyService } from '@abp/notify/notify.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { ODataService } from '@shared/common/odata/odata.service';
import { VerificationChecklistItemType, VerificationChecklistItem,
    VerificationChecklistItemStatus } from '../../verification-checklist/verification-checklist.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    UpdateLeadStagePointInput, UpdateOrderStagePointInput, LeadServiceProxy, OrderServiceProxy,
    ContactServiceProxy, ContactInfoDto, LeadInfoDto, ContactLastModificationInfoDto, PipelineDto,
    UpdateContactAffiliateCodeInput, UpdateContactXrefInput, UpdateContactCustomFieldsInput, StageDto,
    GetSourceContactInfoOutput
} from '@shared/service-proxies/service-proxies';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { ContactsService } from '../../contacts.service';
import { AppFeatures } from '@shared/AppFeatures';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppService } from '@app/app.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: 'personal-details-dialog.html',
    styleUrls: ['personal-details-dialog.less']
})
export class PersonalDetailsDialogComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('checklistScroll', {static: false}) checklistScroll: DxScrollViewComponent;
    showOverviewTab = abp.features.isEnabled(AppFeatures.PFMCreditReport);
    verificationChecklist: VerificationChecklistItem[];
    contactInfo: ContactInfoDto;
    leadInfo: LeadInfoDto;
    stageColor: string;
    configMode: boolean;
    overviewPanelSetting = {
        clientScores: true,
        totalApproved: true,
        verification: true
    };

    private slider: any;
    private affiliateCode: ReplaySubject<string> = new ReplaySubject(1);
    private readonly ident = 'PersonalDetailsDialog';
    private contactXref: ReplaySubject<string> = new ReplaySubject(1);
    public readonly CHECKLIST_TAB_INDEX = 1;
    affiliateCode$: Observable<string> = this.affiliateCode.asObservable().pipe(
        map((affiliateCode: string) => (affiliateCode || '').trim())
    );
    contactXref$: Observable<string> = this.contactXref.asObservable().pipe(
        map((contactXref: string) => (contactXref || '').trim())
    );
    affiliateValidationRules = [
        {
            type: 'pattern',
            pattern: AppConsts.regexPatterns.affiliateCode,
            message: this.ls.l('AffiliateCodeIsNotValid')
        },
        {
            type: 'stringLength',
            max: AppConsts.maxAffiliateCodeLength,
            message: this.ls.l('MaxLengthIs', AppConsts.maxAffiliateCodeLength)
        }
    ];
    xrefValidationRules = [
    {
        type: 'stringLength',
        max: 255,
        message: this.ls.l('MaxLengthIs', 255)
    }];
    selectedTabIndex = 0;
    lastModificationInfo: ContactLastModificationInfoDto;
    userTimezone = DateHelper.getUserTimezone();
    formatting = AppConsts.formatting;
    checklistLeadDataSource = [];
    checklistOrderDataSource = [];
    contactLeadsDataSource: DataSource;
    contactOrdersDataSource: DataSource;
    checklistLeadId: number;
    checklistOrderId: number;
    sourceContactInfo$: Observable<GetSourceContactInfoOutput> = this.contactsService.contactInfo$.pipe(
        map((contactInfo: ContactInfoDto) => contactInfo),
        distinctUntilChanged(),
        switchMap((contactInfo: ContactInfoDto) => this.contactProxy.getSourceContactInfo(contactInfo.groupId, contactInfo.id)
    ));

    constructor(
        private route: ActivatedRoute,
        private leadProxy: LeadServiceProxy,
        private clipboardService: ClipboardService,
        private notifyService: NotifyService,
        private cacheHelper: CacheHelper,
        private cacheService: CacheService,
        private contactProxy: ContactServiceProxy,
        private elementRef: ElementRef,
        private contactsService: ContactsService,
        private pipelineService: PipelineService,
        private profileService: ProfileService,
        private oDataService: ODataService,
        private loadingService: LoadingService,
        private orderProxy: OrderServiceProxy,
        public permissionChecker: AppPermissionService,
        public ls: AppLocalizationService,
        public userManagementService: UserManagementService,
        public dialogRef: MatDialogRef<PersonalDetailsDialogComponent>,
        public appService: AppService,
        public appSession: AppSessionService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '157px',
                right: '-100vw'
            });
        });

        contactsService.contactInfoSubscribe(contactInfo => {
            if (contactInfo && contactInfo.id) {
                this.contactInfo = contactInfo;
                this.affiliateCode.next(contactInfo.affiliateCode);
                this.contactXref.next(contactInfo.personContactInfo.xref);
                this.contactProxy.getContactLastModificationInfo(
                    contactInfo.id
                ).subscribe(lastModificationInfo => {
                    this.lastModificationInfo = lastModificationInfo;
                });
            }
        }, this.ident);

        contactsService.leadInfoSubscribe(leadInfo => {
            if (leadInfo && (!this.leadInfo || this.leadInfo.id != leadInfo.id)) {
                this.leadInfo = leadInfo;
                this.initContactLeadsDataSource();
                this.initContactOrdersDataSource();
                this.initChecklistByLead(leadInfo).subscribe();
                this.stageColor = this.pipelineService.getStageColorByName(leadInfo.stage);
            }
        }, this.ident);

        if (this.showOverviewTab) {
            contactsService.verificationSubscribe(
                this.initVerificationChecklist.bind(this)
            );

            let key = this.cacheHelper.getCacheKey(
                abp.session.userId.toString(), this.ident
            );
            if (this.cacheService.exists(key))
                this.overviewPanelSetting = this.cacheService.get(key);
        }
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0', 'without-shadow');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '155px',
            right: '-100vw'
        });
        this.sourceContactInfo$.subscribe();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize('425px', '100vh');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: '218px',
                    right: '0px'
                });
            }, 100);
        });
    }

    initChecklistByOrder(order: any): Observable<any> {
        this.checklistOrderId = order.Id;
        return this.loadChecklistPoints(this.initChecklistDataSource(AppConsts.PipelinePurposeIds.order,
            this.ls.l('Post-sale Checklist'), order.Stage), true);
    }

    initChecklistByLead(lead: any): Observable<any> {
        this.checklistLeadId = lead.id || lead.Id;
        return this.loadChecklistPoints(this.initChecklistDataSource(AppConsts.PipelinePurposeIds.lead,
            this.ls.l('Pre-sale Checklist'), lead.stage || lead.Stage));
    }

    loadChecklistPoints(dataSource, isOrder = false): Observable<any> {
        let stages = dataSource[0].items;
        if (isOrder)
            return this.orderProxy.getStageChecklistPoints(
                this.checklistOrderId, stages.map(item => item.key)
            ).pipe(map(checklist => {
                return this.checklistOrderDataSource = this.initSelectedChecklist(checklist, stages, dataSource);
            }));
        else
            return this.leadProxy.getStageChecklistPoints(
                this.checklistLeadId, stages.map(item => item.key)
            ).pipe(map(checklist => {
                return this.checklistLeadDataSource = this.initSelectedChecklist(checklist, stages, dataSource);
            }));
    }

    initSelectedChecklist(checklist, stages, dataSource) {
        let selectedCount = 0;
        checklist.forEach(item => {
            stages.some(stage => {
                if (stage.key == item.stageId) {
                    (stage.items || []).some(point => {
                        if (point.id == item.id) {
                            point.date = item.completionTime;
                            if (point.selected = item.isDone)
                                selectedCount++;
                            return true;
                        }
                    });
                    return true;
                }
            });
        });
        dataSource[0].total = checklist.length;
        dataSource[0].progress = selectedCount;
        return dataSource;
    }

    initContactLeadsDataSource() {
        if (this.contactInfo.id)
            this.contactLeadsDataSource = new DataSource({
                paginate: false,
                requireTotalCount: true,
                store: new ODataStore({
                    key: 'Id',
                    url: this.oDataService.getODataUrl('Lead'),
                    version: AppConsts.ODataVersion,
                    beforeSend: (request) => {
                        request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        request.params.$select = ['Id',  'Name', 'Stage', 'LeadDate'];
                        request.params.$filter = 'CustomerId eq ' + this.contactInfo.id;
                        request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    }
                })
            });
    }

    initContactOrdersDataSource() {
        if (this.contactInfo.id)
            this.contactOrdersDataSource = new DataSource({
                paginate: false,
                requireTotalCount: true,
                store: new ODataStore({
                    key: 'Id',
                    url: this.oDataService.getODataUrl('Order'),
                    version: AppConsts.ODataVersion,
                    beforeSend: (request) => {
                        request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        request.params.$select = ['Id',  'Number', 'Name', 'Stage', 'OrderDate'];
                        request.params.$filter = 'ContactId eq ' + this.contactInfo.id;
                        request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    },
                    onLoaded: (data: any) => {
                        if (data.length) {
                            let params = (this.route.queryParams as BehaviorSubject<Params>).getValue(),
                                orderId = params['orderId'] && parseInt(params['orderId']);
                            this.initChecklistByOrder(data.filter(item => item.Id == orderId)[0] || data[0]).subscribe();
                        } else
                            this.checklistOrderId = null;
                    }
                })
            });
    }

    initChecklistDataSource(purposeId, rootName, stageName) {
        let rootItem: any = {
            id: 'root',
            text: rootName.toUpperCase(),
            selected: false,
            expanded: true,
            disabled: false,
            items: []
        }, dataSource = [rootItem];
        this.pipelineService.getPipelineDefinitionObservable(
            purposeId, AppConsts.PipelinePurposeIds.lead == purposeId ? this.contactInfo.groupId : undefined
        ).pipe(takeUntil(this.dialogRef.beforeClosed())).subscribe((pipeline: PipelineDto) => {
            rootItem.items = [];
            pipeline.stages.forEach((stage: StageDto) => {
                if (stage.checklistPoints)
                    rootItem.items.push({
                        key: stage.id,
                        id: 'stage-' + stage.id,
                        text: stage.name,
                        selected: false,
                        expanded: true,
                        disabled: false,
                        items: stage.checklistPoints.sort((prev, next) => {
                            return prev.sortOrder > next.sortOrder ? 1 : -1;
                        }).map(point => {
                            return {
                                id: point.id,
                                text: point.name,
                                disabled: stage.name != stageName,
                                sortOrder: point.sortOrder
                            };
                        })
                    });
            });
        });
        return dataSource;
    }

    getTabContentHeight(subtract = 0) {
        return innerHeight - 324 - subtract + 'px';
    }

    initVerificationChecklist(): void {
        let person = this.contactInfo.personContactInfo.person;
        let contactDetails = this.contactInfo.personContactInfo.details;
        this.verificationChecklist = [
            this.getVerificationChecklistItem(
                VerificationChecklistItemType.Identity,
                person && person.identityConfirmationDate
                    ? VerificationChecklistItemStatus.success
                    : VerificationChecklistItemStatus.unsuccess
            ),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.emails, VerificationChecklistItemType.Email),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.phones, VerificationChecklistItemType.Phone),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.addresses, VerificationChecklistItemType.Address),
            this.getVerificationChecklistItem(VerificationChecklistItemType.Employment),
            this.getVerificationChecklistItem(VerificationChecklistItemType.Income)
        ];
    }

    private getVerificationChecklistItem(type: VerificationChecklistItemType,
        status?: VerificationChecklistItemStatus, confirmedCount?, totalCount?): VerificationChecklistItem {
        return {
            type: type,
            status: status,
            confirmedCount: confirmedCount,
            totalCount: totalCount
        } as VerificationChecklistItem;
    }

    private getVerificationChecklistItemByMultipleValues(items: any[],
        type: VerificationChecklistItemType
    ): VerificationChecklistItem {
        let confirmedCount = 0;
        items.forEach(i => {
            if (i.isConfirmed)
                confirmedCount++;
        });
        return this.getVerificationChecklistItem(
            type,
            confirmedCount > 0 ? VerificationChecklistItemStatus.success
                : VerificationChecklistItemStatus.unsuccess,
            confirmedCount,
            items.length
        );
    }

    toggleSectionVisibility(event, section) {
        event.stopPropagation();
        this.overviewPanelSetting[section] = event.target.checked;
        this.cacheService.set(this.cacheHelper.getCacheKey(
            abp.session.userId.toString(), this.ident
        ), this.overviewPanelSetting);
    }

    toggleConfigMode() {
        this.configMode = !this.configMode;
    }

    deleteItem(item) {
        switch (item) {
            case this.ls.l('Affiliate'):
                this.updateAffiliateCode('');
                break;
            case this.ls.l('Xref'):
                this.updateXref('');
                break;
        }
    }

    updateAffiliateCode(value) {
        value = value.trim();
        this.contactProxy.updateAffiliateCode(new UpdateContactAffiliateCodeInput({
            contactId: this.contactInfo.personContactInfo.id,
            affiliateCode: value || null
        })).subscribe(() => {
            this.contactInfo.affiliateCode = value;
            this.affiliateCode.next(value);
        });
    }

    updateXref(value) {
        value = value.trim();
        this.contactProxy.updateXref(new UpdateContactXrefInput({
            contactId: this.contactInfo.personContactInfo.id,
            xref: value
        })).subscribe(() => {
            this.contactInfo.personContactInfo.xref = value;
            this.contactXref.next(value);
        });
    }

    updateCustomField(value, property) {
        if (value)
            value = value.trim();
        let initialValue = this.contactInfo.personContactInfo[property];
        this.contactInfo.personContactInfo[property] = value;

        this.contactProxy.updateCustomFields(new UpdateContactCustomFieldsInput({
            contactId: this.contactInfo.personContactInfo.id,
            customField1: this.contactInfo.personContactInfo.customField1,
            customField2: this.contactInfo.personContactInfo.customField2,
            customField3: this.contactInfo.personContactInfo.customField3,
            customField4: this.contactInfo.personContactInfo.customField4,
            customField5: this.contactInfo.personContactInfo.customField5
        })).subscribe(null, () => this.contactInfo.personContactInfo[property] = initialValue);
    }

    saveToClipboard(value) {
        this.clipboardService.copyFromContent(value);
        this.notifyService.info(this.ls.l('SavedToClipboard'));
    }

    close() {
        this.dialogRef.close(true);
    }

    getThumbnailSrc(thumbnailId?: string) {
        return this.profileService.getContactPhotoUrl(thumbnailId, true);
    }

    startLoading() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
    }

    finishLoading() {
        this.loadingService.finishLoading(this.elementRef.nativeElement);
    }

    onChecklistChanged(event, isOrder = false) {
        this.startLoading();
        (isOrder ?  this.orderProxy.updateStagePoint(new UpdateOrderStagePointInput({
                pointId: event.itemData.id,
                orderId: this.checklistOrderId,
                isDone: event.itemData.selected
            })) :
            this.leadProxy.updateLeadStagePoint(new UpdateLeadStagePointInput({
                pointId: event.itemData.id,
                leadId: this.checklistLeadId,
                isDone: event.itemData.selected
            }))
        ).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            let dataSource = isOrder ? this.checklistOrderDataSource :
                this.checklistLeadDataSource;
            dataSource[0].progress += (event.itemData.selected ? 1 : -1);
            this.loadChecklistPoints(
                dataSource, isOrder
            ).subscribe(() => {
                event.component.repaint();
            });
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
        });
    }


    onLeadChanged(event) {
        if (event.selectedItem.Id != this.checklistLeadId) {
            this.startLoading();
            this.initChecklistByLead(event.selectedItem).pipe(
                finalize(() => this.finishLoading())).subscribe();
        }
    }

    onSelectInitialized(event) {
        setTimeout(() => event.component.repaint(), 1000);
    }

    onOrderChanged(event: any) {
        if (event.selectedItem.Id != this.checklistOrderId) {
            this.startLoading();
            let top = this.checklistScroll.instance.scrollTop();
            this.initChecklistByOrder(event.selectedItem).pipe(
                finalize(() => this.finishLoading())
            ).subscribe(() => {
                setTimeout(() => {
                    this.checklistScroll.instance.scrollTo(top);
                });
            });
        }
    }

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.ident);
    }
}