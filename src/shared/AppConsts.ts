export class AppConsts {
    static readonly tenancyNamePlaceHolderInUrl = '{TENANCY_NAME}';
    static readonly defaultTenantName = 'Sperse';
    static readonly tenantHostType = 1;

    static readonly googleMapsApiUrl = 'https://maps.googleapis.com/maps/api/js?key={KEY}&libraries=places&language=en';
    static readonly isMobile = RegExp('Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini', 'i').test(navigator.userAgent);
    static readonly defaultErrorMessage = 'No further information available.';

    static readonly thumbWidth  = 44;
    static readonly thumbHeight = 44;

    static remoteServiceBaseUrl: string;
    static remoteServiceBaseUrlFormat: string;
    static appBaseUrl: string;
    static appBaseHref: string; // returns angular's base-href parameter value if used during the publish
    static appBaseUrlFormat: string;
    static appMemberPortalUrl: string;
    static appConfigOrigin: any;

    static recaptchaSiteKey: string;
    static googleSheetClientId: string;
    static subscriptionExpireNootifyDayCount: number;
    static subscriptionRecurringBillingPeriod = 20; /* Days */
    static subscriptionGracePeriod = 20; /* Days */

    static localeMappings: any = [];

    static readonly userManagement = {
        defaultAdminUserName: 'admin'
    };

    static readonly localization = {
        defaultLocalizationSourceName: 'Platform',
        CRMLocalizationSourceName: 'CRM',
        CFOLocalizationSourceName: 'CFO',
        PFMLocalizationSourceName: 'PFM'
    };

    static readonly modules = {
        platformModule: 'Platform',
        CRMModule: 'CRM',
        CFOModule: 'CFO'
    };

    static readonly authorization = {
        encrptedAuthTokenName: 'enc_auth_token'
    };

    static readonly grid = {
        defaultPageSize: 10
    };

    static readonly tenantCustomizations = {
        uiCustomizationsGroupName: 'UiCustomizations',
        UiCustomizationsSiteTitleName: 'SiteTitle'
    };

    /** @todo change to enum */
    static readonly PipelinePurposeIds = {
        lead: 'Lead',
        order: 'Order',
        activity: 'Activity'
    };

    static readonly masks = {
        phone: '+1 (000)-000-0000',
        ssn: '000-00-0000',
        sin: '000-000-000',
        taxNumber: '00-0000000',
        zipCode: '00000',
        zipCodeLong: '00000-0000',
        phoneExt: '99999',
        creditCardNumber: '0000-0000-0000-0099',
        expirationDate: '00/0000',
        cvvCode: '0009'
    };

    static readonly formatting = {
        date: 'MM/dd/yyyy',
        dateTime: 'MM/dd/yyyy hh:mm a',
        dateMoment: 'MM/DD/YYYY',
        dateTimeMoment: 'MM/DD/YYYY hh:mm A',
        timeMoment: 'hh:mm A',
        monthDay: 'MMM d',
        inboxDate: 'MMM d, yyyy hh:mm a',
        fieldDateTime: 'MMM DD, YYYY HH:mm',
        fieldDate: 'MMM DD, YYYY'
    };

    static readonly otherLinkTypeId = '-';

    private static readonly emailRegexString = '(([^<>()\[\\]\\.,;:\\s@"]+(\\.[^<>()\[\\]\\.,;:\\s@"]+)*)|("[^"]+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))';

    static readonly regexPatterns = {
        name: /^[A-Z][a-zA-Z]+$/,
        email: new RegExp(`^${AppConsts.emailRegexString}$`),
        emailWithName: new RegExp(`^((("[^"]+")|([a-zA-Z\\s]+))\\s*<(?=.+>$)|(?!.+>$))${AppConsts.emailRegexString}>?$`),
        phone: /^[\d\+\-\(\)\s]{10,24}$/,
        url: /^(http[s]?:\/\/)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(:[0-9]+)?(\/.*)?$/,
        fullName: /^[\w|\s|\`|\'|\’|\,|\.|\-]+(\(.+\))?$/,
        affiliateCode: /^(?!.*?\.\.)[a-zA-Z0-9\._-]*$/,
        affiliateRateZeroBase: /^0(\.[0-9]{1,4})?$/,
        affiliateRate: /^[0-9]{1,2}(\.[0-9]{1,2})*$/,
        ein: /^\d{2}\-?\d{7}$/,
        duns: /^\d{2}\-?\d{3}-?\d{4}$/,
        siteUrl: /^(http:\/\/|https:\/\/)[a-z0-9-]+(\.[a-z0-9-]+)+(:[0-9]+)?(\/.*)?$/,
        zipUsPattern: /^\d{5}(?:-\d{4})?$/,
        notSupportedDocuments: /\.(ade|adp|apk|bat|chm|cmd|com|cpl|dll|dmg|exe|hta|ins|isp|jar|js|jse|lib|lnk|mde|msc|msi|msp|mst|nsh|pif|scr|sct|shb|sys|vb|vbe|vbs|vxd|wsc|wsf|wsh|cab)$/i
    };

    static readonly imageUrls = {
        noPhoto: 'assets/common/images/no-photo.png',
        noPhotoAdvicePeriod: 'assets/common/icons/advice-period-avatar.svg',
        noPhotoBankCode: 'assets/common/images/bank-code/default-avatar.png',
        noPhotoBankCode3x: 'assets/common/images/bank-code/default-avatar-3x.png',
        profileDefault: 'assets/common/images/default-profile-picture.png',
        profileLendSpace: 'assets/common/images/lend-space-dark/avatar.svg'
    };

    static readonly defaultCompanyName = 'Unknown company';
    static defaultCountryPhoneCode = '+1';
    static defaultCountryCode = 'US';

    /* System Action IDs */
    static readonly SYS_ID_CRM_CANCEL_LEAD           = 'CRM.CancelLead';
    static readonly SYS_ID_CRM_UPDATE_LEAD_STAGE     = 'CRM.UpdateLeadStage';
    static readonly SYS_ID_CRM_PROCESS_LEAD          = 'CRM.ProcessLead';
    static readonly SYS_ID_CRM_UPDATE_ACTIVITY_STAGE = 'CRM.UpdateActivityStage';
    static readonly SYS_ID_CRM_CANCEL_ORDER          = 'CRM.CancelOrder';
    static readonly SYS_ID_CRM_UPDATE_ORDER_STAGE    = 'CRM.UpdateOrderStage';
    static readonly SYS_ID_CRM_PROCESS_ORDER         = 'CRM.ProcessOrder';

    static readonly ODataVersion = 4;
    static readonly ODataRequestTimeoutMilliseconds = 3 * 60 * 1000;

    static readonly maxRatingValue = 10;

    /** 2 hours */
    static readonly generalDictionariesCacheLifetime = 2 * 60 * 60 * 1000;

    static readonly maxImageSize = 5242880;

    static readonly maxDocumentSizeMB = 100;
    static readonly maxDocumentSizeBytes = 1024 * 1024 * AppConsts.maxDocumentSizeMB;

    static readonly maxAffiliateCodeLength = 50
    static readonly maxAffiliateRateLength = 5;
    static readonly maxAffiliateRateZeroBaseLength = 6;
}
