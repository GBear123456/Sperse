/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { ExportGoogleSheetService } from './export-google-sheets/export-google-sheets';
import { Angular5Csv } from './export-csv/export-csv';
import DataSource from 'devextreme/data/data_source';
import DevExpress from 'devextreme/bundles/dx.all';
import capitalize from 'underscore.string/capitalize';
import * as moment from 'moment';
import { exportFromMarkup } from 'devextreme/viz/export';
import { ImageFormat } from '@shared/common/export/image-format.enum';
import * as jsPDF from 'jspdf';
import { PdfExportHeader } from './pdf-export-header.interface';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';

/** Application imports */
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Injectable()
export class ExportService {

    private exportGoogleSheetService: ExportGoogleSheetService;
    private readonly EXPORT_REQUEST_TIMEOUT = 3 * 60 * 1000;

    constructor(
        private injector: Injector,
        private configuration: AppHttpConfiguration,
        private loadingService: LoadingService
    ) {
        this.exportGoogleSheetService = injector.get(ExportGoogleSheetService);
    }

    getFileName(dataGrid?, name?: string, prefix?: string, showItemsInName: boolean = true): string {
        name = name || dataGrid && dataGrid.export.fileName || '';
        let itemsName = showItemsInName
            ? capitalize(location.href.split('/').pop().split('?').shift())
            : '';
        return (prefix ? prefix : '') + itemsName.replace('Leads', 'Contacts') + '_' +
            (!name || name == 'DataGrid' ? '' : name + '_') + moment().local().format('YYYY-MM-DD_hhmmss_a');
    }

    private checkJustifyData(data) {
        return data.map((item) => {
            let result = {};
            for (let field in item)
                if (typeof(item[field]) != 'function') {
                    if (item[field] && item[field].join)
                        result[field] = item[field].map((record) => {
                            return typeof(record) == 'string' ? record :
                                record && record[Object.keys(record).pop()];
                        }).join(';');
                    else if (item[field] instanceof moment)
                        result[field] = item[field].toDate();
                    else
                        result[field] = item[field];
                }
            return result;
        });
    }

    private getDataFromGrid(dataGrid: DxDataGridComponent, callback, exportAllData) {
        if (exportAllData) {
            let initialDataSource = dataGrid.instance.getDataSource(),
                initialStore = initialDataSource.store(),
                initialBeforeSend = initialStore._beforeSend;

            let loadedEvent = initialStore._eventsStrategy._events['loaded'];
            let initialOnLoadedList = [];
            if (loadedEvent && initialDataSource['exportIgnoreOnLoaded']) {
                initialOnLoadedList = initialStore._eventsStrategy._events['loaded']._list;
                initialStore._eventsStrategy._events['loaded']._list = [];
            }

            initialStore._beforeSend = (request) => {
                request.isExport = true;
                initialBeforeSend.call(initialStore, request);
                request.timeout = this.EXPORT_REQUEST_TIMEOUT;
            };
            (new DataSource({
                paginate: false,
                filter: initialDataSource.filter(),
                requireTotalCount: true,
                store: initialStore
            })).load().done(res => {
                initialStore._beforeSend = initialBeforeSend;
                if (initialOnLoadedList.length)
                    initialStore._eventsStrategy._events['loaded']._list = initialOnLoadedList;
                callback(this.checkJustifyData(res));
            }).fail(error => {
                initialStore._beforeSend = initialBeforeSend;
                if (initialOnLoadedList.length)
                    initialStore._eventsStrategy._events['loaded']._list = initialOnLoadedList;
                this.handleExportError(error);
            });
        } else {
            let selection: any = dataGrid.instance.getSelectedRowsData();
            if (selection instanceof Array)
                callback(selection);
            else
                selection.then(callback);
        }
    }

    handleExportError(error: any) {
        this.loadingService.finishLoading();
        let defaultError = this.configuration.defaultError;
        abp.message.error(error && error.errorDetails && error.errorDetails.message
            || defaultError.message + ' ' + defaultError.details, 'Export Error');        
    }

