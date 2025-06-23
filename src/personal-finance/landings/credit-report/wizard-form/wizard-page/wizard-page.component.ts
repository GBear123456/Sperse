/** Core imports */
import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { finalize } from 'rxjs/operators';
import * as moment from 'moment';
import capitalize from 'underscore.string/capitalize';
import { Address } from 'ngx-google-places-autocomplete/objects/address';

/** Application imports */
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppConsts } from '@shared/AppConsts';
import { Country } from '@shared/AppEnums';
import {
    ApplicationServiceProxy,
    CountryStateDto,
    MemberServiceProxy,
    Gender,
    MemberPaymentAuthorizeRequestDto,
    MemberInfoDto,
    MemberAddressDto,
    PasswordComplexitySetting,
    TrackingInfo,
} from '@shared/service-proxies/service-proxies';
import { PaymentInfoComponent } from '@shared/common/widgets/payment-info/payment-info.component';
import { WizardComponent } from '../wizard.component';
import { LoginService } from '@root/account/login/login.service';
import { RegisterModel } from './register.model';
import { v4 as UUID } from 'uuid';
import { PackageIdService } from '../../../../shared/common/packages/package-id.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { GooglePlaceService } from '@shared/common/google-place/google-place.service';
import { StatesService } from '@root/store/states-store/states.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    selector: 'app-wizard-page',
    templateUrl: 'wizard-page.component.html',
    styleUrls: ['wizard-page.component.less'],
    providers: [ ApplicationServiceProxy, GooglePlaceService, MemberServiceProxy, LoginService ]
})
export class CreditWizardPageComponent implements OnInit {
    @ViewChild(WizardComponent, { static: true }) mWizard: WizardComponent;
    @ViewChild(PaymentInfoComponent, { static: true }) paymentInfo: PaymentInfoComponent;
    @ViewChild('addressInput') addressInput: ElementRef;

    private readonly WIZARD_MEMBER_INFO_STEP_INDEX = 0;
    private readonly WIZARD_PAYMENT_STEP_INDEX = 1;
    private readonly WIZARD_ADDRESS_STEP_INDEX = 2;
    private readonly WIZARD_CONFIRM_STEP_INDEX = 3;

    private readonly INPUT_MASK = {
        ssn: '000-00-0000',
        phone: '(000) 000-0000',
        zipCode: '00000'
    };

    private readonly sourceCode = 'LS';

    registrationInProgress = false;
    paymentAuthorizationRequired = true;
    countryCode = AppConsts.defaultCountryCode;
    packageId: number;
    paymentResult: any;
    model: RegisterModel = new RegisterModel();
    country: string;
    street_number: string;
    street_name: string;
    states: CountryStateDto[];
    uniqueId: string = UUID();
    gender = [
        { text: 'Male', value: Gender.Male },
        { text: 'Female', value: Gender.Female }
    ];
    radioGroupCitizen = [
        { text: 'Yes', status: true },
        { text: 'No', status: false }
    ];
    maxDate: Date = new Date();
    minDate: Date = new Date();
    minAge: number;
    maxAge: number;
    payment: MemberPaymentAuthorizeRequestDto = MemberPaymentAuthorizeRequestDto.fromJS({});
    isExistingUser: boolean = !!abp.session.userId;
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    passwordComplexityWord = 'empty';
    showPassword = false;
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    emailRegEx = AppConsts.regexPatterns.email;
    googleAutoComplete: Boolean;
    public options = {
        types: ['address'],
        componentRestrictions: {
            country: [ Country.USA, Country.Canada ]
        }
    };

    constructor(
        private data: PackageIdService,
        private memberService: MemberServiceProxy,
        private store$: Store<RootStore.State>,
        private statesService: StatesService,
        private sessionService: AppSessionService,
        private router: Router,
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public loginService: LoginService
    ) {
        this.minAge = this.minDate.setFullYear(this.minDate.getFullYear() - 18);
        this.maxAge = this.maxDate.setFullYear(this.maxDate.getFullYear() - 99);
        this.model.registrationId = this.uniqueId;
        this.model.isUSCitizen = true;
        this.model.gender = null;
        this.model.address = new MemberAddressDto();
        this.model.address.countryId = this.countryCode;
        this.model.trackingInfo = new TrackingInfo();
        this.model.trackingInfo.sourceCode = this.sourceCode;
        this.googleAutoComplete = Boolean(window['google']);
    }

