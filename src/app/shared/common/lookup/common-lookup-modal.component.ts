/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    EventEmitter,
    Injector,
    Inject,
    OnInit,
    Output,
    ViewChild,
    ChangeDetectorRef, OnDestroy
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Table } from 'primeng/table';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    CommonLookupServiceProxy,
    FindUsersInput,
    NameValueDto,
    PagedResultDtoOfNameValueDto
} from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/components/paginator/paginator';
import { AppComponentBase } from '@shared/common/app-component-base';

export interface ICommonLookupModalOptions {
    title?: string;
    isFilterEnabled?: boolean;
    dataSource: (skipCount: number, maxResultCount: number, filter: string, tenantId?: number) => Observable<PagedResultDtoOfNameValueDto>;
    canSelect?: (item: NameValueDto) => boolean | Observable<boolean>;
    loadOnStartup?: boolean;
    pageSize?: number;
    tenantId?: number;
    filterText?: string;
}

//For more modal options http://valor-software.com/ngx-bootstrap/#/modals#modal-directive

@Component({
    selector: 'commonLookupModal',
    styleUrls: ['./common-lookup-modal.component.less'],
    templateUrl: './common-lookup-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommonLookupModalComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() itemSelected: EventEmitter<NameValueDto> = new EventEmitter<NameValueDto>();
    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;

    defaultOptions: ICommonLookupModalOptions = {
        title: this.l('SelectAUser'),
        dataSource: (skipCount: number, maxResultCount: number, filter: string, tenantId?: number) => {
            const input = new FindUsersInput();
            input.filter = filter;
            input.maxResultCount = maxResultCount;
            input.skipCount = skipCount;
            input.tenantId = tenantId;
            return this._commonLookupService.findUsers(input);
        },
        canSelect: () => true,
        loadOnStartup: true,
        isFilterEnabled: true,
        pageSize: AppConsts.grid.defaultPageSize
    };
    options: ICommonLookupModalOptions;
    filterText: string;

    constructor(
        injector: Injector,
        private _commonLookupService: CommonLookupServiceProxy,
        private _changeDetectorRef: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) private data: any,
        private dialogRef: MatDialogRef<CommonLookupModalComponent>
    ) {
        super(injector);
    }

    ngOnInit() {
        this.configure(this.data);
        if (!this.data.title) {
            this.data.title = this.options.title;
        }
        this.filterText = this.options.filterText;
    }

    private configure(options: ICommonLookupModalOptions): void {
        this.options = $.extend(
            true,
            this.defaultOptions,
            options
        );
    }

    refreshTable(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    close(): void {
        this.dialogRef.close();
    }

    shown(): void {
        this.getRecordsIfNeeds(null);
    }

    getRecordsIfNeeds(event?: LazyLoadEvent): void {
        if (!this.options.loadOnStartup) {
            return;
        }

        this.getRecords(event);
    }

    getRecords(event?: LazyLoadEvent): void {
        const maxResultCount = this.primengTableHelper.getMaxResultCount(this.paginator, event);
        const skipCount = this.primengTableHelper.getSkipCount(this.paginator, event);
        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);
            return;
        }

        this.options
            .dataSource(skipCount, maxResultCount, this.filterText, this.options.tenantId)
            .pipe(
                tap(() => this.startLoading()),
                finalize(() => {
                    this.finishLoading();
                    this._changeDetectorRef.detectChanges();
                })
            )
            .subscribe(result => {
                this.primengTableHelper.totalRecordsCount = result.totalCount;
                this.primengTableHelper.records = result.items;
            });
    }

    selectItem(item: NameValueDto) {
        const boolOrPromise = this.options.canSelect(item);
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
