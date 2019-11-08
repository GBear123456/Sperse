/** Core imports */
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';

/** Third party imports */
import { ModalDirective } from 'ngx-bootstrap';
import { Table } from 'primeng/components/table/table';

/** Application imports */
import { FindOrganizationUnitUsersInput, NameValueDto, OrganizationUnitServiceProxy, UsersToOrganizationUnitInput } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/components/paginator/paginator';
import { IUsersWithOrganizationUnit } from '../users-with-organization-unit';
import { PrimengTableHelper } from '@shared/helpers/PrimengTableHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    selector: 'addMemberModal',
    templateUrl: './add-member-modal.component.html'
})
export class AddMemberModalComponent {
    @Output() membersAdded: EventEmitter<IUsersWithOrganizationUnit> = new EventEmitter<IUsersWithOrganizationUnit>();
    @ViewChild('modal') modal: ModalDirective;
    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;

    organizationUnitId: number;
    isShown = false;
    filterText = '';
    tenantId?: number;
    saving = false;
    selectedMembers: NameValueDto[];

    constructor(
        private organizationUnitService: OrganizationUnitServiceProxy,
        private notify: NotifyService,
        public ls: AppLocalizationService,
        public primengTableHelper: PrimengTableHelper
    ) {}

    show(): void {
        this.modal.show();
    }

    refreshTable(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    close(): void {
        this.modal.hide();
    }

    shown(): void {
        this.isShown = true;
        this.getRecordsIfNeeds(null);
    }

    getRecordsIfNeeds(event: LazyLoadEvent): void {
        if (!this.isShown) {
            return;
        }

        this.getRecords(event);
    }

    getRecords(event?: LazyLoadEvent): void {

        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);
            return;
        }

        this.primengTableHelper.showLoadingIndicator();

        const input = new FindOrganizationUnitUsersInput();
        input.organizationUnitId = this.organizationUnitId;
        input.filter = this.filterText;
        input.skipCount = this.primengTableHelper.getSkipCount(this.paginator, event);
        input.maxResultCount = this.primengTableHelper.getMaxResultCount(this.paginator, event);

        this.organizationUnitService
            .findUsers(input)
            .subscribe(result => {
                this.primengTableHelper.totalRecordsCount = result.totalCount;
                this.primengTableHelper.records = result.items;
                this.primengTableHelper.hideLoadingIndicator();
            });
    }

    addUsersToOrganizationUnit(): void {
        const input = new UsersToOrganizationUnitInput();
        input.organizationUnitId = this.organizationUnitId;
        input.userIds = this.selectedMembers.map(selectedMember => Number(selectedMember.value));
        this.saving = true;
        this.organizationUnitService
            .addUsersToOrganizationUnit(input)
            .subscribe(() => {
                this.notify.success(this.ls.l(('SuccessfullyAdded')));
                this.membersAdded.emit({
                    userIds: input.userIds,
                    ouId: input.organizationUnitId
                });
                this.saving = false;
                this.close();
                this.selectedMembers = [];
            });
    }
}
