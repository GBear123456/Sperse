import { Injectable } from '@angular/core';
import { PersonInfoDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class NameParserService {
    constructor() { }

    parseIntoPerson(value: string, person: PersonInfoDto) {
        let valueParts = value.split(' ');
        let l = valueParts.length;

        // temp implementation, some advanced parser will be used in future
        if (l <= 1)
            person.firstName = (valueParts[0] || value).trim();
        else if (l == 2) {
            person.firstName = valueParts[0].trim();
            person.lastName = valueParts[1].trim();
        }
        else if (l == 3) {
            person.firstName = valueParts[0].trim();
            person.middleName = valueParts[1].trim();
            person.lastName = valueParts[2].trim();
        }
        else if (l == 4) {
            person.namePrefix = valueParts[0].trim();
            person.firstName = valueParts[1].trim();
            person.middleName = valueParts[2].trim();
            person.lastName = valueParts[3].trim();
        }
        else if (l >= 5) {
            person.namePrefix = valueParts[0].trim();
            person.firstName = valueParts[1].trim();
            person.middleName = valueParts[2].trim();
            person.lastName = valueParts[3].trim();
            person.nameSuffix = valueParts[4].trim();
        }
    }
}
