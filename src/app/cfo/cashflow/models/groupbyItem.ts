export class GroupbyItem {
    groupInterval: 'year' | 'month' | 'quarter' | 'dayOfWeek' | 'day';
    optionText: string;
    customizeTextFunction: any;
    historicalSelectionFunction: any;
    historicalCustomizerFunction: any;
    compareYears?: any;
    compareQuarters?: any;
    compareMonths?: any;
    compareDays?: any;
    getQuarter?: any;
}
