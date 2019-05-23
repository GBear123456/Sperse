/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    EventEmitter,
    Inject,
    Output,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs';
import extend from 'lodash/extend';

/** Application imports */
import {
    CommonLookupServiceProxy,
    FindUsersInput,
    NameValueDto,
    PagedResultDtoOfNameValueDto
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

export interface ICommonLookupModalOptions {
    title?: string;
    isFilterEnabled?: boolean;
    load: (options) => Promise<any>;
    canSelect?: (item: NameValueDto) => boolean | Observable<boolean>;
    tenantId?: number;
    filterText?: string;
}

@Component({
    selector: 'commonLookupModal',
    styleUrls: ['./common-lookup-modal.component.less'],
    templateUrl: './common-lookup-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommonLookupModalComponent {
    @Output() itemSelected: EventEmitter<NameValueDto> = new EventEmitter<NameValueDto>();
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    dataSource: DataSource;
    defaultOptions: ICommonLookupModalOptions = {
        filterText: '',
        title: this.ls.l('SelectAUser'),
        load: (loadOptions) => {
            return this._commonLookupService.findUsers(new FindUsersInput({
                filter: this.data.filterText || undefined,
                maxResultCount: loadOptions.take,
                skipCount: loadOptions.skip,
                tenantId: this.data.tenantId
            })).toPromise().then(response => {
                return {
                    data: response.items,
                    totalCount: response.totalCount
                };
            });
        },
        canSelect: () => true,
        isFilterEnabled: true
    };

    constructor(
        private _commonLookupService: CommonLookupServiceProxy,
        private _changeDetectorRef: ChangeDetectorRef,
        private dialogRef: MatDialogRef<CommonLookupModalComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: ICommonLookupModalOptions
    ) {
        this.data = extend(this.defaultOptions, this.data);
        this.dataSource = new DataSource({
            key: 'value',
            load: this.data.load
        });
    }

    refreshTable(): void {
        this.dataSource.reload();
    }

    close(): void {
        this.dialogRef.close();
    }

    selectItem(item: NameValueDto) {
        const boolOrPromise = this.data.canSelect(item);
        if (!boolOrPromise) {
            return;
        }

        if (boolOrPromise === true) {
            this.itemSelected.emit(item);
            this.close();
            return;
        }

        //assume as observable
        (boolOrPromise as Observable<boolean>)
            .subscribe(result => {
                if (result) {
                    this.itemSelected.emit(item);
                    this.close();
                }
            });
    }
}
