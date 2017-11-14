import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';

import { Angular2Csv } from 'angular2-csv/Angular2-csv';

import { capitalize } from 'underscore.string';
import * as moment from "moment";

@Injectable()
export class ExportService {
  constructor() {}

  getFileName() {
      var date = new Date();
      return capitalize(location.href.split('/').pop()) + "_" + moment().local().format('YYYY-MM-DD_hhmmss_a');
  }

  saveAsCSV(data: any, name?: string) {
      if (data) {
          setTimeout(() => {
              var _headers = [''];
              if (data.length > 0)
                  _headers = Object.keys(data[0]);

              new Angular2Csv(data, name || this.getFileName(), { headers: _headers });
          });
      }
  }
}