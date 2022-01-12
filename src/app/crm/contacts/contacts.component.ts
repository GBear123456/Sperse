/** Core imports */
import { Component, Injector, OnDestroy, ViewChild } from '@angular/core';
import { ActivationEnd, Event, NavigationEnd, Params } from '@angular/router';

/** Third party imports */
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of, zip } from 'rxjs';
import {
    first,
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
import { AppStore, ContactAssignedUsersStoreSelectors, PartnerTypesStoreSelectors } from '@app/store';
import { PipelinesStoreActions } from '@app/crm/store';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup, ContactStatus } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactInfoDto,
    ContactServiceProxy,
    CustomerServiceProxy,
    LeadInfoDto,
    LeadServiceProxy,
    OrganizationContactInfoDto,
    OrganizationContactServiceProxy,
    PartnerInfoDto,
    PartnerServiceProxy,
    PersonContactInfoDto,
    PersonShortInfoDto,
    PipelineDto,
    StageDto,
    UpdatePartnerTypeInput,
    UserServiceProxy,
    LayoutType,
    PartnerTypeDto
} from '@shared/service-proxies/service-proxies';
import { OperationsWidgetComponent } from './operations-widget/operations-widget.component';
import { ContactsService } from './contacts.service';
import { AppStoreService } from '@app/store/app-store.service';
import { RP_CONTACT_INFO_ID, RP_DEFAULT_ID, RP_LEAD_INFO_ID, RP_USER_INFO_ID } from './contacts.const';
import { ContactPersonsDialogComponent } from './contact-persons-dialog/contact-persons-dialog.component';
import { CreateEntityDialogComponent } from '@shared/common/create-entity-dialog/create-entity-dialog.component';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ItemFullInfo } from '@shared/common/item-details-layout/item-full-info';
import { TargetDirectionEnum } from '@app/crm/contacts/target-direction.enum';
import { AppPermissions } from '@shared/AppPermissions';
import { NavLink } from '@app/crm/contacts/nav-link.model';
import { ContextType } from '@app/crm/contacts/details-header/context-type.enum';
import { DetailsHeaderComponent } from '@app/crm/contacts/details-header/details-header.component';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { GroupStatus } from '@app/crm/contacts/operations-widget/status.interface';
import { CreateEntityDialogData } from '@shared/common/create-entity-dialog/models/create-entity-dialog-data.interface';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { EntityTypeSys } from '@app/crm/leads/entity-type-sys.enum';

