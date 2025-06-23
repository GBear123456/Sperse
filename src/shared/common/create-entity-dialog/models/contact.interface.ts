import { Address } from '@shared/common/create-entity-dialog/models/address.model';
import { Link } from '@shared/common/create-entity-dialog/models/link.model';
import { Phone } from '@shared/common/create-entity-dialog/models/phone.model';
import { Email } from '@shared/common/create-entity-dialog/models/email.model';

export interface Contact {
    emails: Email[],
    phones: Phone[],
    links: Link[],
    addresses: Address[]
}