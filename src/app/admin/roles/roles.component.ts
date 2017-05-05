import { Component, AfterViewInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { RoleServiceProxy, RoleListDto } from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FileDownloadService } from '@shared/utils/file-download.service';
import { FlatPermissionWithLevelDto } from '@shared/service-proxies/service-proxies';
import { CreateOrEditRoleModalComponent } from './create-or-edit-role-modal.component';
import { JTableHelper } from '@shared/helpers/JTableHelper';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as moment from "moment";

@Component({
    templateUrl: "./roles.component.html",
    animations: [appModuleAnimation()]
})
export class RolesComponent extends AppComponentBase implements AfterViewInit {

    @ViewChild('createOrEditRoleModal') createOrEditRoleModal: CreateOrEditRoleModalComponent;

    //Filters
    selectedPermission: string = '';

    private _$rolesTable: JQuery;

    constructor(
        injector: Injector,
        private _roleService: RoleServiceProxy,
        private _notifyService: NotifyService,
        private _fileDownloadService: FileDownloadService
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        var self = this;

        var initRolesTable = () => {
            self._$rolesTable = $('#RolesTable');

            self._$rolesTable.jtable({

                title: self.l('Roles'),

                actions: {
                    listAction(postData, jtParams: JTableParams) {
                        return JTableHelper.toJTableListAction(self._roleService.getRoles(
                            self.permission ? self.selectedPermission : undefined
                        ));
                    }
                },

                fields: {
                    id: {
                        key: true,
                        list: false
                    },
                    actions: {
                        title: this.l('Actions'),
                        width: '30%',
                        sorting: false,
                        type: 'record-actions',
                        cssClass: 'btn btn-xs btn-primary blue',
                        text: '<i class="fa fa-cog"></i> ' + this.l('Actions') + ' <span class="caret"></span>',
                        items: [{
                            text: this.l('Edit'),
                            visible: (): boolean => {
                                return self.isGranted('Pages.Administration.Roles.Edit');
                            },
                            action(data) {
                                self.createOrEditRoleModal.show(data.record.id);
                            }
                        }, {
                            text: this.l('Delete'),
                            visible: (): boolean => {
                                return self.isGranted('Pages.Administration.Roles.Delete');
                            },
                            action(data) {
                                self.deleteRole(data.record);
                            }
                        }]
                    },
                    displayName: {
                        title: self.l('RoleName'),
                        width: '35%',
                        display: function (data) {
                            var $span = $('<span></span>');

                            $span.append(data.record.displayName + " &nbsp; ");

                            if (data.record.isStatic) {
                                $span.append('<span class="label label-info" data-toggle="tooltip" title="' + self.l('StaticRole_Tooltip') + '" data-placement="top">' + self.l('Static') + '</span>&nbsp;');
                            }

                            if (data.record.isDefault) {
                                $span.append('<span class="label label-default" data-toggle="tooltip" title="' + self.l('DefaultRole_Description') + '" data-placement="top">' + self.l('Default') + '</span>&nbsp;');
                            }

                            $span.find('[data-toggle=tooltip]').tooltip();

                            return $span;
                        }
                    },
                    creationTime: {
                        title: self.l('CreationTime'),
                        width: '35%',
                        display: function (data) {
                            return moment(data.record.creationTime).format('L');
                        }
                    }
                }
            });

            self.getRoles();
        };

        initRolesTable();
    }

    getRoles(): void {
        this._$rolesTable.jtable('load');
    }

    createRole(): void {
        this.createOrEditRoleModal.show();
    }

    deleteRole(role: RoleListDto): void {
        var self = this;
        self.message.confirm(
            self.l('RoleDeleteWarningMessage', role.displayName),
            function (isConfirmed) {
                if (isConfirmed) {
                    self._roleService.deleteRole(role.id).subscribe(() => {
                        self.getRoles();
                        abp.notify.success(self.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
    }
}