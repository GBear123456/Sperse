/** Core imports */
import { Component, Injector, Input, Output, ViewChild, EventEmitter } from '@angular/core';

/** Third party imports */
import { takeUntil } from 'rxjs/operators';

/** Application imports */
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { TagsListComponent } from '../shared/tags-list/tags-list.component';
import { ListsListComponent } from '../shared/lists-list/lists-list.component';
import { TypesListComponent } from '../shared/types-list/types-list.component';
import { UserAssignmentComponent } from '../shared/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '../shared/rating/rating.component';
import { StarsListComponent } from '../shared/stars-list/stars-list.component';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { ContactInfoDto, UserServiceProxy } from '@shared/service-proxies/service-proxies';
import { ContactsService } from './contacts.service';
import { ContactGroup, ContactStatus } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { AppService } from '@app/app.service';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    selector: 'operations-widget',
    templateUrl: './operations-widget.component.html',
    styleUrls: ['./operations-widget.component.less']
})
export class OperationsWidgetComponent extends AppComponentBase {
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: TagsListComponent;
    @ViewChild(TypesListComponent) partnerTypesComponent: TypesListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild('stagesList') stagesComponent: StaticListComponent;
    @ViewChild('statusesList') statusComponent: StaticListComponent;
    @ViewChild(ToolBarComponent) toolbarComponent: ToolBarComponent;

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
    @Input() getAssignedUsersSelector;
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
    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;
    isPrevDisabled = false;
    isNextDisabled = false;

    toolbarConfig = [];
    customToolbarConfig;
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
    constructor(
        injector: Injector,
        private _appService: AppService,
        private _userService: UserServiceProxy,
        private _contactService: ContactsService,
        private _impersonationService: ImpersonationService
    ) {
        super(injector);

        _contactService.toolbarSubscribe(config => {
            this.customToolbarConfig = config;
            this.initToolbarConfig();
        });
    }

    initToolbarConfig(ms = 300) {
        clearTimeout(this.initTimeout);
        this.initTimeout = setTimeout(() => {
            if (this.customToolbarConfig)
                return (this.toolbarConfig = this.customToolbarConfig);

            let items = [
                {
                    name: 'assign',
                    action: this.toggleUserAssignment.bind(this),
                    disabled: !this._contactService.checkCGPermission(this.customerType, 'ManageAssignments')
                },
                this.leadId ? {
                    name: 'stage',
                    action: this.toggleStages.bind(this),
                    disabled: !this._contactService.checkCGPermission(this.customerType)
                } :
                {
                    name: 'status',
                    action: this.toggleStatus.bind(this),
                    disabled: !this._contactService.checkCGPermission(this.customerType)
                }
            ];
            if (this.customerType == ContactGroup.Partner) {
                items.push({
                    name: 'partnerType',
                    action: this.togglePartnerTypes.bind(this),
                    disabled: !this._contactService.checkCGPermission(this.customerType)
                });
            }
            items = items.concat([
                {
                    name: 'lists',
                    action: this.toggleLists.bind(this),
                    disabled: !this._contactService.checkCGPermission(this.customerType, 'ManageListsAndTags')
                },
                {
                    name: 'tags',
                    action: this.toggleTags.bind(this),
                    disabled: !this._contactService.checkCGPermission(this.customerType, 'ManageListsAndTags')
                },
                {
                    name: 'rating',
                    action: this.toggleRating.bind(this),
                    disabled: !this._contactService.checkCGPermission(this.customerType, 'ManageRatingAndStars')
                },
                {
                    name: 'star',
                    action: this.toggleStars.bind(this),
                    disabled: !this._contactService.checkCGPermission(this.customerType, 'ManageRatingAndStars')
                }
            ]);
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
                            this._impersonationService.impersonate(this.contactInfo.personContactInfo.userId, this.appSession.tenantId);
                        }
                    }
                ]
            };

            this.toolbarConfig = this._enabled ? [
                {
                    location: 'before',
                    locateInMenu: 'auto',
                    items: items
                },
                {
                    location: 'before',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'delete',
                            action: this.delete.bind(this),
                            visible: Boolean(this.leadId) &&
                                this._contactService.checkCGPermission(this.customerType)
                        }
                    ]
                },
                impersonationItem,
                this.printButtonConfig,
                this.getNavigationConfig(this.isPrevDisabled, this.isNextDisabled)
            ] : [
                    impersonationItem,
                    this.printButtonConfig,
                    this.getNavigationConfig(this.isPrevDisabled, this.isNextDisabled)
                ];

            const isCfoLinkOrVerifyEnabled = this.contactInfo
                && this.contactInfo.personContactInfo
                && this.contactInfo.groupId == ContactGroup.Client
                && this._appService.isCfoLinkOrVerifyEnabled
                && (
                    this.isClientCFOAvailable() && this._appService.checkCFOClientAccessPermission()
                    || (!this.isClientCFOAvailable() && this._appService.canSendVerificationRequest() && this.contactInfo.statusId === ContactStatus.Active)
                );
            if (isCfoLinkOrVerifyEnabled) {
                this.toolbarConfig.push(
                    {
                        location: 'before',
                        locateInMenu: 'auto',
                        items: [
                            {
                                action: () => {
                                    if (this.isClientCFOAvailable())
                                        this.redirectToCFO();
                                    else
                                        this.requestVerification();
                                },
                                options: {
                                    text: this.l(this.isClientCFOAvailable() ? 'CFO' : 'ClientDetails_RequestVerification'),
                                    icon: this.isClientCFOAvailable() ? 'cfo-icon' : this.toolbarComponent.getImgURI('verify-icon')
                                }
                            }
                        ]
                    }
                );
            }
        }, ms);
    }

    getNavigationConfig(isPrevDisabled: boolean, isNextDisabled: boolean) {
        return {
            location: 'after',
            locateInMenu: 'auto',
            items: [
                {
                    name: 'prev',
                    action: this.loadPrevItem.bind(this),
                    disabled: isPrevDisabled
                },
                {
                    name: 'next',
                    action: this.loadNextItem.bind(this),
                    disabled: isNextDisabled
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

    toggleDataLayout(dataLayoutType) {
        this.dataLayoutType = dataLayoutType;
    }

    toggleUserAssignment(dataLayoutType) {
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

    isClientProspective() {
        return this.contactInfo ? this.contactInfo.statusId == ContactStatus.Prospective : true;
    }

    isClientCFOAvailable() {
        return this.contactInfo && this.contactInfo.personContactInfo &&
            this._appService.isCFOAvailable(this.contactInfo.personContactInfo.userId);
    }

    requestVerification() {
        this._appService.requestVerification(this.contactInfo.personContactInfo.id)
            .pipe(takeUntil(this.deactivate$))
            .subscribe(result => {
                if (this.contactInfo && this.contactInfo.personContactInfo)
                    this.contactInfo.personContactInfo.userId = result;
                this.initToolbarConfig();
            });
    }

    redirectToCFO() {
        this._appService.redirectToCFO(this.contactInfo.personContactInfo.userId);
    }

    updateNavButtons(isFirst, isLast) {
        const updateToolbar = this.isPrevDisabled !== isFirst || this.isNextDisabled !== isLast;
        this.isPrevDisabled = isFirst;
        this.isNextDisabled = isLast;
        if (updateToolbar) {
            this.initToolbarConfig(0);
        }
    }
}
