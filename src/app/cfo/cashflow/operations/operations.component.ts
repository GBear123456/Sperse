import { Component, Injector, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'cashflow-operations',
    templateUrl: './operations.component.html',
    styleUrls: ['./operations.component.less']
})

export class OperationsComponent extends AppComponentBase {
    toolbarItems: any;
    @Output() refreshCashflow: EventEmitter<any> = new EventEmitter();

    toolbarConfig = [
      {location: 'before', items: [
        {name: 'back'}
      ]},
      {location: 'before', items: [
        {name: 'edit'}, {name: 'rules'}, {name: 'expand'}
      ]},
      {location: 'center', items: [
        {name: 'folder'}, {name: 'pen'}
      ]},
      {location: 'center', items: [
        {name: 'more'}
      ]},
      {location: 'after', items: [
        {name: 'refresh', action: this.refresh.bind(this)}
      ]},
      {location: 'after', items: [
        {name: 'download' }, 
        {name: 'print'}
      ]},
      {location: 'after', items: [
        {name: 'box'}, 
        {name: 'pipeline'}, 
        {name: 'grid'}
      ]}
    ];

    constructor(injector: Injector) {
        super(injector);
    }

    refresh() {
        this.refreshCashflow.emit(null);
    }
}