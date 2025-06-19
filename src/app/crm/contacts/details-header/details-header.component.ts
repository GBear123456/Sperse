/** Core imports */
import {
    Component,
    EventEmitter,
    Injector,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

/** Third party import */
import capitalize from 'underscore.string/capitalize';
import { MatDialog } from '@angular/material/dialog';
import { CacheService } from 'ng2-cache-service';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import * as _ from 'underscore';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject, zip } from 'rxjs';
import { filter, finalize, first, map, switchMap, takeUntil } from 'rxjs/operators';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppConsts } from '@shared/AppConsts';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { PersonDialogComponent } from '../person-dialog/person-dialog.component';
import { CreateEntityDialogComponent } from '@shared/common/create-entity-dialog/create-entity-dialog.component';
import { RelationCompaniesDialogComponent } from '../relation-companies-dialog/relation-companies-dialog.component';
import { CreateInvoiceDialogComponent } from '@app/crm/shared/create-invoice-dialog/create-invoice-dialog.component';
import { AddSubscriptionDialogComponent } from '@app/crm/contacts/subscriptions/add-subscription-dialog/add-subscription-dialog.component';
import {
    ContactInfoDto,
    ContactGroupInfo,
    ContactPhotoServiceProxy,
    ContactServiceProxy,
    CreateContactPhotoInput,
    LeadInfoDto,
    OrganizationContactInfoDto,
    OrganizationContactServiceProxy,
    OrganizationInfoDto,
    PersonContactInfoDto,
    PersonContactServiceProxy,
    PersonOrgRelationServiceProxy,
    PersonOrgRelationShortInfo,
    UpdateOrganizationInfoInput,
    UpdatePersonNameInput,
    UpdatePersonOrgRelationInput
} from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@shared/common/name-parser/name-parser.service';
import { NoteAddDialogComponent } from '../notes/note-add-dialog/note-add-dialog.component';
import { AppService } from '@app/app.service';
import { StringHelper } from '@shared/helpers/StringHelper';
import { ContactGroup } from '@shared/AppEnums';
import { CompanyDialogComponent } from '@app/crm/contacts/company-dialog/company-dialog.component';
import { ContactsService } from '../contacts.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { ContextType } from '@app/crm/contacts/details-header/context-type.enum';
import { ContextMenuItem } from '@app/crm/contacts/details-header/context-menu-item.interface';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { MessageService } from 'abp-ng2-module';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { PermissionCheckerService } from 'abp-ng2-module';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { CreateEntityDialogData } from '@shared/common/create-entity-dialog/models/create-entity-dialog-data.interface';
import { UploadPhotoData } from '@app/shared/common/upload-photo-dialog/upload-photo-data.interface';
import { UploadPhotoResult } from '@app/shared/common/upload-photo-dialog/upload-photo-result.interface';
import { NoteAddDialogData } from '@app/crm/contacts/notes/note-add-dialog/note-add-dialog-data.interface';
import { PersonHistoryDialogComponent } from '../personal-details/personal-details-dialog/person-history-dialog/person-history-dialog.component';

@Component({
    selector: 'details-header',
    templateUrl: './details-header.component.html',
    styleUrls: ['./details-header.component.less'],
    providers: [ ContactPhotoServiceProxy, LifecycleSubjectsService ]
})
export class DetailsHeaderComponent implements OnInit, OnDestroy {
    @ViewChild(DxContextMenuComponent) addContextComponent: DxContextMenuComponent;

    @Input()
    public set data(data: ContactInfoDto) {
        data && this.contactInfo.next(data);
    }
    public get data(): ContactInfoDto {
        return this.contactInfo.getValue();
    }

    @Input()
    public set personContactInfo(data: PersonContactInfoDto) {
        this._personContactInfo.next(data);
    }
    public get personContactInfo(): PersonContactInfoDto {
        return this._personContactInfo.getValue();
    }

    @Input() ratingId: number;
    private readonly ADD_OPTION_DEFAULT = ContextType.AddFiles;
    @Output() onInvalidate: EventEmitter<any> = new EventEmitter();

    get isOrgUpdatable(): Boolean {
        return this.manageCompaniesAllowed && this.data && this.data['organizationContactInfo']
            && this.data['organizationContactInfo'].isUpdatable;
    }

