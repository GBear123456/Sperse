import { Component, OnInit, AfterViewInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TenantServiceProxy, TenantListDto, NameValueDto, CommonLookupServiceProxy, FindUsersInput, EntityDtoOfInt64 } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
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
    filters: {
        filterText: string;
        creationDateRangeActive: boolean;
        subscriptionEndDateRangeActive: boolean;
        subscriptionEndDateStart: moment.Moment;
        subscriptionEndDateEnd: moment.Moment;
        creationDateStart: moment.Moment;
        creationDateEnd: moment.Moment;
        selectedEditionId: number;
    } = <any>{};

    constructor(
        injector: Injector,
        private _tenantService: TenantServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _commonLookupService: CommonLookupServiceProxy,
        private _impersonationService: ImpersonationService
    ) {
        super(injector);

        if (this._activatedRoute.snapshot.queryParams['subscriptionEndDateStart'] != null) {
            this.filters.subscriptionEndDateRangeActive = true;
            this.filters.subscriptionEndDateStart = moment(this._activatedRoute.snapshot.queryParams['subscriptionEndDateStart']);
        } else {
            this.filters.subscriptionEndDateStart = moment().startOf('day');
        }

        if (this._activatedRoute.snapshot.queryParams['subscriptionEndDateEnd'] != null) {
            this.filters.subscriptionEndDateRangeActive = true;
            this.filters.subscriptionEndDateEnd = moment(this._activatedRoute.snapshot.queryParams['subscriptionEndDateEnd']);
        } else {
            this.filters.subscriptionEndDateEnd = moment().add(30, 'days').endOf('day');
        }

        if (this._activatedRoute.snapshot.queryParams['creationDateStart'] != null) {
            this.filters.creationDateRangeActive = true;
            this.filters.creationDateStart = moment(this._activatedRoute.snapshot.queryParams['creationDateStart']);
        } else {
            this.filters.creationDateStart = moment().add(-7, 'days').startOf('day')
        }

        if (this._activatedRoute.snapshot.queryParams['creationDateEnd'] != null) {
            this.filters.creationDateRangeActive = true;
            this.filters.creationDateEnd = moment(this._activatedRoute.snapshot.queryParams['creationDateEnd']);
        } else {
            this.filters.creationDateEnd = moment().endOf("day");
        }
    }

    ngOnInit(): void {
        this.filters.filterText = this._activatedRoute.snapshot.queryParams['filterText'] || '';

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
                                self.filters.filterText,
                                self.filters.subscriptionEndDateRangeActive ? self.filters.subscriptionEndDateStart : undefined,
                                self.filters.subscriptionEndDateRangeActive ? self.filters.subscriptionEndDateEnd : undefined,
                                self.filters.creationDateRangeActive ? self.filters.creationDateStart : undefined,
                                self.filters.creationDateRangeActive ? self.filters.creationDateEnd : undefined,
                                self.filters.selectedEditionId,
                                self.filters.selectedEditionId !== undefined && (self.filters.selectedEditionId + "") !== "-1",
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
                        title: this.l('Actions'),
                        width: '15%',
                        sorting: false,
                        type: 'record-actions',
                        cssClass: 'btn btn-xs btn-primary blue',
                        text: '<i class="fa fa-cog"></i> ' + this.l('Actions') + ' <span class="caret"></span>',
                        list: self.permission.isGranted('Pages.Tenants.Edit') || self.permission.isGranted('Pages.Tenants.Delete'),

                        items: [{
                            text: this.l('LoginAsThisTenant'),
                            visible: (): boolean => {
                                return self.permission.isGranted("Pages.Tenants.Impersonation");
                            },
                            enabled(data) {
                                return data.record.isActive;
                            },
                            action(data) {
                                self.impersonateUserLookupModal.tenantId = data.record.id;
                                self.impersonateUserLookupModal.show();
                            }
                        }, {
                            text: this.l('Edit'),
                            visible: (): boolean => {
                                return self.permission.isGranted("Pages.Tenants.Edit");
                            },
                            action(data) {
                                self.editTenantModal.show(data.record.id);
                            }
                        }, {
                            text: this.l('Features'),
                            visible: (): boolean => {
                                return self.permission.isGranted("Pages.Tenants.ChangeFeatures");
                            },
                            action(data) {
                                self.tenantFeaturesModal.show(data.record.id, data.record.name);
                            }
                        }, {
                            text: this.l('Delete'),
                            visible: (): boolean => {
                                return self.permission.isGranted("Pages.Tenants.Delete");
                            },
                            action(data) {
                                self.deleteTenant(data.record);
                            }
                        }, {
                            text: this.l('Unlock'),
                            action(data) {
                                self._tenantService.unlockTenantAdmin(new EntityDtoOfInt64({ id: data.record.id })).subscribe(() => {
                                    self.notify.success(self.l('UnlockedTenandAdmin', data.record.name));
                                });
                            }
                        }]
                    },
                    tenancyName: {
                        title: self.l('TenancyCodeName'),
                        display(data) {
                            var $div = $('<div> ' + data.record.tenancyName + '</div>');
                            if (data.record.hasOwnDatabase) {
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
                    subscriptionEndDateUtc: {
                        title: this.l('SubscriptionEndDateUtc'),
                        width: '15%',
                        display(data) {
                            if (data.record.subscriptionEndDateUtc) {
                                return moment(data.record.subscriptionEndDateUtc).format('L');
                            }

                            return "";
                        }
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
        this.message.confirm(
            this.l('TenantDeleteWarningMessage', tenant.tenancyName),
            isConfirmed => {
                if (isConfirmed) {
                    this._tenantService.deleteTenant(tenant.id).subscribe(() => {
                        this.getTenants();
                        this.notify.success(this.l('SuccessfullyDeleted'));
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