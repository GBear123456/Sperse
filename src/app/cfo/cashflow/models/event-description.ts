export interface IEventDescription {
    name: string;
    handler: EventListenerObject;
    useCapture?: boolean;
}