    exportTo(option, type, dataGrid: DxDataGridComponent = null, prefix?: string, showItemsInName?: boolean): Promise<any> {
        this.loadingService.startLoading();
        if (dataGrid && dataGrid.instance && dataGrid.instance.getDataSource().isLoading())
            return new Promise((resolve) => {
                dataGrid.instance.on('contentReady', () => {
                    dataGrid.instance.off('contentReady');
                    resolve(this.exportTo(option, type, dataGrid, prefix, showItemsInName));
                });
            });
        else
            return this['exportTo' + type + 'Internal'](dataGrid, option == 'all', prefix, showItemsInName)
                .then(() => this.loadingService.finishLoading());
    }

    exportToXLS(option, dataGrid: DxDataGridComponent = null, prefix?: string, showItemsInName?: boolean) {
        return this.exportTo(option, 'Excel', dataGrid, prefix, showItemsInName);
    }

    exportToCSV(option, dataGrid: DxDataGridComponent = null, prefix?: string, showItemsInName?: boolean) {
        return this.exportTo(option, 'CSV', dataGrid, prefix, showItemsInName);
    }

    exportToPDF(option, dataGrid: DxDataGridComponent, prefix?: string) {
        return this.exportTo(option, 'PDF', dataGrid, prefix);
    }

    exportToGoogleSheet(option, dataGrid: DxDataGridComponent = null, prefix?: string, showItemsInName?: boolean) {
        return this.exportTo(option, 'GoogleSheets', dataGrid, prefix, showItemsInName);
    }

    exportBlobToGoogleSheet(blob: Blob, sheetName: string): Promise<any> {
        return this.exportGoogleSheetService.exportBlob(blob, sheetName);
    }

    moveItemsToCSV(data, dataGrid, prefix?: string, showItemsInName?: boolean) {
        if (data) {
            setTimeout(() => {
                let _headers = [''];
                if (data.length > 0)
                    _headers = Object.keys(data[0]);

                new Angular5Csv(
                    data.map(dataItem => ({ ...dataItem})),
                    this.getFileName(dataGrid, null, prefix, showItemsInName),
                    { headers: _headers, replaceNulls: true }
                );
            });
        }
    }

    private exportToCSVInternal(dataGrid: DxDataGridComponent, exportAllData: boolean, prefix?: string, showItemsInName?: boolean) {
        return new Promise((resolve) => {
            this.getDataFromGrid(dataGrid, (data) => {
                this.moveItemsToCSV(data, dataGrid, prefix, showItemsInName);
                resolve();
            }, exportAllData);
        });
    }

    private exportToGoogleSheetsInternal(dataGrid: DxDataGridComponent, exportAllData: boolean, prefix?: string, showItemsInName?: boolean) {
        return this.exportGoogleSheetService.export(new Promise((resolve) => {
            this.getDataFromGrid(dataGrid, data => {
                let visibleColumns: DevExpress.ui.dxDataGridColumn[] = dataGrid.instance.getVisibleColumns(),
                    rowData = this.exportGoogleSheetService.getHeaderRows(visibleColumns);

                data.forEach((val: any) => {
                    let row = { values: [] };
                    visibleColumns.forEach((col: any) => {
                        if (col.allowExporting) {
                            let value = val[col.dataField];
                            row.values.push(this.exportGoogleSheetService.getCellData(value, col));
                        }
                    });
                    rowData.push(row);
                });
                resolve(rowData);
            }, exportAllData);
        }), this.getFileName(dataGrid, null, prefix, showItemsInName));
    }

