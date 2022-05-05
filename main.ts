/**
/* main.js
/* UrlGetterKeiba - Getting horse url -
**/

"use strict";

//* Modules
import { app, BrowserWindow, dialog } from 'electron'; // Electron
import * as fs from 'fs'; // fs
import parse from 'csv-parse/lib/sync'; // CSV parser
import stringifySync from 'csv-stringify/lib/sync'; // csv stfingifier
import iconv from 'iconv-lite'; // Text converter
import { Scrape } from './class/myScraper'; // scraper
import { FileFilter } from 'electron/main';

//* Constants
const WINDOW_WIDTH = 1000; // window width
const WINDOW_HEIGHT = 1000; // window height
const DEFAULT_ENCODING = 'utf8'; // encoding
const CSV_ENCODING = 'Shift_JIS'; // csv encoding
const TARGET_URL = 'https://www.netkeiba.com/'; // base url

//* Interfaces
// window option
interface windowOption {
  width: number; // window width
  height: number; // window height
  defaultEncoding: string; // default encode
  webPreferences: Object; // node
}

// csv stringify option
interface csvStringify {
  header: boolean; // header
  columns: Csvheaders[]; // columns
}

// csv dialog option
interface csvDialog {
  properties: any; // file open
  title: string; // header title
  defaultPath: string; // default path
  filters: FileFilter[]; // filter
}

// dialog options
interface dialogOptions {
  type: string; // dialog type
  title: string; // header title
  message: string; // message
  detail: string; // detail
};

// tmp records
interface tmpRecords {
  columns: boolean; // columns
  from_line: number; // line start
}

// csv headers
interface Csvheaders {
  key: string; // key
  header: string; // header
}

//* General variables
let mainWindow: any = null; // main window
let resultArray: any[][] = []; // result array

// scraper
const scraper = new Scrape();

// header array
const headerObjArray: Csvheaders[] = [
  { key: 'a', header: 'horse' }, // horse name
  { key: 'b', header: 'url' }, // url
];

// choose csv data
const getCsvData = (): Promise<string[]>  => {
  return new Promise((resolve, reject) => {
    // options
    const dialogOptions: csvDialog = {
      properties: ['openFile'], // file open
      title: 'choose csv file', // header title
      defaultPath: '.', // default path
      filters: [
        { name: 'csv(Shif-JIS)', extensions: ['csv'] } // filter
      ],
    }
    // show file dialog
    dialog.showOpenDialog(mainWindow, dialogOptions).then((result: any) => {

      // file exists
      if (result.filePaths.length > 0) {
        // resolved
        resolve(result.filePaths);

      // no file
      } else {
        // rejected
        reject(result.canceled);
      }

    }).catch((err: unknown) => {
      // error
      console.log(`error occured ${err}`);
      // rejected
      reject(err);
    });
  });
}

// show dialog
const showDialog = (title: any, message: any, detail: any, flg: boolean = false) => {
  // dialog options
  const options: dialogOptions = {
    type: '',
    title: title,
    message: message,
    detail: detail.toString(),
  };
  // error or not
  if (flg) {
    options.type = 'error';
  } else {
    options.type = 'info';
  }
  // show dialog
  dialog.showMessageBox(options);
}

// csv file dialog
const getFilename = (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    getCsvData()
      // success
      .then(res => {
        const filename: string = res[0];
        resolve(filename);
      })
      // error
      .catch(err => {
        // show error dialog
        showDialog('no file', 'no csv file selected.', err, true);
        reject(new Error('no file error'));
      });
  });
}

// main
app.on('ready', async () => {
  try {
    // window options
    const windowOptions: windowOption = {
      width: WINDOW_WIDTH, // window width
      height: WINDOW_HEIGHT, // window height
      defaultEncoding: DEFAULT_ENCODING, // encoding
      webPreferences: {
        nodeIntegration: false, // node
      }
    }

    // Electron window
    mainWindow = new BrowserWindow(windowOptions);
    // main html
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    // file reading
    const filename = await getFilename();

    // read file
    fs.readFile(filename, async (err, data) => {
      // variable
      let tmpRecords: string[] = [];
      // initialize
      await scraper.init();
      console.log('scraping ..');

      // decoder
      const str = iconv.decode(data, CSV_ENCODING);

      // error
      if (err) throw err;

      const recordOptions: tmpRecords = {
        columns: false, // no specified columns
        from_line: 2, // from line 2
      }
      // csv reading
      tmpRecords = await parse(str, recordOptions);

      // horse names
      const records = await tmpRecords.map(item => item[0]);

      // goto page
      await scraper.doGo(TARGET_URL);
      // waitfor loading
      await scraper.doWaitSelector('.Txt_Form', 30000);

      // loop words
      for (let rd of records) {
        try {
          // input word
          await scraper.doType('input[name*="word"]', rd);
          // click submit button
          await scraper.doClick('input[name*="submit"]');
          // wait for loading
          await scraper.doWaitFor(1000);
          // get urls
          resultArray.push([rd, scraper.getUrl]);

        } catch (e) {
          // show error
          console.log(e);
          // goto page
          await scraper.doGo(TARGET_URL);
          // waitfor loading
          await scraper.doWaitSelector('.Txt_Form', 30000);
        }
      }

      // stringify option
      const stringifyOptions: csvStringify = {
        header: true, // head mode
        columns: headerObjArray,
      }
      // export csv
      const csvString = await stringifySync(resultArray, stringifyOptions);
      // format date
      const formattedDate: string = (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 14);

      // output csv file
      await fs.promises.writeFile(`output/${formattedDate}.csv`, csvString);

      // close window
      mainWindow.close();

    });
    
    // closing
    mainWindow.on('closed', () => {
      // release window
      mainWindow = null;
    });

  } catch (e) {
    // show error dialog
    showDialog('export error', 'error occured when exporting csv.', e, true);
  }

});