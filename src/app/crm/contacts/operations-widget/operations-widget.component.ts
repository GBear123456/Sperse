/** Core imports */
import { Component, Injector, Input, Output, ViewChild, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/** Application imports */
import { TagsListComponent } from '@app/shared/common/lists/tags-list/tags-list.component';
import { ListsListComponent } from '@app/shared/common/lists/lists-list/lists-list.component';
import { TypesListComponent } from '@app/shared/common/lists/types-list/types-list.component';
import { UserAssignmentComponent } from '@app/shared/common/lists/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '@app/shared/common/lists/rating/rating.component';
import { StarsListComponent } from '@app/crm/shared/stars-list/stars-list.component';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { ContactInfoDto, UserServiceProxy } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { ContactGroup, ContactStatus } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { AppService } from '@app/app.service';
import { AppPermissions } from '@shared/AppPermissions';
import { CrmService } from '@app/crm/crm.service';

@Component({
    selector: 'operations-widget',
    templateUrl: './operations-widget.component.html',
    styleUrls: ['./operations-widget.component.less']
})
export class OperationsWidgetComponent extends AppComponentBase implements OnChanges {
    @ViewChild(TagsListComponent, { static: false }) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent, { static: false }) listsComponent: TagsListComponent;
    @ViewChild(TypesListComponent, { static: false }) partnerTypesComponent: TypesListComponent;
    @ViewChild(UserAssignmentComponent, { static: false }) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent, { static: false }) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent, { static: false }) starsListComponent: StarsListComponent;
    @ViewChild('stagesList', { static: false }) stagesComponent: StaticListComponent;
    @ViewChild('statusesList', { static: false }) statusComponent: StaticListComponent;
    @ViewChild(ToolBarComponent, { static: false }) toolbarComponent: ToolBarComponent;

    /*** @todo add localization service */

    @Input()
    set enabled(val: Boolean) {
        this._enabled = val;
        this.initToolbarConfig();
    }
    get enabled(): Boolean {
        return this._enabled;
    }
    @Input() contactInfo: ContactInfoDto;
    @Input() customerType: string;
    @Input() leadId: number;
    @Input() selectedStageId: number;
    @Input()
    set stages(stages: any[]) {
        this._stages = stages;
        this.initToolbarConfig();
    }
    get stages(): any[] {
        return this._stages;
    }
    @Input() selectedPartnerTypeId: string;
    @Input()
    set partnerTypes(partnerTypes: any[]) {
        this._partnerTypes = partnerTypes;
        this.initToolbarConfig();
    }
    get partnerTypes(): any[] {
        return this._partnerTypes;
    }
    @Input() getProxyService;
    @Input() assignedUsersSelector: (source$: Observable<any>) => Observable<any>;
    @Input() getAssignmentsPermissionKey;

    @Output() onDelete: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateStage: EventEmitter<any> = new EventEmitter();
    @Output() onUpdatePartnerType: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateStatus: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateRating: EventEmitter<any> = new EventEmitter();
    @Output() prev: EventEmitter<any> = new EventEmitter();
    @Output() next: EventEmitter<any> = new EventEmitter();
    @Output() print: EventEmitter<any> = new EventEmitter();

    private initTimeout;
    private _enabled: Boolean;
    private _stages: any[] = [];
    private _partnerTypes: any[] = [];
    isPrevDisabled = false;
    isNextDisabled = false;

    toolbarConfig = [];
    customToolbarConfig;
    optionButtonConfig;
    printButtonConfig = {
        location: 'after',
        locateInMenu: 'auto',
        items: [
            {
                name: 'print',
                action: this.print.emit.bind(this.print)
            }
        ]
    };
    permissions = AppPermissions;
    isCfoAvailable;
    constructor(
        injector: Injector,
        private appService: AppService,
        private userService: UserServiceProxy,
        private contactService: ContactsService,
        private impersonationService: ImpersonationService,
        private crmService: CrmService
    ) {
        super(injector);
        contactService.toolbarSubscribe(config => {
            if (config) {
                this.customToolbarConfig = config.customToolbar;
                this.optionButtonConfig = config.optionButton;
            } else {
                this.customToolbarConfig = undefined;
                this.optionButtonConfig = undefined;
            }

            this.initToolbarConfig();
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        /** Load users instance (or get from cache) for user id to find out whether to show cfo or verify button */
        if (changes.contactInfo && this.contactInfo.groupId == ContactGroup.Client && this.appService.isCfoLinkOrVerifyEnabled) {
            const contactInfo: ContactInfoDto = changes.contactInfo.currentValue;
            if (contactInfo.id && contactInfo.personContactInfo) {
                this.crmService.isCfoAvailable(contactInfo.personContactInfo.userId)
                    .subscribe((isCfoAvailable: boolean) => {
                        this.isCfoAvailable = isCfoAvailable;
                    });
            }
        }
    }

    initToolbarConfig(ms = 300) {
        clearTimeout(this.initTimeout);
        this.initTimeout = setTimeout(() => {
            if (this.customToolbarConfig)
                return (this.toolbarConfig = this.customToolbarConfig);

            let impersonationItem = {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        widget: 'dxButton',
                        options: {
                            text: this.l('LoginAsThisUser')
                        },
                        visible: this.contactInfo && this.contactInfo.personContactInfo && this.contactInfo.personContactInfo.userId &&
                            this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation),
                        action: () => {
                            this.impersonationService.impersonate(this.contactInfo.personContactInfo.userId, this.appSession.tenantId);
                        }
                    }
                ]
            }, optionItem = {
                location: 'before',
                locateInMenu: 'auto',
                items: this.optionButtonConfig ? [this.optionButtonConfig] : []
            };

            this.toolbarConfig = this._enabled ? [
                {
                    location: 'before',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'assign',
                            action: this.toggleUserAssignment.bind(this),
                            disabled: !this.contactService.checkCGPermission(this.customerType, 'ManageAssignments')
                        },
                        {
                            name: 'stage',
                            action: this.toggleStages.bind(this),
                            disabled: !this.contactService.checkCGPermission(this.customerType),
                            visible: this.contactInfo.statusId == ContactStatus.Prospective
                        },
                        {
                            name: 'status',
                            action: this.toggleStatus.bind(this),
                            disabled: !this.contactService.checkCGPermission(this.customerType),
                            visible: this.contactInfo.statusId != ContactStatus.Prospective
                        },
                        {
                            name: 'partnerType',
                            action: this.togglePartnerTypes.bind(this),
                            disabled: !this.contactService.checkCGPermission(this.customerType),
                            visible: this.customerType == ContactGroup.Partner
                        },
                        {
                            name: 'lists',
                            action: this.toggleLists.bind(this),
                            disabled: !this.contactService.checkCGPermission(this.customerType, 'ManageListsAndTags')
                        },
                        {
                            name: 'tags',
                            action: this.toggleTags.bind(this),
                            disabled: !this.contactService.checkCGPermission(this.customerType, 'ManageListsAndTags')
                        },
                        {
                            name: 'rating',
                            action: this.toggleRating.bind(this),
                            disabled: !this.contactService.checkCGPermission(this.customerType, 'ManageRatingAndStars')
                        },
                        {
                            name: 'star',
                            action: this.toggleStars.bind(this),
                            disabled: !this.contactService.checkCGPermission(this.customerType, 'ManageRatingAndStars')
                        }
                    ]
                },
                {
                    location: 'before',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'delete',
                            action: this.delete.bind(this),
                            visible: Boolean(this.leadId) &&
                                this.contactService.checkCGPermission(this.customerType)
                        }
                    ]
                },
                impersonationItem,
                optionItem,
                this.printButtonConfig,
                this.getNavigationConfig()
            ] : [
                impersonationItem,
                optionItem,
                this.printButtonConfig,
                this.getNavigationConfig()
            ];

            if (this.cfoLinkOrVerifyEnabled) {
                this.toolbarConfig.push(
                    {
                        location: 'before',
                        locateInMenu: 'auto',
                        items: [
                            {
                                action: () => {
                                    if (this.isCfoAvailable === true) {
                                        this.redirectToCFO();
                                    } else if (this.isCfoAvailable === false) {
                                        this.requestVerification();
                                    }
                                },
                                options: {
                                    text: this.l(this.isCfoAvailable ? 'CFO' : 'ClientDetails_RequestVerification'),
                                    icon: this.isCfoAvailable ? 'cfo-icon' : this.toolbarComponent.getImgURI('verify-icon')
                                }
                            }
                        ]
                    }
                );
            }
        }, ms);
    }

    getNavigationConfig() {
        return {
            location: 'after',
            locateInMenu: 'auto',
            items: [
                {
                    name: 'prev',
                    action: this.loadPrevItem.bind(this),
                    disabled: this.isPrevDisabled
                },
                {
                    name: 'next',
                    action: this.loadNextItem.bind(this),
                    disabled: this.isNextDisabled
                }
            ]
        };
    }

    toggleStages() {
        this.stagesComponent.toggle();
    }

    toggleStatus() {
        this.statusComponent.toggle();
    }

    togglePartnerTypes() {
        this.partnerTypesComponent.toggle();
    }

    toggleUserAssignment() {
        this.userAssignmentComponent.toggle();
    }

    toggleLists() {
        this.listsComponent.toggle();
    }

    toggleTags() {
        this.tagsComponent.toggle();
    }

    toggleRating() {
        this.ratingComponent.toggle();
    }

    toggleStars() {
        this.starsListComponent.toggle();
    }

    delete() {
        this.onDelete.emit();
    }

    updateStatus(event) {
        this.onUpdateStatus.emit(event);
    }

    updateStage(event) {
        this.onUpdateStage.emit(event);
    }

    updatePartnerType(event) {
        this.onUpdatePartnerType.emit(event);
    }

    updateRating(event) {
        this.onUpdateRating.emit(event);
    }

    refresh() {
        this.stagesComponent.tooltipVisible = false;
        this.initToolbarConfig();
    }

    loadPrevItem() {
        this.prev.emit(this);
    }

    loadNextItem() {
        this.next.emit(this);
    }

    requestVerification() {
        this.appService.requestVerification(this.contactInfo.personContactInfo.id)
            .pipe(takeUntil(this.deactivate$))
            .subscribe(result => {
                if (this.contactInfo && this.contactInfo.personContactInfo)
                    this.contactInfo.personContactInfo.userId = result;
                this.initToolbarConfig();
            });
    }

    redirectToCFO() {
        this.appService.redirectToCFO(this.contactInfo.personContactInfo.userId);
    }

    updateNavButtons(isFirst, isLast) {
        const updateToolbar = this.isPrevDisabled !== isFirst || this.isNextDisabled !== isLast;
        this.isPrevDisabled = isFirst;
        this.isNextDisabled = isLast;
        if (updateToolbar) {
            this.initToolbarConfig(0);
        }
    }

    /**
     * If isCfoAvailable is undefined - then it hasn't loaded yet and this method returns false
     * @return {boolean}
     */
    get cfoLinkOrVerifyEnabled(): boolean {
        return this.isCfoAvailable && this.appService.checkCFOClientAccessPermission()
               || (
                   this.isCfoAvailable === false && this.appService.canSendVerificationRequest()
                   && this.contactInfo.statusId === ContactStatus.Active
               );
    }
}
