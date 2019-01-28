export class FilterSettingConstructor {
    constructor(data?: any) {
        if (data) {
            for (let property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }
}