    private exportToExcelInternal(dataGrid: DxDataGridComponent, exportAllData: boolean, prefix?: string, showItemsInName?: boolean) {
        return new Promise(resolve => {
            let instance = dataGrid.instance,
                dataStore = instance.getDataSource().store(),
                initialBeforeSend = dataStore._beforeSend,
                isLoadPanel = instance.option('loadPanel.enabled'),
                initialFileName = dataGrid.export.fileName,
                onLoadInternal = (res) => {
                    if (res instanceof Array)
                        return this.checkJustifyData(res);
                    else if (res.data)
                        res.data = this.checkJustifyData(res.data);

                    return res;
                };

            dataGrid.export.fileName = this.getFileName(dataGrid, null, prefix, showItemsInName);
            if (isLoadPanel)
                instance.option('loadPanel.enabled', false);

            dataStore._beforeSend = (request) => {
                request.timeout = this.EXPORT_REQUEST_TIMEOUT;
                request.isExport = true;
                initialBeforeSend.call(dataStore, request);
            };

            dataStore.on('loaded', onLoadInternal);
            instance.on('exported', () => {
                if (isLoadPanel)
                    instance.option('loadPanel.enabled', true);

                dataGrid.export.fileName = initialFileName;
                dataStore._beforeSend = initialBeforeSend;
                dataStore.off('loaded', onLoadInternal);
                dataStore.off('exported');
                resolve();
            });
            let onDataError = (error) => {
                dataStore.off('dataErrorOccurred', onDataError);
                this.handleExportError(error.error);
                instance.refresh();
            };
            instance.on('dataErrorOccurred', onDataError);
            instance.exportToExcel(!exportAllData);
        });
    }

    private exportToPDFInternal(dataGrid: DxDataGridComponent, exportAllData: boolean, prefix?: string, showItemsInName?: boolean) {
        const visibleColumns: DevExpress.ui.dxDataGridColumn[] = dataGrid.instance.getVisibleColumns()
            .filter((column: DevExpress.ui.dxDataGridColumn) => column.dataField);
        function getHeaders(columns: DevExpress.ui.dxDataGridColumn[]): PdfExportHeader[]  {
            let result = [];
            columns.forEach((column: DevExpress.ui.dxDataGridColumn) => {
                result.push({
                    id: column.dataField,
                    name: column.dataField,
                    prompt: column.name || column.caption,
                    width: (390 / columns.length),
                    align: 'center',
                    padding: 0,
                    calculateDisplayValue: column.calculateDisplayValue,
                    lookup: column.lookup
                });
            });
            return result;
        }
        return new Promise((resolve) => {
            this.getDataFromGrid(
                dataGrid,
                (data) => {
                    this.moveItemsToPDF(data, dataGrid, getHeaders(visibleColumns), prefix, showItemsInName);
                    resolve();
                },
                exportAllData
            );
        });
    }

    /**
     * Download the charts into file
     * @param ImageFormat format
     */
    exportIntoImage(format: ImageFormat, markup, width, height, prefix?: string) {
        setTimeout(() => {
            exportFromMarkup(markup, {
                fileName: this.getFileName(null, 'Chart', prefix),
                format: format,
                height: height,
                width: width,
                backgroundColor: '#fff'
            });
        });
    }

    private moveItemsToPDF(data, dataGrid, headers: PdfExportHeader[], prefix, showItemsInName?: boolean) {
        const items = data.map((item) => {
            let newItem = {};
            for (let key in item) {
                if (item.hasOwnProperty(key)) {
                    const header = headers.find((header: PdfExportHeader) => header.name === key);
                    if (header) {
                        if (header.lookup && header.lookup.calculateCellValue) {
                            newItem[key] = header.lookup.calculateCellValue(item[key]) || '';
                        } else if (header.calculateDisplayValue) {
                            newItem[key] = header.calculateDisplayValue(item);
                        } else {
                            newItem[key] = item[key] ? item[key].toString() : '';
                        }
                    }
                }
            }
            return newItem;
        });
        if (headers) {
            let doc = new jsPDF('landscape').table(1, 1,
                items,
                headers,
                {
                    printHeaders: true,
                    autoSize: false,
                    fontSize: 8,
                    padding: 0,
                    headerBackgroundColor: '#f3f7fa'
                }
            );
            doc.save(this.getFileName(dataGrid, null, prefix, showItemsInName));
        }
    }
}