'use strict';

const puppeteer = require('puppeteer');
const config = require('./config');

const consoleLog = (message) => {
  if (!config.debug)
    return;
  console.log(message);
};

(async() => {
  const browser = await puppeteer.launch({
    headless: config.headless,
    timeout: 0,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  consoleLog('Configuring the Scraper...');
  consoleLog({
    headless: config.headless,
    email: config.email,
    delay_short: config.delay_short,
    delay_long: config.delay_long
  });

  // 1) Open the Login Page
  consoleLog('1) Opening the Login Page...');
  await page.goto('http://www.tropicfleet.com/');

  let target_link = await page.evaluate((sel) => {
    return document.querySelectorAll(sel)[0].getAttribute('href');
  }, 'a.btn.btn-gray');

  await page.goto(target_link);

  // 2) Submit the Login Form
  consoleLog('2) Submitting the Login Form...');
  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.login_selectors.username, value: config.login_credentials.username });

  let nTry = 0;
  while (nTry++ < 10) {
    await page.waitFor(config.delay_short);

    await page.evaluate((obj) => {
      let element = document.querySelector(obj.selector);

      if (element && element.value == obj.value)
        return true;

      if (element)
        element.value = obj.value;

      return false;
    }, { selector: config.login_selectors.password, value: config.login_credentials.password });

    await page.waitFor(1000);

    if (nTry == 1) {
      await page.click(config.login_selectors.button);
    } else {
      await page.keyboard.press("Enter");
    }

    await page.waitForNavigation();
    await page.waitFor(1000);

    let hasErrorPopup = await page.evaluate((obj) => {
      let element = document.querySelector(obj.selector);
      return !element ? false : true;
    }, { selector: config.login_selectors.msg_ok });

    if (hasErrorPopup) {
      await page.click(config.login_selectors.msg_ok);
      await page.waitForNavigation();
    }

    let bSuccess = await page.evaluate((obj) => {
      let element = document.querySelector(obj.selector);
      return !element ? false : true;
    }, { selector: config.menu_selectors.radio });

    if (bSuccess)
      break;
  }

  // 3) Choose "Export" in the Menu Page
  consoleLog('3) Choosing the "Export" in the Menu Page...');
  await page.waitFor(config.delay_long);
  await page.click(config.menu_selectors.radio_export);
  await page.waitForNavigation();
  await page.waitFor(config.delay_long);

  // 4) Fill in the form to export
  consoleLog('4) Filling in the Export Form...');
  const today = new Date();
  const yy = today.getFullYear().toString().substr(-2);
  let mm = today.getMonth() + 1; //January is 0!
  let dd = today.getDate();
  if (mm < 10) {
    mm = '0' + mm;
  }
  if (dd < 10) {
    dd = '0' + dd;
  }

  consoleLog('Filling in the Date From...');
  await page.click(config.export_selectors.input_date_from);
  await page.waitForNavigation();
  await page.waitFor(config.delay_long);
  consoleLog('Filling in the Date From.....');
  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.export_selectors.input_selected, value: mm + '01' + yy });

  await page.waitForNavigation();
  await page.waitFor(config.delay_long);

  consoleLog('Filling in the Date To...');
  await page.click(config.export_selectors.input_date_to);
  await page.waitForNavigation();
  await page.waitFor(config.delay_long * 3);
  consoleLog('Filling in the Date To.....');
  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.export_selectors.input_selected, value: mm + dd + yy });

  await page.waitForNavigation();
  await page.waitFor(config.delay_long);

  await page.click(config.export_selectors.input_date_thru);
  await page.waitForNavigation();
  await page.waitFor(config.delay_long);

  consoleLog('Filling in the Email...');
  await page.click(config.export_selectors.input_send_to);
  await page.waitForNavigation();
  await page.waitFor(config.delay_long);
  consoleLog('Filling in the Email.....');
  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.export_selectors.input_selected, value: config.email });

  await page.waitForNavigation();
  await page.waitFor(config.delay_long);

  await page.click(config.export_selectors.input_date_thru);
  await page.waitForNavigation();
  await page.waitFor(config.delay_long);

  consoleLog('Selecting a data type...');
  await page.click(config.export_selectors.input_data_type);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitFor(config.delay_long);

  consoleLog('Selected the data type...');

  // 5 Hit "Submit" in the Export Page
  consoleLog('5) Hitting the Submit button...');
  await page.waitFor(config.delay_long);
  await page.click(config.export_selectors.btn_submit);
  await page.waitForNavigation();

  await browser.close();

  consoleLog('done');
})();