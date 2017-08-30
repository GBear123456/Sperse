import { Component, OnInit, AfterViewInit, Injector, Inject, ViewEncapsulation, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { ActivatedRoute } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CreateOrEditClientModalComponent } from './create-or-edit-client-modal.component';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/filter.model';
import { FilterStatesComponent } from '@shared/filters/states/filter-states.component';

import { CommonLookupServiceProxy } from '@shared/service-proxies/service-proxies';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { DxDataGridComponent } from 'devextreme-angular';
import query from 'devextreme/data/query';

import 'devextreme/data/odata/store';

import * as moment from "moment";

@Component({
  templateUrl: "./clients.component.html",
  styleUrls: ["./clients.component.less"],
  animations: [appModuleAnimation()]
})
export class ClientsComponent extends AppComponentBase implements OnInit, AfterViewInit {
  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
  @ViewChild('createOrEditClientModal') createOrEditClientModal: CreateOrEditClientModalComponent;
	
  constructor(
    injector: Injector,
		private _filtersService: FiltersService,
    private _activatedRoute: ActivatedRoute,
    private _commonLookupService: CommonLookupServiceProxy,
    private _impersonationService: ImpersonationService,		
  ) {
    super(injector, true);

    this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

		this.dataSource = {
      store: {
        type: 'odata',
        url: this.getODataURL('Customer'),
        version: this.getODataVersion(),
        beforeSend: function (request) {
          request.headers["Authorization"] = 'Bearer ' + abp.auth.getToken();
          request.headers["Abp.TenantId"] = abp.multiTenancy.getTenantIdCookie();
        }
      }
    }
  }

  onContentReady(event) {
    event.component.columnOption('command:edit', {
      visibleIndex: -1,
      width: 40
    });
  }
    
	onToolbarPrepare(event) {
		event.toolbarOptions.items.unshift({
      location: 'center',
      widget: 'dxButton',
      options: {
        hint: 'Back',
        icon: 'back',
        onClick: Function
      }
    }, {
      location: 'center',
      widget: 'dxButton',
      options: {
        text: 'Assign',
        icon: 'fa fa-user-o',
        onClick: Function()
      }
    }, {
      location: 'center',
      widget: 'dxButton',
      options: {
        text: 'Status',
        icon: 'fa fa-flag-o',
        onClick: Function()
      }
    }, {
      location: 'center',
      widget: 'dxButton',
      options: {
        text: 'Delete',
        icon: 'fa fa-trash-o',
        onClick: Function()
      }
    }, {
      location: 'after',
      widget: 'dxButton',
      options: {
        hint: 'Refresh',
        icon: 'refresh',
        onClick: this.refreshDataGrid.bind(this)
      }
    });
	}

  refreshDataGrid() {
    this.dataGrid.instance.refresh();
  }

  createClient() {
    this.createOrEditClientModal.show();
  }

  ngOnInit(): void {
    this.filterTabs = [
			'all', 'active', 'archived'
		];

		this._filtersService.setup([
			<FilterModel> {
        component: FilterStatesComponent, 
        caption: 'states', 
        items: {
          country: '', 
          state: ''
        }
      },
			<FilterModel> {component: FilterStatesComponent, caption: 'employee'}, 
			<FilterModel> {component: FilterStatesComponent, caption: 'LeadDate'}
		]);
  }

  ngAfterViewInit(): void {
  }
}