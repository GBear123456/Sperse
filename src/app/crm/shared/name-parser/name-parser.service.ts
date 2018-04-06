import { Injectable } from '@angular/core';
import { PersonInfoDto } from '@shared/service-proxies/service-proxies';

import * as parseFullName  from 'parse-full-name';

@Injectable()
export class NameParserService {
    constructor() { }

    parseIntoPerson(value: string, person: PersonInfoDto) {
        if (!value)
            return

        let res = parseFullName.parseFullName(value.trim());
        person.namePrefix = res.title;
        person.firstName = res.first;
        person.middleName = res.middle;
        person.lastName = res.last;
        person.nameSuffix = res.suffix;
        person.nickName = res.nick;
    }
}
