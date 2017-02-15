import { Component, ViewChild, Injector, Output, EventEmitter, ElementRef, AfterViewInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ng2-bootstrap';
import { Observable } from 'rxjs/Observable';
import { PagedResultDtoOfNameValueDto, NameValueDto } from '@shared/service-proxies/service-proxies';
import { JTableHelper } from '@shared/helpers/JTableHelper';
import { AppConsts } from '@shared/AppConsts';

export interface ICommonLookupModalOptions {
    title?: string;
    isFilterEnabled?: boolean;
    dataSource: (skipCount: number, maxResultCount: number, filter: string, tenantId?: number) => Observable<PagedResultDtoOfNameValueDto>;
    canSelect?: (item: NameValueDto) => boolean | Observable<boolean>;
    loadOnStartup?: boolean;
    pageSize?: number;
}

@Component({
    selector: 'commonLookupModal',
    templateUrl: './common-lookup-modal.component.html'
})
export class CommonLookupModalComponent extends AppComponentBase {

    static defaultOptions: ICommonLookupModalOptions = {
        dataSource: null,
        canSelect: () => true,
        loadOnStartup: true,
        isFilterEnabled: true,
        pageSize: AppConsts.grid.defaultPageSize
    };

    @Output() itemSelected: EventEmitter<NameValueDto> = new EventEmitter<NameValueDto>();

    @ViewChild('modal') modal: ModalDirective;
    @ViewChild('table') table: ElementRef;

    private _$table: JQuery;

    options: ICommonLookupModalOptions;

    filterText: string = '';
    tenantId?: number;
    loading = false;

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    configure(options: ICommonLookupModalOptions): void {
        this.options = $.extend(
            true,
            {
                title: this.l('SelectAnItem')
            },
            CommonLookupModalComponent.defaultOptions,
            options
        );
    }

    show(): void {
        if (!this.options) {
            throw Error('Should call CommonLookupModalComponent.configure once before CommonLookupModalComponent.show!');
        }

        //this.filterText = '';
        this.modal.show();
        this.createTableIfNeeded();
        if (this.options.loadOnStartup) {
            this.refreshTable();
        }
    }

    refreshTable(): void {
        this._$table.jtable('load');
    }

    close(): void {
        this.modal.hide();
    }

    createTableIfNeeded(): void {
        if (this._$table) {
            return;
        }

        this._$table = $(this.table.nativeElement);
        this._$table.jtable({
            title: this.options.title,
            paging: true,
            pageSize: this.options.pageSize,

            actions: {
                listAction: (postData, jtParams: JTableParams) => {
                    this.loading = true;
                    return JTableHelper.toJTableListAction(
                        this.options
                            .dataSource(jtParams.jtStartIndex, jtParams.jtPageSize, this.filterText, this.tenantId)
                            .finally(() => this.loading = false)
                    );
                }
            },

            fields: {
                select: {
                    title: this.l('Select'),
                    width: '10%',
                    display: (data: JTableFieldOptionDisplayData<NameValueDto>) => {
                        var $span = $('<span></span>');
                        $('<button class="btn btn-default btn-xs" title="' + this.l('Select') + '"><i class="fa fa-check"></i></button>')
                            .appendTo($span)
                            .click(() => {
                                this.selectItem(data.record);
                            });
                        return $span;
                    }
                },
                name: {
                    title: this.l('Name'),
                    width: '90%'
                }
            }
        });
    }

    selectItem(item: NameValueDto) {
        var boolOrPromise = this.options.canSelect(item);
        if (!boolOrPromise) {
            return;
        }

        if (boolOrPromise === true) {
            this.itemSelected.emit(item);
            this.close();
            return;
        }

        //assume as observable
        this.loading = true;
        (boolOrPromise as Observable<boolean>)
            .finally(() => this.loading = false)
            .subscribe(result => {
                if (result) {
                    this.itemSelected.emit(item);
                    this.close();
                }
            });
    }
}