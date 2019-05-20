/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, ViewChild, Inject, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { select } from '@ngrx/store';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import { CacheService } from 'ng2-cache-service';
import { finalize } from 'rxjs/operators';
import * as moment from 'moment';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import {
    ActivityServiceProxy,
    CustomerServiceProxy,
    LeadServiceProxy,
    OrderServiceProxy,
    CreateActivityDtoType,
    CreateActivityDto,
    UpdateActivityDto
} from '@shared/service-proxies/service-proxies';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { UserAssignmentComponent } from '../../shared/user-assignment-list/user-assignment-list.component';
import { ActivityAssignedUsersStoreSelectors } from '@app/store';
import { StarsListComponent } from '@app/crm/shared/stars-list/stars-list.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { NotifyService } from '@abp/notify/notify.service';
import { MessageService } from '@abp/message/message.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    templateUrl: 'create-activity-dialog.component.html',
    styleUrls: ['create-activity-dialog.component.less'],
    providers: [
        ActivityServiceProxy,
        CacheHelper,
        CustomerServiceProxy,
        LeadServiceProxy,
        OrderServiceProxy,
        DialogService
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateActivityDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
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
    private readonly SAVE_OPTION_DEFAULT = 1;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';
    private lookupTimeout: any;
    private latestSearchPhrase = '';
    private listFilterTimeout: any;
    private initialStageId;

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
    title: string;
    isTitleValid: boolean;
    buttons: IDialogButton[] = [
        {
            id: this.saveButtonId,
            title: this.ls.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private _cacheService: CacheService,
        private _activityProxy: ActivityServiceProxy,
        private dialogService: DialogService,
        private ClientsProxy: CustomerServiceProxy,
        private LeadsProxy: LeadServiceProxy,
        private OrdersProxy: OrderServiceProxy,
        private cacheHelper: CacheHelper,
        private appSession: AppSessionService,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private dialogRef: MatDialogRef<CreateActivityDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {
        this.saveContextMenuItems = [
            { text: this.ls.l('SaveAndAddNew'), selected: false },
            { text: this.ls.l('SaveAndClose'), selected: false }
        ];

        if (this.data.appointment.Id) {
            this.isAllDay = Boolean(this.data.appointment.AllDay);
            if (this.data.appointment.StartDate)
                this.startDate = this.getDateWithTimezone(this.data.appointment.StartDate);
            if (this.data.appointment.EndDate)
                this.endDate = this.getDateWithTimezone(this.data.appointment.EndDate);

            this._activityProxy.get(this.data.appointment.Id).subscribe((res) => {
                this.data.appointment.AssignedUserIds = res.assignedUserIds || [];
            });
        } else {
            let dateNow = new Date(moment().format('YYYY/MM/DD HH:mm:ss'));
            if (this.data.appointment.AllDay)
                this.isAllDay = true;

            if (this.data.appointment.StartDate) {
                this.startDate = new Date(this.data.appointment.StartDate);
                if (!this.isAllDay) {
                    this.startDate.setHours(dateNow.getHours());
                    this.startDate.setMinutes(dateNow.getMinutes());
                    this.startDate.setSeconds(dateNow.getSeconds());
                }
            } else {
                this.startDate = new Date(dateNow);
            }

            if (this.data.appointment.EndDate) {
                this.endDate = new Date(this.data.appointment.EndDate);
                if (!this.isAllDay) {
                    this.endDate.setHours(dateNow.getHours());
                    this.endDate.setMinutes(dateNow.getMinutes());
                    this.endDate.setSeconds(dateNow.getSeconds());
                }
            } else {
                this.endDate = new Date(dateNow);
            }
        }
    }

    ngOnInit() {
        this.loadResourcesData();
        if (!this.data.appointment.AssignedUserIds)
            this.data.appointment.AssignedUserIds = [this.appSession.userId];

        if (!this.data.appointment.StageId && this.data.stages)
            this.initialStageId = this.data.appointment.StageId =
                this.data.stages[Math.floor(this.data.stages.length / 2)].id;

        if (!this.data.appointment.Type)
            this.data.appointment.Type = CreateActivityDtoType.Task;

        this.data.appointment.Type == 'Event' ? this.activityTypeIndex = 1 : this.activityTypeIndex = 0;

        this.title = this.data.appointment.Title;
        this.initToolbarConfig();
        this.saveOptionsInit();
        this.changeDetectorRef.detectChanges();
    }

    loadResourcesData() {
        this.modalDialog.startLoading();
        Promise.all([
            this.lookup('Leads').then(res => this.leads = res),
            this.lookup('Orders').then(res => this.orders = res),
            this.lookup('Clients').then(res => this.clients = res)
        ]).then(
            () => this.modalDialog.finishLoading(),
            () => this.modalDialog.finishLoading()
        );
        this.initToolbarConfig();
    }

    lookup(uri, search = '') {
        return new Promise((resolve, reject) => {
            this[uri + 'Proxy']['getAllByPhrase'](search, this.LOOKUP_RECORDS_COUNT).subscribe(
                (res) => resolve(res),
                (err) => reject(err)
            );
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
                                    text: this.ls.l('Task'),
                                    value: CreateActivityDtoType.Task
                                }, {
                                    action: this.activityTypeChanged.bind(this),
                                    text: this.ls.l('Event'),
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
                            text: this.ls.l('Lead'),
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
                            text: this.ls.l('Client'),
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
                    //         text: this.ls.l('Order'),
                    //         accessKey: 'OrdersList'
                    //     }
                    // },
                    {
                        name: 'star',
                        disabled: true,
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
        this.changeDetectorRef.detectChanges();
    }

    private activityTypeChanged(event) {
        this.activityTypeIndex = event.itemIndex;
        this.data.appointment.Type = event.itemData.value;
        this.initToolbarConfig();
    }

    saveOptionsInit() {
        let cacheKey = this.cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            selectedIndex = this.SAVE_OPTION_DEFAULT;
        if (this._cacheService.exists(cacheKey))
            selectedIndex = this._cacheService.get(cacheKey);
        this.saveContextMenuItems[selectedIndex].selected = true;
        this.buttons[0].title = this.saveContextMenuItems[selectedIndex].text;
        this.changeDetectorRef.detectChanges();
    }

    updateSaveOption(option) {
        this.buttons[0].title = option.text;
        this._cacheService.set(this.cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
        this.changeDetectorRef.detectChanges();
    }

    private createEntity(): void {
        this.modalDialog.startLoading();
        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;

        (this.data.appointment.Id ? this.updateAppointment() : this.createAppointment())
            .pipe(finalize(() => {
                this.modalDialog.startLoading();
                saveButton.disabled = false;
            }))
            .subscribe((res) => {
                this.data.appointment.Id = res;
                this.afterSave();
            });
    }

    getEntityData(id?: number) {
        return {
            id: id,
            type: this.data.appointment.Type,
            title: this.data.appointment.Title,
            description: this.data.appointment.Description,
            assignedUserIds: this.data.appointment.AssignedUserIds || [this.appSession.userId],
            startDate: this.getDateWithoutTimezone(this.startDate, 'startDate'),
            endDate: this.getDateWithoutTimezone(this.endDate, 'endDate'),
            allDay: this.isAllDay,
            stageId: this.data.appointment.StageId,
            leadId: this.data.appointment.LeadId,
            contactId: this.data.appointment.ContactId
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

    getDateWithoutTimezone(date, propertyName = null) {
        if (this.isAllDay) {
            date = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
            date = moment.utc(date);

            if (propertyName === 'startDate')
                date = date.startOf('day');
            if (propertyName === 'endDate')
                date = date.endOf('day');

            return date;
        } else {
            date.setTime(date.getTime() - ((date.getTimezoneOffset() + moment().utcOffset()) * 60 * 1000));
            return moment.utc(date);
        }
    }

    getDateWithTimezone(date) {
        return new Date(moment(date).format('YYYY/MM/DD HH:mm:ss'));
    }

    private afterSave(): void {
        if (this.saveContextMenuItems.length &&
            this.saveContextMenuItems[0].selected) {
            this.resetFullDialog();
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.data.refreshParent(true,
                this.data.appointment.StageId);
            // } else if (this.saveContextMenuItems[1].selected) {
            // @Todo: after add new button uncomment else if and update it, there can be bug with 'Save' button, but I can't reproduce it
        } else {
            this.dialogRef.close();
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
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
            this.isTitleValid = false;
            return this.notifyService.error(this.ls.l('TitleIsRequired'));
        }

        if (!this.dateValidator.validate().isValid)
            return this.notifyService.error(this.ls.l('DatePeriodIsRequired'));

        return true;
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

    onLeadSelected(e) {
        this.data.appointment.LeadId = e.id;
        this.isLeadsSelected = !!e.id;
        this.initToolbarConfig();
    }

    onListFiltered(event) {
        clearTimeout(this.listFilterTimeout);
        this.listFilterTimeout = setTimeout(() => {
            let uri = event.listTitle,
                value = this.getInputElementValue(event);

            this.lookup(uri, value).then(res => {
                switch (uri) {
                    case 'Leads':
                        this.leads = res;
                        break;
                    case 'Clients':
                        this.clients = res;
                        break;
                    case 'Orders':
                        this.orders = res;
                        break;
                }
            });
        }, 1000);
    }

    onClientSelected(e) {
        this.data.appointment.ContactId = e.id;
        this.isClientSelected = !!e.id;
        this.initToolbarConfig();
    }

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

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            this.title = '';
            this.isTitleValid = true;
            this.data.appointment = {
                Type: CreateActivityDtoType.Task,
                StageId: this.initialStageId
            };

            this.isUserSelected = false;
            this.isLeadsSelected = false;
            this.isClientSelected = false;
            this.isStarSelected = false;
            this.initToolbarConfig();

            setTimeout(() => {
                this.userAssignmentComponent.reset();
                this.startDateComponent.instance.option('isValid', true);
                this.endDateComponent.instance.option('isValid', true);
            }, 100);
        };

        if (forced)
            resetInternal();
        else
            this.messageService.confirm(this.ls.l('DiscardConfirmation'), '', (confirmed) => {
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
            $event.component.option('noDataText', this.ls.l('LookingForItems'));
            this.lookup(uri, search).then((res) => {
                if (search == this.latestSearchPhrase) {
                    this[uri.toLowerCase()] = res;
                    $event.component.option('opened', true);
                    setTimeout(() => { $event.event.target.value = search; });
                    if (!res['length'])
                        $event.component.option('noDataText', this.ls.l('NoItemsFound'));
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

    getAssignedUsersSelector() {
        return select(ActivityAssignedUsersStoreSelectors.getAssignedUsers);
    }

    onUserAssignmentChanged(event) {
        this.isUserSelected = !!event.addedItems.length;
        this.initToolbarConfig();
    }

    openCalendar(event) {
        event.component.open();
    }

    removeFocusFromElement(event) {
        event.component.blur();
    }
}
