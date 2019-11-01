/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { ExportGoogleSheetService } from './export-google-sheets/export-google-sheets';
import { Angular5Csv } from './export-csv/export-csv';
import DataSource from 'devextreme/data/data_source';
import capitalize from 'underscore.string/capitalize';
import * as moment from 'moment';
import { exportFromMarkup } from 'devextreme/viz/export';
import { ImageFormat } from '@shared/common/export/image-format.enum';

@Injectable()
export class ExportService {

    private _exportGoogleSheetService: ExportGoogleSheetService;
    private readonly EXPORT_REQUEST_TIMEOUT = 3 * 60 * 1000;

    constructor(private injector: Injector) {
        this._exportGoogleSheetService = injector.get(ExportGoogleSheetService);
    }

    getFileName(dataGrid?, name?: string, prefix?: string): string {
        name = name || dataGrid && dataGrid.export.fileName || '';
        return (prefix ? prefix : '') + capitalize(location.href.split('/').pop()) + '_' +
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

    moveItemsToCSV(data, dataGrid, prefix?: string) {
        if (data) {
            setTimeout(() => {
                let _headers = [''];
                if (data.length > 0)
                    _headers = Object.keys(data[0]);

                new Angular5Csv(data, this.getFileName(dataGrid, null, prefix), { headers: _headers, replaceNulls: true });
            });
        }
    }

    exportToCSV(dataGrid: DxDataGridComponent, exportAllData: boolean, prefix?: string) {
        return new Promise((resolve) => {
            this.getDataFromGrid(dataGrid, (data) => {
                this.moveItemsToCSV(data, dataGrid, prefix);
                resolve();
            }, exportAllData);
        });
    }

    exportToGoogleSheets(dataGrid: DxDataGridComponent, exportAllData: boolean, prefix?: string) {
        return this._exportGoogleSheetService.export(new Promise((resolve) => {
            this.getDataFromGrid(dataGrid, (data) => {
                let visibleColumns = dataGrid.instance.getVisibleColumns(),
                    rowData = [this._exportGoogleSheetService.getHeaderRow(visibleColumns)];

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

    exportToExcel(dataGrid: DxDataGridComponent, exportAllData: boolean, prefix?: string) {
        return new Promise((resolve) => {
            let instance = dataGrid.instance,
                dataStore = instance.getDataSource().store(),
                initialBeforeSend = dataStore._beforeSend,
                isLoadPanel = instance.option('loadPanel.enabled'),
                initialFileName = dataGrid.export.fileName;

            dataGrid.export.fileName = this.getFileName(dataGrid, null, prefix);
            if (isLoadPanel)
                instance.option('loadPanel.enabled', false);

            dataStore._beforeSend = (request) => {
                request.timeout = this.EXPORT_REQUEST_TIMEOUT;
                initialBeforeSend.call(dataStore, request);
            };

            dataStore.on('loaded', (res) => {
                if (res instanceof Array)
                    return this.checkJustifyData(res);
                else if (res.data)
                    res.data = this.checkJustifyData(res.data);

                return res;
            });

            instance.on('exported', () => {
                if (isLoadPanel)
                    instance.option('loadPanel.enabled', true);

                dataGrid.export.fileName = initialFileName;
                dataStore._beforeSend = initialBeforeSend;
                dataStore.off('loaded');
                resolve();
            });

            instance.exportToExcel(!exportAllData);
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

}
