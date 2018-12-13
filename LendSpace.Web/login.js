$(document).ready(function () {
    abp.domain = 'app.lendspace.com';
    var apiOrigin = 'https://' + abp.domain,
        form = window['loginForm'];
    
    form.elements['userNameOrEmailAddress'].onkeyup = 
    form.elements['password'].onkeyup = checkIsValid;

    form.onsubmit = function() {
        if (checkIsValid()) {
            var cookie = queryString(document.cookie, ';');
            var authenticateModel = JSON.stringify({
                userNameOrEmailAddress: form.elements['userNameOrEmailAddress'].value,
                password: form.elements['password'].value,
                rememberClient: form.elements['rememberMe'].value,
                twoFactorRememberClientToken: cookie['TwoFactorRememberClientToken'],
                autoDetectTenancy: true
            });

            $.ajax({
                url: apiOrigin + '/api/TokenAuth/Authenticate',
                data: authenticateModel,
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                error: function(request) {
                    var response = JSON.parse(request.responseText);
                    if (response.error)
                        abp.message.error(response.error.details, response.error.message);
                }
            }).done((response) => {
                if (response.result)
                    handleAuthResult(response.result);
                else
                    location.href = apiOrigin;
            });
        }

        return false;
    }

    var inputCheckTimeout;
    form.onkeypress = form.onchange = function() {
        clearTimeout(inputCheckTimeout);
        inputCheckTimeout = setTimeout(checkIsValid, 300);
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
        location = apiOrigin + path + (params ? '?' + $.param(params): '');
    }

    function handleAuthResult(authenticateResult) {
        if (authenticateResult.shouldResetPassword) {
            // Password reset
            navigate('/account/reset-password', {
                userId: authenticateResult.userId,
                tenantId: authenticateResult.detectedTenancies[0].id,
                resetCode: authenticateResult.passwordResetCode
            });

        } else if (authenticateResult.requiresTwoFactorVerification) {
            // Two factor authentication
            let tenantId = authenticateResult.detectedTenancies[0].id;
            abp.multiTenancy.setTenantIdCookie(tenantId);
            navigate('/account/send-code');
        } else if (authenticateResult.accessToken) {
            // Successfully logged in
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
            navigate('/account/select-tenant');
        } else {
            // Unexpected result!
            abp.message.warn('Unexpected authenticateResult!');
            navigate('/account/login');
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
            abp.appPath,
            abp.domain
        );

        if (twoFactorRememberClientToken) {
            abp.utils.setCookieValue(
                TwoFactorRememberClientToken,
                twoFactorRememberClientToken,
                new Date(new Date().getTime() + 365 * 86400000), // 1 year
                abp.appPath,
                abp.domain
            );
        }

        abp.multiTenancy.setTenantIdCookie();
        location.href = apiOrigin;
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
});