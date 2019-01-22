/** Core imports */
import { Component, OnInit, Injector, Input, Output, ViewChild, EventEmitter } from '@angular/core';

/** Third party import */
import { MatDialog } from '@angular/material/dialog';
import { CacheService } from 'ng2-cache-service';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import * as _ from 'underscore';
import { BehaviorSubject } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { PersonDialogComponent } from './person-dialog/person-dialog.component';
import { CreateClientDialogComponent } from '../shared/create-client-dialog/create-client-dialog.component';
import { UploadDocumentsDialogComponent } from './documents/upload-documents-dialog/upload-documents-dialog.component';
import { RelationCompaniesDialogComponent } from './relation-companies-dialog/relation-companies-dialog.component';
import {
    ContactPhotoDto,
    ContactInfoDto,
    PersonContactInfoDto,
    ContactPhotoServiceProxy,
    CreateContactPhotoInput,
    OrganizationInfoDto,
    OrganizationContactServiceProxy,
    PersonContactServiceProxy,
    PersonOrgRelationServiceProxy,
    UpdatePersonOrgRelationInput,
    UpdateOrganizationInfoInput,
    UpdatePersonInfoInput
} from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { NoteAddDialogComponent } from './notes/note-add-dialog/note-add-dialog.component';
import { AppService } from '@app/app.service';
import { StringHelper } from '@shared/helpers/StringHelper';
import { ContactGroup } from '@shared/AppEnums';
import { CompanyDialogComponent } from '@app/crm/contacts/company-dialog/company-dialog.component';
import { ContactsService } from './contacts.service';

@Component({
    selector: 'details-header',
    templateUrl: './details-header.component.html',
    styleUrls: ['./details-header.component.less'],
    providers: [ AppService, ContactPhotoServiceProxy ]
})
export class DetailsHeaderComponent extends AppComponentBase implements OnInit {
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

    @Input() ratingId: number;

    @Output() onContactSelected: EventEmitter<any> = new EventEmitter();
    @Output() onInvalidate: EventEmitter<any> = new EventEmitter();

    private _contactInfoBehaviorSubject = new BehaviorSubject<ContactInfoDto>(ContactInfoDto.fromJS({}));
    private _personContactInfoBehaviorSubject = new BehaviorSubject<PersonContactInfoDto>(PersonContactInfoDto.fromJS({}));
    private readonly ADD_FILES_OPTION   = 0;
    private readonly ADD_NOTES_OPTION   = 1;
    private readonly ADD_CONTACT_OPTION = 2;
    private readonly ADD_OPTION_DEFAULT = this.ADD_FILES_OPTION;
    private readonly ADD_OPTION_CACHE_KEY = 'add_option_active_index';

    isAdminModule;
    addContextMenuItems = [];
    addButtonTitle = '';
    personOrgRelationInfo: any = {};

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
        private _cacheService: CacheService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.isAdminModule = (appService.getModule() == appService.getDefaultModule());
        this.appService.localizationSourceName = this.localizationSourceName;

