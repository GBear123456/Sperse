/** Core imports */
import { Component, Injector, OnInit, Input, Output, EventEmitter } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { KeyPhrasesDto } from '@app/cfo/transactions/key-phrases/key-phrases-dto.interface';
import { KeyPhrasesFields } from '@app/cfo/transactions/key-phrases/key-phrases-fields.enum';

@Component({
    selector: 'key-phrases',
    templateUrl: 'key-phrases.component.html',
    styleUrls: ['key-phrases.component.less']
})
export class KeyPhrasesComponent extends CFOComponentBase implements OnInit {
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
    keyPhrasesDataSource: DataSource;
    keyPhrasesData: KeyPhrasesDto[] = [];
    readonly keyPhrasesFields: KeysEnum<KeyPhrasesDto> = KeyPhrasesFields;

    constructor(
        injector: Injector
    ) {
        super(injector);
        this.keyPhrasesDataSource = new DataSource({
            select: Object.keys(this.keyPhrasesFields),
            store: new ODataStore({
                url: this.getODataUrl('TransactionGroup'),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            })
        });
        this.startLoading();
    }

    ngOnInit() {
        this.refreshkeyPhrasesCountDataSource();
    }

    refreshkeyPhrasesCountDataSource() {
        if (this.keyPhrasesDataSource) {
            this.keyPhrasesDataSource.store()['_url'] = this.getODataUrl('TransactionGroup', this._keyPhrasesFilterQuery);
            this.keyPhrasesDataSource.load().then((result: KeyPhrasesDto[]) => {
                event.preventDefault();
                this.keyPhrasesData = result;
            });
        }
    }

    onCellClick(event) {
        this.filterByKey.emit(event);
    }
}
