require('dotenv').config();
const { chromium } = require('playwright');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

const getBrowserStackContext = async (browser_name, os_name, os_version_name) => {
  const caps = {
    build: `Chrome Extension Testing`,
    name: `[${os_version_name}] ${browser_name}`,
    browser: browser_name,
    os: os_name,
    osVersion: os_version_name,
    'browserstack.username': process.env.BROWSERSTACK_USERNAME,
    'browserstack.accessKey': process.env.BROWSERSTACK_ACCESS_KEY,
    'browserstack.networkLogs': true,
    "browserstack.uploadMedia": [
      "media://ecc840aece2dfd934b6387b3e4e6cabb44315a96",
    ],
  };

  const browser = await chromium.connectOverCDP(`wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`);
  return browser.contexts()[0];
};

module.exports = {
  sleep,
  getBrowserStackContext,
};
