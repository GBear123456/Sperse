/** Core imports */
import { Component, OnInit, ViewChild, Injector } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { DxContextMenuComponent, DxDateBoxComponent } from 'devextreme-angular';
import { CacheService } from 'ng2-cache-service';
import { finalize } from 'rxjs/operators';
import * as moment from 'moment';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import {
    ActivityServiceProxy,
    CreateActivityDtoType,
    CreateActivityDto,
    UpdateActivityDto
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { ModalDialogComponent } from 'shared/common/dialogs/modal/modal-dialog.component';
import { StaticListComponent } from '../../shared/static-list/static-list.component';
import { UserAssignmentComponent } from '../../shared/user-assignment-list/user-assignment-list.component';
import { ActivityAssignedUsersStoreSelectors } from '@app/store';
import { StarsListComponent } from '@app/crm/shared/stars-list/stars-list.component';

@Component({
    templateUrl: 'create-activity-dialog.component.html',
    styleUrls: ['create-activity-dialog.component.less'],
    providers: [ ActivityServiceProxy, DialogService ]
})
export class CreateActivityDialogComponent extends ModalDialogComponent implements OnInit {
    @ViewChild('stagesList') stagesComponent: StaticListComponent;
    @ViewChild('leadsList') leadsList: StaticListComponent;
    @ViewChild('clientsList') clientsList: StaticListComponent;
    @ViewChild('ordersList') ordersList: StaticListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild('startDateRef') startDateComponent: DxDateBoxComponent;
    @ViewChild('endDateRef') endDateComponent: DxDateBoxComponent;

    private readonly LOOKUP_RECORDS_COUNT = 20;
    private readonly SAVE_OPTION_DEFAULT   = 1;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';
    private lookupTimeout: any;
    private latestSearchPhrase = '';
    dateValidator: any;
    stages: any[] = [];

    leads: any = [];
    orders: any = [];
    clients: any = [];

    saveButtonId = 'saveActivityOptions';
    saveContextMenuItems = [];

    toolbarConfig = [];
    isAllDay = false;

    startDate: Date;
    endDate: Date;

    activityTypeIndex = 0;

    isUserSelected = true;
    isStatusSelected = true;
    isLeadsSelected = false;
    isClientSelected = false;
    isStarSelected = false;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _cacheService: CacheService,
        private _activityProxy: ActivityServiceProxy,
        private dialogService: DialogService
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.saveContextMenuItems = [
            {text: this.l('SaveAndAddNew'), selected: false},
            {text: this.l('SaveAndClose'), selected: false}
        ];

        if (this.data.appointment.Id) {
            if (this.data.appointment.StartDate)
                this.startDate = this.getDateWithTimezone(this.data.appointment.StartDate);
            if (this.data.appointment.EndDate)
                this.endDate = this.getDateWithTimezone(this.data.appointment.EndDate);

            let start = moment.utc(this.data.appointment.StartDate),
                end = moment.utc(this.data.appointment.EndDate);

            this.isAllDay = !end.hour() && !end.minute() && !end.second()
                && !start.hour() && !start.minute() && !start.second()

            this._activityProxy.get(this.data.appointment.Id).subscribe((res) => {
                this.data.appointment.AssignedUserIds = res.assignedUserIds || [];
            });
        } else {
            let dateNow = new Date(moment().format('YYYY-MM-DD HH:mm:ss'));
            if (this.data.appointment.StartDate) {
                this.startDate = new Date(this.data.appointment.StartDate);
                this.startDate.setHours(dateNow.getHours());
                this.startDate.setMinutes(dateNow.getMinutes());
                this.startDate.setSeconds(dateNow.getSeconds());
            } else 
                this.startDate = new Date(dateNow);

            if (this.data.appointment.EndDate) {
                this.endDate = new Date(this.data.appointment.EndDate);
                this.endDate.setHours(dateNow.getHours());
                this.endDate.setMinutes(dateNow.getMinutes());
                this.endDate.setSeconds(dateNow.getSeconds());
            } else 
                this.endDate = new Date(dateNow);
        }

        this.loadResourcesData();
    }

    loadResourcesData() {
        this.lookup('Leads').then(res => this.leads = res);
        this.lookup('Orders').then(res => this.orders = res);
        this.lookup('Clients').then(res => this.clients = res);
        this.initToolbarConfig();
    }

    lookup(uri, search = '') {
        return new Promise((resolve, reject) => {
            this._activityProxy['get' + uri](search, this.LOOKUP_RECORDS_COUNT).subscribe((res) => {
                resolve(res);
            });
        });
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'after', items: [
                    {
                        text: '',
                        name: 'select-box',
                        widget: 'dxDropDownMenu',
                        options: {
                            width: 80,
                            selectedIndex: this.activityTypeIndex,
                            items: [
                                {
                                    action: this.activityTypeChanged.bind(this),
                                    text: this.l('Task'),
                                    value: CreateActivityDtoType.Task
                                }, {
                                    action: this.activityTypeChanged.bind(this),
                                    text: this.l('Event'),
                                    value: CreateActivityDtoType.Event
                                }
                            ]
                        }
                    },
                    {
                        name: 'assign',
                        action: this.toggleUserAssignmen.bind(this),
                        options: {
                            accessKey: 'UserAssign'
                        },
                        attr: {
                            'filter-selected': this.isUserSelected
                        }
                    },
                    {
                        name: 'stage',
                        action: this.toggleStages.bind(this),
                        options: {
                            text: 'Status',
                            accessKey: 'ActivityStage'
                        },
                        attr: {
                            'filter-selected': this.isStatusSelected
                        }
                    },
                    {
                        name: 'lead',
                        action: this.toggleLeadList.bind(this),
                        options: {
                            text: this.l('Lead'),
                            accessKey: 'LeadsList'
                        },
                        attr: {
                            'filter-selected': this.isLeadsSelected
                        }
                    },
                    {
                        name: 'client',
                        action: this.toggleClientLists.bind(this),
                        options: {
                            text: this.l('Client'),
                            accessKey: 'ClientsList'
                        },
                        attr: {
                            'filter-selected': this.isClientSelected
                        }
                    },
                    // {
                    //     name: 'order',
                    //     action: this.toggleOrderList.bind(this),
                    //     options: {
                    //         text: this.l('Order'),
                    //         accessKey: 'OrdersList'
                    //     }
                    // },
                    {
                        name: 'star',
                        action: () => this.starsListComponent.toggle(),
                        options: {
                            width: 20,
                        },
                        attr: {
                            'filter-selected': this.isStarSelected
                        }
                    }
                ]
            },
            {
                location: 'after',
                areItemsDependent: true,
                items: [
                    {
                        name: 'discard',
                        action: this.resetFullDialog.bind(this, false)
                    }
                ]
            }
        ];
    }

    private activityTypeChanged(event) {
        this.activityTypeIndex = event.itemIndex;
        this.data.appointment.Type = event.itemData.value;
        this.initToolbarConfig();
    }

    saveOptionsInit() {
        let cacheKey = this.getCacheKey(this.SAVE_OPTION_CACHE_KEY),
            selectedIndex = this.SAVE_OPTION_DEFAULT;
        if (this._cacheService.exists(cacheKey))
            selectedIndex = this._cacheService.get(cacheKey);
        this.saveContextMenuItems[selectedIndex].selected = true;
        this.data.buttons[0].title = this.saveContextMenuItems[selectedIndex].text;
    }

    updateSaveOption(option) {
        this.data.buttons[0].title = option.text;
        this._cacheService.set(this.getCacheKey(this.SAVE_OPTION_CACHE_KEY),
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
    }

    ngOnInit() {
        super.ngOnInit();
        if (!this.data.appointment.AssignedUserIds)
            this.data.appointment.AssignedUserIds = [this.appSession.userId];

        if (!this.data.appointment.StageId && this.data.stages)
            this.data.appointment.StageId =
                this.data.stages[Math.floor(this.data.stages.length / 2)].id;

        if (!this.data.appointment.Type)
            this.data.appointment.Type = CreateActivityDtoType.Task;

        this.data.appointment.Type == 'Event' ? this.activityTypeIndex = 1 : this.activityTypeIndex = 0;

        this.data.title = this.data.appointment.Title;
        this.data.editTitle = true;
        this.data.titleClearButton = true;
        this.data.placeholder = this.l('Title');
        this.data.buttons = [{
            id: this.saveButtonId,
            title: this.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }];
        this.initToolbarConfig();
        this.saveOptionsInit();
    }

    private createEntity(): void {
        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;

        (this.data.appointment.Id ? this.updateAppointment() : this.createAppointment())
            .pipe(finalize(() => { saveButton.disabled = false; }))
            .subscribe((res) => {
                this.data.appointment.Id = res;
                this.afterSave();
            });
    }

    getEntityData(id = undefined) {
        return {
            id: id,
            type: this.data.appointment.Type,
            title: this.data.appointment.Title,
            description: this.data.appointment.Description,
            assignedUserIds: this.data.appointment.AssignedUserIds || [this.appSession.userId],
            startDate: this.getDateWithoutTimezone(this.startDate),
            endDate: this.getDateWithoutTimezone(this.endDate),
            stageId: this.data.appointment.StageId,
            leadId: this.data.appointment.LeadId,
            orderId: this.data.appointment.OrderId,
            customerId: this.data.appointment.ContactGroupId
        };
    }

    createAppointment() {
        return this._activityProxy.create(
            CreateActivityDto.fromJS(this.getEntityData())
        );
    }

    updateAppointment() {
        return this._activityProxy.update(
            UpdateActivityDto.fromJS(this.getEntityData(this.data.appointment.Id))
        );
    }

    getDateWithoutTimezone(date) {
        if (this.isAllDay)
            return moment.utc(date).startOf('day');
        else {
            date.setTime(date.getTime() - ((date.getTimezoneOffset() + moment().utcOffset()) * 60 * 1000));
            return moment.utc(date);
        }
    }

    getDateWithTimezone(date) {
        return new Date(moment(date).format('YYYY-MM-DD HH:mm:ss'));
    }

    private afterSave(): void {
        if (this.saveContextMenuItems.length &&
            this.saveContextMenuItems[0].selected) {
            this.resetFullDialog();
            this.notify.info(this.l('SavedSuccessfully'));
            this.data.refreshParent(true,
                this.data.appointment.StageId);
            // } else if (this.saveContextMenuItems[1].selected) {
            // @Todo: after add new button uncomment else if and update it, there can be bug with 'Save' button, but I can't reproduce it
        } else {
            this.close();
            this.notify.info(this.l('SavedSuccessfully'));
            this.data.refreshParent(false,
                this.data.appointment.StageId);
       }
    }

    save(event?): void {
        if (event && event.offsetX > 195)
            return this.saveContextComponent
                .instance.option('visible', true);

        if (this.validateData())
            this.createEntity();
    }

    validateData() {
        if (!this.data.appointment.Title) {
            this.data.isTitleValid = false;
            return this.notify.error(this.l('TitleIsRequired'));
        }

        if (!this.dateValidator.validate().isValid)
            return this.notify.error(this.l('DatePeriodIsRequired'));

        return true;
    }

    getDialogPossition(event, shiftX) {
        return this.dialogService.calculateDialogPosition(event, event.target.closest('div'), shiftX, -12);
    }

    toggleStages() {
        this.stagesComponent.toggle();
    }

    toggleLeadList() {
        this.leadsList.toggle();
    }

    toggleClientLists() {
        this.clientsList.toggle();
    }

    // toggleOrderList() {
    //     this.ordersList.toggle();
    // }

    onLeadSelected(e) {
        this.data.appointment.LeadId = e.id;
        this.isLeadsSelected = !!e.id;
        this.initToolbarConfig();
    }

    onClientSelected(e) {
        this.data.appointment.ContactGroupId = e.id;
        this.isClientSelected = !!e.id;
        this.initToolbarConfig();
    }

    // onOrderSelected(e) {
    //     this.data.appointment.OrderId = e.id;
    // }

    onStarsChanged(e) {
        this.isStarSelected = !!e.addedItems.length;
        this.data.appointment.Stars = e.addedItems.id;
        this.initToolbarConfig();
    }

    toggleUserAssignmen() {
        this.userAssignmentComponent.toggle();
    }

    getInputElementValue(event) {
        return event.element.getElementsByTagName('input')[0].value;
    }

    resetComponent(component) {
        component.reset();
        component.option('isValid', true);
    }

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            this.data.title = '';
            this.data.isTitleValid = true;
            this.userAssignmentComponent.reset();
            this.data.appointment = {
                Type: CreateActivityDtoType.Task
            };

            this.isUserSelected = false;
            this.isStatusSelected = false;
            this.isLeadsSelected = false;
            this.isClientSelected = false;
            this.isStarSelected = false;
            this.initToolbarConfig();

            setTimeout(() => {
                this.startDateComponent.instance.option('isValid', true);
                this.endDateComponent.instance.option('isValid', true);
            }, 100);
        };

        if (forced)
            resetInternal();
        else
            this.message.confirm(this.l('DiscardConfirmation'), '', (confirmed) => {
                if (confirmed)
                    resetInternal();
            });
    }

    onSaveOptionSelectionChanged($event) {
        let option = $event.addedItems.pop() || $event.removedItems.pop() ||
            this.saveContextMenuItems[this.SAVE_OPTION_DEFAULT];
        option.selected = true;
        $event.component.option('selectedItem', option);

        this.updateSaveOption(option);
        this.save();
    }

    lookupItems($event) {
        let uri = $event.component.option('name'),
            search = this.latestSearchPhrase = $event.event.target.value;

        if (this[uri.toLowerCase()].length) {
            setTimeout(() => { $event.event.target.value = search; });
            this[uri.toLowerCase()] = [];
        }

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            $event.component.option('opened', true);
            $event.component.option('noDataText', this.l('LookingForItems'));
            this.lookup(uri, search).then((res) => {
                if (search == this.latestSearchPhrase) {
                    this[uri.toLowerCase()] = res;
                    $event.component.option('opened', true);
                    setTimeout(() => { $event.event.target.value = search; });
                    if (!res['length'])
                        $event.component.option('noDataText', this.l('NoItemsFound'));
                } else
                    $event.component.option('opened', false);
            });
        }, 500);
    }

    onStagesChanged(event) {
        this.data.appointment.StageId = event.id;
        this.isStatusSelected = !!event.id;
        this.initToolbarConfig();
    }

    titleChanged(event) {
        this.data.appointment.Title = event;
    }

    initDateValidationGroup($event) {
        this.dateValidator = $event.component;
    }

    getAssignedUsersStoreSelectors() {
        return ActivityAssignedUsersStoreSelectors.getAssignedUsers;
    }

    onUserAssignmentChanged(event) {
        this.isUserSelected = !!event.addedItems.length;
        this.initToolbarConfig();
    }
}
