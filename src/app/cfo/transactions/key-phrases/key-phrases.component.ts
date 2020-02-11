import { Component, Injector, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { DxTreeListComponent } from 'devextreme-angular/ui/tree-list';
import DataSource from 'devextreme/data/data_source';

@Component({
    selector: 'key-phrases',
    templateUrl: 'key-phrases.component.html',
    styleUrls: ['key-phrases.component.less']
})
export class KeyPhrasesComponent extends CFOComponentBase implements OnInit {
    @ViewChild(DxTreeListComponent, { static: true }) keyPhrasesList: DxTreeListComponent;
    @Input() width: string;
    @Input() height: string;
    @Output() filterByKey: EventEmitter<any> = new EventEmitter();

    @Input('filterItems')
    set filterItems(value: any[]) {
        this._keyPhrasesFilterQuery = value;
        this.refreshkeyPhrasesCountDataSource();
    }
    private _keyPhrasesFilterQuery: any[];

    @Output() close: EventEmitter<any> = new EventEmitter();
    keyPhrasesDataSource: any;
    keyPhrasesData = [];

    constructor(
        injector: Injector
    ) {
        super(injector);
        this.keyPhrasesDataSource = new DataSource({
            store: {
                type: 'odata',
                url: this.getODataUrl('TransactionGroup'),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            }
        });
        this.startLoading();
    }

    ngOnInit() {
        this.refreshkeyPhrasesCountDataSource();
    }

    refreshkeyPhrasesCountDataSource() {
        if (this.keyPhrasesDataSource) {
            this.keyPhrasesDataSource.store()['_url'] = this.getODataUrl('TransactionGroup', this._keyPhrasesFilterQuery);
            this.keyPhrasesDataSource.load().done((result) => {
                event.preventDefault();
                this.keyPhrasesData = result;
            });
        }
    }

    onCellClick(event) {
        this.filterByKey.emit(event);
    }
}
