export interface IGroupbyItem {
    groupInterval: 'year' | 'month' | 'quarter' | 'dayOfWeek' | 'day';
    optionText: string;
    customizeTextFunction?: any;
    historicalSelectionFunction: any;
}
