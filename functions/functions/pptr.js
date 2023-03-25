const puppeteer = require('puppeteer');


// (async () => {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto('https://example.com');
//     await page.screenshot({path: 'example.png'});
  
//     await browser.close();
//   })();



const createReservationFlow = async () => {
  let stories = [];
  const browser = await puppeteer.launch({
    headless: false,
    timeout: 20000,
    ignoreHTTPSErrors: true,
    slowMo: 0,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      '--window-size=1280,720',
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 720 });

    // Block images, videos, fonts from downloading
    await page.setRequestInterception(true);

    page.on('request', (interceptedRequest) => {
      const blockResources = ['script', 'stylesheet', 'image', 'media', 'font'];
      if (blockResources.includes(interceptedRequest.resourceType())) {
        interceptedRequest.abort();
      } else {
        interceptedRequest.continue();
      }
    });

    // Change the user agent of the scraper
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
    );

    await page.goto('https://www.nytimes.com/', {
      waitUntil: 'domcontentloaded',
    });

    const storySelector = 'section.story-wrapper h3';

    // Only get the top 10 headlines
    stories = await page.$$eval(storySelector, (divs) =>
      divs.slice(0, 10).map((div, index) => `${index + 1}. ${div.innerText}`)
    );
  } catch (error) {
    console.log(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  return stories;
};

module.exports = createReservationFlow;