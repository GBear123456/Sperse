import { Injectable, Injector } from '@angular/core';

import { Angular2Csv } from 'angular2-csv/Angular2-csv';

import { DxDataGridComponent } from 'devextreme-angular';
import { ExportGoogleSheetService } from './export-google-sheets/export-google-sheets';
import DataSource from 'devextreme/data/data_source';

import * as _s from 'underscore.string';
import * as _ from 'underscore';
import * as moment from 'moment';

@Injectable()
export class ExportService {

    private _exportGoogleSheetService: ExportGoogleSheetService;
    private readonly EXPORT_REQUEST_TIMEOUT = 600000;

    constructor(private _injector: Injector) {
        this._exportGoogleSheetService = _injector.get(ExportGoogleSheetService);
    }

    getFileName() {
        return _s.capitalize(location.href.split('/').pop()) + '_' + moment().local().format('YYYY-MM-DD_hhmmss_a');
    }

    private getDataFromGrid(dataGrid: DxDataGridComponent, callback, exportAllData) {
        if (exportAllData) {
            let initialDataSource = dataGrid.instance.getDataSource(),
                dataSource = new DataSource({
                    filter: initialDataSource.filter(),
                    requireTotalCount: true,
                    store: _.extend(initialDataSource.store(), {
                        _beforeSend: (request) => {
                            request.timeout = this.EXPORT_REQUEST_TIMEOUT;
                            request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        }
                    })
                });
            dataSource.paginate(false);
            dataSource.load().done((res) => {
                callback(res);
            }).fail((e) => { 
                callback([]);
            });
        } else 
            callback(dataGrid.instance.getSelectedRowsData());
    }

    moveItemsToCSV(data) {
        if (data) {
            setTimeout(() => {
                let _headers = [''];
                if (data.length > 0)
                    _headers = Object.keys(data[0]);

                new Angular2Csv(data, this.getFileName(), { headers: _headers });
            });      
        }        
    }

    exportToCSV(dataGrid: DxDataGridComponent, exportAllData: boolean) {
        return new Promise((resolve, reject) => {
            this.getDataFromGrid(dataGrid, (data) => {
                this.moveItemsToCSV(data);
                resolve();
            }, exportAllData);
        });
    }

    exportToGoogleSheets(dataGrid: DxDataGridComponent, exportAllData: boolean) {
        return new Promise((resolve, reject) => {
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

                this._exportGoogleSheetService.export(rowData, this.getFileName());
                resolve();
            }, exportAllData);
        });
    }

    exportToExcel(dataGrid: DxDataGridComponent, exportAllData: boolean) {
        return new Promise((resolve, reject) => {
            let instance = dataGrid.instance,
                dataStore = instance.getDataSource().store(),
                initialBeforeSend = dataStore._beforeSend,
                isLoadPanel = instance.option('loadPanel.enabled');

            dataGrid.export.fileName = this.getFileName();
            if (isLoadPanel)
                instance.option('loadPanel.enabled', false);

            dataStore._beforeSend = (request) => {
                request.timeout = this.EXPORT_REQUEST_TIMEOUT;
                initialBeforeSend.call(dataStore, request);
            }

            instance.on("exported", () => {
                if (isLoadPanel)
                    instance.option('loadPanel.enabled', true);
                dataStore._beforeSend = initialBeforeSend;
                resolve();
            });
      
            instance.exportToExcel(!exportAllData);
        });
    }
}