    @Input() contactGroupId: ContactGroup; 

    private contactInfo: BehaviorSubject<ContactInfoDto> = new BehaviorSubject<ContactInfoDto>(new ContactInfoDto());
    contactInfo$: Observable<ContactInfoDto> = this.contactInfo.asObservable();

    private _personContactInfo: BehaviorSubject<PersonContactInfoDto> = new BehaviorSubject<PersonContactInfoDto>(new PersonContactInfoDto());
    personContactInfo$: Observable<PersonContactInfoDto> = this._personContactInfo.asObservable();
    selectedOrganizationId: ReplaySubject<number> = new ReplaySubject<number>(1);
    selectedOrganizationId$: Observable<number> = this.selectedOrganizationId.asObservable();
    selectedOrganizationInfo$: Observable<PersonOrgRelationShortInfo> = combineLatest(
        this.personContactInfo$,
        this.selectedOrganizationId$
    ).pipe(
        map(([personContactInfo, selectedRelationId]: [PersonContactInfoDto, number]) => {
            return (personContactInfo.orgRelations && personContactInfo.orgRelations.find((orgRelation: PersonOrgRelationShortInfo) => {
                return orgRelation.id === selectedRelationId;
            })) || personContactInfo['personOrgRelationInfo'];
        })
    );
    personJobTitleInSelectedOrganization$: Observable<string> = this.selectedOrganizationInfo$.pipe(
        map((personOrganizationInfo: PersonOrgRelationShortInfo) => personOrganizationInfo && personOrganizationInfo.jobTitle)
    );
    contactId: number;
    leadId: number;

    private readonly CACHE_KEY_PREFIX = 'DetailsHeader';
    private readonly ADD_OPTION_CACHE_KEY = 'add_option_active_index';
    private contactGroups: ContactGroupInfo[];
    showRemovingOrgRelationProgress = false;

    private readonly allContactGroups = _.values(ContactGroup);
    private readonly allContactGroupsExceptUser = this.allContactGroups.filter(v => v != ContactGroup.Employee);

    manageAllowed$: Observable<boolean> = this.contactInfo$.pipe(
        filter(Boolean),
        map((contactInfo: ContactInfoDto) => this.permissionService.checkCGPermission(contactInfo.groups))
    );
    manageAllowed: boolean;
    manageCompaniesAllowed: boolean;
    propertyId$: Observable<number> = this.contactsService.leadInfo$.pipe(
        filter(Boolean),
        map((leadInfo: LeadInfoDto) => leadInfo.propertyId)
    );
    propertyId: number;
    contextMenuInit$: Observable<any>;
    addContextMenuItems: ContextMenuItem[] = [];
    addButtonTitle = '';
    isBankCodeLayout = this.userManagementService.checkBankCodeFeature();
    nameValidationRules = [
        { type: 'required', message: this.ls.l('FullNameIsRequired') },
        { type: 'pattern', pattern: AppConsts.regexPatterns.fullName, message: this.ls.l('FullNameIsNotValid') }
    ];
    companyValidationRules = [
        { type: 'required', message: this.ls.l('CompanyNameIsRequired') }
    ];
    @Input() name: string;
    @Input() companyName: string;
    // @Input() roles: string[] = ['Affiliate', 'Manager', 'Partner'];
    selectedRole: string;

    @Input() contactIds: number[] = []; // List of all contact IDs
    @Input() currentContactId: number;  // Current contact's ID

