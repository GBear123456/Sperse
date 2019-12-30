/** Core imports */
import { Component, Injector, OnDestroy, ViewChild } from '@angular/core';
import { ActivationEnd, Params, Event, NavigationEnd } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { CacheService } from 'ng2-cache-service';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, ReplaySubject, combineLatest, forkJoin, of } from 'rxjs';
import {
    buffer,
    debounceTime,
    filter,
    finalize,
    map,
    publishReplay,
    refCount,
    switchMap,
    takeUntil,
    tap
} from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppStore, PartnerTypesStoreSelectors, ContactAssignedUsersStoreSelectors } from '@app/store';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup, ContactStatus } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactServiceProxy,
    ContactInfoDto,
    UpdateContactStatusInput,
    LeadServiceProxy,
    LeadInfoDto,
    PartnerServiceProxy,
    PartnerInfoDto,
    UpdatePartnerTypeInput,
    UserServiceProxy,
    CustomerServiceProxy,
    PersonContactInfoDto,
    OrganizationContactServiceProxy,
    OrganizationContactInfoDto,
    UpdateContactAffiliateCodeInput
} from '@shared/service-proxies/service-proxies';
import { VerificationChecklistItemType, VerificationChecklistItem, VerificationChecklistItemStatus } from './verification-checklist/verification-checklist.model';
import { OperationsWidgetComponent } from './operations-widget/operations-widget.component';
import { ContactsService } from './contacts.service';
import { AppStoreService } from '@app/store/app-store.service';
import { RP_DEFAULT_ID, RP_USER_INFO_ID, RP_LEAD_INFO_ID, RP_CONTACT_INFO_ID } from './contacts.const';
import { ContactPersonsDialogComponent } from './contact-persons-dialog/contact-persons-dialog.component';
import { CreateClientDialogComponent } from '../shared/create-client-dialog/create-client-dialog.component';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ItemFullInfo } from '@shared/common/item-details-layout/item-full-info';
import { TargetDirectionEnum } from '@app/crm/contacts/target-direction.enum';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { NavLink } from '@app/crm/contacts/nav-link.model';
import { ContextType } from '@app/crm/contacts/details-header/context-type.enum';
import { DetailsHeaderComponent } from '@app/crm/contacts/details-header/details-header.component';
import { SMSDialogComponent } from '@app/crm/shared/sms-dialog/sms-dialog.component';

