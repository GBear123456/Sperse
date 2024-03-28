export enum EventDurationTypes {
    Minutes = 1,
    Hours = 60,
    Days = 1440
}

export class EventDurationHelper {
    static eventDurationDataSource = [
        { value: EventDurationTypes.Minutes, displayValue: 'Minute(s)' },
        { value: EventDurationTypes.Hours, displayValue: 'Hour(s)' },
        { value: EventDurationTypes.Days, displayValue: 'Day(s)' }
    ]

    static getDisplayValue(type: EventDurationTypes): string {
        return this.eventDurationDataSource.find(x => x.value == type).displayValue;
    }

    static ParseDuration(minutes: number) {
        let durationTypes = Object.values(EventDurationTypes).map(x => Number(x)).filter(x => !isNaN(x)).reverse();
        for (let durationType of durationTypes) {
            let value = minutes % durationType;
            if (value == 0) {
                return {
                    eventDurationType: durationType,
                    eventDuration: minutes / durationType
                }
            }
        }
    }
}