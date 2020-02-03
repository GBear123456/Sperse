import { AfterViewInit, Component, ElementRef, EventEmitter, Injector, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FlatPermissionWithLevelDto, PermissionServiceProxy } from '@shared/service-proxies/service-proxies';
import { AdAutoLoginHostDirective } from '../../../account/auto-login/auto-login.component';

@Component({
    selector: 'permission-combo',
    template:
    `<select #PermissionCombobox
        class="form-control"
        [(ngModel)]="selectedPermission"
        (ngModelChange)="selectedPermissionChange.emit($event)"
        [attr.data-live-search]="true">
            <option value="">{{l('FilterByPermission')}}</option>
            <option *ngFor="let permission of permissions" [value]="permission.name">{{permission.displayName}}</option>
    </select>`
})
export class PermissionComboComponent extends AppComponentBase implements OnInit, AfterViewInit {

    @ViewChild('PermissionCombobox', { static: true }) permissionComboboxElement: ElementRef;

    permissions: FlatPermissionWithLevelDto[] = [];

    @Input() selectedPermission: string = undefined;
    @Output() selectedPermissionChange: EventEmitter<string> = new EventEmitter<string>();

    constructor(
        private _permissionService: PermissionServiceProxy,
        injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {
        let self = this;
        this._permissionService.getAllPermissions(false).subscribe(result => {
            $.each(result.items, (index, item) => {
                item.displayName = Array(item.level + 1).join('---') + ' ' + item.displayName;
            });

            this.permissions = result.items;
            setTimeout(() => {
                $(self.permissionComboboxElement.nativeElement).selectpicker('refresh');
            }, 0);
        });
    }

    ngAfterViewInit(): void {
        $(this.permissionComboboxElement.nativeElement).selectpicker({
            iconBase: 'famfamfam-flag',
            tickIcon: 'fa fa-check'
        });
    }
}
