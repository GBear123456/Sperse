/** Core imports */
import { Component, Input, Output, EventEmitter } from "@angular/core";

/** Third party imports */
import { MatDialog } from "@angular/material/dialog";
import { Store, select } from "@ngrx/store";
import * as _ from "underscore";
import { first, filter } from "rxjs/operators";
import { ClipboardService } from "ngx-clipboard";
import { NotifyService } from "abp-ng2-module";

/** Application imports */
import { AppConsts } from "@shared/AppConsts";
import {
    ContactInfoDto,
    ContactInfoDetailsDto,
    ContactLinkServiceProxy,
    ContactLinkDto,
    CreateContactLinkInput,
    UpdateContactLinkInput,
    OrganizationContactServiceProxy,
    ContactLinkTypeDto,
} from "@shared/service-proxies/service-proxies";
import { EditContactDialog } from "../edit-contact-dialog/edit-contact-dialog.component";
import { DialogService } from "@app/shared/common/dialogs/dialog.service";
import { RootStore } from "@root/store";
import {
    ContactLinkTypesStoreActions,
    ContactLinkTypesStoreSelectors,
} from "@app/store";
import { ContactsService } from "../contacts.service";
import { AppLocalizationService } from "@app/shared/common/localization/app-localization.service";
import { AppPermissionService } from "@shared/common/auth/permission.service";
import { AppPermissions } from "@shared/AppPermissions";
import { LinkType } from "@shared/AppEnums";
import { SocialDialogComponent } from "@shared/social-dialog";

@Component({
    selector: "socials",
    templateUrl: "./socials.component.html",
    styleUrls: ["./socials.component.less"],
})
export class SocialsComponent {
    @Input() isCompany;
    @Input()
    set contactInfo(val: ContactInfoDto) {
        if ((this._contactInfo = val) && val.groups)
            this.isEditAllowed =
                this.permissionService.checkCGPermission(val.groups) ||
                (this.isCompany &&
                    this.permissionService.isGranted(
                        AppPermissions.CRMCompaniesManageAll
                    ));
    }
    get contactInfo(): ContactInfoDto {
        return this._contactInfo;
    }

    @Input() contactInfoData: ContactInfoDetailsDto;
    @Input() enableLinkDialog: boolean = true;
    @Input() isEditAllowed = false;

    @Output() onChanged: EventEmitter<any> = new EventEmitter();

    private _contactInfo: ContactInfoDto;

    LINK_TYPES = {};
    urlRegEx = AppConsts.regexPatterns.url;

    selectedLinks: ContactLinkDto[] | undefined = undefined;

    constructor(
        private store$: Store<RootStore.State>,
        private contactsService: ContactsService,
        private contactLinkService: ContactLinkServiceProxy,
        private organizationContactService: OrganizationContactServiceProxy,
        private permissionService: AppPermissionService,
        private clipboardService: ClipboardService,
        private notifyService: NotifyService,
        public dialog: MatDialog,
        public ls: AppLocalizationService
    ) {
        this.linkTypesLoad();
        contactsService.organizationContactInfo$
            .pipe(
                filter((orgInfo) => {
                    return orgInfo.id && !orgInfo.isUpdatable;
                }),
                first()
            )
            .subscribe(() => {
                this.isEditAllowed = false;
            });
    }

    linkTypesLoad() {
        if (this.enableLinkDialog) {
            this.store$.dispatch(
                new ContactLinkTypesStoreActions.LoadRequestAction()
            );
            this.store$
                .pipe(
                    select(ContactLinkTypesStoreSelectors.getContactLinkTypes),
                    filter((types) => !!types)
                )
                .subscribe((types) => {
                    types.forEach((entity: ContactLinkTypeDto) => {
                        this.LINK_TYPES[entity.id] = entity.name.replace(
                            / /g,
                            ""
                        );
                    });
                });
        }
    }

    getDialogPosition(event) {
        let shiftY = this.calculateShiftY(event);
        let parent = event.target.closest("li");
        return DialogService.calculateDialogPosition(
            event,
            parent,
            400,
            shiftY
        );
    }

    isShowSocialIcon(linkType: string) {
        return (
            !linkType ||
            !this.contactInfoData?.links?.some((m) => m.linkTypeId == linkType)
        );
    }

    calculateShiftY(event) {
        let shift = 160;

        let availableSpaceY = window.innerHeight - event.clientY;
        if (availableSpaceY < shift + 20) shift += shift - availableSpaceY + 50;

        return shift;
    }

    showEditDialog(data, event) {
        if (this.enableLinkDialog) {
            if (
                !this.isCompany ||
                (this.contactInfoData && this.contactInfoData.contactId)
            )
                this.showSocialDialog(data, event);
            else
                this.contactsService
                    .addCompanyDialog(
                        event,
                        this.contactInfo,
                        Math.round(event.target.offsetWidth / 2)
                    )
                    .subscribe((result) => {
                        if (result) {
                            this.showSocialDialog(data, event);
                        }
                    });
        } else if (
            !data &&
            this.contactInfoData.links.every((link) => link.id)
        ) {
            this.contactInfoData.links.push(
                new ContactLinkDto({
                    linkTypeId: AppConsts.otherLinkTypeId,
                    url: "",
                    isSocialNetwork: false,
                    isActive: true,
                    comment: undefined,
                    contactId: this.contactInfoData.contactId,
                    id: undefined,
                    isConfirmed: undefined,
                    confirmationDate: undefined,
                    confirmedByUserId: undefined,
                    confirmedByUserFullName: undefined,
                })
            );
        }
    }

