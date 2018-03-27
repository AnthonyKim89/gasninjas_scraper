'use strict';

const puppeteer = require('puppeteer');
const config = require('./config');

(async() => {
  const browser = await puppeteer.launch({
    headless: config.headless,
    slowMo: 250,
    timeout: 0,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const consoleLog = (message) => {
    if (!config.debug)
      return;
    console.log(message);
  };

  const printScreen = async (subject) => {
    if (!config.debug)
      return;
    await page.screenshot({ path: 'tmp/' + Math.round(new Date().getTime() / 1000) + '_' + subject + '.png' });
  }

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
  printScreen('login');
  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.login_selectors.username, value: config.login_credentials.username });

  let nTry = 0;
  while (nTry++ < 10) {
    consoleLog('Attempting to log in... ' + nTry);
    printScreen(nTry + '_login_attempt');
    await page.waitFor(config.delay_short);

    await page.evaluate((obj) => {
      let element = document.querySelector(obj.selector);

      if (element && element.value == obj.value)
        return true;

      if (element)
        element.value = obj.value;

      return false;
    }, { selector: config.login_selectors.password, value: config.login_credentials.password });

    await page.waitFor(config.delay_short);

    if (nTry == 1) {
      await page.click(config.login_selectors.button);
    } else if (nTry == 2) {
      await page.keyboard.press("Enter");
      await page.waitFor(config.delay_short);
    } else {
      await page.keyboard.press("Enter");
      try {
        await page.waitForNavigation();
      } catch (e) {
        consoleLog('Error: Navigation timed out!');
      }
    }

    await page.waitFor(config.delay_short);

    consoleLog('checking if the login attempt is successful: ' + config.login_selectors.msg_ok);
    printScreen(nTry + '_login_result');

    let hasErrorPopup = await page.evaluate((obj) => {
      let element = document.querySelector(obj.selector);
      return !element ? false : true;
    }, { selector: config.login_selectors.msg_ok });

    consoleLog('hasErrorPopup: ' + hasErrorPopup);

    if (hasErrorPopup) {
      await page.click(config.login_selectors.msg_ok);
      await page.waitFor(config.delay_short);
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
  printScreen('menu');
  await page.waitFor(config.delay_long);
  await page.click(config.menu_selectors.radio_export);

  nTry = 0;
  while (nTry++ < 10) {
    await page.waitFor(config.delay_long);
    
    let bNavigated = await page.evaluate((obj) => {
      let element = document.querySelector(obj.selector);
      return !element ? false : true;
    }, { selector: config.export_selectors.input_date_from });

    if (bNavigated)
      break;
  }  

  // 4) Fill in the form to export
  consoleLog('4) Filling in the Export Form...');
  printScreen('export');
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
  // await page.waitForNavigation();
  await page.waitFor(config.delay_long);
  consoleLog('Filling in the Date From.....');
  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.export_selectors.input_selected, value: mm + '01' + yy });

  await page.waitFor(config.delay_long);
  printScreen('export_date_from');

  consoleLog('Filling in the Date To...');
  await page.click(config.export_selectors.input_date_to);
  // await page.waitForNavigation();
  await page.waitFor(config.delay_long);
  consoleLog('Filling in the Date To.....');
  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.export_selectors.input_selected, value: mm + dd + yy });

  await page.waitFor(config.delay_long);
  printScreen('export_date_to');

  await page.click(config.export_selectors.input_date_thru);
  // await page.waitForNavigation();
  await page.waitFor(config.delay_long);

  consoleLog('Filling in the Email...');
  await page.click(config.export_selectors.input_send_to);
  // await page.waitForNavigation();
  await page.waitFor(config.delay_long);
  consoleLog('Filling in the Email.....');
  await page.evaluate((obj) => {
    let element = document.querySelector(obj.selector);
    if (element)
      element.value = obj.value;
  }, { selector: config.export_selectors.input_selected, value: config.email });

  await page.waitFor(config.delay_long);
  printScreen('export_email');

  await page.click(config.export_selectors.input_date_thru);
  // await page.waitForNavigation();
  await page.waitFor(config.delay_long);

  consoleLog('Selecting a data type...');
  await page.click(config.export_selectors.input_data_type);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitFor(config.delay_long);

  consoleLog('Selected the data type...');
  printScreen('export_data_type');

  // 5 Hit "Submit" in the Export Page
  consoleLog('5) Hitting the Submit button...');
  await page.waitFor(config.delay_long);
  await page.click(config.export_selectors.btn_submit);
  await page.waitFor(config.delay_long);

  await browser.close();

  consoleLog('done');
})();