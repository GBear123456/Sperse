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
        html += `<header class="tooltip-header">${moment(pointInfo.argument).format('MMM YYYY')}</header>`;
        fields.forEach(field => {
            if (pointDataObject[field.name] !== null && pointDataObject[field.name] !== undefined) {
                if (field.label == 'Starting Balance') {
                    html += `<div class="tooltip-item ${field.label.toLowerCase()}">${field.label} : <span style="float: right; font-family: Lato; margin-left: 10px">
                            ${(pointDataObject[field.name] - pointDataObject['startingBalanceAdjustments']).toLocaleString('en-EN', {
                                style: 'currency',
                                currency: 'USD'
                            })}</span></div>`;
                } else {
                    html += `<div class="tooltip-item ${field.label.toLowerCase()}">${field.label} : <span style="float: right; font-family: Lato; margin-left: 10px">${pointDataObject[field.name].toLocaleString('en-EN', {
                        style: 'currency',
                        currency: 'USD'
                    })}</span></div>`;
                }
                if (field.name === 'forecastStartingBalance' ||
                    field.name === 'netChange' ||
                    field.name === 'startingBalanceAdjustments' ||
                    field.name === 'forecastNetChange')
                    html += '<hr style="margin: 5px 0"/>';
            }
        });
        return html;
    }

}
