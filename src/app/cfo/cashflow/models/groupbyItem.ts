export interface IGroupbyItem {
    groupInterval: 'year' | 'month' | 'quarter' | 'week';
    optionText: string;
    customizeTextFunction?: any;
}
