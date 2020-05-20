import { inject, TestBed } from '@angular/core/testing';
import { DateHelper } from './DateHelper';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

describe('Date Helper test', () => {
    beforeEach(() => {
        TestBed.resetTestEnvironment();
        TestBed.resetTestEnvironment();
        TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
        abp.timing['timeZoneInfo'] = {
            iana: { timeZoneId: 'UTC' },
            windows: {
                timeZoneId: 'UTC',
                baseUtcOffsetInMilliseconds: 0,
                currentUtcOffsetInMilliseconds: 0,
                isDaylightSavingTimeNow: false,
            }
        };
    });
    afterEach(() => {
        abp.timing.timeZoneInfo.iana.timeZoneId = 'UTC';
    });

    it('Start Date of Today', inject([], () => {
        expect(DateHelper.getStartDate(new Date('Wed May 20 2020 03:29:20 GMT+0300')).toJSON()).toEqual('2020-05-20T00:00:00.000Z');
    }));

    it('End Date of Today', inject([], () => {
        expect(DateHelper.getEndDate(new Date('Wed May 20 2020 03:29:20 GMT+0300')).toJSON()).toEqual('2020-05-20T00:00:00.000Z');
    }));

    it('Start Date of Today + 14 hours', inject([], () => {
        abp.timing.timeZoneInfo.iana.timeZoneId = 'Pacific/Kiritimati';
        expect(DateHelper.getStartDate(new Date('Wed May 21 2020 00:37:43 GMT+0300')).toJSON()).toEqual('2020-05-20T00:00:00.000Z');
    }));

    it('End Date of Today + 14 hours', inject([], () => {
        abp.timing.timeZoneInfo.iana.timeZoneId = 'Pacific/Kiritimati';
        expect(DateHelper.getEndDate(new Date('Wed May 21 2020 00:37:43 GMT+0300')).toJSON()).toEqual('2020-05-20T00:00:00.000Z');
    }));

    it('Start Date of Today -11 hours', inject([], () => {
        abp.timing.timeZoneInfo.iana.timeZoneId = 'Pacific/Apia';
        expect(DateHelper.getStartDate(new Date('Tue May 19 2020 23:45:50 GMT+0300')).toJSON()).toEqual('2020-05-19T00:00:00.000Z');
    }));

    it('End Date of Today -11 hours', inject([], () => {
        abp.timing.timeZoneInfo.iana.timeZoneId = 'Pacific/Apia';
        expect(DateHelper.getEndDate(new Date('Tue May 19 2020 23:45:50 GMT+0300')).toJSON()).toEqual('2020-05-19T00:00:00.000Z');
    }));

    it('Start Date of Yesterday', inject([], () => {
        expect(DateHelper.getStartDate(new Date('Tue May 19 2020 03:33:19 GMT+0300')).toJSON()).toEqual('2020-05-19T00:00:00.000Z');
    }));

    it('End Date of Yesterday', inject([], () => {
        expect(DateHelper.getEndDate(new Date('Tue May 19 2020 03:33:19 GMT+0300')).toJSON()).toEqual('2020-05-19T00:00:00.000Z');
    }));

    it('Start Date of Yesterday +14 hours', inject([], () => {
        expect(DateHelper.getStartDate(new Date('Wed May 20 2020 00:37:43 GMT+0300')).toJSON()).toEqual('2020-05-20T00:00:00.000Z');
    }));

    it('End Date of Yesterday +14 hours', inject([], () => {
        expect(DateHelper.getEndDate(new Date('Wed May 20 2020 00:37:43 GMT+0300')).toJSON()).toEqual('2020-05-20T00:00:00.000Z');
    }));

    it('Start Date of Yesterday -11 hours', inject([], () => {
        expect(DateHelper.getStartDate(new Date('Mon May 18 2020 23:47:48 GMT+0300')).toJSON()).toEqual('2020-05-18T00:00:00.000Z');
    }));

    it('End Date of Yesterday -11 hours', inject([], () => {
        expect(DateHelper.getEndDate(new Date('Mon May 18 2020 23:47:48 GMT+0300')).toJSON()).toEqual('2020-05-18T00:00:00.000Z');
    }));

    it('Last Year', inject([], () => {
        expect(DateHelper.getStartDate(new Date('Tue Jan 01 2019 00:00:00')).toJSON()).toEqual('2019-01-01T00:00:00.000Z');
        expect(DateHelper.getEndDate(new Date('Tue Dec 31 2019 23:59:59 GMT+0200')).toJSON()).toEqual('2019-12-31T00:00:00.000Z');
    }));

    it('This Year', inject([], () => {
        expect(DateHelper.getStartDate(new Date('Wed Jan 01 2020 00:00:00 GMT+0200')).toJSON()).toEqual('2020-01-01T00:00:00.000Z');
        expect(DateHelper.getEndDate(new Date('Thu Dec 31 2020 23:59:59 GMT+0200')).toJSON()).toEqual('2020-05-20T00:00:00.000Z');
    }));

});