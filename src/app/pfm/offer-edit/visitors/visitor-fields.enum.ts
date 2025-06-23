import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { VisitorDto } from '@app/pfm/offer-edit/visitors/visitor-dto.interface';

export const VisitorFields: KeysEnum<VisitorDto> = {
    Id: 'Id',
    StateCode: 'StateCode',
    Email: 'Email',
    PhoneNumber: 'PhoneNumber',
    Date: 'Date',
    DoB: 'DoB',
    FirstName: 'FirstName',
    LastName: 'LastName',
    ApplicantUserId: 'ApplicantUserId'
};