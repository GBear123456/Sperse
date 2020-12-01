/** Core imports */
import { Component, Injector, OnDestroy, ViewChild } from '@angular/core';
import { ActivationEnd, Event, NavigationEnd, Params } from '@angular/router';

/** Third party imports */
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of } from 'rxjs';
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
import { AppStore, ContactAssignedUsersStoreSelectors, PartnerTypesStoreSelectors } from '@app/store';
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
    LayoutType
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
import { Status } from '@app/crm/contacts/operations-widget/status.interface';
import { CreateEntityDialogData } from '@shared/common/create-entity-dialog/models/create-entity-dialog-data.interface';
import { AppSessionService } from '@shared/common/session/app-session.service';

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
    clientStageId: number;
    ratingId: number;
    partnerInfo: PartnerInfoDto;
    partnerTypeId: string;
    partnerTypes: any[] = [];

    private initialData: string;

    navLinks: NavLink[] = [];
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
    public contactGroupId: BehaviorSubject<string> = new BehaviorSubject<string>(null);
    public contactGroupId$: Observable<string> = this.contactGroupId.asObservable().pipe(filter(Boolean)) as Observable<string>;

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
            this.showToolbar = this.getCheckPropertyValue(event.snapshot.data, 'showToolbar', true);
        });
    }

    private getCheckPropertyValue(obj, prop, def) {
        return obj.hasOwnProperty(prop) ? obj[prop] : def;
    }

    initNavigatorProperties() {
        this.dataSourceURI = this.contactsService.getCurrentItemType(this.queryParams, this.contactGroupId.value);
        this.currentItemId = this.getCurrentItemId();
    }

    private getCurrentItemId(): string {
        let currentItemId: string;
        switch (this.contactsService.getSection(this.queryParams, this.contactGroupId.value)) {
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

    private initNavLinks(contact: PersonContactInfoDto, leadInfo?: LeadInfoDto) {
        this.navLinks = [
            {
                name: 'property-information',
                label: this.capitalize(this.l('PropertyInfo')),
                route: 'property-information',
                hidden: !leadInfo || !leadInfo.propertyId
            },
            {
                name: 'property-documents',
                label: this.l('PropertyDocuments'),
                route: 'property-documents',
                hidden: !leadInfo || !leadInfo.propertyId
            },
            { name: 'contact-information', label: this.l('ContactInfo'), route: 'contact-information' },
            { name: 'personal-details', label: this.l('PersonalDetails'), route: 'personal-details'},
            {
                name: 'user-information',
                label: contact.userId ? this.l('UserInformation') : this.l('InviteUser'),
                hidden: !this.permission.isGranted(contact.userId ?
                    AppPermissions.AdministrationUsers : AppPermissions.AdministrationUsersCreate),
                route: 'user-information'
            },
            {
                name: 'user-inbox',
                label: this.l('CommunicationHistory'),
                route: 'user-inbox',
                hidden: !this.isCommunicationHistoryAllowed
            },
            { name: 'documents', label: this.l('Documents'), route: 'documents' },
            { name: 'notes', label: this.l('Notes'), route: 'notes'},
            {
                name: 'invoices',
                label: this.l('OrdersAndInvoices'),
                route: 'invoices',
                disabled: !this.permission.isGranted(AppPermissions.CRMOrdersInvoices),
                hidden: !!this.contactInfo.parentId
            },
            { name: 'subscriptions', label: this.l('Subscriptions'), route: 'subscriptions', hidden: !!this.contactInfo.parentId || (!contact.userId && !this.isClientDetailPage()) },
            { name: 'payment-information', label: this.l('PaymentInformation'), route: 'payment-information', hidden: !!this.contactInfo.parentId || !this.isClientDetailPage() },
            {
                name: 'reseller-activity',
                label: this.l('ResellerActivity'), route: 'reseller-activity',
                hidden: !this.appSessionService.tenant ||
                    this.appSessionService.tenant.customLayoutType != LayoutType.BankCode
            },
            { name: 'lead-information', label: this.l('LeadInformation'), route: 'lead-information', hidden: !!this.contactInfo.parentId },
            { name: 'lead-related-contacts', label: this.l('LeadsRelatedContacts'), route: 'lead-related-contacts', hidden: !!this.contactInfo.parentId },
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
                hidden: !!this.leadId,
                disabled: true
            },
            {
                name: 'questionnaire',
                label: this.l('Questionnaire'),
                route: 'questionnaire',
                disabled: true
            }
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
        this.contactsService.contactInfoUpdate(result);
        this.contactGroupId.next(result.groupId);
        this.manageAllowed = this.permission.checkCGPermission(result.groupId);
        this.assignedUsersSelector = select(
            ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers,
            { contactGroup: result.groupId }
        );
        contactId = contactId || result.personContactInfo.id;
        if (result['organizationContactInfo'] && result['organizationContactInfo'].contactPersons) {
            result['organizationContactInfo'].contactPersons.map((contact: PersonShortInfoDto) => {
                return contact.id == contactId ? result.personContactInfo : contact;
            });
        }

        this.isCommunicationHistoryAllowed = this.permission.checkCGPermission(
            this.contactGroupId.value,
            'ViewCommunicationHistory'
        );
        this.isSendSmsAndEmailAllowed = this.permission.checkCGPermission(
            this.contactGroupId.value,
            'ViewCommunicationHistory.SendSMSAndEmail'
        );

        this.ratingId = result.ratingId;
        this.primaryContact = result.personContactInfo;
        this.contactInfo = result;
        this.personContactInfo = result.personContactInfo;
        this.contactsService.updatePersonContactInfo(this.personContactInfo);
        this.contactsService.updateUserId(
            this.userService['data'].userId = this.primaryContact.userId
        );
        this.initNavLinks(this.primaryContact);
        this.contactsService.toolbarUpdate();
        this.storeInitialData();
    }

    private fillLeadDetails(leadInfo: LeadInfoDto) {
        this.contactService['data'].leadInfo = this.leadInfo = leadInfo;
        this.leadId = this.contactInfo['leadId'] = leadInfo.id;
        this.contactsService.leadInfoUpdate({
            ...this.params,
            ...leadInfo
        });

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
                    this.loadLeadData(result.personContactInfo);
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
        } else {
            contactInfo$ = of(new ContactInfoDto());
        }
        return contactInfo$;
    }

    loadLeadData(personContactInfo?: PersonContactInfoDto, lastLeadCallback?) {
        let contactInfo = this.contactService['data'].contactInfo,
            leadInfo = this.contactService['data'].leadInfo;
        if ((contactInfo && (!leadInfo || !this.leadInfo || this.leadInfo.id != leadInfo.id)) || lastLeadCallback) {
            !lastLeadCallback && this.startLoading(true);
            let leadId = leadInfo && leadInfo.id,
                leadInfo$ = leadId && !lastLeadCallback
                    ? this.leadService.getLeadInfo(leadId)
                    : this.leadService.getLastLeadInfo(contactInfo.id);

            let successCallback = (result: LeadInfoDto) => {
                this.fillLeadDetails(result);
                this.appHttpConfiguration.avoidErrorHandling = false;
                personContactInfo && this.initNavLinks(personContactInfo, this.contactService['data'].leadInfo);
                lastLeadCallback && lastLeadCallback();
            };

            this.appHttpConfiguration.avoidErrorHandling = true;
            leadInfo$.pipe(finalize(() => {
                this.finishLoading(true);
            })).subscribe(successCallback, error => {
                this.appHttpConfiguration.avoidErrorHandling = false;
                if (error.code == 404)
                    this.leadService.getLastLeadInfo(contactInfo.id).subscribe(successCallback);
                else
                    this.notify.error(error.message);
            });
        } else
            this.contactsService.leadInfoUpdate({
                ...this.params,
                ...leadInfo
            });
    }

    private loadLeadsStages(callback?: () => any) {
        if (this.leadStages && this.leadStages.length)
            callback && callback();
        else
            this.pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.lead, this.contactGroupId.value)
                .subscribe((result: PipelineDto) => {
                    this.leadStages = result.stages.map((stage: StageDto) => {
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

    private showConfirmationDialog(status: Status) {
        this.contactsService.updateStatus(this.contactInfo.id, status).subscribe((confirm: boolean) => {
            if (confirm) {
                this.contactInfo.statusId = String(status.id);
                let userData = this.userService['data'];
                if (userData && userData.user) {
                    userData.user.isActive = status.id == ContactStatus.Active;
                }
                this.toolbarComponent.statusComponent.listComponent.option('selectedItemKeys', [status.id]);
                this.notify.success(this.l('StatusSuccessfullyUpdated'));
            } else {
                this.toolbarComponent.statusComponent.listComponent.option('selectedItemKeys', [this.contactInfo.statusId]);
            }
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
        let id = this.contactInfo.statusId == ContactStatus.Prospective || this._router.url.split('?').shift().includes('lead') ? this.leadId : this.contactInfo.id,
            isLead = this._router.url.split('?').shift().includes('lead');
        this.contactsService.deleteContact(this.getCustomerName(), this.contactGroupId.value, id, () => this.close(), isLead);
    }

    updateStatus(status: Status) {
        this.showConfirmationDialog(status);
    }

    updateRating(ratingId: number) {
        this.ratingId = ratingId;
    }

    updateLeadStage($event) {
        if (!this.leadId || !this.leadInfo)
            return;

        const pipelineId = AppConsts.PipelinePurposeIds.lead;
        let sourceStage = this.pipelineService.getStageByName(pipelineId, this.leadInfo.stage, this.contactGroupId.value);
        let targetStage = this.pipelineService.getStageByName(pipelineId, $event.itemData.name, this.contactGroupId.value);

        if (this.pipelineService.updateEntityStage(pipelineId, this.contactGroupId.value, this.leadInfo, sourceStage, targetStage, () => {
            this.toolbarComponent.stagesComponent.listComponent.option(
                'selectedItemKeys',
                [this.clientStageId = targetStage.id]
            );
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
                    this.toolbarComponent.partnerTypesComponent.listComponent.option(
                        'selectedItemKeys',
                        [this.partnerInfo.typeId]
                    );
                }
            }
        );
    }

    getAssignmentsPermissionKey = () => {
        return this.permission.getCGPermissionKey(this.contactGroupId.value, 'ManageAssignments');
    }

    getProxyService = () => {
        return this.contactService;
    }

    addNewContact(event, isSubContact = false) {
        if (this.isUserProfile)
            return;

        let companyInfo = this.contactInfo['organizationContactInfo'];

        this.dialog.closeAll();
        const dialogData: CreateEntityDialogData = {
            parentId: isSubContact ? this.contactInfo.id : undefined,
            isInLeadMode: this.contactInfo.statusId == ContactStatus.Prospective,
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
                this.contactsService.invalidate('sub-contacts');
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
        this.contactsService.updateLocation(this.contactInfo.parentId);
    }
}