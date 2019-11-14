import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'resources',
    templateUrl: 'resources.component.html',
    styleUrls: ['resources.component.less']
})
export class ResourcesComponent {
    data = [
        {
            categoryName: 'Financing',
            list: [
                {
                    title: 'ATM Workbook',
                    file: 'ATM+Workbook.pdf',
                    img: './assets/common/images/bank-code/thumbnails/ATM.png'
                },
                {
                    title: 'BANKCODE Financing Program',
                    file: 'BANKCODE+Financin…ram.pdf',
                    img: './assets/common/images/bank-code/thumbnails/ATM.png'
                },
                {
                    title: 'Seed Overview Slides',
                    file: 'SEED+OVERVIEW+SL…2.0.pptx',
                    img: './assets/common/images/bank-code/thumbnails/ATM.png'
                }
            ]
        },
        {
            categoryName: 'Graphics and logos',
            list: [
                {
                    title: 'BANK Logos',
                    file: 'BANK+Logos.zip',
                    img: './assets/common/images/bank-code/thumbnails/ATM.png'
                },
                {
                    title: 'BANKCODE Logos',
                    file: 'BANKCODE+Logos.zip',
                    img: './assets/common/images/bank-code/thumbnails/ATM.png'
                },
                {
                    title: 'One World One Language',
                    file: 'One+World+One+Language.zip',
                    img: './assets/common/images/bank-code/thumbnails/ATM.png'
                },
                {
                    title: 'Why They Buy Graphic',
                    file: 'Why+They+Buy.zip',
                    img: './assets/common/images/bank-code/thumbnails/ATM.png'
                }
            ]
        },
        {
            categoryName: 'Legal documents',
            list: [
                {
                    title: '2019 BANKCODE Compensation Plan',
                    file: 'Compensation+Plan…019.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Compensation_Plan.png'
                },
                {
                    title: 'BANKCODE E-Sign Consent',
                    file: 'BANKCODE+E-Sign+_…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/E_Sign_Consent.png'
                },
                {
                    title: 'BANKCODE IMA Application and Agreement',
                    file: 'BANKCODE+IMA+App…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/IMA_Application_and_Agreement.png'
                },
                {
                    title: 'BANKCODE Income Disclaimer',
                    file: 'BANKCODE+Income…mer.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Income_Disclaimer.png'
                },
                {
                    title: 'BANKCODE Policies and Procedures',
                    file: 'BANKCODE+Policies…res.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Policies_and_Procedures.png'
                },
                {
                    title: 'BANKCODE Privacy Policy - Updated 2019',
                    file: 'BANKCODE+IMA+Applic…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Privacy_Policy.png'
                },
                {
                    title: 'BANKCODE Terms of Use - Updated 2019',
                    file: 'BANKCODE+Income+…mer.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Terms_of_Use.png'
                },
                {
                    title: 'BANKCODE Advertising Guidelines',
                    file: 'BANKCODE+Policies+…res.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Advertising_Guideline.png'
                }
            ]
        },
        {
            categoryName: 'Social Media Ads',
            list: [
                {
                    title: '300%',
                    file: 'Compensation+Plan…019.pdf',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/300.png'
                },
                {
                    title: '90 Seconds',
                    file: 'BANKCODE+E-Sign+_…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/90_Seconds.png'
                },
                {
                    title: 'Holiday Promotions',
                    file: 'BANKCODE+IMA+Appl…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/Holiday_Promotions.png'
                },
                {
                    title: 'One World',
                    file: 'BANKCODE+Income…mer.pdf',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/One_World.png'
                },
                {
                    title: 'Read The Digital Book',
                    file: 'BANKCODE+Policies+…res.pdf',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/Read_The_Digital_Book.png'
                },
                {
                    title: 'What\'s Your BANK Code',
                    file: 'BANKCODE+IMA+App…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/What_Your_BANK_Code.png'
                },
                {
                    title: 'Why They Buy Ad',
                    file: 'BANKCODE+Income+…mer.pdf',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/Why_They_Buy_Ad.png'
                },
                {
                    title: 'Women\'s Day',
                    file: 'BANKCODE+Policies+…res.pdf',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/ATM.png'
                }
            ]
        },
        {
            categoryName: 'Trainer Kits',
            list: [
                {
                    title: 'L1: BANK Fundamentals Kit',
                    file: 'Compensation+Plan…019.pdf',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L1_BANK_Fundamentas_Kit.png'
                },
                {
                    title: 'L1: Intro to BANK Intelligences - Keynote',
                    file: 'BANKCODE+E-Sign+_+C…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L1_Intro_to_Bank Intelligences_Keynote.png'
                },
                {
                    title: 'L1: Intro to BANK Why They Buy - Keynote',
                    file: 'BANKCODE+IMA+Applic…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L1_Intro_to_Why_They_Buy_Keynote.png'
                },
                {
                    title: 'L2: Speed Coding Kit',
                    file: 'BANKCODE+Income+Di…mer.pdf',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L2_Speed_Coding_Kit.png'
                },
                {
                    title: 'L2: Speed Coding PNG',
                    file: 'BANKCODE+Policies+a…res.pdf',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L2_Speed_Coding_PNG.png'
                },
                {
                    title: 'L3: Power Scripting Kit',
                    file: 'BANKCODE+IMA+Appl…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L3_Power_Scripting_Kit.png'
                },
                {
                    title: 'L3: Power Scripting PNG',
                    file: 'BANKCODE+Income+…mer.pdf',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L3_Power_Scripting_PNG.png'
                },
                {
                    title: 'L4: Communication Mastery Kit',
                    file: 'BANKCODE+Policies+…res.pdf',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L4_Communication_Mastery_Kit.png'
                },
                {
                    title: 'L4: Communication Mastery PNG',
                    file: 'BANKCODE+Policies+…res.pdf',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L4_Communication_Mastery_PNG.png'
                }
            ]
        },
        {
            categoryName: 'Application Forms',
            list: [
                {
                    title: 'Trainer Application Form',
                    file: 'Compensation+Plan…019.pdf',
                    img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Application_Form.png'
                },
                {
                    title: 'Trainer Application Form - Print Ready',
                    file: 'BANKCODE+E-Sig_+C…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Application_Form_Print_Ready.png'
                },
                {
                    title: 'Trainer Order Form',
                    file: 'BANKCODE+IMA+Appl…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Order_Form.png'
                },
                {
                    title: 'Trainer Order Form - Print Ready',
                    file: 'BANKCODE+Income…mer.pdf',
                    img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Order_Form_Print_Ready.png'
                }
            ]
        },
        {
            categoryName: 'Videos',
            list: [
                {
                    title: 'Video - BANK Cryptex',
                    file: 'Compensation+Plan…019.pdf',
                    img: './assets/common/images/bank-code/thumbnails/videos/Video_BANK_Cryptex.png'
                },
                {
                    title: 'Video - BANKCODE One World',
                    file: 'BANKCODE+E-Sig_+C…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/videos/Video_BANKCODE_One_World.png'
                }
            ]
        },
        {
            categoryName: 'Affiliate Marketing Tools',
            list: [
                {
                    title: 'Akzidenz Berthold Font',
                    file: 'Compensation+Plan…019.pdf',
                    img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/Akzidenz_Berthold_Font.png'
                },
                {
                    title: 'Aviano Font',
                    file: 'BANKCODE+E-Sig_+C…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/Aviano_Sans_Font.png'
                },
                {
                    title: 'BANK Style Guide',
                    file: 'BANKCODE+E-Sign+_…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/BANK_Style_Guide.png'
                },
                {
                    title: 'BANKCODE Style Guide',
                    file: 'BANKCODE+E-Sign+…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/CODEBREAKER_Style_Guide.png'
                },
                {
                    title: 'Media Kit',
                    file: 'BANKCODE+E-Sign+_…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/Media_Kit.png'
                }
            ]
        },
        {
            categoryName: 'Slide Decks',
            list: [
                {
                    title: 'Affiliate Opportunity',
                    file: 'Compensation+Plan…019.pdf',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/Affiliate_Opportunity.png'
                },
                {
                    title: 'BANKCODE Product Offers',
                    file: 'BANKCODE+E-Sign+…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/BANKCODE_Product_Offers.png'
                },
                {
                    title: 'Intro to BANK Intelligences',
                    file: 'BANKCODE+E-Sign+…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/Intro_to_Bank_Intelligences.png'
                },
                {
                    title: 'Intro to BANK Why They Buy',
                    file: 'BANKCODE+E-Sign+…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/Intro_to_Why_They_Buy.png'
                },
                {
                    title: 'Quote Deck - Memes',
                    file: 'BANKCODE+E-Sign+…ent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/Quote_Deck_Memes.png'
                },
                {
                    title: 'Trainer Opportunity',
                    file: 'Compensation+Plan…019.pdf',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/Trainer_Opportunity.png'
                }
            ]
        },
    ];

    constructor(public ls: AppLocalizationService) {}
}
