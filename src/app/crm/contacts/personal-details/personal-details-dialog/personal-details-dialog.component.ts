/** Core imports */
import { Component, OnInit, AfterViewInit, Inject, ElementRef } from '@angular/core';

/** Third party imports */
import { CacheService } from 'ng2-cache-service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { VerificationChecklistItemType, VerificationChecklistItem,
    VerificationChecklistItemStatus } from '../../verification-checklist/verification-checklist.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LayoutType, ContactServiceProxy, ContactInfoDto, UpdateContactAffiliateCodeInput, UpdateContactXrefInput } from '@shared/service-proxies/service-proxies';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { ContactsService } from '../../contacts.service';
import { AppFeatures } from '@shared/AppFeatures';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: 'personal-details-dialog.html',
    styleUrls: ['personal-details-dialog.less']
})
export class PersonalDetailsDialogComponent implements OnInit, AfterViewInit {
    showOverviewTab = abp.features.isEnabled(AppFeatures.PFMCreditReport);
    verificationChecklist: VerificationChecklistItem[];
    contactInfo: ContactInfoDto;
    configMode: boolean;
    overviewPanelSetting = {
        clientScores: true,
        totalApproved: true,
        verification: true
    };

    private slider: any;
    private affiliateCode: ReplaySubject<string> = new ReplaySubject(1);
    affiliateCode$: Observable<string> = this.affiliateCode.asObservable().pipe(
        map((affiliateCode: string) => (affiliateCode || '').trim())
    );
    private contactXref: ReplaySubject<string> = new ReplaySubject(1);
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
            min: 2,
            message: this.ls.l('MinLengthIs', 2)
        },
        {
            type: 'stringLength',
            max: 30,
            message: this.ls.l('MaxLengthIs', 30)
        }
    ];
    xrefValidationRules = [
    {
        type: 'stringLength',
        max: 255,
        message: this.ls.l('MaxLengthIs', 255)
    }];
    isLayoutTypeBankCode = this.userManagementService.isLayout(LayoutType.BankCode);

    constructor(
        private cacheHelper: CacheHelper,
        private cacheService: CacheService,
        private contactProxy: ContactServiceProxy,
        private elementRef: ElementRef,
        public contactsService: ContactsService,
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
            }
        }, this.constructor.name);

        if (this.showOverviewTab) {
            contactsService.verificationSubscribe(
                this.initVerificationChecklist.bind(this)
            );

            let key = this.cacheHelper.getCacheKey(
                abp.session.userId.toString(), this.constructor.name
            );
            if (this.cacheService.exists(key))
                this.overviewPanelSetting = this.cacheService.get(key);
        }
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
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
                    top: '157px',
                    right: '0px'
                });
            }, 100);
        });
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
            abp.session.userId.toString(), this.constructor.name
        ), this.overviewPanelSetting);
    }

    toggleConfigMode() {
        this.configMode = !this.configMode;
    }

    updateAffiliateCode(value) {
        value = value.trim();
        if (!value)
            return;
        this.contactProxy.updateAffiliateCode(new UpdateContactAffiliateCodeInput({
            contactId: this.contactInfo.personContactInfo.id,
            affiliateCode: value
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

    close() {
        this.dialogRef.close();
    }
}
