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
import { LoadingService } from '@shared/common/loading-service/loading.service';
import * as jsPDF from 'jspdf';
import { PdfExportHeader } from './pdf-export-header.interface';

@Injectable()
export class ExportService {

    private _exportGoogleSheetService: ExportGoogleSheetService;
    private readonly EXPORT_REQUEST_TIMEOUT = 3 * 60 * 1000;

    constructor(
        private injector: Injector,
        private loadingService: LoadingService
    ) {
        this._exportGoogleSheetService = injector.get(ExportGoogleSheetService);
    }

    getFileName(dataGrid?, name?: string, prefix?: string): string {
        name = name || dataGrid && dataGrid.export.fileName || '';
        let itemsName = capitalize(location.href.split('/').pop().split('?').shift());
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

            initialStore._beforeSend = (request) => {
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
                callback(this.checkJustifyData(res));
            }).fail(() => {
                initialStore._beforeSend = initialBeforeSend;
                callback([]);
            });
        } else
            callback(dataGrid.instance.getSelectedRowsData());
    }

    exportTo(option, type, dataGrid: DxDataGridComponent = null, prefix?: string): Promise<any> {
        this.loadingService.startLoading();
        return this['exportTo' + type + 'Internal'](dataGrid, option == 'all', prefix)
            .then(() => this.loadingService.finishLoading());
    }

    exportToXLS(option, dataGrid: DxDataGridComponent = null, prefix?: string) {
        return this.exportTo(option, 'Excel', dataGrid, prefix);
    }

    exportToCSV(option, dataGrid: DxDataGridComponent = null, prefix?: string) {
        return this.exportTo(option, 'CSV', dataGrid, prefix);
    }

    exportToPDF(option, dataGrid: DxDataGridComponent, prefix?: string) {
        return this.exportTo(option, 'PDF', dataGrid, prefix);
    }

    exportToGoogleSheet(option, dataGrid: DxDataGridComponent = null, prefix?: string) {
        return this.exportTo(option, 'GoogleSheets', dataGrid, prefix);
    }

    moveItemsToCSV(data, dataGrid, prefix?: string) {
        if (data) {
            setTimeout(() => {
                let _headers = [''];
                if (data.length > 0)
                    _headers = Object.keys(data[0]);

                new Angular5Csv(data.map(dataItem => ({ ...dataItem})), this.getFileName(dataGrid, null, prefix), { headers: _headers, replaceNulls: true });
            });
        }
    }

    private exportToCSVInternal(dataGrid: DxDataGridComponent, exportAllData: boolean, prefix?: string) {
        return new Promise((resolve) => {
            this.getDataFromGrid(dataGrid, (data) => {
                this.moveItemsToCSV(data, dataGrid, prefix);
                resolve();
            }, exportAllData);
        });
    }

    private exportToGoogleSheetsInternal(dataGrid: DxDataGridComponent, exportAllData: boolean, prefix?: string) {
        return this._exportGoogleSheetService.export(new Promise((resolve) => {
            this.getDataFromGrid(dataGrid, data => {
                let visibleColumns = dataGrid.instance.getVisibleColumns(),
                    rowData = this._exportGoogleSheetService.getHeaderRows(visibleColumns);

                data.forEach((val: any) => {
                    let row = { values: [] };
                    visibleColumns.forEach((col: any) => {
                        if (col.allowExporting) {
                            let value = val[col.dataField];
                            row.values.push(this._exportGoogleSheetService.getCellData(value, col));
                        }
                    });
                    rowData.push(row);
                });
                resolve(rowData);
            }, exportAllData);
        }), this.getFileName(dataGrid, null, prefix));
    }

    private exportToExcelInternal(dataGrid: DxDataGridComponent, exportAllData: boolean, prefix?: string) {
        return new Promise((resolve) => {
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

            dataGrid.export.fileName = this.getFileName(dataGrid, null, prefix);
            if (isLoadPanel)
                instance.option('loadPanel.enabled', false);

            dataStore._beforeSend = (request) => {
                request.timeout = this.EXPORT_REQUEST_TIMEOUT;
                initialBeforeSend.call(dataStore, request);
            };

            dataStore.on('loaded', onLoadInternal);
            instance.on('exported', () => {
                if (isLoadPanel)
                    instance.option('loadPanel.enabled', true);

                dataGrid.export.fileName = initialFileName;
                dataStore._beforeSend = initialBeforeSend;
                dataStore.off('loaded', onLoadInternal);
                resolve();
            });

            instance.exportToExcel(!exportAllData);
        });
    }

    private exportToPDFInternal(dataGrid: DxDataGridComponent, exportAllData: boolean, prefix?: string) {
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
                    this.moveItemsToPDF(data, dataGrid, getHeaders(visibleColumns), prefix);
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

    private moveItemsToPDF(data, dataGrid, headers: PdfExportHeader[], prefix) {
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
            doc.save(this.getFileName(dataGrid, null, prefix));
        }
    }

}