    constructor(
        injector: Injector,
        private activatedRoute: ActivatedRoute,
        private contactServiceProxy: ContactServiceProxy,
        private personOrgRelationService: PersonOrgRelationServiceProxy,
        private orgContactService: OrganizationContactServiceProxy,
        private userManagementService: UserManagementService,
        private personContactServiceProxy: PersonContactServiceProxy,
        private contactPhotoServiceProxy: ContactPhotoServiceProxy,
        private nameParserService: NameParserService,
        private appService: AppService,
        private cacheService: CacheService,
        private lifeCycleService: LifecycleSubjectsService,
        private cacheHelper: CacheHelper,
        private messageService: MessageService,
        private loadingService: LoadingService,
        private permissionChecker: PermissionCheckerService,
        private profileService: ProfileService,
        private permissionService: AppPermissionService,
        public contactsService: ContactsService,
        public ls: AppLocalizationService,
        public dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.contactsService.leadInfo$.pipe(takeUntil(this.lifeCycleService.destroy$))
            .subscribe((lead: LeadInfoDto) => {
                this.leadId = lead && lead.id;
            });
        this.personContactInfo$.pipe(takeUntil(this.lifeCycleService.destroy$)).subscribe(data => {
            this.initializePersonOrgRelationInfo(data);
        });
        this.contactInfo$.pipe(
            filter(Boolean),
            takeUntil(this.lifeCycleService.destroy$)
        ).subscribe(
            (contactInfo: ContactInfoDto) => {
                this.contactId = contactInfo.id;
                this.contactGroups = contactInfo.groups;
            }
        );
        this.manageAllowed$.pipe(
            takeUntil(this.lifeCycleService.destroy$)
        ).subscribe((manageIsAllowed: boolean) => {
            this.manageAllowed = manageIsAllowed;
            this.manageCompaniesAllowed = this.manageAllowed || 
                this.permissionService.isGranted(AppPermissions.CRMCompaniesManageAll);
        });
        this.propertyId$.pipe(
            takeUntil(this.lifeCycleService.destroy$)
        ).subscribe((propertyId: number) => {
            this.propertyId = propertyId;
        });
        this.contextMenuInit$ = combineLatest(
            this.contactInfo$,
            this.propertyId$,
            this.manageAllowed$
        ).pipe(takeUntil(this.lifeCycleService.destroy$));

        this.contextMenuInit$.subscribe(
            ([contactInfo, propertyId, manageAllowed]: [ContactInfoDto, number, boolean]) => {
                this.addContextMenuItems = this.getDefaultContextMenuItems(manageAllowed, !!propertyId)
                    .filter((menuItem: ContextMenuItem) => {
                        return contactInfo.groups && contactInfo.groups.some(
                            group => menuItem.contactGroups.indexOf(group.groupId) >= 0);
                    });
                this.addOptionsInit();
            }
        );

        /** Set initial selected organization id */
        zip(
            this.contactInfo$.pipe(filter((contact: ContactInfoDto) => !!(contact.primaryOrganizationContactId))),
            this.personContactInfo$.pipe(filter((contact: PersonContactInfoDto) => !!(contact && contact.orgRelations))),
            this.activatedRoute.params
        ).pipe(
            first()
        ).subscribe(([contactInfo, personContactInfo, params]: [ContactInfoDto, PersonContactInfoDto, Params]) => {
            let companyId = isNaN(params['companyId']) ? contactInfo.primaryOrganizationContactId : parseInt(params['companyId']);
            const selectedRelation = personContactInfo.orgRelations.find((orgRelation: PersonOrgRelationShortInfo) => {
                return orgRelation.organization.id === companyId;
            });
            if (selectedRelation && selectedRelation.id) {
                personContactInfo.orgRelationId = selectedRelation.id;
                this.initializePersonOrgRelationInfo(personContactInfo);
                this.selectedOrganizationId.next(selectedRelation.id);
            }
        });

        this.contactInfo$.pipe(
            filter(Boolean),
            takeUntil(this.lifeCycleService.destroy$)
        ).subscribe((contactInfo: ContactInfoDto) => {
            this.name = contactInfo.personContactInfo?.fullName || '';
            this.companyName = contactInfo['organizationContactInfo']?.fullName || '';
            this.currentContactId = contactInfo.id;
        });

        // Get the list of contacts
        this.contactServiceProxy.getSourceContacts('', this.leadId, true, 100)
            .pipe(takeUntil(this.lifeCycleService.destroy$))
            .subscribe((contacts) => {
                this.contactIds = contacts.map(contact => contact.id);
            });
    }

    private getPhotoSrc(data: ContactInfoDto, isCompany?: boolean): Pick<UploadPhotoData, 'source'> {
        let photoBase64;
        if (isCompany && data['organizationContactInfo'].primaryPhoto) {
            photoBase64 = data['organizationContactInfo'].primaryPhoto;
        } else if (!isCompany && data.personContactInfo.primaryPhoto) {
            photoBase64 = data.personContactInfo.primaryPhoto;
        }
        return { source: photoBase64
                    ? 'data:image/jpeg;base64,' + photoBase64
                    : this.profileService.getContactPhotoUrl(null, true, 'large')
               };
    }

