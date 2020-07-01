import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ActivityDto } from '@app/crm/activity/activity-dto.interface';

export const ActivityFields: KeysEnum<ActivityDto> = {
    Id: 'Id',
    Title: 'Title',
    AllDay: 'AllDay',
    StartDate: 'StartDate',
    EndDate: 'EndDate',
    Description: 'Description',
    Type: 'Type',
    AssignedUserIds: 'AssignedUserIds',
    LeadId: 'LeadId',
    StageId: 'StageId',
    ContactId: 'ContactId'
};