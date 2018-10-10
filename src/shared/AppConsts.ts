export class AppConsts {
    static readonly tenancyNamePlaceHolderInUrl = '{TENANCY_NAME}';
    static readonly tenantHostType = 1;

    static readonly googleMapsApiUrl = 'https://maps.googleapis.com/maps/api/js?key={KEY}&libraries=places&language=en';
    static readonly helpLink = 'https://support.sperse.com';
    static readonly isMobile = RegExp('Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini', 'i').test(navigator.userAgent);
    static readonly defaultErrorMessage = 'No further information available.';

    static readonly thumbWidth  = 44;
    static readonly thumbHeight = 44;

    static remoteServiceBaseUrl: string;
    static remoteServiceBaseUrlFormat: string;
    static appBaseUrl: string;
    static appBaseHref: string; // returns angular's base-href parameter value if used during the publish
    static appBaseUrlFormat: string;
    static recaptchaSiteKey: string;
    static googleSheetClientId: string;
    static subscriptionExpireNootifyDayCount: number;
    static subscriptionGracePeriod = 7; /* Days */

    static localeMappings: any = [];

    static readonly userManagement = {
        defaultAdminUserName: 'admin'
    };

    static readonly localization = {
        defaultLocalizationSourceName: 'Platform',
        CRMLocalizationSourceName: 'CRM',
        CFOLocalizationSourceName: 'CFO',
        CreditReportLocalizationSourceName: 'CreditReport'
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

    static readonly PipelinePurposeIds = {
        lead: 'Lead',
        order: 'Order',
        activity: 'Activity'
    };

    static readonly masks = {
        phone: '+1 (000)-000-0000',
        ssn: '000-00-0000',
        taxNumber: '00-0000000'
    };

    static readonly formatting = {
        date: 'MM/DD/YYYY',
        dateTime: 'MM/dd/yyyy hh:mm a'
    };

    static readonly otherLinkTypeId = '-';

    static readonly regexPatterns = {
        name: /^[A-Z][a-zA-Z]+$/,
        email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+")[a-zA-Z]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        phone: /^[0-9]{10}$/,
        url: /(http:\/\/|https:\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?/,
        fullName: /^[^\d]+$/
    };

    static readonly defaultCompanyName = 'Unknown company';

    /* System Action IDs */
    static readonly SYS_ID_CRM_CANCEL_LEAD       = 'CRM.CancelLead';
    static readonly SYS_ID_CRM_UPDATE_LEAD_STAGE = 'CRM.UpdateLeadStage';
    static readonly SYS_ID_CRM_PROCESS_LEAD      = 'CRM.ProcessLead';

    static readonly defaultCountry = 'US';
    static readonly defaultCountryCode = '+1';
    static readonly ODataVersion = 4;

    static readonly maxRatingValue = 10;
}

