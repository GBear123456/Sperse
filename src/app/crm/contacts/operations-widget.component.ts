import { Component, Injector, Input, Output, ViewChild, EventEmitter } from '@angular/core';

import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { TagsListComponent } from '../shared/tags-list/tags-list.component';
import { ListsListComponent } from '../shared/lists-list/lists-list.component';
import { TypesListComponent } from '../shared/types-list/types-list.component';
import { UserAssignmentComponent } from '../shared/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '../shared/rating/rating.component';
import { StarsListComponent } from '../shared/stars-list/stars-list.component';
import { StaticListComponent } from '../shared/static-list/static-list.component';
import { ContactInfoDto, UserServiceProxy } from '@shared/service-proxies/service-proxies';
import { ContactsService } from './contacts.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ContactGroup, ContactStatus } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';

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
    @Output() print: EventEmitter<any> = new EventEmitter();

    private initTimeout;
    private _enabled: Boolean;
    private _stages: any[] = [];
    private _partnerTypes: any[] = [];
    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;

    toolbarConfig = [];

    constructor(
        injector: Injector,
        private _clientService: ContactsService,
        private _appService: AppService,
        private _userService: UserServiceProxy,
        public localizationService: AppLocalizationService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        _clientService.toolbarSubscribe((config) => {
            this.initToolbarConfig(config);
        });
    }

    initToolbarConfig(config = null) {        
        clearTimeout(this.initTimeout);
        this.initTimeout = setTimeout(() => {
            if (config)
                return (this.toolbarConfig = config);

            let items = [
                {
                    name: 'assign',
                    action: this.toggleUserAssignment.bind(this)
                },
                this.leadId ? {
                    name: 'stage',
                    action: this.toggleStages.bind(this)
                } :
                {
                    name: 'status',
                    action: this.toggleStatus.bind(this)
                }
            ];
            if (this.customerType == ContactGroup.Partner) {
                items.push({
                    name: 'partnerType',
                    action: this.togglePartnerTypes.bind(this)
                });
            }
            items = items.concat([
                {
                    name: 'lists',
                    action: this.toggleLists.bind(this)
                },
                {
                    name: 'tags',
                    action: this.toggleTags.bind(this)
                },
                {
                    name: 'rating',
                    action: this.toggleRating.bind(this),
                },
                {
                    name: 'star',
                    action: this.toggleStars.bind(this),
                }
            ]);
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
                            visible: Boolean(this.leadId)
                        }
                    ]
                },
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'print',
                            action: this.print.emit.bind(this.print)
                        }
                    ]
                }
            ] : [ 
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'print',
                            action: this.print.emit.bind(this.print)
                        }
                    ]
                }
            ];

            this.toolbarConfig.push(
                {
                    location: 'before',
                    locateInMenu: 'auto',
                    items: [
                        {
                            visible: this.isClientCFOAvailable() || !this.isClientProspective() &&
                                !(this._userService['data'] && this._userService['data'].userId) && 
                                this._appService.canSendVerificationRequest(),
                            action: () => { 
                                if (this.isClientCFOAvailable())
                                    this.redirectToCFO();
                                else
                                    this.requestVerification();
                            },
                            options: {
                                text: this.l(this.isClientCFOAvailable() ? 'CFO': 'ClientDetails_RequestVerification'),
                                icon: this.isClientCFOAvailable() ? 'cfo-icon' : this.toolbarComponent.getImgURI('verify-icon')
                            }
                        }
                    ]
                }
            );
        }, 300);
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

    isClientProspective() {
        return this.contactInfo ? this.contactInfo.statusId == ContactStatus.Prospective : true;
    }

    isClientCFOAvailable() {
        return this.contactInfo && this.contactInfo.personContactInfo &&
            this._appService.isCFOAvailable(this.contactInfo.personContactInfo.userId);
    }

    requestVerification() {
        this._appService.requestVerification(this.contactInfo.personContactInfo.id);
    }

    redirectToCFO() {
        this._appService.redirectToCFO(this.contactInfo.personContactInfo.userId);
    }
}