/** Core imports */
import { Component, OnInit, Injector, Input, Output, ViewChild, EventEmitter } from '@angular/core';

/** Third party import */
import { MatDialog } from '@angular/material';
import { CacheService } from 'ng2-cache-service';
import { DxContextMenuComponent } from 'devextreme-angular';
import * as _ from 'underscore';
import { BehaviorSubject } from 'rxjs';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { PersonDialogComponent } from './person-dialog/person-dialog.component';
import { CreateClientDialogComponent } from '../shared/create-client-dialog/create-client-dialog.component';
import { UploadDocumentsDialogComponent } from './documents/upload-documents-dialog/upload-documents-dialog.component';
import { ContactGroupInfoDto, CreateContactPhotoInput, ContactEmploymentServiceProxy,
    ContactPhotoDto, UpdateOrganizationInfoInput, OrganizationContactServiceProxy, UpdateContactEmploymentInput,
    PersonContactServiceProxy, UpdatePersonInfoInput, ContactPhotoServiceProxy } from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { NoteAddDialogComponent } from './notes/note-add-dialog/note-add-dialog.component';
import { AppService } from '@app/app.service';
import { StringHelper } from '@shared/helpers/StringHelper';
import { ContactGroupType } from '@shared/AppEnums';
import { CompanyDialogComponent } from '@app/crm/contacts/company-dialog/company-dialog.component';

@Component({
    selector: 'details-header',
    templateUrl: './details-header.component.html',
    styleUrls: ['./details-header.component.less'],
    providers: [ AppService, ContactPhotoServiceProxy, DialogService ]
})
export class DetailsHeaderComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxContextMenuComponent) addContextComponent: DxContextMenuComponent;

    @Input()
    public set data(data: ContactGroupInfoDto) {
        this._contactInfoBehaviorSubject.next(data);
    }
    public get data(): ContactGroupInfoDto {
        return this._contactInfoBehaviorSubject.getValue();
    }

    @Input() ratingId: number;

    @Output() onContactSelected: EventEmitter<any> = new EventEmitter();

    private _contactInfoBehaviorSubject = new BehaviorSubject<ContactGroupInfoDto>(ContactGroupInfoDto.fromJS({}));
    private readonly ADD_FILES_OPTION   = 0;
    private readonly ADD_NOTES_OPTION   = 1;
    private readonly ADD_CONTACT_OPTION = 2;
    private readonly ADD_OPTION_DEFAULT = this.ADD_FILES_OPTION;
    private readonly ADD_OPTION_CACHE_KEY = 'add_option_active_index';

    isAdminModule;
    addContextMenuItems = [];
    addButtonTitle = '';
    contactEmploymentInfo: any = {};

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _contactEmploymentService: ContactEmploymentServiceProxy,
        private organizationContactService: OrganizationContactServiceProxy,
        private personContactServiceProxy: PersonContactServiceProxy,
        private contactPhotoServiceProxy: ContactPhotoServiceProxy,
        private nameParserService: NameParserService,
        private appService: AppService,
        private dialogService: DialogService,
        private _cacheService: CacheService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.isAdminModule = (appService.getModule() == appService.getDefaultModule());

        this.addContextMenuItems = [
            {text: this.l('AddFiles'), selected: false, icon: 'files'},
            {text: this.l('AddNotes'), selected: false, icon: 'note'},
            {text: this.l('AddContact'), selected: false, icon: 'add-contact'}
        ];
        this.addOptionsInit();
    }

    ngOnInit(): void {
        this.initializeEmploymentInfo();
    }

    initializeEmploymentInfo() {
        this._contactInfoBehaviorSubject.subscribe(data => {
            let contactId = data && data.id;
            if (contactId) {
                if (this._contactEmploymentService['data'] && this._contactEmploymentService['data'].id == contactId) {
                    this.contactEmploymentInfo = this._contactEmploymentService['data'].contactEmploymentInfo;
                } else {
                    this._contactEmploymentService.get(contactId)
                        .subscribe(response => {
                            this._contactEmploymentService['data'] = {
                                id: contactId,
                                contactEmploymentInfo: this.contactEmploymentInfo = response.contactEmploymentInfo || {}
                            };
                        }
                    );
                }
            }
        });
    }

    updateContactEmployment(value) {
        this.contactEmploymentInfo.jobTitle = value;
        this._contactEmploymentService.update(UpdateContactEmploymentInput.fromJS({
            id: this.contactEmploymentInfo.id,
            contactEmploymentEditInfo: this.contactEmploymentInfo
        })).subscribe(response => {});
    }

    getDialogPossition(event, shiftX) {
        return this.dialogService.calculateDialogPosition(event, event.target.closest('div'), shiftX, -12);
    }

    showCompanyDialog(e) {
        this.dialog.closeAll();
        this.dialog.open(CompanyDialogComponent, {
            data: {
                company: this.data.primaryOrganizationContactInfo
            },
            panelClass: 'slider',
            maxWidth: '830px'
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    showUploadPhotoDialog(event, isCompany = undefined) {
        this.dialog.closeAll();
        this.dialog.open(UploadPhotoDialogComponent, {
            data: this.data,
            hasBackdrop: true
        }).afterClosed().subscribe(result => {
            if (result) {
                let base64OrigImage = StringHelper.getBase64(result.origImage),
                    base64ThumbImage = StringHelper.getBase64(result.thumImage),
                    dataField = (isCompany ? 'organization' : 'primary') + 'ContactInfo';
                this.data[dataField].primaryPhoto = ContactPhotoDto.fromJS({
                    original: base64OrigImage,
                    thumbnail: base64ThumbImage
                });
                this.contactPhotoServiceProxy.createContactPhoto(
                    CreateContactPhotoInput.fromJS({
                        contactId: this.data[dataField].id,
                        originalImage: base64OrigImage,
                        thumbnail: base64ThumbImage
                    })
                ).subscribe(() => {
                });
            }
        });
        event.stopPropagation();
    }

    getNameInplaceEditData(field = 'personContactInfo') {
        let contactInfo = this.data && this.data[field];
        if (contactInfo)
            return {
                id: contactInfo.id,
                value: contactInfo.fullName.trim(),
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
        if (this.contactEmploymentInfo)
            return {
                id: this.contactEmploymentInfo.id,
                value: (this.contactEmploymentInfo.jobTitle || '').trim(),
                lEntityName: 'JobTitle',
                lEditPlaceholder: this.l('JobTitlePlaceholder')
            };
    }

    showEditPersonDialog(event) {
        this.dialog.closeAll();
        this.dialog.open(PersonDialogComponent, {
            data: this.data.personContactInfo,
            hasBackdrop: false,
            position: this.getDialogPossition(event, 200)
        });
        event.stopPropagation();
    }

    updateCompanyField(value, field = 'companyName') {
        let data = this.data.primaryOrganizationContactInfo;
        data.organization[field] = value;
        this.organizationContactService.updateOrganizationInfo(
            UpdateOrganizationInfoInput.fromJS(
                _.extend({id: data.id}, data.organization))
        ).subscribe(result => {
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
        ).subscribe(result => {});
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

        let dialogClass;
        if (this.addContextMenuItems[this.ADD_CONTACT_OPTION].selected)
            setTimeout(() => {
                this.dialog.open(CreateClientDialogComponent, {
                    panelClass: 'slider',
                    disableClose: true,
                    closeOnNavigation: false,
                    data: {
                        refreshParent: () => {},
                        customerType: ContactGroupType.Client
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
}
