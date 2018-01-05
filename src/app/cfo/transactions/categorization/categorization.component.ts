import { AppConsts } from '@shared/AppConsts';
import { Component, Input, Output, EventEmitter, Injector, OnInit,  ViewChild, HostBinding } from '@angular/core';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import { DxTreeListComponent } from 'devextreme-angular';
import { FiltersService } from '@shared/filters/filters.service';
import { ClassificationServiceProxy, InstanceType17 } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
  selector: 'categorization',
  templateUrl: 'categorization.component.html',
  styleUrls: ['categorization.component.less'],
  providers: [ClassificationServiceProxy]
})
export class CategorizationComponent extends CFOComponentBase implements OnInit {
    @ViewChild(DxTreeListComponent) categoryList: DxTreeListComponent;
    @Output() close: EventEmitter<any> = new EventEmitter();
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();
    @Output() onTransactionDrop: EventEmitter<any> = new EventEmitter();

    @Input('dragMode')
    set dragMode(value: boolean) {
        if (this.categoryList.instance)
            this.categoryList.instance.option('elementAttr', {
                dropAllowed: value
            });
    }

    categories: any;

    constructor(
        injector: Injector,
        private _filtersService: FiltersService,
        private _classificationServiceProxy: ClassificationServiceProxy
    ) {
        super(injector);       
    }

    ngOnInit() {
        super.ngOnInit();

        this._classificationServiceProxy.getCategories(InstanceType17[this.instanceType], this.instanceId).subscribe((data) => {
            let categories = [];
            if (data.types)
                 _.mapObject(data.types, (item, key) => {
                    categories.push({
                        key: key,
                        parent: 0,
                        name: item.name
                    });
                });
            if (data.groups)
                 _.mapObject(data.groups, (item, key) => {
                    categories.push({
                        key: key + item.typeId,
                        parent: item.typeId,
                        name: item.name
                    });
                });
            if (data.items)
                 _.mapObject(data.items, (item, key) => {
                    categories.push({
                        key: key,
                        parent: item.groupId + 
                            data.groups[item.groupId].typeId,
                        name: item.name
                    });
                });

            this.categories = categories;
        });
    }        

    initDragAndDropEvents($event) {
        $event.element.find('tr[aria-level="2"] .dx-treelist-text-content')
            .off('dragenter').off('dragover').off('dragleave').off('drop')
            .on('dragenter', (e) => {
                e.target.classList.add('drag-hover');
            }).on('dragover', (e) => {
                e.originalEvent.preventDefault(); 
                e.originalEvent.stopPropagation();
            }).on('dragleave', (e) => {
                e.target.classList.remove('drag-hover');
            }).on('drop', (e) => {
                this.onTransactionDrop.emit({
                    categoryId: this.categoryList.instance
                      .getKeyByRowIndex($(e.target).closest('tr').index())
                });
            });
    }
}
