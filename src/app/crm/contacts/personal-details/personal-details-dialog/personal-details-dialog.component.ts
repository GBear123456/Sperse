/** Core imports */
import { Component, OnInit, AfterViewInit, Inject, ElementRef, OnDestroy } from '@angular/core';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard';
import { CacheService } from 'ng2-cache-service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { DateHelper } from '@shared/helpers/DateHelper';
import { NotifyService } from '@abp/notify/notify.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { VerificationChecklistItemType, VerificationChecklistItem,
    VerificationChecklistItemStatus } from '../../verification-checklist/verification-checklist.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    ContactServiceProxy, ContactInfoDto, LeadInfoDto, ContactLastModificationInfoDto,
    UpdateContactAffiliateCodeInput, UpdateContactXrefInput, UpdateContactCustomFieldsInput
} from '@shared/service-proxies/service-proxies';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { ContactsService } from '../../contacts.service';
import { AppFeatures } from '@shared/AppFeatures';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    templateUrl: 'personal-details-dialog.html',
    styleUrls: ['personal-details-dialog.less']
})
export class PersonalDetailsDialogComponent implements OnInit, AfterViewInit, OnDestroy {
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
    lastModificationInfo: ContactLastModificationInfoDto;
    userTimezone = DateHelper.getUserTimezone();
    formatting = AppConsts.formatting;

    constructor(
        private clipboardService: ClipboardService,
        private notifyService: NotifyService,
        private cacheHelper: CacheHelper,
        private cacheService: CacheService,
        private contactProxy: ContactServiceProxy,
        private elementRef: ElementRef,
        private contactsService: ContactsService,
        private pipelineService: PipelineService,
        private profileService: ProfileService,
        public permissionChecker: AppPermissionService,
        public ls: AppLocalizationService,
        public userManagementService: UserManagementService,
        public dialogRef: MatDialogRef<PersonalDetailsDialogComponent>,
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
            this.leadInfo = leadInfo;
            this.stageColor = leadInfo && this.pipelineService.getStageColorByName(leadInfo.stage);
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

    getTabContentHeight() {
        return innerHeight - 300 + 'px';
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

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.ident);
    }
}
