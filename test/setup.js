const jsdom = require('jsdom');
const StorageShim = require('node-storage-shim');
const sinon = require('sinon');

const DEFAULT_HTML = '<html><body></body></html>';

global.document = new jsdom.JSDOM(DEFAULT_HTML);

global.window = global.document;

global.navigator = window.navigator;

window.localStorage = new StorageShim();

global.localStorage = window.localStorage;

window.sessionStorage = new StorageShim();

global.sessionStorage = window.sessionStorage;

global.XMLHttpRequest = sinon.useFakeXMLHttpRequest();