@Component({
    templateUrl: './contacts.component.html',
    styleUrls: ['./contacts.component.less'],
    host: {
        '(document:click)': 'closeEditDialogs($event)'
    },
    providers: [ AppStoreService, DialogService ]
})
export class ContactsComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(OperationsWidgetComponent) toolbarComponent: OperationsWidgetComponent;
    @ViewChild(DetailsHeaderComponent) detailsHeaderComponent: DetailsHeaderComponent;

    readonly RP_DEFAULT_ID   = RP_DEFAULT_ID;
    readonly RP_USER_INFO_ID = RP_USER_INFO_ID;
    readonly RP_LEAD_INFO_ID = RP_LEAD_INFO_ID;
    readonly RP_CONTACT_INFO_ID = RP_CONTACT_INFO_ID;

    customerId: number;
    assignedUsersSelector: (source$: Observable<any>) => Observable<any>;
    contactInfo: ContactInfoDto = new ContactInfoDto();
    personContactInfo: PersonContactInfoDto;
    primaryContact: any;
    verificationChecklist: VerificationChecklistItem[];
    leadInfo: LeadInfoDto;
    leadId: number;
    leadStages = [];
    clientStageId: number;
    ratingId: number;
    configMode: boolean;
    partnerInfo: PartnerInfoDto;
    partnerTypeId: string;
    partnerTypes: any[] = [];

    private initialData: string;

    navLinks: NavLink[] = [];
    readonly rightPanelDefaultWidth = '400px';
    rightPanelSetting: any = {
        id: RP_DEFAULT_ID,
        width: this.rightPanelDefaultWidth,
        clientScores: true,
        totalApproved: true,
        verification: true,
        opened: false
    };

    params: any;
    private rootComponent: any;
    queryParams: Params;

    showToolbar;
    currentItemId;
    dataSourceURI = 'Customer';
    targetDirections = TargetDirectionEnum;
    private targetEntity: BehaviorSubject<TargetDirectionEnum> = new BehaviorSubject<TargetDirectionEnum>(TargetDirectionEnum.Current);
    public targetEntity$: Observable<TargetDirectionEnum> = this.targetEntity.asObservable();
    manageAllowed = false;

    isCommunicationHistoryAllowed = false;
    isSendSmsAndEmailAllowed = false;
    private affiliateCode: ReplaySubject<string> = new ReplaySubject(1);
    affiliateCode$: Observable<string> = this.affiliateCode.asObservable().pipe(
        map((affiliateCode: string) => (affiliateCode || '').trim())
    );
    affiliateValidationRules = [
        {
            type: 'pattern',
            pattern: AppConsts.regexPatterns.affiliateCode,
            message: this.l('AffiliateCodeIsNotValid')
        },
        {
            type: 'stringLength',
            max: 50,
            message: this.l('MaxLengthIs', 50)
        }
    ];
    public contactGroupId: BehaviorSubject<string> = new BehaviorSubject<string>(null);
    public contactGroupId$: Observable<string> = this.contactGroupId.asObservable().pipe(filter(Boolean));

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private dialogService: DialogService,
        private cacheService: CacheService,
        private userService: UserServiceProxy,
        private contactService: ContactServiceProxy,
        private orgContactService: OrganizationContactServiceProxy,
        private partnerService: PartnerServiceProxy,
        private leadService: LeadServiceProxy,
        private pipelineService: PipelineService,
        private store$: Store<AppStore.State>,
        private appStoreService: AppStoreService,
        private customerService: CustomerServiceProxy,
        private itemDetailsService: ItemDetailsService,
        private contactServiceProxy: ContactServiceProxy,
        public contactsService: ContactsService
    ) {
        super(injector);
        this.appStoreService.loadUserDictionaries();
        contactService['data'] = {
            contactInfo: null,
            leadInfo: null,
            partnerInfo: null
        };
        this.rootComponent = this.getRootComponent();
        this._activatedRoute.params.pipe(
            takeUntil(this.destroy$),
            switchMap((params: Params) => this.loadContactInfo(params))
        ).subscribe(() => {
            this.initNavButtons();
        });
        this._activatedRoute.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe((params: Params) => this.queryParams = params);

        contactsService.verificationSubscribe(
            this.initVerificationChecklist.bind(this)
        );
        contactsService.invalidateSubscribe(area => this.invalidate(area));
        contactsService.loadLeadInfoSubscribe(() => this.loadLeadData());

        this.handleContactsOptions();
    }

    private handleContactsOptions() {
        const routeData$: Observable<any> = this._router.events.pipe(
            takeUntil(this.destroy$),
            filter((event: Event) => event instanceof ActivationEnd),
            buffer(this._router.events.pipe(filter((event: Event) => event instanceof NavigationEnd))),
            map((events: ActivationEnd[]) => events[0])
        );

        combineLatest(
            routeData$,
            this.contactGroupId$
        ).subscribe(([event, contactGroupId]: [ActivationEnd, string]) => {
            let data = event.snapshot.data,
                rightPanelId = this.getCheckPropertyValue(data, 'rightPanelId', RP_DEFAULT_ID);
            this.showToolbar = this.getCheckPropertyValue(data, 'showToolbar', true);
            if (rightPanelId === this.RP_CONTACT_INFO_ID) {
                this.rightPanelSetting.opened = true;
                this.rightPanelSetting.width = '200px';
            } else {
                this.rightPanelSetting.opened = this.getCheckPropertyValue(
                    data,
                    'rightPanelOpened',
                    rightPanelId == RP_DEFAULT_ID && abp.features.isEnabled(AppFeatures.PFMCreditReport)
                );
                this.rightPanelSetting.width = this.rightPanelSetting.opened ? this.rightPanelDefaultWidth : '0';
            }
            this.rightPanelSetting.id = rightPanelId;
        });
    }

    initNavigatorProperties() {
        switch (this.getSection()) {
            case 'leads':
                this.dataSourceURI = 'Lead';
                this.currentItemId = this.params.leadId;
                break;
            case 'clients':
                this.dataSourceURI = 'Customer';
                this.currentItemId = this.params.contactId;
                break;
            case 'partners':
                this.dataSourceURI = 'Partner';
                this.currentItemId = this.params.contactId;
                break;
            case 'users':
                this.dataSourceURI = 'User';
                this.currentItemId = this.params.userId;
                break;
            case 'orders':
                this.dataSourceURI = 'Order';
                this.currentItemId = this.queryParams.id;
                break;
            default:
                break;
        }
    }

    initNavButtons() {
        this.rootComponent.overflowHidden(true);
        this.rootComponent.pageHeaderFixed();
        let key = this.getCacheKey(abp.session.userId.toString());
        if (this.cacheService.exists(key))
            this.rightPanelSetting = this.cacheService.get(key);
        this.initNavigatorProperties();
        const itemKeyField = this.dataSourceURI == 'User' ? 'id' : 'Id',
              itemDistinctField = this.dataSourceURI == 'Order' ? 'ContactId' : itemKeyField;
        this.targetEntity$.pipe(
            /** To avoid fast next/prev clicking */
            debounceTime(100),
            tap(() => {
                if (this.toolbarComponent) {
                    this.toolbarComponent.updateNavButtons(true, true);
                }
                this.startLoading(true);
            }),
            switchMap((direction: TargetDirectionEnum) => this.itemDetailsService.getItemFullInfo(
                this.dataSourceURI as ItemTypeEnum,
                this.currentItemId,
                direction,
                itemKeyField,
                itemDistinctField
            ).pipe(
                finalize(() => this.finishLoading(true)))
            )
        ).subscribe((itemFullInfo: ItemFullInfo) => {
            let res$ = of(null);
            if (itemFullInfo && this.currentItemId != itemFullInfo.itemData[itemKeyField]) {
                /** New current item Id */
                res$ = this.reloadCurrentSection({
                    userId: this.dataSourceURI === 'User'
                            ? itemFullInfo.itemData[itemKeyField]
                            : (this.dataSourceURI != 'Lead' ? itemFullInfo.itemData.UserId : undefined),
                    contactId: ['Customer', 'Partner'].indexOf(this.dataSourceURI) >= 0 ? itemFullInfo.itemData[itemKeyField] :
                        this.dataSourceURI == 'Lead' ? itemFullInfo.itemData.CustomerId : itemFullInfo.itemData.ContactId,
                    customerId: this.dataSourceURI == 'Lead' ? itemFullInfo.itemData.CustomerId : undefined,
                    leadId: this.dataSourceURI == 'Lead' ? itemFullInfo.itemData[itemKeyField] : undefined,
                    companyId: itemFullInfo.itemData.OrganizationId
                }).pipe(tap(() => this.currentItemId = itemFullInfo.itemData[itemKeyField]));
                this.updateLocation(itemFullInfo);
            }
            res$.subscribe(() => {
                if (this.toolbarComponent) {
                    this.toolbarComponent.updateNavButtons(
                        !itemFullInfo || itemFullInfo.isFirstOnList,
                        !itemFullInfo || itemFullInfo.isLastOnList
                    );
                }
            });
        });
    }

    private getSection() {
        return this.queryParams && this.queryParams.referrer && this.queryParams.referrer.split('/').pop()
            || (this.contactGroupId.value == ContactGroup.Partner ? 'partners' : 'clients');
    }

    private updateLocation(itemFullInfo) {
        switch (this.getSection()) {
            case 'leads':
                this.contactsService.updateLocation(itemFullInfo.itemData.CustomerId, itemFullInfo.itemData.Id, itemFullInfo.itemData.OrganizationId);
                break;
            case 'clients':
                this.contactsService.updateLocation(itemFullInfo.itemData.Id, null, itemFullInfo.itemData.OrganizationId);
                break;
            case 'partners':
                this.contactsService.updateLocation(itemFullInfo.itemData.Id, null, itemFullInfo.itemData.OrganizationId);
                break;
            case 'users':
                this.contactsService.updateLocation(null, null, null, itemFullInfo.itemData.id);
                break;
            case 'orders':
                this.contactsService.updateLocation(itemFullInfo.itemData.ContactId);
                break;
            default:
                break;
        }
    }

    private getCheckPropertyValue(obj, prop, def) {
        return obj.hasOwnProperty(prop) ? obj[prop] : def;
    }

    private initNavLinks(contact) {
        this.navLinks = [
            { name: 'contact-information', label: 'Contact Information', route: 'contact-information' },
            { name: 'personal-details', label: 'Personal Details', route: 'personal-details'},
            {
                name: 'user-information',
                label: contact.userId ? 'User Information' : 'Invite User',
                hidden: !this.permission.isGranted(contact.userId ?
                    AppPermissions.AdministrationUsers : AppPermissions.AdministrationUsersCreate),
                route: 'user-information'
            },
            { name: 'documents', label: 'Documents', route: 'documents' },
            { name: 'notes', label: 'Notes', route: 'notes'},
            {
                name: 'orders',
                label: 'Orders',
                route: 'orders',
                hidden: this.contactGroupId.value == ContactGroup.UserProfile ||
                    this.contactInfo.statusId == ContactStatus.Prospective || true,
                disabled: !this.permission.isGranted(AppPermissions.CRMOrders)
            },
            {
                name: 'invoices',
                label: 'Orders & Invoices',
                route: 'invoices',
                hidden: this.contactGroupId.value == ContactGroup.UserProfile ||
                    this.contactInfo.statusId == ContactStatus.Prospective,
                disabled: !this.permission.isGranted(AppPermissions.CRMOrdersInvoices)
            },
            { name: 'subscriptions', label: 'Subscriptions', route: 'subscriptions', hidden: !this.isClientDetailPage() },
            { name: 'payment-information', label: 'Payment Information', route: 'payment-information', hidden: !this.isClientDetailPage() },
            { name: 'lead-information', label: 'Lead Information', route: 'lead-information' },
            {
                name: 'activity-logs',
                label: 'Activity Logs',
                route: 'activity-logs',
                disabled: !this.permission.isGranted(AppPermissions.PFMApplications)
            },
            { name: 'referral-history', label: 'Referral History', route: 'referral-history', disabled: true },
            { name: 'application-status', label: 'Application Status', route: 'application-status', hidden: !!this.leadId, disabled: true },
            { name: 'questionnaire', label: 'Questionnaire', route: 'questionnaire', disabled: true }
        ];
    }

    isClientDetailPage() {
        return this.contactInfo.statusId != ContactStatus.Prospective;
    }

    private storeInitialData() {
        this.initialData = JSON.stringify(this.contactService['data']);
    }

    private fillContactDetails(result: ContactInfoDto, contactId = null) {
        this.contactService['data'].contactInfo = result;
        if (result.id) {
            this.affiliateCode.next(result.affiliateCode);
        }
        this.contactsService.contactInfoUpdate(result);
        this.contactGroupId.next(result.groupId);
        this.manageAllowed = this.contactsService.checkCGPermission(result.groupId);
        this.assignedUsersSelector = select(
            ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers,
            { contactGroup: result.groupId }
        );
        contactId = contactId || result.personContactInfo.id;
        if (result['organizationContactInfo'] && result['organizationContactInfo'].contactPersons) {
            result['organizationContactInfo'].contactPersons.map((contact) => {
                return (contact.id == contactId ? result.personContactInfo : contact);
            });
        }

        this.isCommunicationHistoryAllowed = this.contactsService.checkCGPermission(this.contactGroupId.value, 'ViewCommunicationHistory');
        this.isSendSmsAndEmailAllowed = this.contactsService.checkCGPermission(this.contactGroupId.value, 'ViewCommunicationHistory.SendSMSAndEmail');

        this.ratingId = result.ratingId;
        this.primaryContact = result.personContactInfo;
        this.contactInfo = result;
        this.personContactInfo = result.personContactInfo;
        this.initVerificationChecklist();

        this.contactsService.updateUserId(
            this.userService['data'].userId = this.primaryContact.userId
        );
        this.initNavLinks(this.primaryContact);
        this.contactsService.toolbarUpdate();
        this.storeInitialData();
    }

    private fillLeadDetails(result) {
        this.contactService['data'].leadInfo = this.leadInfo = result;
        this.leadId = this.contactInfo['leadId'] = result.id;
        this.contactsService.leadInfoUpdate(result);

        this.loadLeadsStages(() => {
            if (this.leadInfo.stage) {
                let leadStage = this.leadStages.find(
                    stage => stage.name === this.leadInfo.stage
                );
                this.clientStageId = leadStage && leadStage.id;
            }
        });

        this.storeInitialData();
    }

    private fillPartnerDetails(result) {
        this.contactService['data'].partnerInfo = this.partnerInfo = result;
        this.partnerTypeId = result.typeId;
        this.storeInitialData();
    }

    invalidate(area?: any) {
        !area && this.loadContactInfo(this.params);
    }

    loadContactInfo(params: Params): Observable<ContactInfoDto> {
        let userId = params['userId'],
            contactId = params['contactId'],
            leadId = params['leadId'],
            companyId = params['companyId'];
        this.params = params;
        this.userService['data'] = {
            userId: userId, user: null, roles: null
        };
        this.contactService['data'].contactInfo = {
            id: this.customerId = contactId
        };
        this.contactService['data'].leadInfo = {
            id: this.leadId = leadId
        };
        return userId
               ? this.loadContactInfoForUser(userId, companyId)
               : this.loadContactInfoForClient(contactId, leadId, companyId);
    }

    get isUserProfile() {
        return this.contactGroupId.value === ContactGroup.UserProfile;
    }

    getContactInfoWithCompany(companyId: number, contactInfo$: Observable<ContactInfoDto>): Observable<ContactInfoDto> {
        return forkJoin(
            contactInfo$,
            companyId
                ? this.orgContactService.getOrganizationContactInfo(companyId)
                : of(OrganizationContactInfoDto.fromJS({}))
        ).pipe(
            map(([contactInfo, organizationContactInfo]: [ContactInfoDto, OrganizationContactInfoDto]) => {
                contactInfo['organizationContactInfo'] = organizationContactInfo;
                if (!companyId && contactInfo['primaryOrganizationContactId'])
                    this.orgContactService.getOrganizationContactInfo(
                        contactInfo['primaryOrganizationContactId']
                    ).subscribe((result: OrganizationContactInfoDto) => {
                        contactInfo['organizationContactInfo'] = result;
                        this.contactsService.organizationInfoUpdate(result);
                    });
                else
                    this.contactsService.organizationInfoUpdate(OrganizationContactInfoDto.fromJS({}));
                return contactInfo;
            })
        );
    }

    loadContactInfoForUser(userId: number, companyId: number): Observable<ContactInfoDto> {
        let res$ = this.getContactInfoWithCompany(
            companyId,
            this.contactService.getContactInfoForUser(userId)
        ).pipe(
            publishReplay(),
            refCount()
        );
        res$.subscribe((res: ContactInfoDto) => {
            this.fillContactDetails(res, res['id']);
        });
        return res$;
    }

    updateContextType(navLink: NavLink): ContextType {
        let newSelectedContextType: ContextType;
        switch (navLink.name) {
            case 'documents': newSelectedContextType = ContextType.AddFiles;  break;
            case 'contact-information': newSelectedContextType = ContextType.AddContact;  break;
            case 'notes': newSelectedContextType = ContextType.AddNotes;  break;
            case 'invoices': newSelectedContextType = ContextType.AddInvoice;  break;
        }
        if (newSelectedContextType !== undefined) {
            this.detailsHeaderComponent.updateSaveOption(
                this.detailsHeaderComponent.addContextMenuItems[newSelectedContextType]
            );
        }
        return newSelectedContextType;
    }

    loadContactInfoForClient(contactId: number, leadId: number, companyId: number): Observable<ContactInfoDto> {
        let contactInfo$ = of(new ContactInfoDto());
        if (contactId) {
            if (!this.loading) this.startLoading(true);
            contactInfo$ = this.getContactInfoWithCompany(
                companyId,
                this.contactService.getContactInfo(contactId)
            ).pipe(
                publishReplay(),
                refCount()
            );
            contactInfo$.pipe(
                finalize(() => {
                    this.finishLoading(true);
                }),
                switchMap(result => {
                    this.loadLeadData(result['personContactInfo']);
                    this.fillContactDetails(result);
                    if (leadId)
                        this.loadLeadsStages();
                    if (this.contactGroupId.value == ContactGroup.Partner)
                        return this.partnerService.get(contactId);
                    return of(null);
                })
            ).subscribe((result: ContactInfoDto) => {
                if (result) {
                    this.fillPartnerDetails(result);
                    this.loadPartnerTypes();
                } else if (!this.contactInfo)
                    this.close(true);
            });
        }
        return contactInfo$;
    }

    loadLeadData(personContactInfo?: any, lastLeadCallback?) {
        let contactInfo = this.contactService['data'].contactInfo,
            leadInfo = this.contactService['data'].leadInfo;
        if ((!this.leadInfo && contactInfo && leadInfo) || lastLeadCallback) {
            !lastLeadCallback && this.startLoading(true);
            let leadId = leadInfo.id,
                leadInfo$ = leadId && !lastLeadCallback
                    ? this.leadService.getLeadInfo(leadId)
                    : this.leadService.getLast(contactInfo.id);

            leadInfo$.pipe(finalize(() => {
                this.finishLoading(true);
            })).subscribe(result => {
                this.fillLeadDetails(result);
                personContactInfo && this.initNavLinks(personContactInfo);
                lastLeadCallback && lastLeadCallback();
            });
        } else
            this.contactsService.leadInfoUpdate(leadInfo);
    }

    private loadLeadsStages(callback?: () => any) {
        if (this.leadStages && this.leadStages.length)
            callback && callback();
        else
            this.pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.lead, this.contactGroupId.value)
                .subscribe(result => {
                    this.leadStages = result.stages.map((stage) => {
                        return {
                            id: stage.id,
                            name: stage.name,
                            index: stage.sortOrder,
                            action: this.updateLeadStage.bind(this)
                        };
                    });
                    callback && callback();
                });
    }

    private loadPartnerTypes() {
        this.store$.pipe(select(PartnerTypesStoreSelectors.getPartnerTypes)).subscribe(
            (partnerTypes: any) => {
                this.partnerTypes = partnerTypes && partnerTypes.length ?
                    partnerTypes.map(type => {
                        type['action'] = this.updatePartnerType.bind(this);
                        return type;
                    }) : [];
            }
        );
    }

    private getCustomerName() {
        return this.contactInfo.personContactInfo.fullName;
    }

    private showConfirmationDialog(status) {
        this.message.confirm(
            this.l('ClientUpdateStatusWarningMessage'),
            this.l('ClientStatusUpdateConfirmationTitle'),
            isConfirmed => {
                if (isConfirmed) {
                    this.updateStatusInternal(status.id)
                        .subscribe(() => {
                            this.contactInfo.statusId = status.id;
                            let userData = this.userService['data'];
                            if (userData && userData.user) {
                                userData.user.isActive = status.id == ContactStatus.Active;
                            }
                            this.toolbarComponent.statusComponent.listComponent.option('selectedItemKeys', [status.id]);
                            this.notify.success(this.l('StatusSuccessfullyUpdated'));
                        });
                } else {
                    this.toolbarComponent.statusComponent.listComponent.option('selectedItemKeys', [this.contactInfo.statusId]);
                }
            }
        );
    }

    private updateStatusInternal(statusId: string) {
        return this.contactService.updateContactStatus(new UpdateContactStatusInput({
            contactId: this.contactInfo.id,
            statusId: statusId
        }));
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

    showContactPersons(event) {
        this.dialog.closeAll();
        this.dialog.open(ContactPersonsDialogComponent, {
            data: this.contactInfo,
            hasBackdrop: false,
            minWidth: 420,
            position: this.getDialogPossition(event, -182, 89),
            panelClass: ['related-contacts']
        }).afterClosed().subscribe(result => {
            if (result == 'addContact')
                this.addNewContact(event);
            else if (result) {
                this.startLoading(true);
                this.contactService.getContactInfo(result.id)
                    .pipe(finalize(() => this.finishLoading(true)))
                    .subscribe((contactInfo) => {
                        let orgContactInfo = contactInfo['organizationContactInfo'] = this.contactInfo['organizationContactInfo'];
                        this.customerId = contactInfo.id;
                        this.fillContactDetails(contactInfo);
                        this.loadLeadData(contactInfo.personContactInfo, () => {
                            this.contactsService.updateLocation(this.customerId, this.leadId, orgContactInfo && orgContactInfo.id);
                        });
                    });
            }
        });
        event.stopPropagation();
    }

    getDialogPossition(event, shiftX, shiftY) {
        return this.dialogService.calculateDialogPosition(event, event.target.closest('div'), shiftX, shiftY);
    }

    close(force = false) {
        this.dialog.closeAll();
        let data = force || JSON.stringify(<any>this.contactService['data']);
        this._router.navigate(
            [this.queryParams.referrer || 'app/crm/clients'],
            {
                queryParams: _.extend(
                    _.mapObject(
                        this.queryParams,
                        (val, key) => key == 'referrer' ? undefined : val
                    ),
                    !force && this.initialData != data ? {refresh: true} : {}
                )
            }
        );
    }

    closeEditDialogs(event) {
        if (document.body.contains(event.target) && !this.dialog.getDialogById('permanent') &&
            !event.target.closest('.mat-dialog-container, .dx-popup-wrapper, .swal-modal')
        )
            this.dialog.closeAll();
    }

    printMainArea() {
        let elm = this.getElementRef(),
            handel = window.open();
        handel.document.open();
        handel.document.write('<h1>' + this.getCustomerName() + '</h1>' +
            elm.nativeElement.getElementsByClassName('main-content')[0].innerHTML);
        handel.document.close();
        handel.print();
        handel.close();
    }

    ngOnDestroy() {
        this.dialog.closeAll();
        this.rootComponent.overflowHidden();
        this.rootComponent.pageHeaderFixed(true);
        this.contactsService.unsubscribe();
        super.ngOnDestroy();
    }

    deleteLead() {
        this.message.confirm(
            this.l('LeadDeleteWarningMessage', this.getCustomerName()),
            isConfirmed => {
                if (isConfirmed) {
                    this.leadService.deleteLead(this.leadId).subscribe(() => {
                        this.notify.success(this.l('SuccessfullyDeleted'));
                        this.contactService['data']['deleted'] = true;
                        this.close();
                    });
                }
            }
        );
    }

    updateStatus(statusId: string) {
        this.showConfirmationDialog(statusId);
    }

    updateRating(ratingId: number) {
        this.ratingId = ratingId;
    }

    initVerificationChecklist(): void {
        let person = this.primaryContact.person;
        let contactDetails = this.primaryContact.details;
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

    updateLeadStage($event) {
        if (!this.leadId || !this.leadInfo)
            return;

        const pipelineId = AppConsts.PipelinePurposeIds.lead;
        let sourceStage = this.pipelineService.getStageByName(pipelineId, this.leadInfo.stage);
        let targetStage = this.pipelineService.getStageByName(pipelineId, $event.itemData.name);

        if (this.pipelineService.updateEntityStage(pipelineId, this.leadInfo, sourceStage, targetStage, () => {
            this.toolbarComponent.stagesComponent.listComponent.option('selectedItemKeys', [this.clientStageId = targetStage.id]);
        })) {
            this.leadInfo.stage = targetStage.name;
            this.notify.success(this.l('StageSuccessfullyUpdated'));
        } else
            this.message.warn(this.l('CannotChangeLeadStage', sourceStage.name, targetStage.name));

        this.toolbarComponent.refresh();
        $event.event.stopPropagation();
    }

    updatePartnerType($event) {
        this.showUpdatePartnerTypeConfirmationDialog($event.selectedRowKeys[0]);
        $event.event.stopPropagation();
    }

    private showUpdatePartnerTypeConfirmationDialog(typeId) {
        this.message.confirm(
            this.l('PartnerTypeUpdateWarningMessage'),
            this.l('PartnerTypeUpdateConfirmationTitle'),
            isConfirmed => {
                if (isConfirmed) {
                    this.partnerService.updateType(UpdatePartnerTypeInput.fromJS({
                        partnerId: this.customerId,
                        typeId: typeId
                    })).subscribe(() => {
                        this.partnerInfo.typeId = typeId;
                        this.partnerTypeId = typeId;
                        this.notify.success(this.l('TypeSuccessfullyUpdated'));
                    });
                } else {
                    this.toolbarComponent.partnerTypesComponent.listComponent.option('selectedItemKeys', [this.partnerInfo.typeId]);
                }
            }
        );
    }

    toggleConfigMode() {
        this.configMode = !this.configMode;
    }

    toggleSectionVisibility(event, section) {
        event.stopPropagation();

        this.rightPanelSetting[section] = event.target.checked;
        this.cacheService.set(this.getCacheKey(abp.session.userId.toString()), this.rightPanelSetting);
    }

    onContactSelected(contact) {
        this.initNavLinks(contact);
        this.contactsService.updateUserId(
            this.userService['data'].userId = contact.userId);
    }

    getAssignmentsPermissionKey = () => {
        return this.contactsService.getCGPermissionKey(this.contactGroupId.value, 'ManageAssignments');
    }

    getProxyService = () => {
        return this.contactService;
    }

    addNewContact(event) {
        if (this.isUserProfile)
            return;

        let companyInfo = this.contactInfo['organizationContactInfo'];

        this.dialog.closeAll();
        this.dialog.open(CreateClientDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                isInLeadMode: this.contactInfo.statusId == ContactStatus.Prospective,
                company: companyInfo && companyInfo.fullName,
                customerType: this.contactGroupId.value || ContactGroup.Client,
                refreshParent: () => {}
            }
        }).afterClosed().subscribe(() => {
            this.orgContactService.getOrganizationContactInfo(companyInfo.id).subscribe((result) => {
                this.contactInfo['organizationContactInfo'] = result;
            });
        });
        event.stopPropagation();
    }

    showSMSDialog() {
        this.dialog.closeAll();
        this.dialog.open(SMSDialogComponent, {
            id: 'permanent',
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                contact: this.contactInfo
            }
        }).afterClosed().subscribe();
    }

    reloadCurrentSection(params = this.params) {
        let area = this._router.url.split('?').shift().split('/').pop();
        const loading$ = this.loadContactInfo(params);
        if (area == 'lead-information') this.leadInfo = undefined;
        this.contactsService.invalidate(area);
        return loading$;
    }

    loadTargetEntity(event, direction) {
        this.targetEntity.next(direction);
    }

    updateAffiliateCode(value) {
        value = value.trim();
        if (!value)
            return;
        this.contactServiceProxy.updateAffiliateCode(new UpdateContactAffiliateCodeInput({
            contactId: this.contactInfo.id,
            affiliateCode: value
        })).subscribe(() => {
            this.contactInfo.affiliateCode = value;
            this.affiliateCode.next(value);
        });
    }
}