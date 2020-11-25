import { ContactGroup } from '@shared/AppEnums';
import { EntityTypeSys } from '@app/crm/leads/entity-type-sys.enum';

export interface CreateEntityDialogData {
    customerType: ContactGroup;
    isInLeadMode?: boolean;
    refreshParent?: () => void;
    entityTypeId?: number;
    entityTypeSysId?: EntityTypeSys;
    parentId?: number;
    pipelineId?: number;
    company?: string;
    /** For bankcode old member area @todo remove in future */
    createMethod?: () => any;
    createModel?: any;
    hideToolbar?: boolean;
    hideCompanyField?: boolean;
    hideLinksField?: boolean;
    hideNotesField?: boolean;
    hidePhotoArea?: boolean;
    hideSaveAndExtend?: boolean;
    disallowMultipleItems?: boolean;
    dontCheckSimilarEntities?: boolean;
}