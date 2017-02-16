import { Component, AfterViewInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { AuditLogServiceProxy, AuditLogListDto } from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FileDownloadService } from '@shared/utils/file-download.service';
import { AuditLogDetailModalComponent } from '@app/admin/audit-logs/audit-log-detail-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as moment from "moment";
import { JTableHelper } from '@shared/helpers/JTableHelper';

@Component({
    templateUrl: "./audit-logs.component.html",
    styleUrls: ["./audit-logs.component.less"],
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class AuditLogsComponent extends AppComponentBase implements AfterViewInit {

    @ViewChild('auditLogDetailModal') auditLogDetailModal: AuditLogDetailModalComponent;

    //Filters
    public startDate: moment.Moment = moment().startOf("day");
    public endDate: moment.Moment = moment().endOf("day");
    public username: string;
    public serviceName: string;
    public methodName: string;
    public browserInfo: string;
    public hasException: boolean = undefined;
    public minExecutionDuration: number;
    public maxExecutionDuration: number;

    private _$auditLogsTable: JQuery;

    constructor(
        injector: Injector,
        private _auditLogService: AuditLogServiceProxy,
        private _notifyService: NotifyService,
        private _fileDownloadService: FileDownloadService
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        let self = this;

        let initAuditLogsTable = () => {
            self._$auditLogsTable = $('#AuditLogsTable');

            self._$auditLogsTable.jtable({

                title: self.l('Roles'),

                paging: true,
                sorting: true,
                multiSorting: true,

                actions: {
                    listAction(postData, jtParams: JTableParams) {
                        return JTableHelper.toJTableListAction(self._auditLogService.getAuditLogs(
                            self.startDate,
                            self.endDate,
                            self.username,
                            self.serviceName,
                            self.methodName,
                            self.browserInfo,
                            self.hasException,
                            self.minExecutionDuration,
                            self.maxExecutionDuration,
                            jtParams.jtSorting,
                            jtParams.jtPageSize,
                            jtParams.jtStartIndex
                        ));
                    }
                },

                fields: {
                    id: {
                        key: true,
                        list: false
                    },
                    actions: {
                        title: '',
                        width: '5%',
                        sorting: false,
                        display: function (data) {
                            var $div = $('<div class=\"text-center\"></div>');

                            $div.append('<button class="btn btn-default btn-xs"><i class="fa fa-search"></i></button>')
                                .click(function () {
                                    self.showDetails(data.record);
                                });

                            return $div;
                        }
                    },
                    exception: {
                        title: '',
                        width: '5%',
                        sorting: false,
                        display: function (data) {
                            var $div = $('<div class=\"text-center\"></div>');

                            if (data.record.exception) {
                                $div.append('<i class="fa fa-warning font-yellow-gold"></i>');
                            } else {
                                $div.append('<i class="fa fa-check-circle font-green"></i>');
                            }

                            return $div;
                        }
                    },
                    executionTime: {
                        title: self.l('Time'),
                        width: '13%',
                        display: function (data) {
                            return moment(data.record.executionTime).format('YYYY-MM-DD HH:mm:ss');
                        }
                    },
                    userName: {
                        title: self.l('UserName'),
                        width: '10%'
                    },
                    serviceName: {
                        title: self.l('Service'),
                        width: '17%',
                        sorting: false
                    },
                    methodName: {
                        title: self.l('Action'),
                        width: '10%',
                        sorting: false
                    },
                    executionDuration: {
                        title: self.l('Duration'),
                        width: '5%',
                        display: function (data) {
                            return self.l('Xms', data.record.executionDuration);
                        }
                    },
                    clientIpAddress: {
                        title: self.l('IpAddress'),
                        width: '10%',
                        sorting: false
                    },
                    clientName: {
                        title: self.l('Client'),
                        width: '10%',
                        sorting: false
                    },
                    browserInfo: {
                        title: self.l('Browser'),
                        width: '15%',
                        sorting: false,
                        display: (data: JTableFieldOptionDisplayData<AuditLogListDto>) => {
                            return $('<span></span>')
                                .attr('title', data.record.browserInfo)
                                .text(abp.utils.truncateStringWithPostfix(data.record.browserInfo, 20));
                        }
                    }
                }
            });

            self.getAuditLogs();
        };

        initAuditLogsTable();
    }

    showDetails(record: AuditLogListDto): void {
        this.auditLogDetailModal.show(record);
    }

    getAuditLogs(): void {
        this._$auditLogsTable.jtable('load');
    }

    exportToExcel(): void {
        let self = this;
        self._auditLogService.getAuditLogsToExcel(
            self.startDate,
            self.endDate,
            self.username,
            self.serviceName,
            self.methodName,
            self.browserInfo,
            self.hasException,
            self.minExecutionDuration,
            self.maxExecutionDuration,
            undefined,
            undefined,
            undefined)
            .subscribe(result => {
                self._fileDownloadService.downloadTempFile(result);
            });
    }
}