    getPhoto(primaryPhoto: string): string {
        return primaryPhoto
            ? 'url(data:image/png;base64,' + this.data.personContactInfo.primaryPhoto + ')'
            : 'url(' + this.profileService.getContactPhotoUrl(null, true, 'large') + ')';
    }

    getDefaultContextMenuItems(manageAllowed: boolean, showAddProperty: boolean): ContextMenuItem[] {
        return [
            {
                type: ContextType.AddFiles,
                text: this.ls.l('AddFiles'),
                selected: false,
                icon: 'files',
                visible: manageAllowed,
                contactGroups: this.allContactGroups
            },
            {
                type: ContextType.AddPropertyFiles,
                text: this.ls.l('AddPropertyFiles'),
                selected: false,
                icon: 'files',
                visible: manageAllowed && showAddProperty,
                contactGroups: this.allContactGroups
            },
            {
                type: ContextType.AddNotes,
                text: this.ls.l('AddNotes'),
                selected: false,
                icon: 'note',
                visible: manageAllowed,
                contactGroups: this.allContactGroups
            },
            {
                type: ContextType.AddContact,
                text: capitalize(this.ls.l('AddSubContact')),
                selected: false,
                icon: 'add-contact',
                visible: !this.data.parentId,
                contactGroups: this.allContactGroupsExceptUser
            },
            {
                type: ContextType.AddInvoice,
                text: this.ls.l('AddInvoice'),
                selected: false,
                icon: 'money',
                visible: !this.data.parentId &&
                    this.permissionChecker.isGranted(AppPermissions.CRMOrdersInvoicesManage),
                contactGroups: this.allContactGroups
            },
            {
                type: ContextType.AddSubscription,
                text: this.ls.l('AddSubscription'),
                selected: false,
                icon: 'product',
                visible: abp.session.tenantId && manageAllowed &&
                    this.permissionChecker.isGranted(AppPermissions.CRMOrdersManage) &&
                    !!this.contactsService.getFeatureCount(AppFeatures.CRMMaxProductCount) &&
                    abp.features.isEnabled(AppFeatures.CRMSubscriptionManagementSystem),
                contactGroups: this.allContactGroups
            }
        ];
    }

    initializePersonOrgRelationInfo(personContactInfo?: PersonContactInfoDto): PersonContactInfoDto {
        personContactInfo = personContactInfo || this.personContactInfo;
        if (personContactInfo && personContactInfo.orgRelations) {
            let orgRelation = personContactInfo['personOrgRelationInfo'];
            if (!orgRelation || orgRelation.id != personContactInfo.orgRelationId)
                personContactInfo['personOrgRelationInfo'] =
                    personContactInfo.orgRelations.find(orgRelation => orgRelation.id === personContactInfo.orgRelationId);
        }
        return personContactInfo;
    }

    updateJobTitle(value) {
        let orgRelationInfo = this.personContactInfo['personOrgRelationInfo'];
        orgRelationInfo.jobTitle = value;
        this.loadingService.startLoading();
        this.personOrgRelationService.update(UpdatePersonOrgRelationInput.fromJS({
            id: orgRelationInfo.id,
            relationshipType: orgRelationInfo.relationType.id,
            jobTitle: orgRelationInfo.jobTitle
        })).pipe(finalize(() => this.loadingService.finishLoading())).subscribe(() => {
            this.personContactInfo.jobTitle = value;
            this._personContactInfo.next(this.personContactInfo);
        }, () => {
            orgRelationInfo.jobTitle = this.personContactInfo.jobTitle;
        });
    }

    removePersonOrgRelation(event) {
        let companyName = this.data['organizationContactInfo'].fullName;
        this.messageService.confirm(
            this.ls.l('ContactRelationRemovalConfirmationMessage', companyName), '',
            (result: boolean) => {
                if (result) {
                    let orgRelationId = this.personContactInfo['personOrgRelationInfo'].id;
                    this.showRemovingOrgRelationProgress = true;
                    this.personOrgRelationService.delete(orgRelationId)
                        .pipe(finalize(() => this.showRemovingOrgRelationProgress = false))
                        .subscribe(() => {
                            let orgRelations = this.data.personContactInfo.orgRelations;
                            let orgRelationToDelete = _.find(orgRelations, orgRelation => orgRelation.id === orgRelationId);
                            if (this.data.primaryOrganizationContactId == orgRelationToDelete.organization.id) {
                                this.data['organizationContactInfo'] = undefined;
                                this.data.primaryOrganizationContactId = orgRelations.length ?
                                    orgRelations.reverse()[0].organization.id : undefined;
                            }
                            orgRelations.splice(orgRelations.indexOf(orgRelationToDelete), 1);
                            this.displayOrgRelation(orgRelationToDelete.organization.id);
                            this.contactsService.invalidateUserData();
                        });
                }
            }
        );
        event && event.stopPropagation();
    }