    showSocialDialog(data, event) {
        // Open the new social dialog for editing
        const dialogRef = this.dialog.open(SocialDialogComponent, {
            width: '450px',
            data: {
                id: data ? data.id : undefined, // Pass ID for edit mode
                platform: data ? this.getPlatformFromLinkType(data.linkTypeId) : '',
                url: data ? data.url : '',
                comment: data ? data.comment : '',
                isActive: data ? data.isActive : true,
                isConfirmed: data ? data.isConfirmed : false
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.log('Social dialog edit result:', result);
                if (result.isEditMode) {
                    this.handleSocialDialogEditResult(data, result);
                } else {
                    this.handleSocialDialogResult(result);
                }
            }
        });
        event.stopPropagation();
    }

    // Handle editing existing social links
    private handleSocialDialogEditResult(originalData: any, result: any) {
        if (originalData && originalData.id) {
            // Update existing link
            const updateData = {
                field: "url",
                id: originalData.id,
                value: result.url,
                name: this.ls.l("Link"),
                groups: this.contactInfo.groups,
                contactId: this.contactInfoData?.contactId,
                url: result.url,
                confirmationDate: originalData.confirmationDate,
                confirmedByUserFullName: originalData.confirmedByUserFullName,
                usageTypeId: this.mapPlatformToLinkType(result.platformId) || originalData.linkTypeId,
                isConfirmed: result.isConfirmed,
                isActive: result.isActive,
                comment: result.comment,
                isCompany: this.isCompany,
                deleteItem: () => {
                    this.deleteLink(originalData.id);
                },
            };

            this.updateDataField(originalData, updateData);
        }
    }

    // Helper method to get platform name from link type ID
    private getPlatformFromLinkType(linkTypeId: string): string {
        const linkTypeToPlatformMap: { [key: string]: string } = {
            'facebook': 'Facebook',
            'twitter': 'X.com',
            'linkedin': 'LinkedIn',
            'instagram': 'Instagram',
            'youtube': 'YouTube',
            'tiktok': 'TikTok',
            'whatsapp': 'WhatsApp',
            'telegram': 'Telegram',
            'discord': 'Discord',
            'github': 'GitHub',
            'reddit': 'Reddit',
            'snapchat': 'Snapchat',
            'pinterest': 'Pinterest',
            'skype': 'Skype',
            'zoom': 'Zoom',
            'vimeo': 'Vimeo',
            'soundcloud': 'SoundCloud',
            'slack': 'Slack',
            'teams': 'Microsoft Teams',
            'calendly': 'Calendly',
            'cal': 'Cal.com',
            'crunchbase': 'Crunchbase',
            'angellist': 'AngelList',
            'bbb': 'BBB.org',
            'glassdoor': 'Glassdoor',
            'opencorporates': 'Opencorporates',
            'opensea': 'OpenSea',
            'substack': 'Substack',
            'threads': 'Threads',
            'trustpilot': 'Trustpilot',
            'tweach': 'Tweach',
            'viber': 'Viber',
            'wechat': 'WeChat',
            'yelp': 'Yelp'
        };
        
        return linkTypeToPlatformMap[linkTypeId] || '';
    }

    updateDataField(data, dialogData) {
        if (dialogData.usageTypeId != AppConsts.otherLinkTypeId)
            dialogData["linkTypeId"] = dialogData.usageTypeId;

        this.contactLinkService[
            (data && data.id ? "update" : "create") + "ContactLink"
        ](
            (data && data.id
                ? UpdateContactLinkInput
                : CreateContactLinkInput
            ).fromJS(dialogData)
        ).subscribe((result) => {
            if (!result && data) {
                data.url = dialogData.url;
                data.comment = dialogData.comment;
                data.linkTypeId = dialogData.usageTypeId;
                data.isSocialNetwork = dialogData["isSocialNetwork"];
                data.isConfirmed = dialogData.isConfirmed;
                data.isActive = dialogData.isActive;
            } else if (result.id) {
                dialogData.id = result.id;
                if (this.enableLinkDialog) {
                    this.contactInfoData.links.push(
                        ContactLinkDto.fromJS(dialogData)
                    );
                } else Object.assign(data, dialogData);
            }
            this.onChanged.emit();
        });
    }

    updateLink(link, newValue) {
        this.updateDataField(
            link,
            _.extend(_.clone(link), {
                contactId: this.contactInfoData.contactId,
                url: newValue,
                usageTypeId: link.linkTypeId,
                isConfirmed: link.isConfirmed,
                isActive: link.isActive,
                comment: link.comment,
            })
        );
    }

