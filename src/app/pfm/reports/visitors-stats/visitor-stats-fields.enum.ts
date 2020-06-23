import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { VisitorStatsDto } from './visitor-stats-dto.inteface';

export const VisitorStatsFields: KeysEnum<VisitorStatsDto> = {
    Id: 'Id',
    State: 'State',
    Email: 'Email',
    PhoneNumber: 'PhoneNumber',
    Date: 'Date',
    DoB: 'DoB',
    CampaignName: 'CampaignName',
    ApplicantUserId: 'ApplicantUserId',
    FirstName: 'FirstName',
    LastName: 'LastName'
};