        this.addContextMenuItems = [
            {text: this.l('AddFiles'), selected: false, icon: 'files'},
            {text: this.l('AddNotes'), selected: false, icon: 'note'},
            {text: this.l('AddContact'), selected: false, icon: 'add-contact'}
        ];
        this.addOptionsInit();
    }

    ngOnInit(): void {
        this.initializePersonOrgRelationInfo();
    }

    initializePersonOrgRelationInfo() {
        this._personContactInfoBehaviorSubject.subscribe(data => {
            if (data && data.orgRelations) {
                this.personOrgRelationInfo = _.find(data.orgRelations, orgRelation => orgRelation.id === data.orgRelationId);
            }
        });
    }

    updateJobTitle(value) {
        this.personOrgRelationInfo.jobTitle = value;
        this._personOrgRelationService.update(UpdatePersonOrgRelationInput.fromJS({
            id: this.personOrgRelationInfo.id,
            relationshipType: this.personOrgRelationInfo.relationType.id,
            jobTitle: this.personOrgRelationInfo.jobTitle
        })).subscribe(() => {});
    }

    showCompanyDialog(e) {
        this.dialog.closeAll();
        this.dialog.open(CompanyDialogComponent, {
            data: {
                company: this.data['organizationContactInfo']
            },
            panelClass: 'slider',
            maxWidth: '830px'
        }).afterClosed().subscribe(result => {
            if (result) {
                 this.data['organizationContactInfo'].organization = new OrganizationInfoDto(result.company);
                 this.data['organizationContactInfo'].fullName = result.company.fullName;
                 this.data['organizationContactInfo'].primaryPhoto = result.company.primaryPhoto;
            }
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    showUploadPhotoDialog(event, isCompany?: boolean) {
        if (isCompany) {
            let companyInfo = this.data['organizationContactInfo'];
            if (!companyInfo || !companyInfo.id)
                return ;
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
                }
                else {
                    let base64OrigImage = StringHelper.getBase64(result.origImage);
                    let base64ThumbImage = StringHelper.getBase64(result.thumImage);

                    this.contactPhotoServiceProxy.createContactPhoto(
                        CreateContactPhotoInput.fromJS({
                            contactId: this.data[dataField].id,
                            originalImage: base64OrigImage,
                            thumbnail: base64ThumbImage
                        })).subscribe((result) => {
                            let primaryPhoto = base64OrigImage
                                ? ContactPhotoDto.fromJS({
                                    original: base64OrigImage,
                                    thumbnail: base64ThumbImage
                                }) :
                                undefined;

                            this.handlePhotoChange(dataField, primaryPhoto, result)
                        });
                }
        });
        event.stopPropagation();
    }

    private handlePhotoChange(dataField: string, photo: ContactPhotoDto, thumbnailId: string) {
        this.data[dataField].primaryPhoto = photo;

        if (this.data[dataField].userId == abp.session.userId)
            abp.event.trigger('profilePictureChanged', thumbnailId);
    }

    private getPhotoSrc(data: ContactInfoDto, isCompany?: boolean): { source?: string } {
        let photoBase64;
        if (isCompany && data['organizationContactInfo'].primaryPhoto) {
            photoBase64 = data['organizationContactInfo'].primaryPhoto.original;
        } else if (!isCompany && data.personContactInfo.primaryPhoto) {
            photoBase64 = data.personContactInfo.primaryPhoto.original;
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
        if (this.personOrgRelationInfo)
            return {
                id: this.personOrgRelationInfo.id,
                value: (this.personOrgRelationInfo.jobTitle || '').trim(),
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
        if (event && event.offsetX > 155)
            return this.addContextComponent
                .instance.option('visible', true);

        if (this.addContextMenuItems[this.ADD_CONTACT_OPTION].selected)
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
        else if (this.addContextMenuItems[this.ADD_FILES_OPTION].selected)
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
        else if (this.addContextMenuItems[this.ADD_NOTES_OPTION].selected)
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
    }

    addCompanyDialog(event) {
        this._contactsService.addCompanyDialog(event, this.data).subscribe(result => {
            if (result)
                this.onInvalidate.emit();
        });
    }

    showCompanyList(event) { 
        this.dialog.closeAll();
        this.dialog.open(RelationCompaniesDialogComponent, {
            data: this.data,
            hasBackdrop: false,
            position: this.dialogService.calculateDialogPosition(event, event.target)
        }).afterClosed().subscribe(result => {
            if (result == 'addCompany')
                this.addCompanyDialog(event);
            else if (result)
                this.displaySelectedCompany(result);
        });
        event.stopPropagation();
    }

    displaySelectedCompany(company) {
        this.startLoading();
        this._orgContactService.getOrganizationContactInfo(company.id)
            .pipe(finalize(() => this.finishLoading())).subscribe((result) => {
                this.data['organizationContactInfo'] = result;
                this._contactsService.updateLocation(
                    this.data.id, null, null, result && result.id);
            });
    }
}