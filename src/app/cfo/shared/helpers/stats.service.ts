import { Injectable } from '@angular/core';
import * as moment from 'moment';

@Injectable()
export class StatsService {

    constructor() { }

    /**
     * Replace string negative value like '$-1000' for the string '$(1000)' (with brackets)
     * @param {string} value
     * @return {string}
     */
    replaceMinusWithBrackets(value: string) {
        return value.replace(/\B(?=(\d{3})+\b)/g, ',').replace(/-(.*)/, '($1)');
    }

    getTooltipInfoHtml(data, fields, pointInfo) {
        let html = '';
        let pointDataObject = data.find(item => item.date.toDate().toString() == pointInfo.argument);

        moment.tz.setDefault(undefined);
        let date = moment(pointInfo.argument);
        moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);

        html += `<header class="tooltip-header">${date.format('MMM YYYY')}</header>`;
        fields.forEach(field => {
            if (pointDataObject[field.name] !== null &&
                pointDataObject[field.name] !== undefined &&
                field.name !== 'adjustments' &&
                field.name !== 'forecastAdjustments'
            ) {
                if (field.label == 'Starting Balance') {
                    html += `<div class="tooltip-item ${field.label.toLowerCase()}">${field.label} : <span style="float: right; font-family: Lato; margin-left: 10px">
                            ${(pointDataObject[field.name] - pointDataObject[field.name + 'Adjustments']).toLocaleString('en-EN', {
                                style: 'currency',
                                currency: 'USD'
                            })}</span></div>`;
                } else if (field.name == 'forecastEndingBalance' || field.name == 'endingBalance') {
                    if (pointDataObject['forecastAdjustments'] !== 0 && pointDataObject['forecastAdjustments'] !== undefined ||
                        pointDataObject['adjustments'] !== 0 && pointDataObject['adjustments'] !== undefined
                    ) {
                        html += `<div class="tooltip-item ${field.label.toLowerCase()}"><span style="padding: 0 3px; color: rgb(50, 190, 242); font-weight: bold;">!</span> ${field.label} : <span style="float: right; font-family: Lato; margin-left: 10px">${pointDataObject[field.name].toLocaleString('en-EN', {
                            style: 'currency',
                            currency: 'USD'
                        })}</span></div>`;
                    } else {
                        html += `<div class="tooltip-item ${field.label.toLowerCase()}">${field.label} : <span style="float: right; font-family: Lato; margin-left: 10px">${pointDataObject[field.name].toLocaleString('en-EN', {
                            style: 'currency',
                            currency: 'USD'
                        })}</span></div>`;
                    }
                } else if ((field.name.indexOf('BalanceAdjustments') < 0) || pointDataObject[field.name]) {
                    html += `<div class="tooltip-item ${field.label.toLowerCase()}">${field.label} : <span style="float: right; font-family: Lato; margin-left: 10px">${pointDataObject[field.name].toLocaleString('en-EN', {
                        style: 'currency',
                        currency: 'USD'
                    })}</span></div>`;
                }

                if (field.name === 'forecastStartingBalanceAdjustments' ||
                    field.name === 'netChange' ||
                    field.name === 'startingBalanceAdjustments' ||
                    field.name === 'forecastNetChange'
                )
                    html += '<hr style="margin: 5px 0"/>';
            }
        });
        return html;
    }

}
