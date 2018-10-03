(function() {
    const TwoFactorRememberClientToken = 'TwoFactorRememberClientToken';
    const AbpLocalizationCultureName = 'Abp.Localization.CultureName';
    const EncryptedAuthToken = 'enc_auth_token';

    var remoteServiceUrl = '', loginInformations;
    var pathParts = location.pathname.split('/').filter(Boolean);
    var cookie = queryString(document.cookie, ';');
    var params = queryString(document.location.search.substr(1), '&');
    if (
        !params.secureId && (
            (!pathParts.length && !cookie['Abp.AuthToken']) ||
            (pathParts.pop() == 'login')
        )
    ) {
        window.loginPageHandler = function(appConfig) {}

        document.getElementById('loginPage').style.display = 'block';
        document.getElementById('loadSpinner').style.display = 'none';
        document.getElementById('forget-password').href = location.origin + '/account/forgot-password';
        window.history.pushState("", "", location.origin + '/account/login' + document.location.search);

        getAppConfig();
    }

    function getBaseHref() {
        return document.head.getElementsByTagName('base')[0].href;
    }

    function ajax(url, headers) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);

            for (var header in headers)
                xhr.setRequestHeader(header, headers[header]);

            xhr.onload = function() {
                if (xhr.status === 200)
                    resolve(JSON.parse(xhr.responseText));
                else
                    reject(xhr);
            };
            xhr.send();        
        });
    }

    function getAppConfig() {
        ajax('./assets/appconfig.json').then(function(result) {
            remoteServiceUrl = result.remoteServiceBaseUrl;
            var cookie = queryString(document.cookie, ';');
            var currentUrl = window.location.protocol + '//' + window.location.host;
            if (result.appBaseUrl !== currentUrl) {
                ajax(remoteServiceUrl + '/api/services/Platform/TenantHost/GetTenantApiHost?TenantHostType=1',
                    {
                        'Accept-Language': cookie[AbpLocalizationCultureName]
                    }
                ).then((tenantApiHostOutput) => {
                    let apiProtocolUrl = new URL(result.remoteServiceBaseUrl);

                    if (tenantApiHostOutput.result && tenantApiHostOutput.result.apiHostName) {
                        remoteServiceUrl = apiProtocolUrl.protocol + '//' + tenantApiHostOutput.result.apiHostName;
                    } else {
                        remoteServiceUrl = result.remoteServiceBaseUrl;
                    }

                    getCurrentLoginInformations();
                });
            } else {
                getCurrentLoginInformations();
            }
        });
    }

    function getCurrentLoginInformations() {
        ajax(remoteServiceUrl + '/api/services/Platform/Session/GetCurrentLoginInformations',
            {
                "Content-Type": "application/json", 
                "Accept": "application/json"                
            }
        ).then(function(response) {
            loginInformations = response && response.result;
            if (window['logoImage']) {
                logoImage.setAttribute('src', 
                    loginInformations && loginInformations.tenant && loginInformations.tenant.logoId ?
                    remoteServiceUrl + '/TenantCustomization/GetLogo?logoId=' + response.tenant.logoId: 
                    getBaseHref() + 'assets/common/images/app-logo-on-dark.png'
                );
                logoImage.style.display = 'block';
            }
        });
    }

    function queryString(value, delimiter) {
        var result = {};
        value.split(delimiter).forEach(function(val) {
            var parts = val.split('=');
            if (parts.length == 2)
                result[parts[0].trim()] = parts[1].trim();
        });
        return result;
    }

    function navigate(path, params) {
        location = path + (params ? $.param(params): '');
    }

    function handleAuthResult(authenticateResult) {
        if (authenticateResult.shouldResetPassword) {
            // Password reset
            navigate('account/reset-password', {
                queryParams: {
                    userId: authenticateResult.userId,
                    tenantId: authenticateResult.detectedTenancies[0].id,
                    resetCode: authenticateResult.passwordResetCode
                }
            });

        } else if (authenticateResult.requiresTwoFactorVerification) {
            // Two factor authentication
            let tenantId = authenticateResult.detectedTenancies[0].id;
            abp.multiTenancy.setTenantIdCookie(tenantId);
            navigate('account/send-code');
        } else if (authenticateResult.accessToken) {
            // Successfully logged in
            var form = window['loginForm'];
            login(
                authenticateResult.accessToken,
                authenticateResult.encryptedAccessToken,
                authenticateResult.expireInSeconds,
                form && form.elements['rememberMe'].checked,
                authenticateResult.twoFactorRememberClientToken,
                authenticateResult.returnUrl
            );
        } else if (authenticateResult.detectedTenancies.length > 1) {
            //Select tenant
            navigate('account/select-tenant');
        } else {
            // Unexpected result!
            abp.message.warn('Unexpected authenticateResult!');
            navigate('account/login');
        }
    }

    function login(accessToken, encryptedAccessToken, expireInSeconds, rememberMe, twoFactorRememberClientToken, redirectUrl) {

        var tokenExpireDate = rememberMe ? (new Date(new Date().getTime() + 1000 * expireInSeconds)) : undefined;

        abp.auth.setToken(
            accessToken,
            tokenExpireDate
        );

        abp.utils.setCookieValue(
            EncryptedAuthToken,
            encryptedAccessToken,
            tokenExpireDate,
            abp.appPath
        );

        if (twoFactorRememberClientToken) {
            abp.utils.setCookieValue(
                TwoFactorRememberClientToken,
                twoFactorRememberClientToken,
                new Date(new Date().getTime() + 365 * 86400000), // 1 year
                abp.appPath
            );
        }

        abp.multiTenancy.setTenantIdCookie();

        redirectUrl = redirectUrl || sessionStorage.getItem('redirectUrl');
        if (redirectUrl) {
            sessionStorage.removeItem('redirectUrl');
            location.href = redirectUrl;
        } else {
            location.href = location.origin;
        }
    }

    if (window['loginForm']) {
        var form = window['loginForm'];
        form.onsubmit = function() {      
            if (checkIsValid()) {
                var params = queryString(document.location.search.substr(1), '&');
                var cookie = queryString(document.cookie, ';');
                var authenticateModel = JSON.stringify({
                    userNameOrEmailAddress: form.elements['userNameOrEmailAddress'].value,
                    password: form.elements['password'].value,
                    twoFactorRememberClientToken: cookie[TwoFactorRememberClientToken],
                    singleSignIn: params.ss,
                    returnUrl: params.returnUrl,
                    autoDetectTenancy: true
                });
                
                abp.ui.setBusy();
                $.ajax({
                    url: remoteServiceUrl + '/api/TokenAuth/Authenticate',
                    data: authenticateModel,
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json", 
                        "Accept": "application/json"                
                    },
                    error: function(request) {
                        abp.ui.clearBusy();
                        var response = JSON.parse(request.responseText);
                        if (response.error)
                            abp.message.error(response.error.details, response.error.message);
                    }
                }).done((response) => {
                    abp.ui.clearBusy();
                    if (response.result) {
                        handleAuthResult(response.result);
                        sessionStorage.setItem('authenticateResult',  
                            JSON.stringify(response.result));
                        sessionStorage.setItem('authenticateModel', 
                            authenticateModel);
                    }
                });
            }

            return false;
        }

        function checkIsValid() {
            var login = form.elements['userNameOrEmailAddress'];
            var password = form.elements['password'];
            var button = form.elements['submit'];
            var result = login.value && password.value;
            if (result)
                button.removeAttribute('disabled');
            else
                button.setAttribute('disabled', '');

            return result;
        }

        var inputCheckTimeout;
        form.onkeypress = form.onchange = function() {
            clearTimeout(inputCheckTimeout);
            inputCheckTimeout = setTimeout(checkIsValid, 300);
        }
        
        window.addEventListener('load', function() {                        
            $( document ).ready( function() {
                $('.agree-rights').show();

                var privacy = $('#privacy');
                privacy.on('show.bs.modal', function() {
                    $(this)
                        .addClass('modal-scrollfix')
                        .find('.modal-body')
                        .html('loading...')
                        .load(remoteServiceUrl + '/docs/privacy.html', function() {
                            privacy
                                .removeClass('modal-scrollfix')
                                .modal('handleUpdate');
                        });
                });

                var terms = $('#terms');
                terms.on('show.bs.modal', function() {
                    $(this)
                        .addClass('modal-scrollfix')
                        .find('.modal-body')
                        .html('loading...')
                        .load(remoteServiceUrl + '/docs/terms.html', function() {
                            terms
                                .removeClass('modal-scrollfix')
                                .modal('handleUpdate');
                        });
                });

                $('.print-this').on('click', function() {
                    printElement($('.print-this-section')[0]);
                });
            });

            function printElement(elem) {
                let domClone = elem.cloneNode(true);
                let printSection = document.getElementById('printSection');
                if (!printSection) {
                    printSection = document.createElement('div');
                    printSection.id = 'printSection';
                    document.body.appendChild(printSection);
                }
                printSection.innerHTML = '';
                printSection.appendChild(domClone);
                window.print();
            }
        });
    }
})();