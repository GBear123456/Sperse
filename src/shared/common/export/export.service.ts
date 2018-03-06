import { Injectable, Injector } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';

import { Angular2Csv } from 'angular2-csv/Angular2-csv';

import { DxDataGridComponent } from 'devextreme-angular';
import { ExportGoogleSheetService } from './export-google-sheets/export-google-sheets';

import { capitalize } from 'underscore.string';
import * as moment from "moment";

@Injectable()
export class ExportService {

    private _exportGoogleSheetService: ExportGoogleSheetService;

    constructor(private _injector: Injector) {
        this._exportGoogleSheetService = _injector.get(ExportGoogleSheetService);
    }

    getFileName() {
        return capitalize(location.href.split('/').pop()) + '_' + moment().local().format('YYYY-MM-DD_hhmmss_a');
    }

    saveAsCSV(dataGrid: DxDataGridComponent, exportAllData: boolean, name?: string) {
        let data = exportAllData ?
            dataGrid.instance.getDataSource().items()
            : dataGrid.instance.getSelectedRowsData();

        if (data) {
            setTimeout(() => {
                var _headers = [''];
                if (data.length > 0)
                    _headers = Object.keys(data[0]);

                new Angular2Csv(data, name || this.getFileName(), { headers: _headers });
            });
        }
    }

    exportToGoogleSheets(dataGrid: DxDataGridComponent, exportAllData: boolean) {
        this._exportGoogleSheetService.export(dataGrid, this.getFileName(), exportAllData);
    }
}
