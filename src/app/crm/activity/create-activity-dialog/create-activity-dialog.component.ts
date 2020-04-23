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
    ActivityType,
    CreateActivityDto,
    UpdateActivityDto
} from '@shared/service-proxies/service-proxies';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { UserAssignmentComponent } from '@app/shared/common/lists/user-assignment-list/user-assignment-list.component';
import { ActivityAssignedUsersStoreSelectors } from '@app/store';
import { StarsListComponent } from '@app/crm/shared/stars-list/stars-list.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { NotifyService } from '@abp/notify/notify.service';
import { MessageService } from '@abp/message/message.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppPermissions } from '@shared/AppPermissions';
import { DateHelper } from '@shared/helpers/DateHelper';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';

@Component({
    templateUrl: 'create-activity-dialog.component.html',
    styleUrls: ['create-activity-dialog.component.less'],
    providers: [
        ActivityServiceProxy,
        CacheHelper,
        CustomerServiceProxy,
        DialogService
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateActivityDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild('stagesList', { static: false }) stagesComponent: StaticListComponent;
    @ViewChild('leadsList', { static: false }) leadsList: StaticListComponent;
    @ViewChild('clientsList', { static: false }) clientsList: StaticListComponent;
    @ViewChild(UserAssignmentComponent, { static: false }) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(DxContextMenuComponent, { static: false }) saveContextComponent: DxContextMenuComponent;
    @ViewChild(StarsListComponent, { static: false }) starsListComponent: StarsListComponent;
    @ViewChild('startDateRef', { static: false }) startDateComponent: DxDateBoxComponent;
    @ViewChild('endDateRef', { static: false }) endDateComponent: DxDateBoxComponent;

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
    clients: any = [];

    saveButtonId = 'saveActivityOptions';
    saveContextMenuItems = [
        { text: this.ls.l('SaveAndAddNew'), selected: false },
        { text: this.ls.l('SaveAndClose'), selected: false }
    ];

    toolbarConfig = [];
    isAllDay = false;

    startDate: Date;
    endDate: Date;

    activityTypeIndex = 0;

    isUserSelected = false;
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
    permissions = AppPermissions;
    assignedUsersSelector = select(ActivityAssignedUsersStoreSelectors.getAssignedUsers);
    hasManagePermission: boolean = this.permissionChecker.isGranted(AppPermissions.CRMManageEventsAssignments);

    constructor(
        private cacheService: CacheService,
        private dialogService: DialogService,
        private cacheHelper: CacheHelper,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private dialogRef: MatDialogRef<CreateActivityDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private permissionChecker: PermissionCheckerService,
        public activityProxy: ActivityServiceProxy,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.saveContextMenuItems = [
            { text: this.ls.l('SaveAndAddNew'), selected: false },
            { text: this.ls.l('SaveAndClose'), selected: false }
        ];

        if (this.data.appointment && this.data.appointment.Id) {
            this.isAllDay = Boolean(this.data.appointment.AllDay);
            if (this.data.appointment.StartDate)
                this.startDate = this.getDateWithTimezone(new Date(this.data.appointment.StartDate));
            if (this.data.appointment.EndDate)
                this.endDate = this.getDateWithTimezone(new Date(this.data.appointment.EndDate));

            this.activityProxy.get(this.data.appointment.Id).subscribe((res) => {
                this.data.appointment.AssignedUserIds = res.assignedUserIds || [];
                this.isUserSelected = !!this.data.appointment.AssignedUserIds;
                this.initToolbarConfig();
                this.changeDetectorRef.detectChanges();
            });
        } else
            this.initAppointmentDate();
    }

    initAppointmentDate() {
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

    ngOnInit() {
        this.loadResourcesData();
        if (!this.data.appointment.StageId && this.data.stages)
            this.initialStageId = this.data.appointment.StageId =
                this.data.stages[Math.floor(this.data.stages.length / 2)].id;

        if (!this.data.appointment.Type)
            this.data.appointment.Type = ActivityType.Task;

        this.data.appointment.Type == 'Event' ? this.activityTypeIndex = 1 : this.activityTypeIndex = 0;
        this.title = this.data.appointment.Title ? this.data.appointment.Title : '';
        this.initToolbarConfig();
        this.saveOptionsInit();
        this.changeDetectorRef.detectChanges();
    }

    loadResourcesData() {
        if (this.permissionChecker.isGranted(AppPermissions.CRMCustomers)) {
            this.modalDialog.startLoading();
            Promise.all([
                this.lookup('Leads').then(res => this.leads = res),
                this.lookup('Clients').then(res => this.clients = res)
            ]).then(
                () => this.modalDialog.finishLoading(),
                () => this.modalDialog.finishLoading()
            );
        }
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
                location: 'before', items: [
                    {
                        text: '',
                        name: 'select-box',
                        widget: 'dxDropDownMenu',
                        options: {
                            width: 80,
                            hint: this.ls.l('Type'),
                            selectedIndex: this.activityTypeIndex,
                            items: [
                                {
                                    action: this.activityTypeChanged.bind(this),
                                    text: this.ls.l('Task'),
                                    value: ActivityType.Task
                                }, {
                                    action: this.activityTypeChanged.bind(this),
                                    text: this.ls.l('Event'),
                                    value: ActivityType.Event
                                }
                            ]
                        }
                    },
                    {
                        name: 'assign',
                        action: this.toggleUserAssignment.bind(this),
                        disabled: !this.hasManagePermission,
                        options: {
                            accessKey: 'UserAssign'
                        },
                        attr: {
                            'filter-selected': this.hasManagePermission && this.isUserSelected
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
                        disabled: !this.permissionChecker.isGranted(AppPermissions.CRMCustomers),
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
                        disabled: !this.permissionChecker.isGranted(AppPermissions.CRMCustomers),
                        options: {
                            text: this.ls.l('Client'),
                            accessKey: 'ClientsList'
                        },
                        attr: {
                            'filter-selected': this.isClientSelected
                        }
                    },
                    {
                        name: 'star',
                        disabled: true,
                        action: this.toggleStarsList.bind(this),
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
        if (this.cacheService.exists(cacheKey))
            selectedIndex = this.cacheService.get(cacheKey);
        this.saveContextMenuItems[selectedIndex].selected = true;
        this.buttons[0].title = this.saveContextMenuItems[selectedIndex].text;
        this.changeDetectorRef.detectChanges();
    }

    updateSaveOption(option) {
        this.buttons[0].title = option.text;
        this.cacheService.set(this.cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
        this.changeDetectorRef.detectChanges();
    }

    private createEntity(): void {
        this.modalDialog.startLoading();
        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;

        (this.data.appointment.Id ? this.updateAppointment() : this.createAppointment())
            .pipe(finalize(() => {
                this.modalDialog.finishLoading();
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
            assignedUserIds: this.data.appointment.AssignedUserIds,
            startDate: this.getDateWithoutTimezone(this.startDate, 'startDate'),
            endDate: this.getDateWithoutTimezone(this.endDate, 'endDate'),
            allDay: this.isAllDay,
            stageId: this.data.appointment.StageId,
            leadId: this.data.appointment.LeadId,
            contactId: this.data.appointment.ContactId
        };
    }

    createAppointment() {
        return this.activityProxy.create(
            CreateActivityDto.fromJS(this.getEntityData())
        );
    }

    updateAppointment() {
        return this.activityProxy.update(
            UpdateActivityDto.fromJS(this.getEntityData(this.data.appointment.Id))
        );
    }

    getDateWithoutTimezone(date: Date, propertyName = null) {
        return moment.utc(DateHelper.removeTimezoneOffset(date, true, this.isAllDay ?
            (propertyName === 'startDate' ? 'from' : 'to') : undefined));
    }

    getDateWithTimezone(date: Date) {
        return DateHelper.addTimezoneOffset(date, true);
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
        this.changeDetectorRef.detectChanges();
    }

    toggleLeadList() {
        this.leadsList.toggle();
        this.changeDetectorRef.detectChanges();
    }

    toggleClientLists() {
        this.clientsList.toggle();
        this.changeDetectorRef.detectChanges();
    }

    toggleStarsList() {
        this.starsListComponent.toggle();
        this.changeDetectorRef.detectChanges();
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

    toggleUserAssignment() {
        this.userAssignmentComponent.toggle();
        this.changeDetectorRef.detectChanges();
    }

    getInputElementValue(event) {
        return event.element.getElementsByTagName('input')[0].value;
    }

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            this.title = '';
            this.isTitleValid = true;
            this.data.appointment = {
                Type: ActivityType.Task,
                StageId: this.initialStageId
            };

            this.isAllDay = false;
            this.isUserSelected = false;
            this.isLeadsSelected = false;
            this.isClientSelected = false;
            this.isStarSelected = false;
            this.initAppointmentDate();
            this.initToolbarConfig();

            setTimeout(() => {
                this.userAssignmentComponent.reset();
                this.startDateComponent.instance.option('isValid', true);
                this.endDateComponent.instance.option('isValid', true);
                this.changeDetectorRef.detectChanges();
                this.modalDialog.clear();
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

    onUserAssignmentChanged(event) {
        const selectedItemKeys = event.component.option('selectedItemKeys');
        this.isUserSelected = !!(selectedItemKeys && selectedItemKeys.length);
        this.initToolbarConfig();
    }

    openCalendar(event) {
        event.component.open();
    }

    removeFocusFromElement(event) {
        event.component.blur();
    }
}
