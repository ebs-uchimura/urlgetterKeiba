/**
 * myScraper.ts
 *
 * class：Scrape
 * function：scraping site
 **/

'use strict';

// constants 
const USER_ROOT_PATH: string = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"] ?? ''; // user path
const CHROME_EXEC_PATH1: string = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'; // chrome.exe path1
const CHROME_EXEC_PATH2: string = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // chrome.exe path2
const CHROME_EXEC_PATH3: string = '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'; // chrome.exe path3
const DISABLE_EXTENSIONS: string = '--disable-extensions'; // disable extension
const ALLOW_INSECURE: string = '--allow-running-insecure-content'; // allow insecure content
const IGNORE_CERT_ERROR: string = '--ignore-certificate-errors'; // ignore cert-errors
const NO_SANDBOX: string = '--no-sandbox'; // no sandbox
const DISABLE_SANDBOX: string = '--disable-setuid-sandbox'; // no setup sandbox
const DISABLE_DEV_SHM: string = '--disable-dev-shm-usage'; // no dev shm
const DISABLE_GPU: string = '--disable-gpu'; // no gpu
const NO_FIRST_RUN: string = '--no-first-run'; // no first run
const NO_ZYGOTE: string = '--no-zygote'; // no zygote
// const SINGLE_PROCESS: string = '--single-process'; // single process
const DEF_USER_AGENT: string = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36';

// define modules
import puppeteer from 'puppeteer-core'; // Puppeteer for scraping
import path from 'path'; // path
import * as fs from 'fs'; // fs

export class Scrape {

  static browser: puppeteer.Browser;
  static page: puppeteer.Page;

  // constractor
  constructor() {
  }

  // initialize
  init(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // lauch browser
        Scrape.browser = await puppeteer.launch({
          headless: true, // no display mode
          executablePath: await getChromePath(), // chrome.exe path
          ignoreDefaultArgs: [DISABLE_EXTENSIONS], // ignore extensions
          args: [NO_SANDBOX, DISABLE_SANDBOX, DISABLE_DEV_SHM, DISABLE_GPU, NO_FIRST_RUN, NO_ZYGOTE, ALLOW_INSECURE, IGNORE_CERT_ERROR],
        });
        // create new page
        Scrape.page = await Scrape.browser.newPage();
        // mimic agent
        await Scrape.page.setUserAgent(DEF_USER_AGENT);
        // resolved
        resolve();

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // go page
  doGo(targetPage: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // goto target page
        await Scrape.page.goto(targetPage, {
          waitUntil: 'networkidle2',
        });
        // resolved
        resolve();

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // click
  doClick(elem: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // click target element
        await Scrape.page.click(elem);
        // resolved
        resolve();

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // type
  doType(elem: string, value: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // type element on specified value
        await Scrape.page.type(elem, value);
        // resolved
        resolve();

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // select
  doSelect(elem: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // select element
        await Scrape.page.select(elem);
        // resolved
        resolve();

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // screenshot
  doScreenshot(path: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // take screenshot
        await Scrape.page.screenshot({ path: path });
        // resolved
        resolve();

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // eval
  doSingleEval(selector: string, property: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // target item
        const item: any = await Scrape.page.$(selector);
        // if not null
        if (item !== null) {
          // got data
          const data: string = await (await item.getProperty(property)).jsonValue();
          // if got data not null
          if (data !== null) {
            // resolved
            resolve(data);
          }
        }

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // eval
  doMultiEval(selector: string, property: string): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // data set
        let datas: string[] = [];
        // target list
        const list: any = await Scrape.page.$$(selector);
        // loop in list
        for (let ls of list) {
          // push to data set
          datas.push(await (await ls.getProperty(property)).jsonValue());
        }
        // resolved
        resolve(datas);

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // waitfor
  doWaitFor(time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // waitfor specified time
        await Scrape.page.waitForTimeout(time);
        // resolved
        resolve();

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // waitSelector
  doWaitSelector(elem: string, time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // wait for loading selector
        await Scrape.page.waitForSelector(elem, { timeout: time });
        // resolved
        resolve();

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // waitNav
  doWaitNav(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // wait for naviation
        await Scrape.page.waitForNavigation({ waitUntil: 'networkidle2' });
        // resolved
        resolve();

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // exit
  doClose(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // close browser
        await Scrape.browser.close();
        // resolved
        resolve();

      } catch (e: unknown) {
        // error
        console.log(e);
        // reject
        reject();
      }
    });
  }

  // url
  get getUrl(): string {
    return Scrape.page.url();
  }
}

// get chrome absolute path
const getChromePath = (): string => {
  // chrome tmp path
  const tmpPath: string = path.join(USER_ROOT_PATH, CHROME_EXEC_PATH3);

  // 32bit
  if (fs.existsSync(CHROME_EXEC_PATH1)) {
    return CHROME_EXEC_PATH1 ?? '';

    // 64bit
  } else if (fs.existsSync(CHROME_EXEC_PATH2)) {
    return CHROME_EXEC_PATH2 ?? '';

    // user path
  } else if (fs.existsSync(tmpPath)) {
    return tmpPath ?? '';

    // error
  } else {
    // error logging
    console.log('8: no chrome path error');
    return '';
  }
}