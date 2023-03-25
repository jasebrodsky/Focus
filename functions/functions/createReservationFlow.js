// include puppetter library
//const puppeteer = require('puppeteer');
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra');
const useProxy = require('puppeteer-page-proxy');
const scrapingbee = require('scrapingbee');



// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');


//RESEARCH HOW TO USE SCRAPPING BEE WITH PUPPETTER.. GET()???
// async function get(url) {
//   var client = new scrapingbee.ScrapingBeeClient('8CY40T49A94L8SOSI90DECSCC7V9XFU7KTNOQV4QR1O6EXICF0G7PVWOGBYV8OL1Y824SYUO2J14JFNY');
//   var response = await client.get({
//     url: url,
//     params: {  
//     },
//   })
//   return response
// }


// cont get = async (url) => {
//   var client = new scrapingbee.ScrapingBeeClient('8CY40T49A94L8SOSI90DECSCC7V9XFU7KTNOQV4QR1O6EXICF0G7PVWOGBYV8OL1Y824SYUO2J14JFNY');
//   var response = await client.get({
//     url: url,
//     params: {  
//     },
//   })
//   return response

// }

const createReservationFlow = async (date) => {

  // console.log('date is: '+JSON.stringify(date));
  //console.log('date is: '+date);

  //query database for all dates in fulfill status
  //for each date returned, create reservation w/yelp and properties from the date. 
  //with data scraped from yelp, update date in database. 

  //include from passed in date
  let firstName = date.reservationFirstName;
  let lastName = date.reservationLastName;
  let latitude = date.proposedLat;
  let longitude = date.proposedLong;
  let proposedTime = date.proposedTime;
  let price = date.priceMax;

  let phone = '206 354 1511';
  let email = 'campicsies@gmail.com';
  let rezTime = 1900;

  
  
  //const proxy = "http://api.scraperapi.com?api_key=94b0962bc92bd046f6d8132a86f4fd05&url="
  let yelpLink = 'https://www.yelp.com/search?find_desc=reservations&l=a%3A'+latitude+'%2C'+longitude+'%2C13.656&attrs=RestaurantsPriceRange2.'+price+'&sortby=rating&rez_date=' + new Date(proposedTime).toLocaleDateString("en-US") + '&rez_covers=2&rez_time='+rezTime;
  //const yelpLinkProxy = proxy + yelpLink;
  let yelpLinkDetails = 'https://www.yelp.com/reservations/buena-vista-restaurant-and-bar-new-york/checkout/2022-11-12/1515/2?yelp_redirect=1';


  //let yelpLinkProxy =  await get(yelpLink);

  // get(yelpLink).then(function (response) {
  //   var decoder = new TextDecoder();
  //   var text = decoder.decode(response.data);
  //   console.log('TEXT IS:'+text);
  // }).catch((e) => console.log('A problem occurs : ' + e.response.data));
  

  // console.log(yelpLinkProxy);


  // ScraperAPI proxy configuration
  // PROXY_USERNAME = 'scraperapi';
  // //PROXY_PASSWORD = '94b0962bc92bd046f6d8132a86f4fd05'; // <-- enter your API_Key here
  // PROXY_PASSWORD = '9a6cd88e1d6f39b0e970222c440ca36e'; // <-- enter your API_Key here
  // //PROXY_SERVER = 'proxy-server.scraperapi.com';
  // PROXY_SERVER = 'https://proxy-server.scraperapi.com&render=true';
  // PROXY_SERVER_PORT = '8001';

  // //proxycrawl proxy configuration
  // PROXY_USERNAME = 'jasebrodsky@gmail.com';
  // PROXY_PASSWORD = 'KQX5mcyY_y_mLIjpcpZFcw'; // <-- enter your API_Key here
  // //PROXY_SERVER = 'https://smartproxy.proxycrawl.com';
  // PROXY_SERVER = 'http://smartproxy.crawlbase.com';
  // PROXY_SERVER_PORT = '8012';

  //  //brightdata proxy configuration
    PROXY_USERNAME = 'brd-customer-hl_420f6dde-zone-dedicatedresidentia-country-us';
    //PROXY_PASSWORD = 'sbb5mhqenpm2'; // <-- enter your API_Key here
    PROXY_PASSWORD = 'cgv9ap33d324'; // <-- enter your API_Key here
    PROXY_SERVER = 'http://zproxy.lum-superproxy.io';
    PROXY_SERVER_PORT = '22225';

  //save selectors to elements to interact with. Get Muntaz to help with this XPATH ... 
  const firstNameInput = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div.arrange__09f24__LDfbs.gutter-1-5__09f24__vMtpw.layout-equal__09f24__odeM0.margin-t2__09f24__b0bxj.border-color--default__09f24__NPAKY > div:nth-child(1) > div.floating-label-container__09f24__lwS94.border-color--default__09f24__NPAKY > label > input";
  const lastNameInput = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div.arrange__09f24__LDfbs.gutter-1-5__09f24__vMtpw.layout-equal__09f24__odeM0.margin-t2__09f24__b0bxj.border-color--default__09f24__NPAKY > div:nth-child(2) > div > label > input";
  const mobileInput = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div.arrange__09f24__LDfbs.gutter-1-5__09f24__vMtpw.layout-equal__09f24__odeM0.layout-stack-medium__09f24__GJgwf.margin-t3__09f24__riq4X.border-color--default__09f24__NPAKY > div:nth-child(1) > div > label > input";
  const emailInput = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div.arrange__09f24__LDfbs.gutter-1-5__09f24__vMtpw.layout-equal__09f24__odeM0.layout-stack-medium__09f24__GJgwf.margin-t3__09f24__riq4X.border-color--default__09f24__NPAKY > div:nth-child(2) > div > label > input";
  const reqestInput = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div:nth-child(3) > div > label > input";
  const confirmButton = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div.responsive-hidden-medium__09f24__yxacI.margin-t3__09f24__riq4X.border-color--default__09f24__NPAKY > button > span";



  // params = {
  //   //'render_js':'True',
  //   //render_js=False&premium_proxy=True,
  //   'js_scenario': `{instructions: [{fill: [${firstNameInput}, "value_1"]}]}`,

  // }

  // //bee proxy
  // //PROXY_USERNAME = '8CY40T49A94L8SOSI90DECSCC7V9XFU7KTNOQV4QR1O6EXICF0G7PVWOGBYV8OL1Y824SYUO2J14JFNY'; //jasebrodsky@gmail.com
  // PROXY_USERNAME = 'N9P5IH2ZFD1ZZEVRJS82V773RQJ0MH55PUGV23X4P28TAC8DRMD7IF9CX5GBF8HK4JYR3LPLFX42TTMC'; //campicsies@gmail.com
  // //PROXY_PASSWORD =  JSON.stringify(params); // <-- enter your params here
  // PROXY_PASSWORD =  'render_js=True&block_resources=False'; // <-- enter your params here
  // PROXY_SERVER = 'proxy.scrapingbee.com';
  // PROXY_SERVER_PORT = '8886';
  // //stealth_proxy=True
  // //block_resources=False

 




  //All Proxy calls should go to: http://smartproxy.proxycrawl.com 
  //port: 8012 
  //using your access token as a proxy username.

  
  
  
  //let yelpLink = 'https://www.yelp.com/search?find_desc=reservations&l=a%3A40.738895%2C-73.928009%2C13.656&attrs=RestaurantsPriceRange2.2&sortby=rating&rez_date=10/30/2022&rez_covers=2&rez_time=1900';
  //console.log('yelpLinkProxy is: '+yelpLinkProxy);

  //FIGURE OUT WHEN THE BELOW MIGHT NOT BE WORKING. the console.log is not printing "try block executing", might be bc: 
  //1. puppeteer.launch is not resolving.. add a timeout. and then debug why it's timeing out. 
  //2. try block is not executing for some reason. Does this need to to wait on the puppeteer??


  //setup browser
  const browser = await puppeteer.launch({
    headless: false,
    //timeout: 0,
    ignoreHTTPSErrors: true,
    slowMo: 150,
    devtools: true,
    args: [
      '--no-sandbox',
      //REVIEW THESE ARGS? 
      '--disable-gpu',
      '--incognito',
      // '--disable-dev-shm-usage',
      // '--disable-setuid-sandbox',
      // '--no-first-run',
      // '--no-sandbox',
      // '--no-zygote',
      //'--ignore-certificate-errors-spki-list ',
      '--disable-web-security',
      '--allow-insecure-localhost',
      '--ignore-certificate-errors',
      '--ignore-urlfetcher-cert-requests',
      //'--window-size=1920,1080',
      `--proxy-server=${PROXY_SERVER}:${PROXY_SERVER_PORT}`,
      
      //`--proxy-server=http://KQX5mcyY_y_mLIjpcpZFcw@smartproxy.proxycrawl.com:8012`,
      //HOW DO I USE SERVER SIDE RENDER OR PREMIUM PROXIES HERE???? 
      //`--proxy-server=http://${PROXY_SERVER}:${PROXY_SERVER_PORT}`,
      //`--proxy-server=http://${PROXY_USERNAME}.render=true:${PROXY_PASSWORD}@${PROXY_SERVER}:${PROXY_SERVER_PORT}`
    ],               
  });

  //console.log('browser is: '+ browser);

  //  const yelpSearchResultsPage = await browser.newPage();
  //  await yelpSearchResultsPage.authenticate({username: PROXY_USERNAME,password: PROXY_PASSWORD});
  // await yelpSearchResultsPage.setViewport({ width: 1280, height: 800 })
  // await yelpSearchResultsPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
  // await yelpSearchResultsPage.setRequestInterception(true);
  
  const reservationDetailsPage = await browser.newPage();
  await reservationDetailsPage.authenticate({username: PROXY_USERNAME, password: PROXY_PASSWORD});
  
  //await reservationDetailsPage.setRequestInterception(true);

  // //yelpSearchResultsPage.on('request', async interceptedRequest => {
  //   reservationDetailsPage.on('request', async interceptedRequest => {
  //     //const blockResources = ['stylesheet', 'image', 'media', 'font'];
  //     const blockResources = [];
  //     console.log('yelpSearchResultsPage: '+interceptedRequest);
  
  //     if (blockResources.includes(interceptedRequest.resourceType())) {
  //       interceptedRequest.abort();
  //     } else {
  //       //wait 3.6 seconds before sending next request, to slow down requests
  //       await reservationDetailsPage.waitForTimeout(5000);
  //       interceptedRequest.continue();
  //     }
      
  //   });


  await reservationDetailsPage.goto('https://www.yelp.com/reservations/11-tigers-new-york-2/checkout/2022-11-14/1900/2?yelp_redirect=1', {
    //waitUntil: 'domcontentloaded',
    waitUntil: 'networkidle0',
    timeout: 0
    }
  );
  
  // await reservationDetailsPage.setViewport({ width: 1280, height: 800 })
  // await reservationDetailsPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
  // await reservationDetailsPage.setRequestInterception(true);
  // console.log('setRequestInteception to true');
  // //NEED TO AWAIT THIS?
  


  try{
    
    // await yelpSearchResultsPage.goto(yelpLinkDetails, {
    //   //waitUntil: 'domcontentloaded',
    //   waitUntil: 'load', timeout: 0
    //   }
    // );

    // await reservationDetailsPage.goto('https://www.yelp.com/reservations/les-enfants-de-boheme-new-york/checkout/2022-11-12/1900/2?yelp_redirect=1', {
    //   //waitUntil: 'domcontentloaded',
    //   waitUntil: 'networkidle0',
    //   timeout: 0
    //   }
    // );


    // //selector for reservation times available at all restaurants
    // const reservationTimesSelector = '.slot__09f24__OFBaY'; //can this better??
   

    // //MAYBE WAIT A BIT, PROXY IS TOO SLOW? 
    // // find all reservation times on the page and map and clck on a random one. 
    // await yelpSearchResultsPage.$$eval(reservationTimesSelector, (buttons) =>
    //     //click on random button within the buttons array. 
    //     buttons[Math.floor(Math.random() * buttons.length)].click()
    // );
    // console.log('click random reservation button');



    //when target changes, save as new target reservationDetailsPageTarget when it was opened from the first target. 
    // const reservationDetailsPageTarget = await browser.waitForTarget(target => target.opener() === yelpSearchResultsPage.target());
    // console.log('save new page target');

    //browser.target();
    //get the new page object:
    // const reservationDetailsPage = await reservationDetailsPageTarget.page();
    // console.log('save new page objects as reservationDetailsPage');

    // await reservationDetailsPage.setRequestInterception(true);

    // reservationDetailsPage.on('request', async interceptedRequest => {
    //   const blockResources = ['stylesheet', 'image', 'media', 'font'];
    //   console.log('reservationDetailsPage: '+interceptedRequest);
  
    //   if (blockResources.includes(interceptedRequest.resourceType())) {
    //     interceptedRequest.abort();
    //   } else {
    //     //wait 3.6 seconds before sending next request, to slow down requests
    //     //await yelpSearchResultsPage.waitForTimeout(3600);
    //     interceptedRequest.continue();
    //   }
      
    // });

    // await reservationDetailsPage.setDefaultNavigationTimeout(0); //remove nav timeouts
    // console.log('remove nav timeouts for reservationDetailsPage  ');

    // // //set the viewport again on the new page. 
    // await reservationDetailsPage.setViewport({ width: 1920, height: 1080 });
    // console.log('set viewport for reservationDetailsPage  ');

    //save selectors to elements to interact with. Get Muntaz to help with this XPATH ... 
    const firstNameInput = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div.arrange__09f24__LDfbs.gutter-1-5__09f24__vMtpw.layout-equal__09f24__odeM0.margin-t2__09f24__b0bxj.border-color--default__09f24__NPAKY > div:nth-child(1) > div.floating-label-container__09f24__lwS94.border-color--default__09f24__NPAKY > label > input";
    const lastNameInput = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div.arrange__09f24__LDfbs.gutter-1-5__09f24__vMtpw.layout-equal__09f24__odeM0.margin-t2__09f24__b0bxj.border-color--default__09f24__NPAKY > div:nth-child(2) > div > label > input";
    const mobileInput = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div.arrange__09f24__LDfbs.gutter-1-5__09f24__vMtpw.layout-equal__09f24__odeM0.layout-stack-medium__09f24__GJgwf.margin-t3__09f24__riq4X.border-color--default__09f24__NPAKY > div:nth-child(1) > div > label > input";
    const emailInput = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div.arrange__09f24__LDfbs.gutter-1-5__09f24__vMtpw.layout-equal__09f24__odeM0.layout-stack-medium__09f24__GJgwf.margin-t3__09f24__riq4X.border-color--default__09f24__NPAKY > div:nth-child(2) > div > label > input";
    const reqestInput = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div:nth-child(3) > div > label > input";
    const confirmButton = "body > yelp-react-root > div > div > div > div > div.page-wrapper__09f24__rXVxs > div > div > div.arrange-unit__09f24__rqHTg.arrange-unit-grid-column--8__09f24__HDezV.layout-stack-gutter-3__09f24__R2wY7.border-color--default__09f24__NPAKY > div.margin-t4__09f24__G0VVf.border-color--default__09f24__NPAKY > fieldset > div.responsive-hidden-medium__09f24__yxacI.margin-t3__09f24__riq4X.border-color--default__09f24__NPAKY > button > span";
    
    // //select and type name into first name input
    await reservationDetailsPage.focus(firstNameInput);
    console.log('focus on first name on reservationDetailsPage');
    await reservationDetailsPage.keyboard.type(firstName);
    console.log('type first name on reservationDetailsPage');
    //select and type last name into last name input
    await reservationDetailsPage.focus(lastNameInput);
    console.log('focus on last name on reservationDetailsPage');
    await reservationDetailsPage.keyboard.type(lastName);
    console.log('type last name on reservationDetailsPage');
    
    // //select and type email into email input
    await reservationDetailsPage.focus(emailInput);
    console.log('focus on email  on reservationDetailsPage');
    await reservationDetailsPage.keyboard.type("campicsies@gmail.com");
    console.log('type email on reservationDetailsPage');

    // //select and type phone number into phone number input
    await reservationDetailsPage.focus(mobileInput);
    console.log('focus on mobile on reservationDetailsPage');
    await reservationDetailsPage.keyboard.type("2063535726");
    console.log('type mobile on reservationDetailsPage');

    //slect and type request into request input
    // await newPage.focus(reqestInput);
    // await newPage.keyboard.type(" ");


    //blocked!!! WHY IS IT BREAKING AFTER CLICKING SUBMIT... MAYBE THE PROMISE.ALL IS NOT SET UPCORRENCLTY. 

    //  await reservationDetailsPage.click("button[type=submit].css-cednmx"); // Clicking the link will indirectly cause a navigation
    //  console.log('clicked submit on reservationDetailsPage');

    // await reservationDetailsPage.waitForNavigation({waitUntil: 'networkidle2'}); // The promise resolves after navigation has finished
    // console.log('navigated event happened on mobile on reservationDetailsPage');


    // await Promise.all([
    //   reservationDetailsPage.click("button[type=submit].css-cednmx"),
    //   reservationDetailsPage.waitForNavigation({waitUntil:'networkidle2'})
    // ])
    // console.log('clicked submit and waited for navigate');

      await reservationDetailsPage.click("button[type=submit].css-cednmx"); // Clicking the link will indirectly cause a navigation

    // //click confirm reservation button and wait for page redirect.  
    // await Promise.all([
    //     reservationDetailsPage.click("button[type=submit].css-cednmx"), // Clicking the link will indirectly cause a navigation
    //     reservationDetailsPage.waitForNavigation(), // The promise resolves after navigation has finished
    // ]).catch(e => console.log(e));
     console.log('resolved all promises - clicked submit and waited for navigate');

    //set the viewport again. 
    //await reservationDetailsPage.setViewport({ width: 1920, height: 1080 }); //do i need this if i'm reusing same page?
    //console.log('set viewport for reservationDetailsPage');

    //VERIFY RESERVATION WAS CONFIRMED (maybe look into URL?) 
    //IF CONFIRMED, CONTINUE SCRIPT AND UPDATE DATE. 
    // reservationDetailsPage.url() == 'https://www.yelp.com/.../?success=1

    //save selectors to elements to interact with. Get Muntaz to help with this XPATH ... 
    const reservationTimeSelector = ".css-1h1j0y3";
    const restaurantNameSelector = ".css-1f2a2s6";
    const restaurantAddressSelector = ".css-e81eai";
    const confirmationSuccess = true; //can look in the URL for 'success' ?

    // let reservationTime;
    // reservationDetailsPage
    //   .waitForSelector(reservationTimeSelector)
    //   .then(
    //     async () => 
    //     reservationTime = await reservationDetailsPage.$eval(reservationTimeSelector, elem => elem.innerText)
    //   );
    //     console.log('wait for resturant time selector, then save it locally. RESERVATION TIME IS:'+reservationTime);


  //   //update variables with values from dom. 
  //   // reservationTime = await reservationDetailsPage.$eval(reservationTimeSelector, elem => elem.innerText)
  //   // console.log('find reservation time on reservationDetailsPage: '+reservationTime);

    // restaurantName = await reservationDetailsPage.$eval(restaurantNameSelector, elem => elem.innerText)
    // console.log('find restaurant name on reservationDetailsPage: '+restaurantName);

  //   // restaurantAddress = await reservationDetailsPage.$eval(restaurantAddressSelector, elem => elem.innerText)
  //   // console.log('find resturant address on reservationDetailsPage: '+restaurantAddress);

  //   //UPDATE DATE IN DB WITH ABOVE DETAILS
  //   //update date with info from yelp. 
  //   // let dateToUpdate = admin.database().ref('dates/'+date.key);
    
  //   // //use yelp data here
  //   // dateToUpdate.update({
  //   //   restaurantName: restaurantName,
  //   //   confirmedTime: reservationTime,
  //   //   placeAddress: restaurantAddress,
  //   //   confirmedLat: proposedLat,
  //   //   confirmedLong: proposedLong,
  //   //   status: 'accepted',
  //   // }).then(function() {
  //   //   console.log("date updated.")
  //   //   //return 'Remove succeeded';
  //   // }).catch(function(error) {
  //   //   console.log("date updated failed: " + error.message)
  //   //   //return 'error: '+error.message;
  //   // });


  //   // let response = { 
  //   //   success: true,
  //   //   restaurantName: restaurantName,
  //   //   reservationTime: reservationTime,
  //   //   restaurantAddress: restaurantAddress,
  //   // }

  
  //   //return response ; //return response
  //   return null; 
  //     //  admin.database().ref('/dates/' + change.after.key).update({
  //     //   restaurantName: restaurantName,
  //     //   reservationTime: reservationTime,
  //     //   restaurantAddress: restaurantAddress,
  //     //   confirmedLat: latitude,
  //     //   confirmedLong: longitude,
  //     //   status: 'accepted',
  //     // }).catch(reason => {
  //     //   console.log(reason);
  //     //   res.status(500).send('error: '+reason)
  //     // });   

  //   //UPDATE DATE STATUS TO TRIGGER UX/NOTIFICATIONS

  //   console.log('reservationTime is: '+reservationTime);
  //   console.log('restaurantName is: '+restaurantName);
  //   console.log('restaurantAddress is: '+restaurantAddress);
  //   //const reservationConfirmation = '.css-133wuwu'; //can this bea

  
  }catch(err){
   console.log(err)
  }


};

module.exports = createReservationFlow;