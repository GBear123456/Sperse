/** Core imports */
import {
    Component,
    OnInit,
    Injector,
    Input,
    Output,
    ViewChild,
    EventEmitter,
    OnDestroy
} from '@angular/core';

/** Third party import */
import { MatDialog } from '@angular/material/dialog';
import { CacheService } from 'ng2-cache-service';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import * as _ from 'underscore';
import { BehaviorSubject } from 'rxjs';
import { filter, finalize, takeUntil } from 'rxjs/operators';
import startCase from 'lodash/startCase';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { PersonDialogComponent } from './person-dialog/person-dialog.component';
import { CreateClientDialogComponent } from '../shared/create-client-dialog/create-client-dialog.component';
import { UploadDocumentsDialogComponent } from './documents/upload-documents-dialog/upload-documents-dialog.component';
import { RelationCompaniesDialogComponent } from './relation-companies-dialog/relation-companies-dialog.component';
import { CreateInvoiceDialogComponent } from '@app/crm/shared/create-invoice-dialog/create-invoice-dialog.component';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import {
    ContactInfoDto,
    PersonContactInfoDto,
    ContactPhotoServiceProxy,
    CreateContactPhotoInput,
    OrganizationInfoDto,
    OrganizationContactServiceProxy,
    PersonContactServiceProxy,
    PersonOrgRelationServiceProxy,
    PersonOrgRelationShortInfo,
    UpdatePersonOrgRelationInput,
    UpdateOrganizationInfoInput,
    UpdatePersonInfoInput
} from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { NoteAddDialogComponent } from './notes/note-add-dialog/note-add-dialog.component';
import { AppService } from '@app/app.service';
import { StringHelper } from '@shared/helpers/StringHelper';
import { ContactGroup, ContactStatus } from '@shared/AppEnums';
import { CompanyDialogComponent } from '@app/crm/contacts/company-dialog/company-dialog.component';
import { ContactsService } from './contacts.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    selector: 'details-header',
    templateUrl: './details-header.component.html',
    styleUrls: ['./details-header.component.less'],
    providers: [ AppService, ContactPhotoServiceProxy, LifecycleSubjectsService ]
})
export class DetailsHeaderComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxContextMenuComponent) addContextComponent: DxContextMenuComponent;

    @Input()
    public set data(data: ContactInfoDto) {
        this._contactInfoBehaviorSubject.next(data);
    }
    public get data(): ContactInfoDto {
        return this._contactInfoBehaviorSubject.getValue();
    }

    @Input()
    public set personContactInfo(data: PersonContactInfoDto) {
        this._personContactInfoBehaviorSubject.next(data);
    }
    public get personContactInfo(): PersonContactInfoDto {
        return this._personContactInfoBehaviorSubject.getValue();
    }

    @Input() ratingId: number;

    @Output() onContactSelected: EventEmitter<any> = new EventEmitter();
    @Output() onInvalidate: EventEmitter<any> = new EventEmitter();

    private _contactInfoBehaviorSubject = new BehaviorSubject<ContactInfoDto>(ContactInfoDto.fromJS({}));
    private _personContactInfoBehaviorSubject = new BehaviorSubject<PersonContactInfoDto>(PersonContactInfoDto.fromJS({}));
    private readonly ADD_FILES_OPTION   = 0;
    private readonly ADD_NOTES_OPTION   = 1;
    private readonly ADD_CONTACT_OPTION = 2;
    private readonly ADD_INVOICE_OPTION = 3;
    private readonly ADD_OPTION_DEFAULT = this.ADD_FILES_OPTION;
    private readonly ADD_OPTION_CACHE_KEY = 'add_option_active_index';

    groupNames = _.mapObject(_.invert(ContactGroup), (val) => startCase(val));
    statusNames = _.invert(ContactStatus);

    isAdminModule;
    defaultContextMenuItems = [
        {
            text: this.l('AddFiles'),
            selected: false,
            icon: 'files',
            contactGroups: [ ContactGroup.Client, ContactGroup.Partner, ContactGroup.UserProfile ]
        },
        {
            text: this.l('AddNotes'),
            selected: false,
            icon: 'note',
            contactGroups: [ ContactGroup.Client, ContactGroup.Partner, ContactGroup.UserProfile ]
        },
        {
            text: this.l('AddContact'),
            selected: false,
            icon: 'add-contact',
            contactGroups: [ ContactGroup.Client, ContactGroup.Partner ]
        },
        {
            text: this.l('AddInvoice'),
            selected: false,
            icon: 'money',
            contactGroups: [ ContactGroup.Client, ContactGroup.Partner ]
        }
    ];
    addContextMenuItems = [];
    addButtonTitle = '';

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _contactsService: ContactsService,
        private _personOrgRelationService: PersonOrgRelationServiceProxy,
        private _orgContactService: OrganizationContactServiceProxy,
        private personContactServiceProxy: PersonContactServiceProxy,
        private contactPhotoServiceProxy: ContactPhotoServiceProxy,
        private nameParserService: NameParserService,
        private appService: AppService,
        private dialogService: DialogService,
        private _cacheService: CacheService,
        private lifeCycleService: LifecycleSubjectsService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.isAdminModule = (appService.getModule() == appService.getDefaultModule());
    }

    ngOnInit(): void {
        this._personContactInfoBehaviorSubject.subscribe(data => {
            this.initializePersonOrgRelationInfo(data);
        });
        this._contactInfoBehaviorSubject
            .pipe(filter(Boolean), takeUntil(this.lifeCycleService.destroy$))
            .subscribe(
                contactInfo => {
                    this.addContextMenuItems = this.defaultContextMenuItems.filter(menuItem => menuItem.contactGroups.indexOf(contactInfo.groupId) >= 0);
                    this.addOptionsInit();
                }
            );
    }

    initializePersonOrgRelationInfo(data?) {
        data = data || this.personContactInfo;
        if (data && data.orgRelations)
            data['personOrgRelationInfo'] = PersonOrgRelationShortInfo.fromJS(
                _.find(data.orgRelations, orgRelation => orgRelation.id === data.orgRelationId)
            );
    }

    updateJobTitle(value) {
        let orgRelationInfo = this.personContactInfo['personOrgRelationInfo'];
        orgRelationInfo.jobTitle = value;
        this._personOrgRelationService.update(UpdatePersonOrgRelationInput.fromJS({
            id: orgRelationInfo.id,
            relationshipType: orgRelationInfo.relationType.id,
            jobTitle: orgRelationInfo.jobTitle
        })).subscribe(() => {});
    }

    removePersonOrgRelation(event) {
        let companyName = this.data['organizationContactInfo'].fullName;
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: this.l('ContactRelationRemovalConfirmationTitle'),
                message: this.l('ContactRelationRemovalConfirmationMessage', companyName),
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.dialog.closeAll();
                let orgRelationId = this.personContactInfo['personOrgRelationInfo'].id;
                this._personOrgRelationService.delete(orgRelationId).subscribe(() => {
                    let orgRelations = this.data.personContactInfo.orgRelations;
                    let orgRelationToDelete = _.find(orgRelations, orgRelation => orgRelation.id === orgRelationId);
                    orgRelations.splice(orgRelations.indexOf(orgRelationToDelete), 1);
                    this.displayOrgRelation(orgRelationToDelete.organization.id);
                });
            }
        });
        event.stopPropagation();
    }

    showCompanyDialog(e) {
        let companyInfo = this.data['organizationContactInfo'];
        if (!companyInfo || !companyInfo.id)
            return this.addCompanyDialog(e);

        this.dialog.closeAll();
        this.dialog.open(CompanyDialogComponent, {
            data: {
                company: companyInfo,
                contactInfo: this.data
            },
            panelClass: 'slider',
            maxWidth: '830px'
        }).afterClosed().subscribe(result => {
            if (result && result.action == 'delete') {
                let orgId = result.orgId;
                let orgRelations = this.data.personContactInfo.orgRelations;
                let orgRelationsToDelete = _.filter(orgRelations, orgRelation => orgRelation.organization.id === orgId);
                orgRelationsToDelete.forEach((orgRelation) => orgRelations.splice(orgRelations.indexOf(orgRelation), 1));
                this.displayOrgRelation(orgId);
            } else if (result) {
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
                let isPartner = this.data.groupId == ContactGroup.Partner;
                this._contactsService.updateLocation(
                    isPartner ? null : this.data.id, this.data['leadId'],
                    isPartner ? this.data.id : null);
            }
        } else {
            let orgRelation = _.find(orgRelations, item => item.isPrimary);
            this.displaySelectedCompany(orgRelation.organization.id, orgRelation.id);
        }
    }

    showUploadPhotoDialog(event, isCompany?: boolean) {
        if (isCompany) {
            let companyInfo = this.data['organizationContactInfo'];
            if (!companyInfo || !companyInfo.id)
                return;
        }

        this.dialog.closeAll();
        let data = { ...this.data, ...this.getPhotoSrc(this.data, isCompany) };
        this.dialog.open(UploadPhotoDialogComponent, {
            data: data,
            hasBackdrop: true
        }).afterClosed()
            .pipe(filter(result => result))
            .subscribe(result => {
                let dataField = (isCompany ? 'primaryOrganization' : 'person') + 'ContactInfo';

                if (result.clearPhoto) {
                    this.contactPhotoServiceProxy.clearContactPhoto(this.data[dataField].id)
                        .subscribe(() => {
                            this.handlePhotoChange(dataField, null, null);
                        });
                } else {
                    let base64OrigImage = StringHelper.getBase64(result.origImage);
                    let base64ThumbImage = StringHelper.getBase64(result.thumImage);

                    this.contactPhotoServiceProxy.createContactPhoto(
                        CreateContactPhotoInput.fromJS({
                            contactId: this.data[dataField].id,
                            original: base64OrigImage,
                            thumbnail: base64ThumbImage,
                            source: result.source
                        })).subscribe((result) => {
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

    private getPhotoSrc(data: ContactInfoDto, isCompany?: boolean): { source?: string } {
        let photoBase64;
        if (isCompany && data['organizationContactInfo'].primaryPhoto) {
            photoBase64 = data['organizationContactInfo'].primaryPhoto;
        } else if (!isCompany && data.personContactInfo.primaryPhoto) {
            photoBase64 = data.personContactInfo.primaryPhoto;
        }
        return photoBase64 ? { source: 'data:image/jpeg;base64,' + photoBase64 } : {};
    }

    getNameInplaceEditData(field = 'personContactInfo') {
        let contactInfo = this.data && this.data[field];
        if (contactInfo)
            return {
                id: contactInfo.id,
                value: (contactInfo.fullName || '').trim(),
                validationRules: [
                    {type: 'required', message: this.l('FullNameIsRequired')},
                    {type: 'pattern', pattern: AppConsts.regexPatterns.fullName, message: this.l('FullNameIsNotValid')}
                ],
                isEditDialogEnabled: true,
                lEntityName: 'Name',
                lEditPlaceholder: this.l('ClientNamePlaceholder')
            };
    }

    getJobTitleInplaceEditData() {
        let orgRelationInfo = this.personContactInfo
            && this.personContactInfo['personOrgRelationInfo'];
        if (orgRelationInfo)
            return {
                id: orgRelationInfo.id,
                value: (orgRelationInfo.jobTitle || '').trim(),
                lEntityName: 'JobTitle',
                lEditPlaceholder: this.l('JobTitle')
            };
    }

    showEditPersonDialog(event) {
        this.dialog.closeAll();
        this.dialog.open(PersonDialogComponent, {
            data: this.data.personContactInfo,
            hasBackdrop: false,
            position: this.dialogService.calculateDialogPosition(
                event, event.target.closest('div'), 200, -12)
        });
        event.stopPropagation();
    }

    updateCompanyField(value, field = 'companyName') {
        let data = this.data['organizationContactInfo'];
        data.organization[field] = value;
        this._orgContactService.updateOrganizationInfo(
            UpdateOrganizationInfoInput.fromJS(
                _.extend({id: data.id}, data.organization))
        ).subscribe(() => {
            data.fullName = value;
        });
    }

    updatePrimaryContactName(value) {
        value = value.trim();
        if (!value)
            return;

        this.data.personContactInfo.fullName = value;

        let person = this.data.personContactInfo.person;
        this.nameParserService.parseIntoPerson(value, person);

        this.personContactServiceProxy.updatePersonInfo(
            UpdatePersonInfoInput.fromJS(
                _.extend({id:  person.contactId},  person))
        ).subscribe(() => {});
    }

    addOptionsInit() {
        let cacheKey = this.getCacheKey(this.ADD_OPTION_CACHE_KEY),
            selectedIndex = this.ADD_OPTION_DEFAULT;
        if (this._cacheService.exists(cacheKey))
            selectedIndex = this._cacheService.get(cacheKey);
        this.addContextMenuItems[selectedIndex].selected = true;
        this.addButtonTitle = this.addContextMenuItems[selectedIndex].text;
    }

    updateSaveOption(option) {
        this.addButtonTitle = option.text;
        this._cacheService.set(this.getCacheKey(this.ADD_OPTION_CACHE_KEY),
            this.addContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
    }

    addOptionSelectionChanged(event) {
        let option = event.addedItems.pop() || event.removedItems.pop() ||
            this.addContextMenuItems[this.ADD_OPTION_DEFAULT];
        option.selected = true;
        event.component.option('selectedItem', option);

        this.updateSaveOption(option);

        this.addEntity();
    }

    addEntity(event?) {
        if (event && event.offsetX > event.target.offsetWidth - 32)
            return this.addContextComponent
                .instance.option('visible', true);

        if (this.addContextMenuItems[this.ADD_CONTACT_OPTION] && this.addContextMenuItems[this.ADD_CONTACT_OPTION].selected)
            setTimeout(() => {
                this.dialog.open(CreateClientDialogComponent, {
                    panelClass: 'slider',
                    disableClose: true,
                    closeOnNavigation: false,
                    data: {
                        refreshParent: () => {},
                        customerType: ContactGroup.Client
                    }
                });
            });
        else if (this.addContextMenuItems[this.ADD_FILES_OPTION] && this.addContextMenuItems[this.ADD_FILES_OPTION].selected)
            setTimeout(() => {
                this.dialog.open(UploadDocumentsDialogComponent, {
                    panelClass: 'slider',
                    disableClose: false,
                    hasBackdrop: false,
                    closeOnNavigation: true,
                    data: {
                        contactId: this.data.id
                    }
                });
            });
        else if (this.addContextMenuItems[this.ADD_NOTES_OPTION] && this.addContextMenuItems[this.ADD_NOTES_OPTION].selected)
            setTimeout(() => {
                this.dialog.open(NoteAddDialogComponent, {
                    panelClass: 'slider',
                    disableClose: false,
                    hasBackdrop: false,
                    closeOnNavigation: true,
                    data: {
                        contactInfo: this.data,
                    }
                });
            });
        else if (this.addContextMenuItems[this.ADD_INVOICE_OPTION] && this.addContextMenuItems[this.ADD_INVOICE_OPTION].selected)
            setTimeout(() => {
                this.dialog.open(CreateInvoiceDialogComponent, {
                    panelClass: 'slider',
                    disableClose: true,
                    closeOnNavigation: false,
                    data: { }
                });
            });
    }

    addCompanyDialog(event) {
        this._contactsService.addCompanyDialog(event, this.data).subscribe(result => {});
    }

    showCompanyList(event) {
        this.dialog.closeAll();
        this.dialog.open(RelationCompaniesDialogComponent, {
            data: this.data,
            hasBackdrop: false,
            position: this.dialogService.calculateDialogPosition(event, event.target)
        }).afterClosed().subscribe(result => {
            if (result == 'addContact')
                this.addCompanyDialog(event);
            else if (result)
                this.displaySelectedCompany(result.id, result.relation.id);
        });
        event.stopPropagation();
    }

    displaySelectedCompany(orgId, orgRelationId) {
        this.startLoading(true);
        this.personContactInfo.orgRelationId = orgRelationId;
        this.initializePersonOrgRelationInfo();
        this._orgContactService.getOrganizationContactInfo(orgId)
            .pipe(finalize(() => this.finishLoading(true))).subscribe((result) => {
                let isPartner = this.data.groupId == ContactGroup.Partner;
                this.data['organizationContactInfo'] = result;
                this._contactsService.updateLocation(
                    isPartner ? null : this.data.id, this.data['leadId'],
                    isPartner ? this.data.id : null, result && result.id);
            });
    }


    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }

    refresh(event) {
        this.onInvalidate.emit(event);
    }
}
