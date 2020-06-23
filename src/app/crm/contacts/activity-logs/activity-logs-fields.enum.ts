import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ActivityLogsDto } from '@app/crm/contacts/activity-logs/activity-logs-dto.interface';

export const ActivityLogsFields: KeysEnum<ActivityLogsDto> = {
    Date: 'Date',
    CampaignId: 'CampaignId',
    CampaignName: 'CampaignName',
    CampaignType: 'CampaignType',
    RedirectUrl: 'RedirectUrl'
};