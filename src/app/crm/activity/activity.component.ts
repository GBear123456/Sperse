/** Core imports */
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Injector,
    OnDestroy,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { DxSchedulerComponent } from 'devextreme-angular/ui/scheduler';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment-timezone';
import buildQuery from 'odata-query';
import { Observable, combineLatest, forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

/** Application imports */
import { DateHelper } from '@shared/helpers/DateHelper';
import { ActivityAssignedUsersStoreActions, AppStore } from '@app/store';
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { PipelineComponent } from '@app/shared/pipeline/pipeline.component';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ActivityServiceProxy, ActivityType, PipelineDto, StageDto } from '@shared/service-proxies/service-proxies';
import { CreateActivityDialogComponent } from './create-activity-dialog/create-activity-dialog.component';
import { FiltersService } from '@shared/filters/filters.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { PermissionCheckerService } from 'abp-ng2-module';
import { AppPermissions } from '@shared/AppPermissions';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ActivityDto } from '@app/crm/activity/activity-dto.interface';
import { ActivityFields } from '@app/crm/activity/activity-fields.enum';

@Component({
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.less'],
    providers: [ ActivityServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(DxSchedulerComponent) schedulerComponent: DxSchedulerComponent;
    @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;
    schedulerHeight$: Observable<number> = combineLatest(
        this.appService.toolbarIsHidden$,
        this.fullScreenService.isFullScreenMode$
    ).pipe(
        map(([hidden, fullscreen]: [boolean, boolean]) => {
            return window.innerHeight - (fullscreen ? (hidden ? 0 : 60) : (hidden ? 150 : 210));
        })
    );

    private rootComponent: any;
    dataLayoutType: DataLayoutType = DataLayoutType.DataGrid;
    private dataSourceURI = 'Activity';
    private stages: any;

    public timezone = 'Etc/UTC';
    public showPipeline = false;
    public pipelineDataSource: any;
    public pipelinePurposeId = AppConsts.PipelinePurposeIds.activity;
    public cellDuration = 15;

    public activityTypes = ActivityType;
    private selectedEntities: any[] = [];
    set selectedActivities(value: any[]) {
        if (this.selectedEntities.length != value.length) {
            this.selectedEntities = value;
            this.initToolbarConfig();
        } else
            this.selectedEntities = value;
    }
    get selectedActivities(): any[] {
        return this.selectedEntities;
    }

    public currentDate = new Date();
    public scheduleDate = new Date(this.currentDate);
    private pipelineDate = new Date(this.currentDate);
    private calendarCaption: string;
    public calendarInitialized = false;

    private currentView = 'month';
    private pipelineView = this.currentView;
    public scheduleView = this.currentView;

    public popoverCalendarVisible = false;
    public resources: any[] = [
        {
            fieldExpr: 'Type',
            useColorAsDefault: true,
            allowMultiple: false,
            dataSource: [
                {
                    text: this.l('Event'),
                    id: ActivityType.Event,
                    color: '#727bd2'
                },
                {
                    text: this.l('Task'),
                    id: ActivityType.Task,
                    color: '#32c9ed'
                }
            ],
            label: this.l('Type')
        }
    ];
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: true,
            action: () => {
                this.showActivityDialog(new Date());
            },
            label: this.l('AddNewTask')
        }
    ];
    public searchValue: string;
    public totalCount: number;
    toolbarConfig: ToolbarGroupModel[];
    layoutTypes = DataLayoutType;
    readonly activityFields: KeysEnum<ActivityDto> = ActivityFields;
    showUserActivitiesOnly = false;

    constructor(
        injector: Injector,
        private activityProxy: ActivityServiceProxy,
        private filtersService: FiltersService,
        private store$: Store<AppStore.State>,
        private permissionCheckerService: PermissionCheckerService,
        private changeDetectorRef: ChangeDetectorRef,
        public  pipelineService: PipelineService,
        public appService: AppService,
        public dialog: MatDialog
    ) {
        super(injector);
        if (this.permissionCheckerService.isGranted(AppPermissions.CRMManageEventsAssignments)) {
            this.store$.dispatch(new ActivityAssignedUsersStoreActions.LoadRequestAction(false));
        }
        if (abp.clock.provider.supportsMultipleTimezone)
            this.timezone = abp.timing.timeZoneInfo.iana.timeZoneId;

        this.updateCalendarCaption();
        this.initDataSource();
    }

    toggleToolbar() {
        setTimeout(() => this.repaint(), 0);
        this.filtersService.fixed = false;
        this.filtersService.disable();
        this.initToolbarConfig();
    }

    initDataSource() {
        this.dataSource = new DataSource({
            paginate: false,
            requireTotalCount: false,
            select: Object.keys(this.activityFields),
            onLoadError: (error) => {
                this.httpInterceptor.handleError(error);
            },
            store: new ODataStore({
                key: this.activityFields.Id,
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    this.startLoading();
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    let customize = ['DELETE', 'PATCH'].indexOf(request.method);
                    if (customize >= 0) {
                        if (customize)
                            request.method = 'POST';
                        let endpoint = this.parseODataURL(request.url);
                        request.url = endpoint.url + 'api/services/CRM/Activity/'
                            + (customize ? 'Move' : 'Delete?Id=' + endpoint.id);
                    } else {
                        if (this.showUserActivitiesOnly)
                            request.params['assignedUserIds[0]'] = this.appSession.userId;
                        request.params.$filter = buildQuery(
                            {
                                filter: [
                                    {
                                        or: [
                                            {and: [{StartDate: {le: this.getEndDate()}}, {EndDate: {ge: this.getStartDate()}}]}
                                        ]
                                    }
                                ]
                            }
                        ).split('=').pop();
                    }
                },
                deserializeDates: false,
                onLoaded: (res) => {
                    this.finishLoading();
                    if (res instanceof Array) {
                        this.totalCount = res && res.length;
                        res.forEach((record) => {
                            if (record.StartDate == record.EndDate)
                                record.EndDate = undefined;
                            record.fieldTimeZone = 'Etc/UTC';
                        });
                        this.changeDetectorRef.detectChanges();
                    }
                },
                errorHandler: (error) => {
                    setTimeout(() => this.isDataLoaded = true);
                }
            })
        });
    }

    parseODataURL(url) {
        let parts = url.split('odata');
        return {
            id: parts.pop().replace(/\D/g, ''),
            url: parts.pop()
        };
    }

    getCurrentDate(isStartDate = true) {
        let period = <any>this.getPeriodType(),
            date = moment.utc(this.currentDate.toDateString());
        if (['month', 'week'].includes(period))
            date = date[isStartDate ? 'startOf' : 'endOf'](period).add(
                !this.showPipeline && period == 'month' ? (isStartDate ? -10 : 10) : 0, 'days');

        return date.toDate();
    }

    getPeriodType() {
        if (!this.currentView) {
            return 'month';
        }

        return this.currentView == 'agenda' ? 'day' : this.currentView;
    }

    getStartDate() {
        return DateHelper.removeTimezoneOffset(this.getCurrentDate(), true, 'from');
    }

    getEndDate() {
        return DateHelper.removeTimezoneOffset(this.getCurrentDate(false), true, 'to');
    }

    isSameDate(start, end) {
        if (start && end)
            return moment(start).format('MMM DD') == moment(end).format('MMM DD');
        return true;
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before',
                items: [
                    {
                        name: 'filters',
                        action: () => {
                            this.filtersService.fixed = !this.filtersService.fixed;
                        },
                        options: {
                            visible: false,
                            checkPressed: () => {
                                return this.filtersService.fixed;
                            },
                            mouseover: () => {
                                this.filtersService.enable();
                            },
                            mouseout: () => {
                                if (!this.filtersService.fixed)
                                    this.filtersService.disable();
                            }
                        },
                        attr: {
                            'filter-selected': this.filtersService.hasFilterSelected
                        }
                    }
                ]
            },
            {
                location: 'center',
                areItemsDependent: true,
                items: [
                    {
                        name: 'calendar-navigator-left',
                        widget: 'dxButton',
                        options: {
                            icon: 'chevronprev'
                        },
                        action: () => {
                            this.updateCurrentDate(-1);
                        },
                        attr: {
                            'class': 'bold'
                        }
                    },
                    {
                        name: 'calendar-navigator-body',
                        widget: 'dxButton',
                        options: {
                            text: this.calendarCaption
                        },
                        action: () => {
                            this.popoverCalendarVisible = true;
                        },
                        attr: {
                            'id': 'calendar-navigator-body',
                            'class': 'bold'
                        }
                    },
                    {
                        name: 'calendar-navigator-right',
                        widget: 'dxButton',
                        options: {
                            icon: 'chevronnext'
                        },
                        action: () => {
                            this.updateCurrentDate(1);
                        },
                        attr: {
                            'class': 'bold'
                        }
                    },
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        widget: 'dxTextBox',
                        disabled: false,
                        options: {
                            width: 250,
                            height: 40,
                            readOnly: true,
                            visible: ['day', 'week'].includes(this.currentView),
                            value: this.l('CellDurationMinutes') + ':'
                        }
                    },
                    {
                        widget: 'dxNumberBox',
                        options: {
                            width: 60,
                            height: 40,
                            visible: ['day', 'week'].includes(this.currentView),
                            value: this.cellDuration,
                            showSpinButtons: true,
                            onValueChanged: event => {
                                this.cellDuration = event.value;
                            },
                            step: 5,
                            max: 60,
                            min: 5
                        }
                    }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                areItemsDependent: false,
                items: [
                    {
                        widget: 'dxCheckBox',
                        options: {
                            visible: true,
                            value: this.showUserActivitiesOnly,
                            width: '150px',
                            elementAttr: {style: 'margin-right: 15px;'},
                            text: this.l('My Activities'),
                            onValueChanged: (event) => {
                                this.showUserActivitiesOnly = event.value;
                                if (this.showPipeline)
                                    this.setPipelineDataSource();
                                else
                                    this.refresh();
                            }
                        }
                    }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'actions',
                        widget: 'dxDropDownMenu',
                        disabled: !this.permissionCheckerService.isGranted(AppPermissions.CRMManageEventsAssignments) ||
                            this.dataLayoutType !== DataLayoutType.Pipeline || !this.selectedEntities.length,
                        options: {
                            items: [
                                {
                                    text: this.l('Delete'),
                                    disabled: this.selectedEntities.length > 1 && !this.isGranted(AppPermissions.CRMBulkUpdates),
                                    action: this.deleteTasks.bind(this)
                                }
                            ]
                        }
                    }
                ]
            },
            {
                location: 'after',
                areItemsDependent: true,
                items: [
                    {
                        name: 'Day',
                        widget: 'dxButton',
                        options: {
                            text: 'Day',
                            checkPressed: () => {
                                return (this.currentView == 'day');
                            }
                        },
                        action: () => {
                            this.onViewChanged('day');
                        }
                    },
                    {
                        name: 'Week',
                        widget: 'dxButton',
                        options: {
                            text: 'Week',
                            checkPressed: () => {
                                return (this.currentView == 'week');
                            }
                        },
                        action: () => {
                            this.onViewChanged('week');
                        }
                    },
                    {
                        name: 'Month',
                        widget: 'dxButton',
                        options: {
                            text: 'Month',
                            checkPressed: () => {
                                return (this.currentView == 'month');
                            }
                        },
                        action: () => {
                            this.onViewChanged('month');
                        }
                    },
                    {
                        name: 'Agenda',
                        widget: 'dxButton',
                        options: {
                            text: 'Agenda',
                            checkPressed: () => {
                                return (this.currentView == 'agenda');
                            }
                        },
                        action: () => {
                            this.onViewChanged('agenda');
                        }
                    }
                ]
            },
            {
                location: 'after',
                areItemsDependent: true,
                items: [
                    {
                        name: 'pipeline',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Pipeline),
                        options: {
                            checkPressed: () => {
                                return (this.dataLayoutType == DataLayoutType.Pipeline);
                            }
                        }
                    },
                    {
                        name: 'dataGrid',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.DataGrid),
                        options: {
                            checkPressed: () => {
                                return (this.dataLayoutType == DataLayoutType.DataGrid);
                            }
                        }
                    }
                ]
            }
        ];
        this.changeDetectorRef.detectChanges();
    }

    deleteTasks() {
        this.message.confirm(
            this.l('TasksDeleteWarningMessage'), '',
            isConfirmed => {
                if (isConfirmed) {
                    this.startLoading();
                    forkJoin(this.selectedEntities.map((entity) => this.activityProxy.delete(entity.Id))).pipe(
                        finalize(() => this.finishLoading())
                    ).subscribe(() => {
                        this.refresh();
                        this.notify.success(this.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
    }

    toggleCompactView() {
        this.pipelineService.toggleContactView();
    }

    repaintDataGrid(delay = 0) {
        setTimeout(() => this.schedulerComponent.instance.repaint(), delay);
    }

    toggleFullScreen() {
        !this.showPipeline && this.repaintDataGrid(100);
    }

    onAppointmentFormCreated(event) {
        event.component.hideAppointmentPopup(false);
        this.showActivityDialog(event.appointmentData);
    }

    toggleDataLayout(dataLayoutType: DataLayoutType) {
        this.pipelineService.toggleDataLayoutType(dataLayoutType);
        let showPipeline = dataLayoutType == DataLayoutType.Pipeline;
        if (this.showPipeline != showPipeline) {
            this.dataLayoutType = dataLayoutType;
            this.showPipeline = showPipeline;
            if (this.showPipeline) {
                if (!this.pipelineDataSource || this.pipelineView != this.currentView || this.pipelineDate != this.currentDate) {
                    this.pipelineView = this.currentView;
                    this.pipelineDate = new Date(this.currentDate);
                    this.setPipelineDataSource(!!this.pipelineDataSource);
                }
            } else {
                this.schedulerComponent.instance.option('dataSource', null);
                if (!this.currentView) {
                    this.scheduleView = this.currentView = 'month';
                    this.updateCalendarCaption();
                } else if (this.scheduleView != this.currentView)
                    this.scheduleView = this.currentView;

                if (this.scheduleDate != this.currentDate)
                    this.scheduleDate = new Date(this.currentDate);

                //this is done to prevent double data retrieving after settings scheduleView and scheduleDate
                setTimeout(() => this.schedulerComponent.instance.option('dataSource', this.dataSource));
            }
        }
    }

    setPipelineDataSource(refresh: boolean = true) {
        let dataSource = {
            uri: this.dataSourceURI,
            requireTotalCount: true,
            store: {
                type: 'odata',
                key: this.activityFields.Id,
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    if (this.showUserActivitiesOnly)
                        request.params['assignedUserIds[0]'] = this.appSession.userId;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                deserializeDates: false,
                paginate: true
            }
        };
        if (this.pipelineView)
            dataSource['customFilter'] = { 
                odata: {and: [{ StartDate: { le: this.getEndDate() } }, { EndDate: { ge: this.getStartDate() } }]},
                params: this.showUserActivitiesOnly ? {'assignedUserIds[0]': this.appSession.userId} : {}
            };

        this.pipelineDataSource = dataSource;

        if (refresh)
            this.pipelineComponent.refresh();
    }

    showActivityDialog(appointment) {
        this.schedulerComponent.instance.hideAppointmentTooltip();
        this.dialog.open(CreateActivityDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                stages: this.stages,
                appointment: appointment instanceof Date
                    ? { startDate: appointment }
                    : (appointment.entity || appointment) as ActivityDto,
                refreshParent: this.refresh.bind(this)
            }
        });
    }

    refresh(stageId?: number) {
        if (this.showPipeline) {
            if (this.pipelineDataSource)
                this.pipelineComponent.refresh(stageId);
        } else
            this.schedulerComponent.instance.getDataSource().reload();
        this.selectedEntities = [];
        this.initToolbarConfig();
    }

    repaint() {
        let instance = this.schedulerComponent.instance,
            initialHeight = instance.option('height');

        instance.option('height', '0px');
        setTimeout(() => instance.option('height', initialHeight));
    }

    activate() {
        this.filtersService.fixed = false;
        this.appService.hideSubscriptionCallback = () => {
            if (!this.showPipeline)
                this.repaint();
        };

        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();
        this.activityStagesLoad();
        this.pipelineComponent.detectChanges();
    }

    deactivate() {
        this.appService.hideSubscriptionCallback = null;
        this.rootComponent.overflowHidden();
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.activate();
    }

    ngOnDestroy() {
        this.deactivate();
    }

    activityStagesLoad() {
        this.pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.activity, null)
            .subscribe((result: PipelineDto) => {
                this.stages = result.stages.map((stage: StageDto) => {
                    return {
                        id: stage.id,
                        index: stage.sortOrder,
                        name: stage.name
                    };
                });
            });
    }

    deleteAppointment(event, appointment: ActivityDto) {
        event.stopPropagation();
        if (appointment) {
            let instance = this.schedulerComponent.instance;
            instance.hideAppointmentTooltip();
            instance.deleteAppointment(appointment);
        }
    }

    getDateWithTimezone(value) {
        return new Date(moment(value).format('YYYY-MM-DD HH:mm:ss'));
    }

    onViewChanged(view: string) {
        if (this.showPipeline && this.currentView == view)
            this.currentView = null;
        else
            this.currentView = view;

        if (this.showPipeline) {
            this.pipelineView = this.currentView;
            this.setPipelineDataSource();
        } else {
            this.scheduleView = this.currentView;
        }

        this.updateCalendarCaption();
        this.initToolbarConfig();
    }

    currentDateChange() {
        if (this.showPipeline) {
            this.pipelineDate = new Date(this.currentDate);
            if (this.pipelineView)
                this.setPipelineDataSource();
        } else {
            this.scheduleDate = new Date(this.currentDate);
        }

        this.updateCalendarCaption();
        this.initToolbarConfig();
        this.popoverCalendarVisible = false;
    }

    onAppointmentUpdating(event) {
        if (this.currentView == 'month') {
            if (event.newData.AllDay) {
                event.newData.StartDate = DateHelper.removeTimezoneOffset(new Date(event.newData.StartDate), true, 'from').toISOString();
                event.newData.EndDate = DateHelper.removeTimezoneOffset(new Date(event.newData.EndDate), true, 'from').toISOString();
            } else
            if (Date.parse(event.newData.StartDate) - Date.parse(event.newData.EndDate)
                == Date.parse(event.oldData.StartDate) - Date.parse(event.oldData.EndDate)
            ) {
                event.newData.StartDate = DateHelper.addTimezoneOffset(new Date(event.newData.StartDate), true).toISOString();
                event.newData.EndDate = DateHelper.addTimezoneOffset(new Date(event.newData.EndDate), true).toISOString();
            }
        }
    }

    updateCurrentDate(direction: 1 | -1) {
        let newDate = new Date(this.currentDate);
        switch (this.currentView) {
            case 'agenda':
            case 'day':
                newDate.setDate(newDate.getDate() + direction);
                break;
            case 'week':
                newDate.setDate(newDate.getDate() + (direction * 7));
                break;
            case 'month':
                newDate.setDate(1);
                newDate.setMonth(newDate.getMonth() + direction);
                break;
        }

        this.currentDate = newDate;
        if (!this.calendarInitialized)
            this.currentDateChange();
    }

    updateCalendarCaption() {
        let momentDate = moment.utc(this.currentDate.toDateString());
        switch (this.currentView) {
            case 'agenda':
            case 'day':
                this.calendarCaption = momentDate.format('D MMMM YYYY');
                break;
            case 'week':
                let weekStart = momentDate.startOf('week');
                let weekEnd = momentDate.endOf('week');
                if (weekStart.month() == momentDate.month() && weekEnd.month() == momentDate.month()) {
                    this.calendarCaption = `${weekStart.date()} - ${weekEnd.date()} ${momentDate.format('MMMM YYYY')}`;
                } else {
                    this.calendarCaption = `${weekStart.date()} ${weekStart.format('MMM')} - ${weekEnd.date()} ${weekEnd.format('MMM')} ${weekEnd.year()}`;
                }
                break;
            case 'month':
                this.calendarCaption = momentDate.format('MMMM YYYY');
                break;
            default:
                this.calendarCaption = 'All period';
        }
    }

    updateTotalCount(totalCount: number) {
        this.totalCount = totalCount;
    }
}