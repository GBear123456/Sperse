///<reference path="../../node_modules/abp-web-resources/Abp/Framework/scripts/abp.d.ts"/>
///<reference path="../../node_modules/abp-web-resources/Abp/Framework/scripts/libs/abp.jquery.d.ts"/>
///<reference path="../../node_modules/abp-web-resources/Abp/Framework/scripts/libs/abp.signalr.d.ts"/>

declare namespace abp {
    namespace ui {
        function setBusy(elm?: any, text?: any, optionsOrPromise?: any): void;
    }
}