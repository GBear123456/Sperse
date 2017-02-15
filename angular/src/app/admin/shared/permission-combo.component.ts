import { Component, OnInit, AfterViewInit, AfterViewChecked, ElementRef, ViewChild, Injector, Input, Output, EventEmitter } from '@angular/core';
import { PermissionServiceProxy, FlatPermissionWithLevelDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';

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
export class PermissionComboComponent extends AppComponentBase implements OnInit, AfterViewInit, AfterViewChecked {

    @ViewChild('PermissionCombobox') permissionComboboxElement: ElementRef;

    permissions: FlatPermissionWithLevelDto[] = [];
    
    @Input() selectedPermission: string = undefined;
    @Output() selectedPermissionChange: EventEmitter<string> = new EventEmitter<string>();

    constructor(
        private _permissionService: PermissionServiceProxy,
        injector: Injector) {
            super(injector)
    }

    ngOnInit(): void {
        var self = this;
        this._permissionService.getAllPermissions().subscribe(result => {
            $.each(result.items, (index, item) => {
                item.displayName = Array(item.level + 1).join('---') + ' ' + item.displayName;
            });

            this.permissions = result.items;
        });
    }

    ngAfterViewInit(): void {
        $(this.permissionComboboxElement.nativeElement).selectpicker({
            iconBase: "famfamfam-flag",
            tickIcon: "fa fa-check"
        });
    }

    ngAfterViewChecked(): void{
        $(this.permissionComboboxElement.nativeElement).selectpicker('refresh');
    }
}