/** Core imports */
import { Component, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { DxSchedulerComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import { forkJoin } from 'rxjs';
import * as _ from 'underscore';
import * as moment from 'moment';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { UserServiceProxy, ActivityServiceProxy, CreateActivityDto, 
    CreateActivityDtoType, UpdateActivityDto, PipelineDto } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.less'],
    animations: [appModuleAnimation()],
    providers: [ActivityServiceProxy]
})
export class ActivityComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(DxSchedulerComponent) schedulerComponent: DxSchedulerComponent;

    private rootComponent: any;
    private dataLayoutType: DataLayoutType = DataLayoutType.Grid;

    public showPipeline = false;
    public pipelineDataSource: any;
    public pipelinePurposeId = AppConsts.PipelinePurposeIds.activity;
  
    public selectedLeads: any = [];
    public currentDate = new Date();
    public currentView = 'month';
    public resources: any[] = [
        {
            fieldExpr: "type",
            useColorAsDefault: true,
            allowMultiple: false,
            dataSource: [{
                  text: this.l('Event'),
                  id: CreateActivityDtoType.Event,
                  color: "#727bd2"
              }, {
                  text: this.l('Task'),
                  id: CreateActivityDtoType.Task,
                  color: "#32c9ed"
            }],
            label: this.l("Type")
        }
    ];
    public headlineConfig = {
        names: [this.l('Tasks')],
        onRefresh: Function(),
        icon: 'docs',
        buttons: [
            {
                enabled: true,
                action: () => { 
                    this.schedulerComponent.instance
                        .showAppointmentPopup(new Date(), true);
                },
                lable: this.l('AddNewTask')
            }
        ]
    };

    constructor(injector: Injector, 
        private _router: Router,
        private _appService: AppService,
        private _activityProxy: ActivityServiceProxy,
        private _pipelineService: PipelineService,
        private _userServiceProxy: UserServiceProxy
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

        this.initResources();
        this.initDataSource();
    }

    initDataSource() {
        let date = moment(this.currentDate);
        this._activityProxy.getAll(this.appSession.userId, 
            null, null).subscribe((res) => {
            this.dataSource = res.map((item) => {
                item['text'] = item.title;
                return item;
            });
        });    
/*
        this.pipelineDataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                return (new Promise((resolve, reject) => {
                    resolve([]);
                })).then(response => {                    
                    return {
                        data: response,
                        totalCount: 10
                    };
                });
            }
        });     
*/
    }

    initResources() {
        forkJoin(this._pipelineService
            .getPipelineDefinitionObservable(this.pipelinePurposeId),
            this._userServiceProxy.getUsers(false, '', '', undefined, '', undefined, undefined)
        ).subscribe((result) => {
                this.resources.push(
                    {
                        fieldExpr: "stageId",
                        allowMultiple: false,
                        dataSource: result[0].stages.map((item) => {
                            item['text'] = item.name;
                            return item;
                        }),
                        label: this.l("Stage")
                    },
                    {
                        fieldExpr: "assignedUserId",
                        allowMultiple: false,
                        dataSource: result[1].items.map((item) => {
                            item['text'] = item.name + '(' + item.emailAddress + ')';
                            return item;
                        }),
                        label: this.l("Assign")
                    },
                    {
                        fieldExpr: "orderId",
                        allowMultiple: false,
                        dataSource: [],
                        label: this.l("Order")
                    },
                    {
                        fieldExpr: "leadId",
                        allowMultiple: false,
                        dataSource: [],
                        label: this.l("Lead")
                    },
                    {
                        fieldExpr: "customerId",
                        allowMultiple: false,
                        dataSource: [],
                        label: this.l("Customer")
                    }
                )
            }
        );
    }

    initToolbarConfig() {
        this._appService.toolbarConfig = [
            {
                location: 'before', items: [
                    { 
                        name: 'back', 
                        action: Function()
                    }
                ]
            },
            {
                location: 'before', items: [
                    {
                        widget: 'dxDateBox',
                        options: {
                            acceptCustomValue: false,
                            adaptivityEnabled: true,
                            value: this.currentDate,
                            onValueChanged: (event) => {
                                this.currentDate = event.value;
                            }
                        }
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'select-box',
                        widget: 'dxDropDownMenu',
                        options: {
                            width: 120,
                            selectedIndex: this.currentView.length - 3,
                            onSelectionChanged: (event) => {
                                this.currentView = event.itemData.text.toLowerCase();
                            },
                            items: [
                                { text: this.l('Day') }, 
                                { text: this.l('Week') }, 
                                { text: this.l('Month') }, 
                                { text: this.l('Agenda') }
                            ]
                        }
                    },
                    {
                        name: 'download',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Download'),
                            items: [{
                                action: Function(),
                                text: this.l('Save as PDF'),
                                icon: 'pdf',
                            }, {
                                action: this.exportToXLS.bind(this),
                                text: this.l('Export to Excel'),
                                icon: 'xls',
                            }, {
                                action: this.exportToCSV.bind(this),
                                text: this.l('Export to CSV'),
                                icon: 'sheet'
                            }, {
                                action: this.exportToGoogleSheet.bind(this),
                                text: this.l('Export to Google Sheets'),
                                icon: 'sheet'
                            }, { type: 'downloadOptions' }]
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
                            },
                        }
                    },
                    {
                        name: 'grid',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Grid),
                        options: {
                            checkPressed: () => {
                                return (this.dataLayoutType == DataLayoutType.Grid);
                            },
                        }
                    }
                ]
            }
        ];
    }

    onAppointmentAdding($event) {
        let data = $event.appointmentData;
        $event.cancel = this._activityProxy.create(
            CreateActivityDto.fromJS({
                type: data.type,
                title: data.text,
                description: data.description,
                assignedUserId: data.assignedUserId,
                startDate: data.startDate,
                endDate: data.endDate,
                stageId: data.stageId,
                leadId: data.leadId,
                orderId: data.orderId,
                customerId: data.customerId
            })
        ).toPromise().then((res) => {
            data.id = res;
        }).catch(err => {
            this.schedulerComponent.instance
                .hideAppointmentPopup(false);
            return true;
        });
    }

    onAppointmentUpdating($event) {
        let data = $event.newData;
        $event.cancel = this._activityProxy.update(
            UpdateActivityDto.fromJS({
                id: data.id,
                type: data.type,
                title: data.text,
                description: data.description,
                assignedUserId: data.assignedUserId,
                startDate: data.startDate,
                endDate: data.endDate,
                stageId: data.stageId,
                leadId: data.leadId,
                orderId: data.orderId,
                customerId: data.customerId
            })
        ).toPromise().catch(err => {
            this.schedulerComponent.instance
                .hideAppointmentPopup(false);
            return true;
        });
    }

    onAppointmentDeleting($event) {
        $event.cancel = this._activityProxy
            .delete($event.appointmentData.id)
                .toPromise().catch(err => {
                    return true;
                });
    }

    onOptionChanged($event) {
        //!!VP this part fix scroll appearance for month view
        if ($event.component.option('currentView') == 'month')
            setTimeout(() => {
                let scroll = $event.element.getElementsByClassName('dx-scrollable-content')[0];
                if (scroll) {
                    scroll.classList.remove('dx-scheduler-scrollable-fixed-content');
                }
                $event.component.getWorkSpaceScrollable().update();
            }, 100);
    }

    toggleDataLayout(dataLayoutType) {
        this.showPipeline = (dataLayoutType == DataLayoutType.Pipeline);
        this.dataLayoutType = dataLayoutType;
    }

    activate() {
        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();
    }

    deactivate() {
        this._appService.toolbarConfig = null;
        this.rootComponent.overflowHidden();
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.activate();
    }

    ngOnDestroy() {
        this.deactivate();
    }

    onStagesLoaded($event) {
    }
}