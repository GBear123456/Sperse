import { Component, Injector, ViewChild, OnInit, ElementRef, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { IBasicOrganizationUnitInfo } from './basic-organization-unit-info';
import { JTableHelper } from '@shared/helpers/JTableHelper';
import { OrganizationUnitServiceProxy, OrganizationUnitUserListDto, CommonLookupServiceProxy, FindUsersInput, NameValueDto, UserToOrganizationUnitInput } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { IUserWithOrganizationUnit } from './user-with-organization-unit';

@Component({
    selector: 'organization-unit-members',
    templateUrl: "./organization-unit-members.component.html"
})
export class OrganizationUnitMembersComponent extends AppComponentBase implements OnInit {

    @Output() memberRemoved = new EventEmitter<IUserWithOrganizationUnit>();
    @Output() memberAdded = new EventEmitter<IUserWithOrganizationUnit>();

    @ViewChild('memberLookupModal') memberLookupModal: CommonLookupModalComponent;

    private _organizationUnit: IBasicOrganizationUnitInfo = null;
    private _$table: JQuery;

    constructor(
        injector: Injector,
        private _changeDetector: ChangeDetectorRef,
        private _organizationUnitService: OrganizationUnitServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy
    ) {
        super(injector);
    }

    get organizationUnit(): IBasicOrganizationUnitInfo {
        return this._organizationUnit;
    }

    set organizationUnit(ou: IBasicOrganizationUnitInfo) {
        if (this._organizationUnit === ou) {
            return;
        }

        this._organizationUnit = ou;
        if (ou) {
            this.refreshMembers();
        }
    }

    ngOnInit(): void {
        this.memberLookupModal.configure({
            title: this.l('SelectAUser'),
            dataSource: (skipCount: number, maxResultCount: number, filter: string) => {
                var input = new FindUsersInput();
                input.filter = filter;
                input.maxResultCount = maxResultCount;
                input.skipCount = skipCount;
                return this._commonLookupService.findUsers(input);
            },
            canSelect: (item: NameValueDto) => {
                var input = new UserToOrganizationUnitInput();

                input.userId = parseInt(item.value);
                input.organizationUnitId = this.organizationUnit.id;

                return this._organizationUnitService
                    .isInOrganizationUnit(input)
                    .map((value, index) => {
                        if (value) {
                            this.message.warn(this.l('UserIsAlreadyInTheOrganizationUnit'));
                        }

                        return !value;
                    });
            }
        });
    }

    creatTableIfNeeded(): void {
        if (this._$table) {
            return;
        }

        this._$table = $('#OrganizationUnitMembersTable');
        this._$table.jtable({

            title: this.l('Members'),

            paging: true,
            sorting: true,

            actions: {
                listAction: (postData, jtParams: JTableParams) => {
                    return JTableHelper.toJTableListAction(
                        this._organizationUnitService.getOrganizationUnitUsers(
                            this._organizationUnit.id,
                            jtParams.jtSorting,
                            jtParams.jtPageSize,
                            jtParams.jtStartIndex
                        )
                    );
                }
            },

            fields: {
                actions: {
                    title: this.l('Actions'),
                    width: '15%',
                    list: this.isGranted('Pages.Administration.OrganizationUnits.ManageMembers'),
                    display: (data: JTableFieldOptionDisplayData<OrganizationUnitUserListDto>) => {
                        var $span = $('<span></span>');

                        if (this.isGranted('Pages.Administration.OrganizationUnits.ManageMembers')) {
                            $('<button class="btn btn-default btn-xs" title="' + this.l('Delete') + '"><i class="fa fa-trash-o"></i></button>')
                                .appendTo($span)
                                .click(() => {
                                    this.removeMember(data.record);
                                });
                        }

                        return $span;
                    }

                },
                userName: {
                    title: this.l('UserName'),
                    width: '50%'
                },

                addedTime: {
                    title: this.l('AddedTime'),
                    width: '35%',
                    display: data => moment(data.record.addedTime).format('L')
                }
            }
        });
    }

    refreshMembers(): void {
        this.creatTableIfNeeded();
        $('#OrganizationUnitMembersTable').jtable('load');
    }

    openAddModal(): void {
        this.memberLookupModal.show();
    }

    addModalMemberSelected(item: NameValueDto): void {
        let input = new UserToOrganizationUnitInput();
        input.organizationUnitId = this.organizationUnit.id;
        input.userId = parseInt(item.value);
        this._organizationUnitService
            .addUserToOrganizationUnit(input)
            .subscribe(() => {
                this.notify.success(this.l('SuccessfullyAdded'));
                this.memberAdded.emit({
                    userId: input.userId,
                    ouId: input.organizationUnitId
                });
                this.refreshMembers();
            });
    }

    removeMember(user: OrganizationUnitUserListDto): void {
        this.message.confirm(
            this.l('RemoveUserFromOuWarningMessage', user.userName, this.organizationUnit.displayName),
            isConfirmed => {
                if (isConfirmed) {
                    this._organizationUnitService
                        .removeUserFromOrganizationUnit(user.id, this.organizationUnit.id)
                        .subscribe(() => {
                            this.notify.success(this.l('SuccessfullyRemoved'));
                            this.memberRemoved.emit({
                                userId: user.id,
                                ouId: this.organizationUnit.id
                            });
                            this.refreshMembers();
                        });
                }
            }
        );
    }
}