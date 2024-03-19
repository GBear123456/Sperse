export enum EventDurationTypes {
    Minutes = 1,
    Hours = 60,
    Days = 1440
}

export class EventDurationHelper {
    static ParseDuration(minutes: number) {
        let durationTypes = Object.values(EventDurationTypes).map(x => Number(x)).filter(x => !isNaN(x)).reverse();
        for (let durationType of durationTypes) {
            let value = minutes % durationType;
            if (value == 0) {
                return {
                    eventDurationType: <any>EventDurationTypes[durationType],
                    eventDuration: minutes / durationType
                }
            }
        }
    }
}