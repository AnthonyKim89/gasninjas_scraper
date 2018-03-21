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
    ignoreHTTPSErrors: true
  });
  const page = await browser.newPage();

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
    await page.waitFor(1000);

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
  await page.waitFor(2000);
  await page.click(config.menu_selectors.radio_export);
  await page.waitForNavigation();

  // 4) Fill in the form to export
  consoleLog('4) Filling in the Export Form...');
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; //January is 0!
  let dd = today.getDate();
  if (mm < 10) {
    mm = '0' + mm;
  }
  if (dd < 10) {
    dd = '0' + dd;
  }

  await page.click(config.export_selectors.input_date_from);
  await page.waitForNavigation();
  await page.waitFor(2000);
  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.export_selectors.input_selected, value: mm + '/01/' + yyyy });

  await page.click(config.export_selectors.input_date_to);
  await page.waitForNavigation();
  await page.waitFor(2000);
  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.export_selectors.input_selected, value: mm + '/' + dd + '/' + yyyy });

  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.export_selectors.input_data_type, value: config.export_values.data_type });

  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.export_selectors.input_send_to, value: config.email });

  // 5 Hit "Submit" in the Export Page
  consoleLog('5) Hitting the Submit button...');
  await page.waitFor(2000);
  await page.click(config.export_selectors.btn_submit);
  await page.waitForNavigation();

  // await browser.close();

  consoleLog('done');
})();