    ngOnInit() {
        this.payment.bankCard = this.paymentInfo.bankCard;

        if (this.isExistingUser)
            this.mWizard.addDisabledSteps(this.WIZARD_CONFIRM_STEP_INDEX);

        if (this.model.packageId = this.packageId = this.data.packageId) {
            this.memberService.selectPackage(this.packageId).
                subscribe(result => {
                    if (result) {
                        if (result.registrationId)
                            this.model.registrationId = this.uniqueId = result.registrationId;
                        if (result.memberInfo) {
                            this.model.name = result.memberInfo.name;
                            this.model.surname = result.memberInfo.surname;
                            this.model.doB = result.memberInfo.doB;
                            this.model.email = result.memberInfo.email;
                            this.model.ssn = result.memberInfo.ssn;
                            this.model.phone = result.memberInfo.phone;
                            this.model.isUSCitizen = result.memberInfo.isUSCitizen;
                            this.model.gender = <Gender><any>result.memberInfo.gender;

                            if (result.memberInfo.address) {
                                this.model.address = result.memberInfo.address;
                                this.payment.bankCard.billingAddress = result.memberInfo.address.streetAddress;
                                this.payment.bankCard.billingCity = result.memberInfo.address.city;
                                this.payment.bankCard.billingStateCode = result.memberInfo.address.stateId;
                                this.payment.bankCard.billingCountryCode = result.memberInfo.address.countryId;
                                this.payment.bankCard.billingZip = result.memberInfo.address.zip;
                            }
                        }

                        this.paymentAuthorizationRequired = result.paymentAuthorizationRequired;

                        if (!this.paymentAuthorizationRequired)
                            this.mWizard.addDisabledSteps(this.WIZARD_PAYMENT_STEP_INDEX);
                        else
                            this.mWizard.addDisabledSteps(this.WIZARD_ADDRESS_STEP_INDEX);
                    }
                });
            this.getStates();
        } else
            this.router.navigate(['personal-finance']);

        this.passwordComplexitySetting.requireDigit = abp.setting.getBoolean('Abp.Zero.UserManagement.PasswordComplexity.RequireDigit');
        this.passwordComplexitySetting.requireLowercase = abp.setting.getBoolean('Abp.Zero.UserManagement.PasswordComplexity.RequireLowercase');
        this.passwordComplexitySetting.requireUppercase = abp.setting.getBoolean('Abp.Zero.UserManagement.PasswordComplexity.RequireUppercase');
        this.passwordComplexitySetting.requireNonAlphanumeric = abp.setting.getBoolean('Abp.Zero.UserManagement.PasswordComplexity.RequireNonAlphanumeric');
        this.passwordComplexitySetting.requiredLength = abp.setting.getInt('Abp.Zero.UserManagement.PasswordComplexity.RequiredLength');
    }

