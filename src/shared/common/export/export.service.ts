/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { ExportGoogleSheetService } from './export-google-sheets/export-google-sheets';
import { Angular5Csv } from './export-csv/export-csv';
import DataSource from 'devextreme/data/data_source';
import capitalize from 'underscore.string/capitalize';
import * as _ from 'underscore';
import * as moment from 'moment';

@Injectable()
export class ExportService {

    private _exportGoogleSheetService: ExportGoogleSheetService;
    private readonly EXPORT_REQUEST_TIMEOUT = 3 * 60 * 1000;

    constructor(private _injector: Injector) {
        this._exportGoogleSheetService = _injector.get(ExportGoogleSheetService);
    }

    getFileName(dataGrid?) {
        let name = dataGrid && dataGrid.export.fileName || '';
        return capitalize(location.href.split('/').pop()) + '_' +
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
                dataSource = new DataSource({
                    paginate: false,
                    filter: initialDataSource.filter(),
                    requireTotalCount: true,
                    store: _.extend(initialDataSource.store(), {
                        _beforeSend: (request) => {
                            request.timeout = this.EXPORT_REQUEST_TIMEOUT;
                            request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        }
                    })
                });
            dataSource.load().done((res) => {
                callback(this.checkJustifyData(res));
            }).fail(() => {
                callback([]);
            });
        } else
            callback(dataGrid.instance.getSelectedRowsData());
    }

    moveItemsToCSV(data, dataGrid) {
        if (data) {
            setTimeout(() => {
                let _headers = [''];
                if (data.length > 0)
                    _headers = Object.keys(data[0]);

                new Angular5Csv(data, this.getFileName(dataGrid), { headers: _headers, replaceNulls: true });
            });
        }
    }

    exportToCSV(dataGrid: DxDataGridComponent, exportAllData: boolean) {
        return new Promise((resolve) => {
            this.getDataFromGrid(dataGrid, (data) => {
                this.moveItemsToCSV(data, dataGrid);
                resolve();
            }, exportAllData);
        });
    }

    exportToGoogleSheets(dataGrid: DxDataGridComponent, exportAllData: boolean) {
        return new Promise((resolve) => {
            this.getDataFromGrid(dataGrid, (data) => {
                let visibleColumns = dataGrid.instance.getVisibleColumns(),
                    rowData = [this._exportGoogleSheetService.getHeaderRow(visibleColumns)];

                _.each(data, (val: any) => {
                    let row = { values: [] };
                    _.each(visibleColumns, (col: any) => {
                        if (col.allowExporting) {
                            let value = val[col.dataField];

                            row.values.push(this._exportGoogleSheetService.getCellData(value, col));
                        }
                    });
                    rowData.push(row);
                });

                this._exportGoogleSheetService.export(rowData, this.getFileName(dataGrid));
                resolve();
            }, exportAllData);
        });
    }

    exportToExcel(dataGrid: DxDataGridComponent, exportAllData: boolean) {
        return new Promise((resolve) => {
            let instance = dataGrid.instance,
                dataStore = instance.getDataSource().store(),
                initialBeforeSend = dataStore._beforeSend,
                isLoadPanel = instance.option('loadPanel.enabled'),
                initialFileName = dataGrid.export.fileName;

            dataGrid.export.fileName = this.getFileName(dataGrid);
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
}
