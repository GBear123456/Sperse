import { Component, OnInit, AfterViewInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TenantServiceProxy, TenantListDto, NameValueDto, CommonLookupServiceProxy, FindUsersInput } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Observable } from 'rxjs/Observable';
import { CreateTenantModalComponent } from './create-tenant-modal.component';
import { EditTenantModalComponent } from './edit-tenant-modal.component';
import { TenantFeaturesModalComponent } from './tenant-features-modal.component'
import { JTableHelper } from '@shared/helpers/JTableHelper';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as moment from "moment";

@Component({
    templateUrl: "./tenants.component.html",
    styleUrls: ["./tenants.component.less"],
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class TenantsComponent extends AppComponentBase implements OnInit, AfterViewInit {

    @ViewChild('impersonateUserLookupModal') impersonateUserLookupModal: CommonLookupModalComponent;
    @ViewChild('createTenantModal') createTenantModal: CreateTenantModalComponent;
    @ViewChild('editTenantModal') editTenantModal: EditTenantModalComponent;
    @ViewChild('tenantFeaturesModal') tenantFeaturesModal: TenantFeaturesModalComponent;

    private _$tenantsTable: JQuery;
    filterText: string;

    constructor(
        injector: Injector,
        private _tenantService: TenantServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _commonLookupService: CommonLookupServiceProxy,
        private _impersonationService: ImpersonationService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.impersonateUserLookupModal.configure({
            title: this.l('SelectAUser'),
            dataSource: (skipCount: number, maxResultCount: number, filter: string, tenantId?: number) => {
                var input = new FindUsersInput();
                input.filter = filter;
                input.maxResultCount = maxResultCount;
                input.skipCount = skipCount;
                input.tenantId = tenantId;
                return this._commonLookupService.findUsers(input);
            }
        });
    }

    ngAfterViewInit(): void {
        let self = this;

        this.filterText = this._activatedRoute.snapshot.queryParams['filterText'] || '';

        var initTenantsTable = () => {
            self._$tenantsTable = $('#TenantsTable');

            self._$tenantsTable.jtable({

                title: self.l('Tenants'),

                paging: true,
                sorting: true,
                multiSorting: true,

                actions: {
                    listAction(postData, jtParams: JTableParams) {
                        return JTableHelper.toJTableListAction(
                            self._tenantService.getTenants(
                                self.filterText,
                                jtParams.jtSorting,
                                jtParams.jtPageSize,
                                jtParams.jtStartIndex
                            )
                        );
                    }
                },

                fields: {
                    id: {
                        key: true,
                        list: false
                    },
                    actions: {
                        title: self.l('Actions'),
                        width: '15%',
                        sorting: false,
                        list: self.permission.isGranted('Pages.Tenants.Edit') || self.permission.isGranted('Pages.Tenants.Delete'),
                        display: (data: JTableFieldOptionDisplayData<TenantListDto>) => {
                            var $span = $('<span></span>');

                            if (self.permission.isGranted("Pages.Tenants.Impersonation")) {
                                var $impersonateButton = $('<button class="btn btn-default btn-xs" title="' + self.l('LoginAsThisTenant') + '"><i class="fa fa-sign-in"></i></button>');
                                $impersonateButton.appendTo($span)
                                    .click(() => {
                                        this.impersonateUserLookupModal.tenantId = data.record.id;
                                        this.impersonateUserLookupModal.show();
                                    });

                                if (!data.record.isActive) {
                                    $impersonateButton.attr("disabled", "disabled");
                                }
                            }

                            if (self.permission.isGranted("Pages.Tenants.Edit")) {
                                $('<button class="btn btn-default btn-xs" title="' + self.l('Edit') + '"><i class="fa fa-edit"></i></button>')
                                    .appendTo($span)
                                    .click(() => {
                                        self.editTenantModal.show(data.record.id);
                                    });
                            }

                            if (self.permission.isGranted("Pages.Tenants.ChangeFeatures")) {
                                $('<button class="btn btn-default btn-xs" title="' + self.l('Features') + '"><i class="fa fa-list"></i></button>')
                                    .appendTo($span)
                                    .click(() => {
                                        self.tenantFeaturesModal.show(data.record.id, data.record.name);
                                    });
                            }

                            if (self.permission.isGranted("Pages.Tenants.Delete")) {
                                $('<button class="btn btn-default btn-xs" title="' + self.l('Delete') + '"><i class="fa fa-trash-o"></i></button>')
                                    .appendTo($span)
                                    .click(() => {
                                        self.deleteTenant(data.record);
                                    });
                            }

                            return $span;
                        }
                    },
                    tenancyName: {
                        title: self.l('TenancyCodeName'),
                        display(data) {
                            var $div = $('<div> ' + data.record.tenancyName + '</div>');
                            if (data.record.connectionString) {
                                $div.prepend($("<i class='fa fa-database' title=\"" + self.l('HasOwnDatabase') + "\"></i>"));
                            }

                            return $div;
                        },
                        width: '18%'
                    },
                    name: {
                        title: self.l('Name'),
                        width: '20%'
                    },
                    editionDisplayName: {
                        title: self.l('Edition'),
                        width: '18%'
                    },
                    isActive: {
                        title: self.l('Active'),
                        width: '9%',
                        display: data => {
                            if (data.record.isActive) {
                                return '<span class="label label-success">' + self.l('Yes') + '</span>';
                            } else {
                                return '<span class="label label-default">' + self.l('No') + '</span>';
                            }
                        }
                    },
                    creationTime: {
                        title: self.l('CreationTime'),
                        width: '20%',
                        display(data) {
                            return moment(data.record.creationTime).format('L');
                        }
                    }
                }

            });

            self.getTenants();
        };

        initTenantsTable();
    }

    getTenants(): void {
        this._$tenantsTable.jtable('load');
    }

    createTenant(): void {
        this.createTenantModal.show();
    };

    deleteTenant(tenant: TenantListDto): void {
        let self = this;
        self.message.confirm(
            self.l('TenantDeleteWarningMessage', tenant.tenancyName),
            isConfirmed => {
                if (isConfirmed) {
                    self._tenantService.deleteTenant(tenant.id).subscribe(() => {
                        self.getTenants();
                        self.notify.success(self.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
    }

    impersonateUser(item: NameValueDto): void {
        this._impersonationService
            .impersonate(
            parseInt(item.value),
            this.impersonateUserLookupModal.tenantId
            );
    }
}