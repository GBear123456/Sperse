import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FlatPermissionWithLevelDto, PermissionServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '../../shared/common/localization/app-localization.service';

@Component({
    selector: 'permission-combo',
    template:
    `<select #PermissionCombobox
        class="form-control"
        [(ngModel)]="selectedPermission"
        (ngModelChange)="selectedPermissionChange.emit($event)"
        [attr.data-live-search]="true">
            <option value="">{{ls.l('FilterByPermission')}}</option>
            <option *ngFor="let permission of permissions" [value]="permission.name">{{permission.displayName}}</option>
    </select>`
})
export class PermissionComboComponent implements OnInit, AfterViewInit {
    @ViewChild('PermissionCombobox', { static: true }) permissionComboboxElement: ElementRef;
    @Input() selectedPermission: string = undefined;
    @Output() selectedPermissionChange: EventEmitter<string> = new EventEmitter<string>();
    permissions: FlatPermissionWithLevelDto[] = [];

    constructor(
        private permissionService: PermissionServiceProxy,
        public ls: AppLocalizationService
    ) {}

    ngOnInit(): void {
        let self = this;
        this.permissionService.getAllPermissions(false).subscribe(result => {
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
