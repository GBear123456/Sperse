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
    ContactServiceProxy,
    ActivityType,
    CreateActivityDto,
    UpdateActivityDto,
    LayoutType,
    ActivityDto
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
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { ActivityDto as InternalActivityDto } from '@app/crm/activity/activity-dto.interface';

@Component({
    templateUrl: 'create-activity-dialog.component.html',
    styleUrls: ['create-activity-dialog.component.less'],
    providers: [
        ActivityServiceProxy,
        CacheHelper,
        ContactServiceProxy
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateActivityDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild('stagesList', { static: false }) stagesComponent: StaticListComponent;
    @ViewChild('contactsList', { static: false }) contactsList: StaticListComponent;
    @ViewChild(UserAssignmentComponent, { static: false }) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(DxContextMenuComponent, { static: false }) saveContextComponent: DxContextMenuComponent;
    @ViewChild(StarsListComponent, { static: false }) starsListComponent: StarsListComponent;
    @ViewChild('startDateRef', { static: false }) startDateComponent: DxDateBoxComponent;
    @ViewChild('endDateRef', { static: false }) endDateComponent: DxDateBoxComponent;

    private readonly LOOKUP_RECORDS_COUNT = 20;
    private lookupTimeout: any;
    private latestSearchPhrase = '';
    private listFilterTimeout: any;
    private initialStageId;

    dateValidator: any;
    stages: any[] = [];

    contacts: any = [];

    saveButtonId = 'saveActivityOptions';
    toolbarConfig = [];
    isAllDay = false;
    startDate: Date;
    endDate: Date;

    activityTypeIndex = 0;

    isUserSelected = true;
    isStatusSelected = true;
    isContactSelected = false;
    isStarSelected = false;
    title: string;
    isTitleValid: boolean;
    buttons: IDialogButton[] = [
        {
            id: this.saveButtonId,
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this),
            contextMenu: {
                items: [
                    { text: this.ls.l('SaveAndAddNew'), selected: false },
                    { text: this.ls.l('SaveAndClose'), selected: false }
                ],
                cacheKey: this.cacheHelper.getCacheKey('save_option_active_index', 'CreateActivityDialog'),
                defaultIndex: 1
            }
        }
    ];
    permissions = AppPermissions;
    assignedUsersSelector = select(ActivityAssignedUsersStoreSelectors.getAssignedUsers);
    hasManagePermission: boolean = this.permissionChecker.isGranted(AppPermissions.CRMManageEventsAssignments);
    appointment: InternalActivityDto = this.data.appointment;

    constructor(
        private cacheService: CacheService,
        private cacheHelper: CacheHelper,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private dialogRef: MatDialogRef<CreateActivityDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private permissionChecker: PermissionCheckerService,
        private userManagementService: UserManagementService,
        public activityProxy: ActivityServiceProxy,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        if (this.appointment && this.appointment.Id) {
            this.isAllDay = Boolean(this.appointment.AllDay);
            if (this.appointment.StartDate)
                this.startDate = this.getDateWithTimezone(new Date(this.appointment.StartDate));
            if (this.appointment.EndDate)
                this.endDate = this.getDateWithTimezone(new Date(this.appointment.EndDate));

            this.activityProxy.get(this.appointment.Id).subscribe((res: ActivityDto) => {
                this.appointment.AssignedUserIds = res.assignedUserIds || [];
                this.isUserSelected = !!this.appointment.AssignedUserIds;
                this.initToolbarConfig();
                this.changeDetectorRef.detectChanges();
            });
        } else
            this.initAppointmentData();
    }

    initAppointmentData() {
        this.appointment.AssignedUserIds = [abp.session.userId];
        let dateNow = new Date(moment().format('YYYY/MM/DD HH:mm:ss'));
        if (this.appointment.AllDay)
            this.isAllDay = true;

        if (this.appointment.StartDate) {
            this.startDate = new Date(this.appointment.StartDate);
            if (!this.isAllDay) {
                this.startDate.setHours(dateNow.getHours());
                this.startDate.setMinutes(dateNow.getMinutes());
                this.startDate.setSeconds(dateNow.getSeconds());
            }
        } else {
            this.startDate = new Date(dateNow);
        }

        if (this.appointment.EndDate) {
            this.endDate = new Date(this.appointment.EndDate);
            if (!this.isAllDay) {
                this.endDate.setHours(dateNow.getHours());
                this.endDate.setMinutes(dateNow.getMinutes());
                this.endDate.setSeconds(dateNow.getSeconds());
            }
        } else {
            this.endDate = new Date(dateNow);
            this.endDate.setTime(
                this.endDate.getTime() + (1000 * 60 * 15)
            );
        }
    }

    ngOnInit() {
        this.loadResourcesData();
        if (!this.appointment.StageId && this.data.stages)
            this.initialStageId = this.appointment.StageId =
                this.data.stages[Math.floor(this.data.stages.length / 2)].id;

        if (!this.appointment.Type)
            this.appointment.Type = ActivityType.Task;

        this.appointment.Type == 'Event' ? this.activityTypeIndex = 1 : this.activityTypeIndex = 0;
        this.title = this.appointment.Title ? this.appointment.Title : '';
        this.initToolbarConfig();
        this.changeDetectorRef.detectChanges();
    }

    loadResourcesData() {
        this.modalDialog.startLoading();
        Promise.all([
            this.lookup('contacts').then(res => this.contacts = res)
        ]).then(
            () => this.modalDialog.finishLoading(),
            () => this.modalDialog.finishLoading()
        );
        this.initToolbarConfig();
    }

    lookup(uri, search = '') {
        return new Promise((resolve, reject) => {
            this[uri.toLowerCase() + 'Proxy']['getAllByPhrase'](search, this.LOOKUP_RECORDS_COUNT).subscribe(
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
                        attr: {
                            'filter-selected': this.hasManagePermission && this.isUserSelected,
                            class: 'assign-to'
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
                        name: 'contact',
                        action: this.toggleContactLists.bind(this),
                        options: {
                            text: this.ls.l('Contact'),
                            accessKey: 'ContactsList'
                        },
                        attr: {
                            'filter-selected': this.isContactSelected
                        }
                    },
                    {
                        name: 'star',
                        visible: !this.userManagementService.isLayout(LayoutType.BankCode),
                        disabled: true,
                        action: this.toggleStarsList.bind(this),
                        options: {
                            width: 20
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
        this.appointment.Type = event.itemData.value;
        this.initToolbarConfig();
    }

    private createEntity(): void {
        this.modalDialog.startLoading();
        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;

        (this.appointment.Id ? this.updateAppointment() : this.createAppointment())
            .pipe(finalize(() => {
                this.modalDialog.finishLoading();
                saveButton.disabled = false;
            }))
            .subscribe((res) => {
                /** @todo check why create don't return appointmentId  */
                //this.appointment.Id = res;
                this.afterSave();
            });
    }

    getEntityData(id?: number) {
        return {
            id: id,
            type: this.appointment.Type,
            title: this.appointment.Title,
            description: this.appointment.Description,
            assignedUserIds: this.appointment.AssignedUserIds,
            startDate: this.getDateWithoutTimezone(this.startDate, 'startDate'),
            endDate: this.getDateWithoutTimezone(this.endDate, 'endDate'),
            allDay: this.isAllDay,
            stageId: this.appointment.StageId,
            leadId: this.appointment.LeadId,
            contactId: this.appointment.ContactId
        };
    }

    createAppointment() {
        return this.activityProxy.create(
            CreateActivityDto.fromJS(this.getEntityData())
        );
    }

    updateAppointment() {
        return this.activityProxy.update(
            UpdateActivityDto.fromJS(this.getEntityData(this.appointment.Id))
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
        if (this.buttons[0].contextMenu.items.length &&
            this.buttons[0].contextMenu.items[0].selected) {
            this.resetFullDialog();
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.data.refreshParent(true, this.appointment.StageId);
            // } else if (this.saveContextMenuItems[1].selected) {
            // @Todo: after add new button uncomment else if and update it, there can be bug with 'Save' button, but I can't reproduce it
        } else {
            this.dialogRef.close();
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.data.refreshParent(false,
                this.appointment.StageId);
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
        if (!this.appointment.Title) {
            this.isTitleValid = false;
            return this.notifyService.error(this.ls.l('TitleIsRequired'));
        }

        if (!this.dateValidator.validate().isValid)
            return this.notifyService.error(this.ls.l('DatePeriodIsRequired'));

        if (this.startDate >= this.endDate) {
            this.startDateComponent.instance.option('isValid', false);
            this.endDateComponent.instance.option('isValid', false);
            return this.notifyService.error(this.ls.l('EndDateBeforeStartDate'));
        }

        return true;
    }

    toggleStages() {
        this.stagesComponent.toggle();
        this.changeDetectorRef.detectChanges();
    }

    toggleContactLists() {
        this.contactsList.toggle();
        this.changeDetectorRef.detectChanges();
    }

    toggleStarsList() {
        this.starsListComponent.toggle();
        this.changeDetectorRef.detectChanges();
    }

    onListFiltered(event) {
        clearTimeout(this.listFilterTimeout);
        this.listFilterTimeout = setTimeout(() => {
            let uri = event.listTitle.toLowerCase(),
                value = this.getInputElementValue(event);
            this.lookup(uri, value).then(res => {
                switch (uri) {
                    case 'contacts':
                        this.contacts = res;
                        break;
                }
            });
        }, 1000);
    }

    onContactSelected(e) {
        this.appointment.ContactId = e.id;
        this.isContactSelected = !!e.id;
        this.initToolbarConfig();
    }

    // onStarsChanged(e) {
    //     this.isStarSelected = !!e.addedItems.length;
    //     this.appointment['Stars'] = e.addedItems.id;
    //     this.initToolbarConfig();
    // }

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
            this.appointment = {
                Type: ActivityType.Task,
                StageId: this.initialStageId
            } as any;

            this.isAllDay = false;
            this.isUserSelected = false;
            this.isContactSelected = false;
            this.isStarSelected = false;
            this.initAppointmentData();
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
            this.messageService.confirm('', this.ls.l('DiscardConfirmation'), (confirmed) => {
                if (confirmed)
                    resetInternal();
            });
    }

    onSaveOptionSelectionChanged() {
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
        this.appointment.StageId = event.id;
        this.isStatusSelected = !!event.id;
        this.initToolbarConfig();
    }

    titleChanged(event) {
        this.appointment.Title = event;
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
        this.dateValidator.validate();
        event.component.blur();
    }

    getStartDayTime(value) {
        let date = new Date(value);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    getEndDayTime(value) {
        let date = new Date(value);
        date.setHours(23, 59, 59, 59);
        return date;
    }
}
