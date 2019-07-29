import { TestBed, inject } from '@angular/core/testing';
import * as moment from 'moment-timezone';
import { CashflowService } from './cashflow.service';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

describe('CashflowService', () => {
    beforeEach(() => {
        TestBed.resetTestEnvironment();
        TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
        TestBed.configureTestingModule({
            providers: [CashflowService]
        });
    });

    it('should be created', inject([CashflowService], (service: CashflowService) => {
        expect(service).toBeTruthy();
    }));

    it('calculateCellValue should work', inject([CashflowService], (service: CashflowService) => {
        //console.log(moment);
        const dataArray = [
            {
                accountId: 142,
                adjustmentType: 0,
                amount: -1826.38,
                cashflowTypeId: 'B',
                date: moment('2017-07-01T00:00:00Z'),
                initialData: moment('2017-07-01T00:00:00Z')
            },
            {
                accountId: 142,
                adjustmentType: 0,
                amount: 676.18,
                cashflowTypeId: 'B',
                date: moment('2017-09-15T00:00:00Z'),
                initialData: moment('2017-09-15T00:00:00Z')
            },
            {
                accountId: 142,
                amount: 2256.14,
                cashflowTypeId: 'B',
                date: moment('2019-05-06T00:00:00Z'),
                initialData: moment('2019-05-06T00:00:00Z')
            },
            {
                accountId: 142,
                amount: 4000,
                cashflowTypeId: 'B',
                date: moment('2019-05-09T00:00:00Z'),
                initialData: moment('2019-05-09T00:00:00Z')
            }
        ];
        expect(service.calculateCellValue({ year: 2017 }, dataArray, true)).toBe(0);
        expect(service.calculateCellValue({ year: 2017, quarter: 3, accountId: 142, cashflowTypeId: 'B' }, dataArray, true)).toBe(-1826.38);
        expect(service.calculateCellValue({ year: 2017, quarter: 3, month: 9 }, dataArray, true)).toBe(0);
        expect(service.calculateCellValue({ year: 2017, quarter: 3, month: 9, day: 15, accountId: 142, cashflowTypeId: 'B' }, dataArray, true)).toBe(676.18);
        expect(service.calculateCellValue({ year: 2019, quarter: 2, month: 5, projected: '{"startDate":"2019-05-06T00:00:00.000Z","endDate":"2019-05-12T23:59:59.999Z","weekNumber":19}', accountId: 142, cashflowTypeId: 'B' }, dataArray, true)).toBe(2256.14);
        expect(service.calculateCellValue({ year: 2019, quarter: 2, month: 5, day: 9, accountId: 142, cashflowTypeId: 'B' }, dataArray, true)).toBe(4000);
    }));
});
