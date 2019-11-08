import { ChangeDetectorRef, Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { AddMemberModalComponent } from '@app/admin/organization-units/add-member-modal/add-member-modal.component';
import { OrganizationUnitServiceProxy, OrganizationUnitUserListDto } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/components/paginator/paginator';
import { Table } from 'primeng/components/table/table';
import { IBasicOrganizationUnitInfo } from '../basic-organization-unit-info';
import { IUserWithOrganizationUnit } from '../user-with-organization-unit';
import { IUsersWithOrganizationUnit } from '../users-with-organization-unit';
import { AppPermissions } from '@shared/AppPermissions';
import { PrimengTableHelper } from '@shared/helpers/PrimengTableHelper';
import { MessageService } from '@abp/message/message.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    selector: 'organization-unit-members',
    templateUrl: './organization-unit-members.component.html'
})
export class OrganizationUnitMembersComponent {

    @Output() memberRemoved = new EventEmitter<IUserWithOrganizationUnit>();
    @Output() membersAdded = new EventEmitter<IUsersWithOrganizationUnit>();

    @ViewChild('addMemberModal') addMemberModal: AddMemberModalComponent;
    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;

    public permissions = AppPermissions;
    private _organizationUnit: IBasicOrganizationUnitInfo = null;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private organizationUnitService: OrganizationUnitServiceProxy,
        private message: MessageService,
        private notify: NotifyService,
        public ls: AppLocalizationService,
        public primengTableHelper: PrimengTableHelper
    ) {}

    get organizationUnit(): IBasicOrganizationUnitInfo {
        return this._organizationUnit;
    }

    set organizationUnit(ou: IBasicOrganizationUnitInfo) {
        if (this._organizationUnit === ou) {
            return;
        }

        this._organizationUnit = ou;
        this.addMemberModal.organizationUnitId = ou.id;
        if (ou) {
            this.refreshMembers();
        }
    }

    getOrganizationUnitUsers(event?: LazyLoadEvent) {
        if (!this._organizationUnit) {
            return;
        }

        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);

            return;
        }

        this.primengTableHelper.showLoadingIndicator();
        this.organizationUnitService.getOrganizationUnitUsers(
            this._organizationUnit.id,
            this.primengTableHelper.getSorting(this.dataTable),
            this.primengTableHelper.getMaxResultCount(this.paginator, event),
            this.primengTableHelper.getSkipCount(this.paginator, event)
        ).subscribe(result => {
            this.primengTableHelper.totalRecordsCount = result.totalCount;
            this.primengTableHelper.records = result.items;
            this.primengTableHelper.hideLoadingIndicator();
        });
    }

    reloadPage(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    refreshMembers(): void {
        this.reloadPage();
    }

    openAddModal(): void {
        this.addMemberModal.show();
    }

    removeMember(user: OrganizationUnitUserListDto): void {
        this.message.confirm(
            this.ls.l('RemoveUserFromOuWarningMessage', user.userName, this.organizationUnit.displayName),
            this.ls.l(('AreYouSure')),
            isConfirmed => {
                if (isConfirmed) {
                    this.organizationUnitService
                        .removeUserFromOrganizationUnit(user.id, this.organizationUnit.id)
                        .subscribe(() => {
                            this.notify.success(this.ls.l(('SuccessfullyRemoved')));
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

    addMembers(data: any): void {
        this.membersAdded.emit({
            userIds: data.userIds,
            ouId: data.ouId
        });

        this.refreshMembers();
    }
}
