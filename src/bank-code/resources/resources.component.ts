import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'resources',
    templateUrl: 'resources.component.html',
    styleUrls: ['resources.component.less']
})
export class ResourcesComponent {
    isClicked: number;
    data = [
        {
            categoryName: 'AFFILIATE TOOLS',
            anchor: 'marketing',
            list: [
                {
                    title: 'Akzidenz Berthold Font',
                    fileName: 'Compensation+Plan…019.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Marketing+Materials/Akzidenz+Berthold+Font.zip',
                    img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/Akzidenz_Berthold_Font.png'
                },
                {
                    title: 'Aviano Font',
                    fileName: 'BANKCODE+E-Sig_+C…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Marketing+Materials/Aviano+Font.zip',
                    img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/Aviano_Sans_Font.png'
                },
                {
                    title: 'BANK Style Guide',
                    fileName: 'BANKCODE+E-Sign+_…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Marketing+Materials/BANK+Style+Guide.zip',
                    img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/BANK_Style_Guide.png'
                },
                {
                    title: 'BANKCODE Style Guide',
                    fileName: 'BANKCODE+E-Sign+…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Marketing+Materials/BANKCODE+Style+Guide.zip',
                    img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/CODEBREAKER_Style_Guide.png'
                },
                {
                    title: 'Media Kit',
                    fileName: 'BANKCODE+E-Sign+_…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Media+Kit/Media+Kit.pdf',
                    img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/Media_Kit.png'
                }
            ]
        },
        {
            categoryName: 'FINANCING',
            anchor: 'fin',
            list: [
                {
                    title: 'ATM Workbook',
                    fileName: 'ATM+Workbook.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Finance/ATM+Workbook.pdf',
                    img: './assets/common/images/bank-code/thumbnails/ATM.png'
                },
                {
                    title: 'BANKCODE Financing Program',
                    fileName: 'BANKCODE+Financin…ram.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Finance/BANKCODE+Financing+Program.pdf',
                    img: './assets/common/images/bank-code/thumbnails/CreditApproval.png'
                },
                {
                    title: 'Seed Overview Slides',
                    fileName: 'SEED+OVERVIEW+SL…2.0.pptx',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Finance/SEED+OVERVIEW+SLIDES+V.2.0.pptx',
                    img: './assets/common/images/bank-code/thumbnails/SeedCapital.png'
                }
            ]
        },
        {
            categoryName: 'GRAPHICS & MEDIA',
            anchor: 'graph',
            list: [
                {
                    title: 'BANKCODE Logos',
                    fileName: 'BANKCODE+Logos.zip',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/BANK+Logos.zip',
                    img: './assets/common/images/bank-code/thumbnails/BANK-Logos.png'
                },
                {
                    title: 'Codebreaker Logos',
                    fileName: 'Codebreaker+Logos.zip',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/BANKCODE+Logos.zip',
                    img: './assets/common/images/bank-code/thumbnails/Codebreaker-Logos.png'
                },
                {
                    title: 'One World One Language',
                    fileName: 'One+World+One+Language.zip',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/One+World+One+Language.zip',
                    img: './assets/common/images/bank-code/thumbnails/One_World.png'
                },
                {
                    title: 'Why They Buy Graphic',
                    fileName: 'Why+They+Buy.zip',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Why+They+Buy.zip',
                    img: './assets/common/images/bank-code/thumbnails/Why_They_Buy_Ad.png'
                },
                {
                    title: '300%',
                    fileName: 'Compensation+Plan…019.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/300%25.zip',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/300.png'
                },
                {
                    title: '90 Seconds',
                    fileName: 'BANKCODE+E-Sign+_…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/90_Sec.zip',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/90_Seconds.png'
                },
                {
                    title: 'Holiday Promotions',
                    fileName: 'BANKCODE+IMA+Appl…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/Holiday+Promotions.zip',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/Holiday_Promotions.png'
                },
                {
                    title: 'One World',
                    fileName: 'BANKCODE+Income…mer.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/One+World.zip',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/One_World.png'
                },
                {
                    title: 'Read The Digital Book',
                    fileName: 'BANKCODE+Policies+…res.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/Read+the+digital+book.zip',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/Read_The_Digital_Book.png'
                },
                {
                    title: 'What\'s Your BANK Code',
                    fileName: 'BANKCODE+IMA+App…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/What\'s+your+BANK+code.zip',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/What_Your_BANK_Code.png'
                },
                {
                    title: 'Why They Buy Ad',
                    fileName: 'BANKCODE+Income+…mer.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/Why+They+Buy.zip',
                    img: './assets/common/images/bank-code/thumbnails/social-media-ads/Why_They_Buy_Ad.png'
                },
                {
                    title: 'Women\'s Day',
                    fileName: 'BANKCODE+Policies+…res.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/Women\'s+Day.zip',
                    img: './assets/common/images/bank-code/thumbnails/8_March_WomensDay.jpg'
                }
            ]
        },
        {
            categoryName: 'LEGAL DOCUMENTS',
            anchor: 'legal',
            list: [
                {
                    title: '2019 BANKCODE Compensation Plan',
                    fileName: 'Compensation+Plan…019.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Compensation+Plan/Compensation+Plan+-+September+2019.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Compensation_Plan.png'
                },
                {
                    title: 'BANKCODE E-Sign Consent',
                    fileName: 'BANKCODE+E-Sign+_…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+E-Sign+_+Consent.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/E_Sign_Consent.png'
                },
                {
                    title: 'BANKCODE IMA Application and Agreement',
                    fileName: 'BANKCODE+IMA+App…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+IMA+Application+and+Agreement.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/IMA_Application_and_Agreement.png'
                },
                {
                    title: 'BANKCODE Income Disclaimer',
                    fileName: 'BANKCODE+Income…mer.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+Income+Disclaimer.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Income_Disclaimer.png'
                },
                {
                    title: 'BANKCODE Policies and Procedures',
                    fileName: 'BANKCODE+Policies…res.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+Policies+and+Procedures.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Policies_and_Procedures.png'
                },
                {
                    title: 'BANKCODE Privacy Policy - Updated 2019',
                    file: 'BANKCODE+IMA+Applic…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+Privacy+Policy+-+Updated+2019.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Privacy_Policy.png'
                },
                {
                    title: 'BANKCODE Terms of Use - Updated 2019',
                    fileName: 'BANKCODE+Income+…mer.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+Terms+of+Use+-+Updated+2019.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Terms_of_Use.png'
                },
                {
                    title: 'BANKCODE Advertising Guidelines',
                    fileName: 'BANKCODE+Policies+…res.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODEAdvertisingGuidelines.pdf',
                    img: './assets/common/images/bank-code/thumbnails/legal-documents/Guideline.png'
                }
            ]
        },
        {
            categoryName: 'ORDER FORMS',
            anchor: 'forms',
            list: [
                {
                    title: 'Trainer Application Form',
                    fileName: 'Compensation+Plan…019.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Trainer+Application+Forms/Trainer+Application+Form.pdf',
                    img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Application_Form.png'
                },
                {
                    title: 'Trainer Application Form - Print Ready',
                    fileName: 'BANKCODE+E-Sig_+C…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Trainer+Application+Forms/Trainer+Application+Form+-+Print+Ready.pdf',
                    img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Application_Form_Print_Ready.png'
                },
                {
                    title: 'Trainer Order Form',
                    fileName: 'BANKCODE+IMA+Appl…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Trainer+Order+Forms/Trainer+Order+Form.pdf',
                    img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Order_Form.png'
                },
                {
                    title: 'Trainer Order Form - Print Ready',
                    fileName: 'BANKCODE+Income…mer.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Trainer+Order+Forms/Trainer+Order+Form+-+Print+Ready.pdf',
                    img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Order_Form_Print_Ready.png'
                },
                {
                    title: 'BANKCODE Order Form',
                    fileName: 'BANKCODE+Order+Form.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/BANKCODE+Order+Forms/BANKCODE+Order+Form.pdf',
                    img: './assets/common/images/bank-code/no_image.png'
                },
                {
                    title: 'BANKCODE Order Form - Print Ready',
                    fileName: 'BANKCODE+Order+F…m+-+pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/BANKCODE+Order+Forms/BANKCODE+Order+Form+-+Print+Ready.pdf',
                    img: './assets/common/images/bank-code/no_image.png'
                },
                {
                    title: 'Signature Series Order Form',
                    fileName: 'Signature+S…s+O…r+Form.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Signature+Series+Order+Forms/Signature+Series+Order+Form.pdf',
                    img: './assets/common/images/bank-code/no_image.png'
                },
                {
                    title: 'Signature Series Order Form - Print Ready',
                    fileName: 'Signature+-+Print+Ready.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Signature+Series+Order+Forms/Signature+Series+Order+Form+-+Print+Ready.pdf',
                    img: './assets/common/images/bank-code/no_image.png'
                }
            ]
        },
        {
            categoryName: 'TRAINER KITS',
            anchor: 'trainer',
            list: [
                {
                    title: 'L1: BANK Fundamentals Kit',
                    fileName: 'Compensation+Plan…019.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L1/BANK+Fundamentals.zip',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L1_BANK_Fundamentas_Kit.png'
                },
                {
                    title: 'L1: Intro to BANK Intelligences - Keynote',
                    fileName: 'BANKCODE+E-Sign+_+C…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L1/Intro+to+BANK+Intelligences+090219.key.zip',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L1_Intro_to_Bank Intelligences_Keynote.png'
                },
                {
                    title: 'L1: Intro to BANK Why They Buy - Keynote',
                    fileName: 'BANKCODE+IMA+Applic…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L1/Intro+to+BANK+Why+They+Buy+090219.key.zip',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L1_Intro_to_Why_They_Buy_Keynote.png'
                },
                {
                    title: 'L2: Speed Coding Kit',
                    fileName: 'BANKCODE+Income+Di…mer.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L2/Speed+Coding.zip',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L2_Speed_Coding_Kit.png'
                },
                {
                    title: 'L2: Speed Coding PNG',
                    fileName: 'BANKCODE+Policies+a…res.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L2/SPEED+CODING_TK.png',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L2_Speed_Coding_PNG.png'
                },
                {
                    title: 'L3: Power Scripting Kit',
                    fileName: 'BANKCODE+IMA+Appl…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L3/Power+Scripting+Kit.zip',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L3_Power_Scripting_Kit.png'
                },
                {
                    title: 'L3: Power Scripting PNG',
                    fileName: 'BANKCODE+Income+…mer.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L3/POWER+SCRIPTING_TK.png',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L3_Power_Scripting_PNG.png'
                },
                {
                    title: 'L4: Communication Mastery Kit',
                    fileName: 'BANKCODE+Policies+…res.pdf',
                    fileLink: 'https://vo.bankcode.com/trainerkits#',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L4_Communication_Mastery_Kit.png'
                },
                {
                    title: 'L4: Communication Mastery PNG',
                    fileName: 'BANKCODE+Policies+…res.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L4/COMMUNICATION+MASTERY_TK.png',
                    img: './assets/common/images/bank-code/thumbnails/trainer-kits/L4_Communication_Mastery_PNG.png'
                }
            ]
        },
        {
            categoryName: 'SLIDE DECKS',
            anchor: 'decks',
            list: [
                {
                    title: 'Affiliate Opportunity',
                    fileName: 'Compensation+Plan…019.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Slide+Decks/AFFILIATE+Opportunity.zip',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/Affiliate_Opportunity.png'
                },
                {
                    title: 'BANKCODE Product Offers',
                    fileName: 'BANKCODE+E-Sign+…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Slide+Decks/BANKCODE+Product+Offers+090319.pptx.zip',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/BANKCODE_Product_Offers.png'
                },
                {
                    title: 'Intro to BANK Intelligences',
                    fileName: 'BANKCODE+E-Sign+…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Slide+Decks/Intro+to+BANK+Intelligences+090319.pptx.zip',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/Intro_to_Bank_Intelligences.png'
                },
                {
                    title: 'Intro to BANK Why They Buy',
                    fileName: 'BANKCODE+E-Sign+…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Slide+Decks/Intro+to+BANK+Why+They+Buy+090319.pptx.zip',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/Intro_to_Why_They_Buy.png'
                },
                {
                    title: 'Quote Deck - Memes',
                    fileName: 'BANKCODE+E-Sign+…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Slide+Decks/Quote+Deck+-+Memes.zip',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/Quote_Deck_Memes.png'
                },
                {
                    title: 'Trainer Opportunity',
                    fileName: 'Compensation+Plan…019.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Slide+Decks/Trainer+Opportunity.zip',
                    img: './assets/common/images/bank-code/thumbnails/slide-decks/Trainer_Opportunity.png'
                }
            ]
        },
        {
            categoryName: 'VIDEOS',
            anchor: 'videos',
            list: [
                {
                    title: 'Video - BANK Cryptex',
                    fileName: 'Compensation+Plan…019.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Videos/BANK+Cryptex+Video.mp4',
                    img: './assets/common/images/bank-code/thumbnails/videos/Video_BANK_Cryptex.png'
                },
                {
                    title: 'Video - BANKCODE One World',
                    fileName: 'BANKCODE+E-Sig_+C…ent.pdf',
                    fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Videos/BANKCODE+One+World.mp4',
                    img: './assets/common/images/bank-code/thumbnails/videos/Video_BANKCODE_One_World.png'
                }
            ]
        },
    ];

    constructor(
        public ls: AppLocalizationService
    ) {
    }
}