    getStates(): void {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getCountryStates, { countryCode: this.countryCode }))
            .subscribe(result => {
                if (result)
                    this.states = result;
            });
    }

    checkButtonDisabled(formId) {
        return !this.states ||
            !Array.prototype.slice.call(top[formId]['elements'])
                .every(function (input) {
                    return (input.type != 'text') || (Boolean(input.value)
                        && !input.getAttribute('aria-invalid'));
                });
    }

    validate(event): boolean {
        if (event.validationGroup.validate().isValid) {
            event.component.option('disabled', true);
            return true;
        }
    }

    previousStep() {
        this.mWizard.currentStep--;
    }

    memberInfoSubmit(event) {
        this.model.name = capitalize(this.model.name);
        this.model.surname = capitalize(this.model.surname);

        let date = new Date(this.model.doB.toString()),
            month = date.getMonth() + 1,
            day = date.getDate();

        this.model.doB = moment(
            Date.parse(
                date.getFullYear() + '-' +
                this.twoDigitsFormat(month) + '-' +
                this.twoDigitsFormat(day) +
                'T00:00:00.000Z'
            )
        );

        if (!this.validate(event)) return;

        this.memberService.submitMemberInfo(this.convertToMemberInfo(this.model))
            .pipe(finalize(() => { event.component.option('disabled', false); }))
            .subscribe(result => {
                this.paymentAuthorizationRequired = result.paymentAuthorizationRequired;
                if (result && result.paymentAuthorizationRequired) {
                    this.mWizard.removeDisabledSteps(this.WIZARD_PAYMENT_STEP_INDEX);
                    this.mWizard.addDisabledSteps(this.WIZARD_ADDRESS_STEP_INDEX);
                    this.mWizard.currentStep = this.WIZARD_PAYMENT_STEP_INDEX;
                } else {
                    this.mWizard.removeDisabledSteps(this.WIZARD_ADDRESS_STEP_INDEX);
                    this.mWizard.addDisabledSteps(this.WIZARD_PAYMENT_STEP_INDEX);
                    this.mWizard.currentStep = this.WIZARD_ADDRESS_STEP_INDEX;
                }
            });
    }

    billingInfoSubmit(event) {

        if (!this.paymentAuthorizationRequired) {
            this.mWizard.currentStep = this.WIZARD_CONFIRM_STEP_INDEX;
            return;
        }

        if (!this.paymentInfo.validationGroup.validate().isValid) return;
        event.component.option('disabled', true);

        this.payment.packageId = this.model.packageId;
        this.payment.bankCard.holderName = this.model.name + ' ' + this.model.surname;
        this.payment.bankCard.billingCountryCode = this.countryCode;
        this.payment.registrationId = this.uniqueId;
        this.memberService.paymentAuthorize(this.payment)
            .pipe(finalize(() => { event.component.option('disabled', false); }))
            .subscribe((result) => {
                if (result.success) {
                    this.paymentAuthorizationRequired = false;
                    if (this.isExistingUser) {
                        this.model.password = 'stub';
                        this.registerMemberSubmit();
                    } else
                        this.mWizard.currentStep = this.WIZARD_CONFIRM_STEP_INDEX;
                } else
                    this.paymentResult = result;
            });

        this.fillModelAddress(this.payment);
    }

    fillModelAddress(paymentInfo: MemberPaymentAuthorizeRequestDto) {
        this.model.address.streetAddress = paymentInfo.bankCard.billingAddress;
        this.model.address.city = paymentInfo.bankCard.billingCity;
        this.model.address.stateId = paymentInfo.bankCard.billingStateCode;
        this.model.address.stateName = paymentInfo.bankCard.billingState;
        this.model.address.countryId = paymentInfo.bankCard.billingCountryCode;
        this.model.address.zip = paymentInfo.bankCard.billingZip;
    }

    onAddressChanged(address: Address) {
        this.street_number = GooglePlaceService.getStreetNumber(address.address_components);
        this.street_name = GooglePlaceService.getStreet(address.address_components);
        this.model.address.stateId = GooglePlaceService.getStateCode(address.address_components);
        this.model.address.stateName = GooglePlaceService.getStateName(address.address_components);
        this.model.address.city = GooglePlaceService.getCity(address.address_components);
        this.model.address.streetAddress = this.payment.bankCard.billingAddress = this.addressInput.nativeElement.value
            = this.street_number ? this.street_number + ' ' + this.street_name : this.street_name;
        this.model.address.zip = GooglePlaceService.getZipCode(address.address_components);
        const countryName = GooglePlaceService.getCountryName(address.address_components);
        const countryCode = GooglePlaceService.getCountryCode(address.address_components);
        this.country = this.sessionService.getCountryNameByCode(countryCode) || countryName;

        if (this.countryCode !== countryCode) {
            this.model.address.countryId = this.countryCode = countryCode;
            this.getStates();
        }
    }

    addressInfoSubmit(event) {
        if (!this.validate(event)) return;

        this.memberService.submitMemberInfo(this.convertToMemberInfo(this.model))
            .pipe(finalize(() => { event.component.option('disabled', false); }))
            .subscribe(()  => {
                if (this.isExistingUser) {
                    this.model.password = 'stub';
                    this.registerMemberSubmit();
                } else {
                    this.mWizard.currentStep = this.WIZARD_CONFIRM_STEP_INDEX;
                }
            });
    }

    registerMemberSubmit(): void {
        abp.ui.setBusy();
        this.registrationInProgress = true;
        this.memberService.registerMember(this.model)
            .subscribe(() => {
                if (!this.isExistingUser) {
                    this.loginService.authenticateModel.userNameOrEmailAddress = this.model.email;
                    this.loginService.authenticateModel.password = this.model.password;
                    this.loginService.authenticate(() => this.finalizeRegistering(), AppConsts.appBaseUrl + '/personal-finance');
                } else {
                    this.finalizeRegistering();
                    this.router.navigate(['personal-finance/credit-reports']);
                }
            }, () => {
                if (this.isExistingUser)
                    this.mWizard.currentStep = this.WIZARD_MEMBER_INFO_STEP_INDEX;
                this.finalizeRegistering();
            }
            );
    }

    finalizeRegistering() {
        this.registrationInProgress = false;
        abp.ui.clearBusy();
    }

    twoDigitsFormat(value) {
        return ('0' + value).slice(-2);
    }

    convertToMemberInfo(model: RegisterModel): MemberInfoDto {
        let memberInfo = new MemberInfoDto();
        memberInfo.name = model.name;
        memberInfo.surname = model.surname;

        memberInfo.doB = model.doB;
        memberInfo.email = model.email;
        memberInfo.packageId = model.packageId;
        memberInfo.phone = model.phone;
        memberInfo.registrationId = model.registrationId;
        memberInfo.ssn = model.ssn;
        memberInfo.isUSCitizen = model.isUSCitizen;

        memberInfo.gender = <Gender><any>model.gender;
        memberInfo.address = model.address;
        memberInfo.trackingInfo = new TrackingInfo();
        memberInfo.trackingInfo.sourceCode = model.trackingInfo.sourceCode;

        return memberInfo;
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    validateDateBirth(event) {
        event = event.event;
        let value = event.target.value + event.key;

        if (['ArrowRight', 'ArrowLeft', 'Backspace', 'Delete', 'Tab'].indexOf(event.key) >= 0)
            return;

        value = value + '11/11/1111'.slice(value.length);
        if (!value.match(/^(0?[1-9]|1[012])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/))
            event.preventDefault();
    }

    focusDateBirth(event) {
        setTimeout(function () {
            event.component._popup._$popupContent.find('.dx-calendar').dxCalendar({
                zoomLevel: 'decade',
                value: new Date(1980, 0)
            });
        }, 0);

        event.component.open();
    }

    toggleShowPassword(event) {
        this.showPassword = !this.showPassword;
        event.currentTarget.text = this.ls.l((this.showPassword ? 'Hide' : 'Show') + 'Password');
    }

    UpdatePasswordStrength(newPassword) {
        let passwordComplexityScore = this.GetPasswordStrength(newPassword);

        if (passwordComplexityScore == -1) {
            this.passwordComplexityWord = 'empty';
        } else if (passwordComplexityScore == 0) {
            this.passwordComplexityWord = 'tooshort';
        } else if (passwordComplexityScore <= 0.25) {
            this.passwordComplexityWord = 'weak';
        } else if (passwordComplexityScore <= 0.5) {
            this.passwordComplexityWord = 'fair';
        } else {
            this.passwordComplexityWord = 'strong';
        }
    }

    GetPasswordStrength(password) {
        if (password.length == 0) return -1;
        if (password.length < this.passwordComplexitySetting.requiredLength) return 0;

        let rate = 0;
        let hasDigit = password.match(/[0-9]/);
        let hasLower = password.match(/[a-z]/);
        let hasUpper = password.match(/[A-Z]/);
        let hasNonAlfa = password.match(/[!,@,#,$,%,^,&,*,?,_,~,\-,(,),\s,\[,\],+,=,\,,<,>,:,;]/);

        if ((this.passwordComplexitySetting.requireDigit && !hasDigit) ||
            (this.passwordComplexitySetting.requireLowercase && !hasLower) ||
            (this.passwordComplexitySetting.requireUppercase && !hasUpper) ||
            (this.passwordComplexitySetting.requireNonAlphanumeric && !hasNonAlfa)) {
            return 0.25;
        }

        if (hasDigit) rate++;
        if (hasLower) rate++;
        if (hasUpper) rate++;
        if (hasNonAlfa) rate++;
        return rate / 4;
    }

    checkPasswordRule(passwordInput, rule) {
        return !passwordInput.value ||
            passwordInput.errors && passwordInput.errors[rule] ? 'invalid' : 'valid';
    }
}
