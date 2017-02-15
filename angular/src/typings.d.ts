///<reference path="../node_modules/@types/jquery/index.d.ts"/>
///<reference path="../node_modules/@types/jstree/index.d.ts"/>
///<reference path="../node_modules/abp-web-resources/Abp/Framework/scripts/abp.d.ts"/>
///<reference path="../node_modules/abp-web-resources/Abp/Framework/scripts/libs/abp.jquery.d.ts"/>
///<reference path="../node_modules/abp-web-resources/Abp/Framework/scripts/libs/abp.signalr.d.ts"/>
///<reference path="../node_modules/moment/moment.d.ts"/>
///<reference path="../node_modules/@types/moment-timezone/index.d.ts"/>
///<reference path="../node_modules/@types/bootstrap/index.d.ts"/>
///<reference path="../node_modules/@types/toastr/index.d.ts"/>

// Typings reference file, see links for more information
// https://github.com/typings/typings
// https://www.typescriptlang.org/docs/handbook/writing-declaration-files.html

declare var System: any;

declare var App: any; //Related to Metronic
declare var Layout: any; //Related to Metronic

interface JQuery {
    Jcrop(...any): any;
}

interface JQuery {
    daterangepicker(...any): any;
}

interface JQuery {
    slimScroll(...any): any;
}

interface JQuery {
    timeago(...any): any;
}

/**
 * jTable
 */

interface JTableParams {
    jtStartIndex: number;
    jtPageSize: number;
    jtSorting: string;
}

interface JQuery {
    jtable(...any): void;
}

interface JTableFieldOptionDisplayData<TRecord> {
    record: TRecord;
}

/**
 * jQuery selectpicker
 */

interface JQuery {
    selectpicker(...any): any;
}

/**
 * jQuery sparkline
 */

interface JQuery {
    sparkline(...any): any;
}

/**
 * jQuery Bootstrap Switch
 */

interface JQuery {
    bootstrapSwitch(...any): any;
}

/**
 * Morris
 */

declare namespace morris {
    interface IAreaOptions {
        gridEnabled?: boolean;
        //gridLineColor?: string;
        padding?: number;
    }
}

/**
 * rtl-detect
 */

declare module 'rtl-detect';


/**
 * LocalForage
 */
// Type definitions for Mozilla's localForage
// Project: https://github.com/mozilla/localforage
// Definitions by: yuichi david pichsenmeister <https://github.com/3x14159265>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

interface LocalForageOptions {
    driver?: string | LocalForageDriver | LocalForageDriver[];

    name?: string;

    size?: number;

    storeName?: string;

    version?: number;

    description?: string;
}

interface LocalForageDbMethods {
    getItem<T>(key: string): Promise<T>;
    getItem<T>(key: string, callback: (err: any, value: T) => void): void;

    setItem<T>(key: string, value: T): Promise<T>;
    setItem<T>(key: string, value: T, callback: (err: any, value: T) => void): void;

    removeItem(key: string): Promise<void>;
    removeItem(key: string, callback: (err: any) => void): void;

    clear(): Promise<void>;
    clear(callback: (err: any) => void): void;

    length(): Promise<number>;
    length(callback: (err: any, numberOfKeys: number) => void): void;

    key(keyIndex: number): Promise<string>;
    key(keyIndex: number, callback: (err: any, key: string) => void): void;

    keys(): Promise<string[]>;
    keys(callback: (err: any, keys: string[]) => void): void;

    iterate(iteratee: (value: any, key: string, iterationNumber: number) => any): Promise<any>;
    iterate(iteratee: (value: any, key: string, iterationNumber: number) => any,
        callback: (err: any, result: any) => void): void;
}

interface LocalForageDriverSupportFunc {
    (): Promise<boolean>;
}

interface LocalForageDriver extends LocalForageDbMethods {
    _driver: string;

    _initStorage(options: LocalForageOptions): void;

    _support?: boolean | LocalForageDriverSupportFunc;
}

interface LocalForageSerializer {
    serialize<T>(value: T | ArrayBuffer | Blob, callback: (value: string, error: any) => void): void;

    deserialize<T>(value: string): T | ArrayBuffer | Blob;

    stringToBuffer(serializedString: string): ArrayBuffer;

    bufferToString(buffer: ArrayBuffer): string;
}

interface LocalForage extends LocalForageDbMethods {
    LOCALSTORAGE: string;
    WEBSQL: string;
    INDEXEDDB: string;

    /**
     * Set and persist localForage options. This must be called before any other calls to localForage are made, but can be called after localForage is loaded.
     * If you set any config values with this method they will persist after driver changes, so you can call config() then setDriver()
     * @param {LocalForageOptions} options?
     */
    config(options: LocalForageOptions): boolean;

    /**
     * Create a new instance of localForage to point to a different store.
     * All the configuration options used by config are supported.
     * @param {LocalForageOptions} options
     */
    createInstance(options: LocalForageOptions): LocalForage;

    driver(): string;
    /**
     * Force usage of a particular driver or drivers, if available.
     * @param {string} driver
     */
    setDriver(driver: string | string[]): Promise<void>;
    setDriver(driver: string | string[], callback: () => void, errorCallback: (error: any) => void): void;
    defineDriver(driver: LocalForageDriver): Promise<void>;
    defineDriver(driver: LocalForageDriver, callback: () => void, errorCallback: (error: any) => void): void;
    /**
     * Return a particular driver
     * @param {string} driver
     */
    getDriver(driver: string): Promise<LocalForageDriver>;

    getSerializer(): Promise<LocalForageSerializer>;
    getSerializer(callback: (serializer: LocalForageSerializer) => void): void;

    supports(driverName: string): boolean;

    ready(callback: () => void): void;
    ready(): Promise<void>;
}

declare module "localforage" {
    let localforage: LocalForage;
    export = localforage;
}