    showCompanyDialog(e) {
        let companyInfo = this.data['organizationContactInfo'];
        if (!companyInfo || !companyInfo.id)
            return this.addCompanyDialog(e);

        this.dialog.closeAll();
        this.dialog.open(CompanyDialogComponent, {
            data: {
                company: companyInfo,
                contactInfo: this.data,
                invalidate: this.onInvalidate
            },
            panelClass: 'slider',
            maxWidth: '830px'
        }).afterClosed().subscribe(result => {
            if (result) {
                 companyInfo.organization = new OrganizationInfoDto(result.company);
                 companyInfo.fullName = result.company.fullName;
                 companyInfo.primaryPhoto = result.company.primaryPhoto;
            }
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    displayOrgRelation(orgId) {
        let orgRelations = this.data.personContactInfo.orgRelations;
        if (this.data.primaryOrganizationContactId == orgId) {
            let orgRelation = orgRelations && _.sortBy(orgRelations, (orgRelation) => {
                return orgRelation.id;
            }).reverse()[0];
            if (orgRelation) {
                orgRelation.isPrimary = true;
                this.data.primaryOrganizationContactId = orgRelation.organization.id;
                this.displaySelectedCompany(orgRelation.organization.id, orgRelation.id);
            } else {
                this.data.primaryOrganizationContactId = null;
                this.data.personContactInfo.orgRelations = [];
                this.contactsService.updateLocation(this.data.id, this.leadId);
            }
        } else {
            let orgRelation = _.find(orgRelations, item => item.isPrimary) || orgRelations[0];
            if (orgRelation && orgRelation.organization)
                this.displaySelectedCompany(orgRelation.organization.id, orgRelation.id);
        }
    }

    showUploadPhotoDialog(event, isCompany?: boolean) {
        if (!this.manageAllowed)
            return false;

        if (isCompany) {
            let companyInfo = this.data['organizationContactInfo'];
            if (!companyInfo || !companyInfo.id)
                return;
        }

        this.dialog.closeAll();
        let data: UploadPhotoData = {
            title: this.ls.l('ChangeContactPhoto'),
            ...this.getPhotoSrc(this.data, isCompany),
            maxSizeBytes: AppConsts.maxImageSize
        };
        this.dialog.open(UploadPhotoDialogComponent, {
            data: data,
            maxWidth: AppConsts.maxImageDialogWidth,
            hasBackdrop: true
        }).afterClosed()
            .pipe(filter(Boolean))
            .subscribe((result: UploadPhotoResult) => {
                let dataField = (isCompany ? 'primaryOrganization' : 'person') + 'ContactInfo';
                if (result.clearPhoto) {
                    this.contactPhotoServiceProxy.clearContactPhoto(this.data[dataField].id)
                        .subscribe(() => {
                            this.handlePhotoChange(dataField, null, null);
                        });
                } else {
                    let base64OrigImage = StringHelper.getBase64(result.origImage);
                    let base64ThumbImage = StringHelper.getBase64(result.thumbImage);
                    this.contactPhotoServiceProxy.createContactPhoto(
                        CreateContactPhotoInput.fromJS({
                            contactId: this.data[dataField].id,
                            original: base64OrigImage,
                            thumbnail: base64ThumbImage,
                            source: result.source
                        })).subscribe((result: string) => {
                            this.handlePhotoChange(dataField, base64OrigImage, result);
                        });
                }
        });
        event.stopPropagation();
    }

    private handlePhotoChange(dataField: string, photo: string, thumbnailId: string) {
        this.data[dataField].primaryPhoto = photo;
        if (this.data[dataField].userId == abp.session.userId)
            abp.event.trigger('profilePictureChanged', thumbnailId);
    }

    showEditPersonDialog(event) {
        this.dialog.closeAll();
        this.dialog.open(PersonDialogComponent, {
            data: this.data,
            position: DialogService.calculateDialogPosition(
                event, event.target.closest('div'), 200, -12)
        });
        event.stopPropagation();
    }

    showPersonHistory(event) {
        event.stopPropagation();
        this.dialog.open(PersonHistoryDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                contactId: this.data.id
            }
        }).afterClosed().subscribe(() => {
        });
    }

    updateCompanyField(value, field = 'companyName') {
        let data = this.data['organizationContactInfo'];
        data.organization[field] = value;
        this.orgContactService.updateOrganizationInfo(
            UpdateOrganizationInfoInput.fromJS(_.extend({id: data.id}, data.organization))
        ).subscribe(() => {
            data.fullName = value;
            this.contactsService.invalidateUserData();
        });
    }

    updatePrimaryContactName(value) {
        value = value.trim();
        if (!value)
            return;
        let person = this.data.personContactInfo.person;
        this.nameParserService.parseIntoPerson(value, person);
        this.personContactServiceProxy.updatePersonName(
            UpdatePersonNameInput.fromJS(_.extend({ id: person.contactId}, person))
        ).subscribe(() => {
            this.data.personContactInfo.fullName = value;
        });
    }

    get addOptionCacheKey() {
        return this.ADD_OPTION_CACHE_KEY + '_' + this.data.groups.map(group => group.groupId).join('_');
    }

    addOptionsInit() {
        if (this.addContextMenuItems.length) {
            let cacheKey = this.cacheHelper.getCacheKey(this.addOptionCacheKey, this.CACHE_KEY_PREFIX),
                selectedMenuItem = this.getContextMenuItemByType(
                    this.cacheService.exists(cacheKey) ? this.cacheService.get(cacheKey) : this.ADD_OPTION_DEFAULT
                );
            if (!selectedMenuItem || !selectedMenuItem.visible)
                selectedMenuItem = this.getContextMenuItemByType(this.ADD_OPTION_DEFAULT);

            selectedMenuItem.selected = true;
            this.addButtonTitle = selectedMenuItem.text;
        }
    }

    updateSaveOption(option: ContextMenuItem) {
        if (option && option.visible) {
            this.addButtonTitle = option.text;
            option.selected = true;
            this.addContextComponent.instance.option('selectedItem', option);
            this.cacheService.set(
                this.cacheHelper.getCacheKey(this.addOptionCacheKey, this.CACHE_KEY_PREFIX),
                option.type.toString()
            );
        }
    }

    addOptionSelectionChanged(event) {
        const option: ContextMenuItem = event.addedItems.pop() || event.removedItems.pop() ||
            this.getContextMenuItemByType(this.ADD_OPTION_DEFAULT);
        this.updateSaveOption(option);
        this.addEntity();
    }

    addEntity(event?) {
        if (event && event.offsetX > event.target.offsetWidth - 32)
            return this.addContextComponent.instance.option('visible', true);

        const selectedMenuItem = this.addContextMenuItems.find((contextMenuItem: ContextMenuItem) => {
            return contextMenuItem.selected === true;
        });
        if (selectedMenuItem.type === ContextType.AddContact)
            setTimeout(() => {
                const dialogData: CreateEntityDialogData = {
                    parentId: this.data.id,
                    customerType: this.contactGroupId
                };
                this.dialog.open(CreateEntityDialogComponent, {
                    panelClass: 'slider',
                    disableClose: true,
                    closeOnNavigation: false,
                    data: dialogData
                }).afterClosed().subscribe(() => {
                    this.onInvalidate.emit();
                });
            });
        else if (selectedMenuItem.type === ContextType.AddFiles)
            setTimeout(() => {
                this.contactsService.showUploadDocumentsDialog(
                    this.data.id
                );
            });
        else if (selectedMenuItem.type === ContextType.AddPropertyFiles)
            setTimeout(() => {
                this.contactsService.showUploadDocumentsDialog(
                    this.propertyId,
                    this.ls.l('UploadPropertyDocumentsDialogTitle')
                );
            });
        else if (selectedMenuItem.type === ContextType.AddNotes)
            setTimeout(() => {
                const noteAddDialogData: NoteAddDialogData = {
                    contactInfo: this.data,
                    propertyId: this.propertyId,
                    contactsService: this.contactsService
                };
                this.dialog.open(NoteAddDialogComponent, {
                    panelClass: 'slider',
                    hasBackdrop: false,
                    closeOnNavigation: true,
                    data: noteAddDialogData
                }).componentInstance.onSaved.subscribe(() => {
                    this.contactsService.invalidate('notes');
                });
            });
        else if (selectedMenuItem.type === ContextType.AddInvoice)
            setTimeout(() => {
                this.dialog.open(CreateInvoiceDialogComponent, {
                    panelClass: 'slider',
                    disableClose: true,
                    closeOnNavigation: false,
                    data: {
                        contactInfo: this.data,
                        refreshParent: () => {
                            this.contactsService.invalidate('invoices');
                        }
                    }
                });
            });
        else if (selectedMenuItem.type === ContextType.AddSubscription) {
            let leadId = this.activatedRoute.parent.snapshot.paramMap.get('leadId') ?
                this.leadId :
                null;

            this.dialog.open(AddSubscriptionDialogComponent, {
                panelClass: ['slider'],
                hasBackdrop: false,
                closeOnNavigation: false,
                disableClose: true,
                data: { contactId: this.data.id, leadId: leadId }
            });

        }
    }

    private getContextMenuItemByType(contextType: ContextType): ContextMenuItem {
        return this.addContextMenuItems.find((contextMenuItem: ContextMenuItem) => {
            return contextMenuItem.type == contextType;
        });
    }

    addCompanyDialog(event) {
        if (this.manageAllowed)
            this.contactsService.addCompanyDialog(event, this.data).pipe(
                switchMap(() => this.personContactInfo$),
                first()
            ).subscribe((personContactInfo: PersonContactInfoDto) => {
                this.selectedOrganizationId.next(personContactInfo.orgRelationId);
            });
    }

    addCompanyLogo(event) {
        if (this.isOrgUpdatable) {
            const organizationContactInfo: OrganizationContactInfoDto = this.data['organizationContactInfo'];
            this.contactsService.showUploadPhotoDialog(
                organizationContactInfo.id,
                organizationContactInfo.primaryPhoto,
                event, false
            ).subscribe((logo: string) => {
                organizationContactInfo.primaryPhoto = logo;
            });
        }
    }

    showCompanyList(event) {
        this.dialog.closeAll();
        this.dialog.open(RelationCompaniesDialogComponent, {
            data: this.data,
            hasBackdrop: false,
            position: DialogService.calculateDialogPosition(event, event.target)
        }).afterClosed().subscribe(result => {
            if (result == 'addContact')
                this.addCompanyDialog(event);
            else if (result)
                this.displaySelectedCompany(result.id, result.relation.id);
        });
        event.stopPropagation();
    }

    displaySelectedCompany(orgId: number, orgRelationId: number) {
        this.personContactInfo.orgRelationId = orgRelationId;
        this.initializePersonOrgRelationInfo();
        this.loadingService.startLoading();
        this.orgContactService.getOrganizationContactInfo(orgId)
            .pipe(finalize(() => this.loadingService.finishLoading()))
            .subscribe((result: OrganizationContactInfoDto) => {
                this.data['organizationContactInfo'] = result;
                this.selectedOrganizationId.next(orgRelationId);
                this.contactsService.updateLocation(this.data.id, this.leadId, result && result.id);
            });
    }

    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }

    refresh() {
        this.onInvalidate.emit();
    }

    trim(value: string): string {
        return (value || '').trim();
    }

    goToPrevClient() {
        if (!this.contactIds || !this.currentContactId) return;
        const idx = this.contactIds.indexOf(this.currentContactId);
        if (idx > 0) {
            const prevId = this.contactIds[idx - 1];
            this.contactsService.updateLocation(prevId);
        }
    }

    goToNextClient() {
        if (!this.contactIds || !this.currentContactId) return;
        const idx = this.contactIds.indexOf(this.currentContactId);
        if (idx < this.contactIds.length - 1 && idx !== -1) {
            const nextId = this.contactIds[idx + 1];
            this.contactsService.updateLocation(nextId);
        }
    }

    onRoleDropdown() {
        // Open your role selection dropdown logic here
    }

    onClose() {
        // Implement close logic (e.g., navigate away or emit an event)Add commentMore actions
    }
}
