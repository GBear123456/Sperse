import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { GetRolesInput, RoleListDto, RoleServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'role-combo',
    template:
    `<select #RoleCombobox
        class="form-control"
        [(ngModel)]="selectedRole"
        (ngModelChange)="selectedRoleChange.emit($event)"
        [attr.data-live-search]="true"
        jq-plugin="selectpicker">
            <option value="">{{emptyText}}</option>
            <option *ngFor="let role of roles" [value]="role.id">{{role.displayName}}</option>
    </select>`
})
export class RoleComboComponent implements OnInit {
    @ViewChild('RoleCombobox', { static: true }) roleComboboxElement: ElementRef;
    @Input() selectedRole: string = undefined;
    @Input() emptyText = '';
    @Output() selectedRoleChange: EventEmitter<string> = new EventEmitter<string>();
    roles: RoleListDto[] = [];

    constructor(
        private roleService: RoleServiceProxy,
    ) {}

    ngOnInit(): void {
        const self = this;
        this.roleService.getRoles(new GetRolesInput()).subscribe(result => {
            this.roles = result.items;
            setTimeout(() => {
                $(self.roleComboboxElement.nativeElement).selectpicker('refresh');
            }, 0);
        });
    }
}