    deleteLink(id) {
        this.dialog.closeAll();
        this.contactLinkService
            .deleteContactLink(this.contactInfoData.contactId, id)
            .subscribe(() => {
                this.contactInfoData.links.every((item, index) => {
                    if (item.id == id) {
                        this.contactInfoData.links.splice(index, 1);
                        return false;
                    }
                    return true;
                });
                this.selectedLinks.every((item, index) => {
                    if (item.id == id) {
                        this.selectedLinks.splice(index, 1);
                        return false;
                    }
                    return true;
                });
                this.onChanged.emit();
            });
    }

    normalizeLink(link) {
        return link
            ? /http[s]{0,1}:\/\//g.test(link)
                ? link
                : "http://" + link
            : link;
    }
    copyToClipbord(value) {
        this.clipboardService.copyFromContent(value);
        this.notifyService.info(this.ls.l("SavedToClipboard"));
    }
    onSelectLinks(link: ContactLinkDto) {
        if (this.selectedLinks?.length > 1) {
            this.selectedLinks = [link];
            return;
        }
        const isAlreadySelected = this.selectedLinks?.some(
            (m) => m.id === link.id
        );
        if (isAlreadySelected) {
            this.selectedLinks = [];
        } else {
            this.selectedLinks = [link];
        }
    }
    onAllSelectLinks() {
        if (this.selectedLinks?.length <= 1)
            this.selectedLinks = this.contactInfoData?.links;
        else {
            this.selectedLinks = [];
        }
    }

    // New function to open social dialog modal
    openSocialDialog(event: any) {
        console.log('Opening social dialog with contact data:', {
            contactId: this.contactInfoData?.contactId,
            isCompany: this.isCompany,
            existingLinks: this.contactInfoData?.links?.length || 0
        });

        const dialogRef = this.dialog.open(SocialDialogComponent, {
            width: '450px',
            data: {
                platform: '',
                url: '',
                comment: '',
                isActive: true,
                isConfirmed: false
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.log('Social dialog result received:', result);
                // Handle the result here - you can integrate with your existing logic
                // For example, create a new social link
                this.handleSocialDialogResult(result);
            } else {
                console.log('Social dialog was cancelled');
            }
        });
    }

    // Handle the result from social dialog
    private handleSocialDialogResult(result: any) {
        console.log('Processing social dialog result:', result);
        
        // Create a new contact link using the existing logic
        const newLinkData = {
            field: "url",
            id: undefined,
            value: result.url,
            name: this.ls.l("Link"),
            groups: this.contactInfo.groups,
            contactId: this.contactInfoData?.contactId,
            url: result.url,
            confirmationDate: undefined,
            confirmedByUserFullName: undefined,
            usageTypeId: this.mapPlatformToLinkType(result.platformId) || AppConsts.otherLinkTypeId,
            isConfirmed: result.isConfirmed,
            isActive: result.isActive,
            comment: result.comment,
            isCompany: this.isCompany,
            deleteItem: () => {
                // Handle delete if needed
            },
        };

        console.log('Created new link data:', newLinkData);

        // Use existing update logic to create the link
        this.updateDataField(null, newLinkData);
        
        // Reset selected links to show all links after adding new one
        this.selectedLinks = this.contactInfoData?.links || [];
    }

    // Map platform ID to the CRM system's link type ID
    private mapPlatformToLinkType(platformId: string): string {
        console.log('Mapping platform ID to link type:', platformId);
        
        const platformToLinkTypeMap: { [key: string]: string } = {
            'apple': 'apple',
            'angel': 'angellist',
            'bbb.org': 'bbb',
            'cb': 'crunchbase',
            'cal.com': 'cal',
            'calendly': 'calendly',
            'discord': 'discord',
            'dribbble': 'dribbble',
            'facebook': 'facebook',
            'github': 'github',
            'glassdoor': 'glassdoor',
            'google': 'google',
            'instagram': 'instagram',
            'linkedin': 'linkedin',
            'messenger': 'messenger',
            'opencorporates': 'opencorporates',
            'opensea': 'opensea',
            'pinterest': 'pinterest',
            'reddit': 'reddit',
            'rss': 'rss',
            'skype': 'skype',
            'slack': 'slack',
            'snapchat': 'snapchat',
            'soundcloud': 'soundcloud',
            'substack': 'substack',
            'teams': 'teams',
            'telegram': 'telegram',
            'threads': 'threads',
            'tiktok': 'tiktok',
            'trustpilot': 'trustpilot',
            'tweach': 'tweach',
            'viber': 'viber',
            'vimeo': 'vimeo',
            'wechat': 'wechat',
            'whatsapp': 'whatsapp',
            'x.com': 'twitter',
            'yelp': 'yelp',
            'youtube': 'youtube',
            'zoom': 'zoom'
        };
        
        // Try to find the link type ID from the store
        const linkType = this.LINK_TYPES && Object.keys(this.LINK_TYPES).find(key => 
            this.LINK_TYPES[key].toLowerCase() === platformToLinkTypeMap[platformId]?.toLowerCase()
        );
        
        console.log('Available link types:', this.LINK_TYPES);
        console.log('Mapped link type:', linkType || AppConsts.otherLinkTypeId);
        
        return linkType || AppConsts.otherLinkTypeId;
    }
}