@Component({
    templateUrl: './contacts.component.html',
    styleUrls: ['./contacts.component.less'],
    providers: [ AppStoreService, DialogService ]
})
export class ContactsComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(OperationsWidgetComponent, { static: false }) toolbarComponent: OperationsWidgetComponent;
    @ViewChild(DetailsHeaderComponent, { static: false }) detailsHeaderComponent: DetailsHeaderComponent;

    readonly RP_DEFAULT_ID   = RP_DEFAULT_ID;
    readonly RP_USER_INFO_ID = RP_USER_INFO_ID;
    readonly RP_LEAD_INFO_ID = RP_LEAD_INFO_ID;
    readonly RP_CONTACT_INFO_ID = RP_CONTACT_INFO_ID;

    customerId: number;
    assignedUsersSelector: (source$: Observable<any>) => Observable<any>;
    contactInfo: ContactInfoDto = new ContactInfoDto();
    personContactInfo: PersonContactInfoDto;
    primaryContact: PersonContactInfoDto;
    leadInfo: LeadInfoDto;
    leadId: number;
    leadStages = [];
    allPipelines = [];
    partnerInfo: PartnerInfoDto;
    partnerTypeId: string;
    partnerTypes: any[] = [];

    private initialData: string;

    public contactGroupId: BehaviorSubject<string> = this.contactsService.contactGroupId;
    public contactGroupId$: Observable<string> = this.contactGroupId.asObservable().pipe(filter(Boolean)) as Observable<string>;
    isCommunicationHistoryAllowed$: Observable<boolean> = this.contactsService.contactInfo$.pipe(
        map((contactInfo: ContactInfoDto) => contactInfo && this.permission.checkCGPermission(
            contactInfo.groups,
            'ViewCommunicationHistory'
        ))
    );
    leadInfo$: Observable<LeadInfoDto> = this.contactsService.leadInfo$.pipe(
        filter((leadInfo: LeadInfoDto) => !!leadInfo)
    );
    isPropertyContact$: Observable<boolean> = this.leadInfo$.pipe(
        map((leadInfo: LeadInfoDto) => !!leadInfo.propertyId)
    );
    userId$: Observable<number> = this.contactsService.userId$;
    contactIsParent$: Observable<boolean> = this.contactsService.contactInfo$.pipe(
        filter(Boolean),
        map((contactInfo: ContactInfoDto) => !contactInfo.parentId)
    );
    isContactProspective$: Observable<boolean> = this.contactsService.contactInfo$.pipe(
        filter(Boolean),
        map((contactInfo: ContactInfoDto) => contactInfo.groups.every(group => group.isProspective))
    );
    showSubscriptionsSection$: Observable<boolean> = combineLatest(
        this.contactIsParent$,
        this.userId$,
        this.isContactProspective$
    ).pipe(
        map(([contactIsParent, userId, isProspective]: [boolean, number, boolean]) => {
            return contactIsParent || (!userId && isProspective);
        })
    );
    showPaymentInformationSection$: Observable<boolean> = combineLatest(
        this.contactIsParent$,
        this.isContactProspective$
    ).pipe(
        map(([contactIsParent, isProspective]: boolean[]) => {
            return contactIsParent || isProspective;
        })
    );

    navLinks: NavLink[] = [
        {
            name: 'property-information',
            label: this.capitalize(this.l('PropertyInfo')),
            route: 'property-information',
            visible$: this.isPropertyContact$
        },
        {
            name: 'property-documents',
            label: this.l('PropertyDocuments'),
            route: 'property-documents',
            visible$: this.isPropertyContact$
        },
        {
            name: 'contact-information',
            label$: this.contactsService.leadInfo$.pipe(map(
                lead => {
                    if (lead && lead.typeSysId) {
                        if (lead.typeSysId == EntityTypeSys.PropertyAcquisition) return this.l('SellerContactInfo');
                        if (lead.typeSysId.startsWith(EntityTypeSys.PropertyRentAndSale)) return this.l('BuyerContactInfo');
                    }
                    return this.l('ContactInfo')
                }
            )),
            route: 'contact-information'
        },
        { name: 'personal-details', label: this.l('PersonalDetails'), route: 'personal-details'},
        {
            name: 'user-information',
            label$: this.userId$.pipe(map((userId: number) => userId
                ? this.l('UserInformation')
                : this.l('InviteUser'))),
            visible$: combineLatest(this.userId$, this.contactsService.contactInfo$).pipe(
                map(([userId, contactInfo] : [number, ContactInfoDto]) => {
                    return userId ? this.permission.isGranted(AppPermissions.AdministrationUsersEdit)
                        || contactInfo && this.permission.checkCGPermission(contactInfo.groups, 'UserInformation')
                    : this.permission.isGranted(AppPermissions.AdministrationUsersCreate);
                })
            ),
            route: 'user-information'
        },
        {
            name: 'user-inbox',
            label: this.l('CommunicationHistory'),
            route: 'user-inbox',
            visible$: this.isCommunicationHistoryAllowed$
        },
        {
            name: 'documents',
            label$: this.contactsService.leadInfo$.pipe(map(
                lead => {
                    if (lead && lead.typeSysId) {
                        if (lead.typeSysId == EntityTypeSys.PropertyAcquisition) return this.l('SellerDocuments');
                        if (lead.typeSysId.startsWith(EntityTypeSys.PropertyRentAndSale)) return this.l('BuyerDocuments');
                    }
                    return this.l('Documents')
                }
            )),
            route: 'documents'
        },
        { name: 'notes', label: this.l('Notes'), route: 'notes'},
        {
            name: 'invoices',
            label: this.l('OrdersAndInvoices'),
            route: 'invoices',
            disabled: !this.permission.isGranted(AppPermissions.CRMOrdersInvoices),
            visible$: this.contactIsParent$
        },
        {
            name: 'subscriptions',
            label: this.l('Subscriptions'),
            route: 'subscriptions',
            visible$: this.showSubscriptionsSection$
        },
        {
            name: 'payment-information',
            label: this.l('PaymentInformation'),
            route: 'payment-information',
            visible$: this.showPaymentInformationSection$
        },
        {
            name: 'reseller-activity',
            label: this.l('ResellerActivity'), route: 'reseller-activity'
        },
        {
            name: 'lead-information',
            label: this.l('LeadInformation'),
            route: 'lead-information',
            visible$: this.contactIsParent$
        },
        {
            name: 'lead-related-contacts',
            label: this.l('LeadsRelatedContacts'),
            route: 'lead-related-contacts',
            visible$: this.contactIsParent$
        },
        {
            name: 'activity-logs',
            label: this.l('ActivityLogs'),
            route: 'activity-logs',
            disabled: !this.permission.isGranted(AppPermissions.PFMApplications)
        },
        {
            name: 'referral-history',
            label: this.l('ReferralHistory'),
            route: 'referral-history',
            disabled: true
        },
        {
            name: 'application-status',
            label: this.l('ApplicationStatus'),
            route: 'application-status',
            visible$: this.leadInfo$.pipe(
                map((leadInfo: LeadInfoDto) => !!leadInfo.id)
            ),
            disabled: true
        },
        {
            name: 'questionnaire',
            label: this.l('Questionnaire'),
            route: 'questionnaire',
            disabled: true
        }
    ];
    params: any;
    private rootComponent: any;
    queryParams: Params;

    showToolbar;
    currentItemId;
    dataSourceURI: ItemTypeEnum = ItemTypeEnum.Customer;
    private targetEntity: BehaviorSubject<TargetDirectionEnum> = new BehaviorSubject<TargetDirectionEnum>(TargetDirectionEnum.Current);
    public targetEntity$: Observable<TargetDirectionEnum> = this.targetEntity.asObservable();
    manageAllowed = false;

    isCommunicationHistoryAllowed = false;
    isSendSmsAndEmailAllowed = false;

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private userService: UserServiceProxy,
        private contactService: ContactServiceProxy,
        private appSessionService: AppSessionService,
        private appHttpConfiguration: AppHttpConfiguration,
        private orgContactService: OrganizationContactServiceProxy,
        private partnerService: PartnerServiceProxy,
        private leadService: LeadServiceProxy,
        private pipelineService: PipelineService,
        private store$: Store<AppStore.State>,
        private appStoreService: AppStoreService,
        private customerService: CustomerServiceProxy,
        private itemDetailsService: ItemDetailsService,
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
            switchMap((params: Params) => this.loadContactInfo(params)),
            switchMap(() => this._activatedRoute.queryParams)
        ).subscribe((params: Params) => {
            this.queryParams = params;
            this.initNavButtons();
        });

        contactsService.invalidateSubscribe(area => this.invalidate(area));
        contactsService.loadLeadInfoSubscribe(() => this.loadLeadData());
        this.handleContactsOptions();
        this.contactsService.prev.pipe(takeUntil(this.destroy$)).subscribe((e) => {
            this.loadTargetEntity(e, TargetDirectionEnum.Prev);
        });
        this.contactsService.next.pipe(takeUntil(this.destroy$)).subscribe((e) => {
            this.loadTargetEntity(e, TargetDirectionEnum.Next);
        });
    }

    initContextTypeByRoute() {
        this.detailsHeaderComponent.contextMenuInit$.pipe(first()).subscribe(() => {
            let section = this._activatedRoute.children[0].routeConfig.path;
            this.updateContextType(this.navLinks.find(link => link.name == section));
        });
    }

    private handleContactsOptions() {
        const routeData$: Observable<any> = this._router.events.pipe(
            takeUntil(this.destroy$),
            filter((event: Event) => event instanceof ActivationEnd),
            buffer(this._router.events.pipe(filter((event: Event) => event instanceof NavigationEnd))),
            map((events: ActivationEnd[]) => events[0])
        );

        combineLatest(routeData$).subscribe(([event]: [ActivationEnd]) => {
            this.showToolbar = this.getCheckPropertyValue(event.snapshot.data, 'showToolbar', true);
        });
    }

    private getCheckPropertyValue(obj, prop, def) {
        return obj.hasOwnProperty(prop) ? obj[prop] : def;
    }

    initNavigatorProperties() {
        this.dataSourceURI = this.contactsService.getCurrentItemType(this.queryParams);
        this.currentItemId = this.getCurrentItemId();
    }

    private getCurrentItemId(): string {
        let currentItemId: string;
        switch (this.contactsService.getSection(this.queryParams)) {
            case 'leads': currentItemId = this.params.leadId; break;
            case 'clients': currentItemId = this.params.contactId; break;
            case 'partners': currentItemId = this.params.contactId; break;
            case 'users': currentItemId = this.params.userId; break;
            case 'orders': currentItemId = this.queryParams.orderId; break;
            case 'subscriptions': currentItemId = this.queryParams.subId; break;
            default: break;
        }
        return currentItemId;
    }

    initNavButtons() {
        this.rootComponent.overflowHidden(true);
        this.rootComponent.pageHeaderFixed();
        this.initNavigatorProperties();
        const itemKeyField = this.dataSourceURI == ItemTypeEnum.User ? 'id' : 'Id',
              itemDistinctField = [ItemTypeEnum.Order, ItemTypeEnum.Subscription].indexOf(this.dataSourceURI) >= 0 ? 'LeadId' : itemKeyField;
        let subscription = this.targetEntity$.pipe(
            /** To avoid fast next/prev clicking */
            takeUntil(this.destroy$),
            debounceTime(100),
            tap(() => {
                if (this.toolbarComponent) {
                    this.toolbarComponent.updateNavButtons(true, true);
                }
                this.startLoading(true);
            }),
            switchMap((direction: TargetDirectionEnum) => this.itemDetailsService.getItemFullInfo(
                this.dataSourceURI,
                this.currentItemId,
                direction,
                itemKeyField,
                itemDistinctField
            ).pipe(
                finalize(() => this.finishLoading(true))
            ))
        ).subscribe((itemFullInfo: ItemFullInfo) => {
            if (itemFullInfo && this.currentItemId != itemFullInfo.itemData[itemKeyField]) {
                subscription.unsubscribe();
                this.targetEntity.next(TargetDirectionEnum.Current);
                this.updateLocation(itemFullInfo);
            } else
                if (this.toolbarComponent) {
                    this.toolbarComponent.updateNavButtons(
                        !itemFullInfo || itemFullInfo.isFirstOnList,
                        !itemFullInfo || itemFullInfo.isLastOnList
                    );
                }
        });
    }

    private updateLocation(itemFullInfo) {
        switch (this.contactsService.getSection(this.queryParams)) {
            case 'leads':
                this.contactsService.updateLocation(
                    itemFullInfo.itemData.CustomerId,
                    itemFullInfo.itemData.Id,
                    itemFullInfo.itemData.OrganizationId
                );
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
                this.contactsService.updateLocation(itemFullInfo.itemData.ContactId,
                    itemFullInfo.itemData.LeadId, null, null, {...this.queryParams, orderId: itemFullInfo.itemData.Id});
                break;
            case 'subscriptions':
                this.contactsService.updateLocation(itemFullInfo.itemData.ContactId,
                    itemFullInfo.itemData.LeadId, null, null, {...this.queryParams, subId: itemFullInfo.itemData.Id});
                break;
            default:
                break;
        }
    }

    private storeInitialData() {
        this.initialData = JSON.stringify(this.contactService['data']);
    }

    private checkUpdateToolbar() {
        if (!['user-inbox', 'documents', 'notes'].includes(
            this._activatedRoute.snapshot.firstChild.routeConfig.path
        ))
            this.contactsService.toolbarUpdate();
    }

    private getContactGroupId(contactInfo: ContactInfoDto): string {
        let contactGroupId = this.contactsService.getContactGroupId(
            (this._activatedRoute.queryParams as BehaviorSubject<any>).value
        );
        if (contactGroupId && contactInfo.groups.some(group => group.groupId == contactGroupId)) {
            return contactGroupId;
        }
        let group = contactInfo.groups.filter(group => group.isActive).shift() || 
            contactInfo.groups.filter(group => group.isProspective).shift();

        return (group && group.groupId) || contactInfo.groups[0].groupId || ContactGroup.Client;
    }

    private fillContactDetails(result: ContactInfoDto, contactId = null) {
        this.contactService['data'].contactInfo = result;
        this.contactsService.contactInfoUpdate(result);
        this.contactGroupId.next(this.getContactGroupId(result));
        this.manageAllowed = this.permission.checkCGPermission(result.groups);
        this.assignedUsersSelector = select(
            ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers,
            { contactGroup: this.contactGroupId.value }
        );
        contactId = contactId || result.personContactInfo.id;
        if (result['organizationContactInfo'] && result['organizationContactInfo'].contactPersons) {
            result['organizationContactInfo'].contactPersons.map((contact: PersonShortInfoDto) => {
                return contact.id == contactId ? result.personContactInfo : contact;
            });
        }

        this.isCommunicationHistoryAllowed = this.permission.checkCGPermission(
            result.groups,
            'ViewCommunicationHistory'
        );
        this.isSendSmsAndEmailAllowed = this.permission.checkCGPermission(
            result.groups,
            'ViewCommunicationHistory.SendSMSAndEmail'
        );

        this.primaryContact = result.personContactInfo;
        this.contactInfo = result;
        this.personContactInfo = result.personContactInfo;
        this.contactsService.updatePersonContactInfo(this.personContactInfo);
        this.contactsService.updateUserId(
            this.userService['data'].userId = this.primaryContact.userId
        );
        this.initContextTypeByRoute();
        this.checkUpdateToolbar();
        this.storeInitialData();
    }

    private fillLeadDetails(leadInfo: LeadInfoDto) {
        this.contactService['data'].leadInfo = this.leadInfo = leadInfo;
        this.leadId = this.contactInfo['leadId'] = leadInfo.id;
        this.contactsService.leadInfoUpdate({
            ...this.params,
            ...leadInfo
        });
        this.loadLeadsStages();
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
        this.contactsService.contactId.next(contactId);
        this.params = params;
        this.userService['data'] = {
            userId: userId, user: null, roles: null
        };
        this.contactService['data'].contactInfo = {
            id: this.customerId = contactId
        };
        if (this.leadId != leadId)
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
                if (!companyId && contactInfo.primaryOrganizationContactId)
                    this.orgContactService.getOrganizationContactInfo(
                        contactInfo.primaryOrganizationContactId
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
            if (this.permission.isGranted(AppPermissions.CRM)) {
                this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(false));
                this.loadLeadData();
            }
        });
        return res$;
    }

    updateContextType(navLink: NavLink): ContextType {
        let newSelectedContextType: ContextType;
        this.closeEditDialogs();
        switch (navLink.name) {
            case 'documents': newSelectedContextType = ContextType.AddFiles;  break;
            case 'contact-information': newSelectedContextType = ContextType.AddContact;  break;
            case 'notes': newSelectedContextType = ContextType.AddNotes;  break;
            case 'invoices': newSelectedContextType = ContextType.AddInvoice; break;
            case 'lead-related-contacts': newSelectedContextType = ContextType.AddContact; break;
            case 'subscriptions': newSelectedContextType = ContextType.AddSubscription; break;
        }
        if (newSelectedContextType !== undefined) {
            setTimeout(() => {
                this.detailsHeaderComponent.updateSaveOption(
                    this.detailsHeaderComponent.addContextMenuItems[newSelectedContextType]
                );
            });
        }
        return newSelectedContextType;
    }

    loadContactInfoForClient(contactId: number, leadId: number, companyId: number): Observable<ContactInfoDto> {
        let contactInfo$: Observable<ContactInfoDto>;
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
                switchMap((result: ContactInfoDto) => {
                    this.fillContactDetails(result);
                    this.loadLeadData(result.personContactInfo);
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
        } else {
            contactInfo$ = of(new ContactInfoDto());
        }
        return contactInfo$;
    }

    loadLeadData(personContactInfo?: PersonContactInfoDto, lastLeadCallback?) {
        let contactInfo = this.contactService['data'].contactInfo,
            leadInfo = this.contactService['data'].leadInfo;

        if (contactInfo && (!contactInfo.hasOwnProperty('parentId') || contactInfo.parentId))
            return this.fillLeadDetails(new LeadInfoDto());

        if ((contactInfo && (!leadInfo || !this.leadInfo || this.leadInfo.id != leadInfo.id)) || lastLeadCallback) {
            this.contactGroupId$.pipe(filter(Boolean), first()).subscribe((contactGroupId: string) => {
                !lastLeadCallback && this.startLoading(true);
                let leadId = leadInfo && leadInfo.id,
                    leadInfo$ = leadId && !lastLeadCallback ? 
                        this.leadService.getLeadInfo(leadId) :
                        this.leadService.getLastLeadInfo(
                            contactGroupId, contactInfo.id
                        );

                let successCallback = (result: LeadInfoDto) => {
                    this.fillLeadDetails(result);
                    lastLeadCallback && lastLeadCallback();
                };

                this.appHttpConfiguration.avoidErrorHandling = true;
                leadInfo$.pipe(finalize(() => {
                    this.appHttpConfiguration.avoidErrorHandling = false;
                    this.finishLoading(true);
                })).subscribe(successCallback, error => {
                    if (error.code == 404)
                        this.leadService.getLastLeadInfo(
                            contactGroupId, contactInfo.id
                        ).subscribe(successCallback);
                    else
                        this.notify.error(error.message);
                });
            });
        } else
            this.contactsService.leadInfoUpdate({
                ...this.params,
                ...leadInfo
            });
    }

    private loadLeadsStages() {
        this.leadInfo$.pipe(
            first(),
            switchMap((leadInfo) => {
                return zip(of(leadInfo), this.pipelineService.getAllPipelinesOberverable(
                    AppConsts.PipelinePurposeIds.lead
                ));
            })
        ).subscribe(([leadInfo, pipelines]) => {
            this.allPipelines = pipelines.filter(
                (pipeline: PipelineDto) => this.permission.checkCGPermission([pipeline.contactGroupId])
                    && (!pipeline.entityTypeSysId || (                        
                        pipeline.entityTypeSysId.startsWith('Property')
                            && leadInfo.propertyId
                    )
                )
            ).map((pipeline: PipelineDto) => {
                return {
                    id: pipeline.id,
                    text: pipeline.name,
                    items: pipeline.stages.map((stage: StageDto) => {
                        return {
                            id: stage.id,
                            name: stage.name,
                            index: stage.sortOrder,
                            action: this.updateLeadStage.bind(this),
                            disabled: leadInfo.pipelineId != pipeline.id && stage.isFinal,
                            pipelineId: pipeline.id
                        }
                    })
                };
            });
        });
    }

    private loadPartnerTypes() {
        this.store$.pipe(select(PartnerTypesStoreSelectors.getPartnerTypes)).subscribe(
            (partnerTypes: PartnerTypeDto[]) => {
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

    private showConfirmationDialog(status: GroupStatus) {
        this.contactsService.updateStatus(
            this.contactInfo.id, status.groupId, status.isActive
        ).subscribe((confirm: boolean) => {
            if (confirm) {
                this.contactInfo.groups.some(group => {
                    if (group.groupId == status.groupId) {                        
                        group.isActive = status.isActive;
                        return true;
                    }
                });
                let userData = this.userService['data'];
                if (userData && userData.user) {
                    userData.user.isActive = status.isActive;
                }
                this.notify.success(this.l('StatusSuccessfullyUpdated'));
            } else {
                status.isActive = !status.isActive;
            }
            this.toolbarComponent.updateActiveGroups(status);
        }, () => {
            this.toolbarComponent.updateActiveGroups();
        });
    }

    showContactPersons(event) {
        this.dialog.closeAll();
        this.dialog.open(ContactPersonsDialogComponent, {
            data: this.contactInfo,
            hasBackdrop: false,
            minWidth: 420,
            position: this.getDialogPosition(event, -182, 89),
            panelClass: ['related-contacts']
        }).afterClosed().subscribe(result => {
            if (result == 'addContact')
                this.addNewContact(event);
            else if (result) {
                this.startLoading(true);
                this.contactService.getContactInfo(result.id)
                    .pipe(finalize(() => this.finishLoading(true)))
                    .subscribe((contactInfo) => {
                        this.itemDetailsService.clearItemsSource();
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

    getDialogPosition(event, shiftX, shiftY) {
        return DialogService.calculateDialogPosition(event, event.target.closest('div'), shiftX, shiftY);
    }

    close(force: boolean = false) {
        this.dialog.closeAll();
        let data = this.contactService['data'],
            refresh = data.refresh;
        if (!refresh && !force) {
            let compare = JSON.stringify(<any>data);
            refresh = this.initialData != compare;
        }
        let queryParams = { ... this.queryParams };
        if (queryParams.referrer) {
            delete queryParams.referrer;
        }
        this._router.navigate(
            [(this.queryParams && this.queryParams.referrer) || 'app/crm/clients'],
            {
                queryParams: _.extend(
                    queryParams,
                    refresh ? { refresh: Date.now() } : {}
                )
            }
        );
        delete data.refresh;
    }

    closeEditDialogs() {
        this.dialog.openDialogs.forEach((dialog: MatDialogRef<any>) => {
            if (!dialog.disableClose) {
                dialog.close();
            }
        });
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
        this.contactsService.cleanLastContact();
        this.contactsService.unsubscribe();
        super.ngOnDestroy();
    }

    deleteContact() {
        let id = this.contactInfo.groups.every(group => group.isProspective) || this._router.url.split('?').shift().includes('lead') ? this.leadId : this.contactInfo.id,
            isLead = this._router.url.split('?').shift().includes('lead');
        this.contactsService.deleteContact(this.getCustomerName(), this.contactInfo.groups.map(group => group.groupId), id, () => this.close(), isLead);
    }

    updateStatus(status: GroupStatus) {
        this.showConfirmationDialog(status);
    }

    updateLeadStage($event) {
        if (!this.leadId || !this.leadInfo)
            return;

        this.leadInfo$.pipe(
            first(),
            map((leadInfo: LeadInfoDto) => leadInfo.pipelineId)
        ).subscribe((pipelineId: number) => {
            if (pipelineId == $event.itemData.pipelineId)
                this.updateStageInternal(pipelineId, $event.itemData);
            else
                this.message.confirm(
                    this.l('PipelineAndStageChange'),
                    this.l('AreYouSure'),
                    confirmed => {
                        if (confirmed)
                            this.updateStageInternal(pipelineId, $event.itemData);
                        else 
                            this.toolbarComponent.stagesComponent.disabled = false;
                    }
                )
            this.toolbarComponent.stagesComponent.toggle();
        });
        $event.event.stopPropagation();
    }

    private updateStageInternal(pipelineId, data) {
        const pipelinePurposeId = AppConsts.PipelinePurposeIds.lead;
        let isPipelineChange = pipelineId != data.pipelineId,
            sourceStage = this.pipelineService.getStage(pipelinePurposeId, pipelineId, this.leadInfo.stageId),
            targetStage = this.pipelineService.getStage(pipelinePurposeId, data.pipelineId, data.id);

        this.toolbarComponent.stagesComponent.disabled = true;
        if (!this.pipelineService.updateEntityStage(
            this.leadInfo, sourceStage, targetStage, () => {
                this.toolbarComponent.stagesComponent.disabled = false;
                if (this.leadInfo.stageId == targetStage.id) {
                    this.notify.success(this.l('StageSuccessfullyUpdated'));
                    if (isPipelineChange || sourceStage.isFinal != targetStage.isFinal) {
                        this.leadInfo = undefined;
                        this.reloadCurrentSection(this.params).pipe(
                            first()
                        ).subscribe(() => {
                            this.contactService['data'].refresh = true;
                        });
                    }
                } else
                    this.refreshStageDropdown();
            }
        ))
            this.message.warn(this.l('CannotChangeLeadStage', sourceStage.name, targetStage.name));
    }

    refreshStageDropdown() {
        if (this.leadInfo)
            this.toolbarComponent.stagesComponent.listComponent.option(
                'selectedItemKeys', [this.leadInfo.stageId]
            );
        this.toolbarComponent.refresh();
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
                    this.toolbarComponent.partnerTypesComponent.listComponent.option(
                        'selectedItemKeys',
                        [this.partnerInfo.typeId]
                    );
                }
            }
        );
    }

    getAssignmentsPermissionKey = () => {
        return this.contactGroupId.value ? this.permission.getCGPermissionKey(
            [this.contactGroupId.value], 'ManageAssignments') : '';
    }

    getProxyService = () => {
        return this.contactService;
    }

    addNewContact(event, isSubContact = false) {
        if (this.isUserProfile || !this.manageAllowed)
            return;

        let companyInfo = this.contactInfo['organizationContactInfo'];
        this.dialog.closeAll();
        const dialogData: CreateEntityDialogData = {
            parentId: isSubContact ? this.contactInfo.id : undefined,
            isInLeadMode: this.contactInfo.groups.every(group => group.isProspective),
            company: isSubContact ? undefined : companyInfo && companyInfo.fullName,
            customerType: this.contactGroupId.value || ContactGroup.Client
        };
        this.dialog.open(CreateEntityDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: dialogData
        }).afterClosed().subscribe(() => {
            if (isSubContact)
                this.reloadCurrentSection();
            else
                this.orgContactService.getOrganizationContactInfo(companyInfo.id).subscribe((result: OrganizationContactInfoDto) => {
                    this.contactInfo['organizationContactInfo'] = result;
                });
        });
        event.stopPropagation();
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

    showParent() {
        this.leadInfo = undefined;
        this.contactsService.updateLocation(this.contactInfo.parentId);
    }
}