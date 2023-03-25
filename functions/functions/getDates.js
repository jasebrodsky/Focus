
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const yelp = require('yelp-fusion');
const client = yelp.client('CKia7Mz51NpAHxvG-thuvuZk0RGPeGmyVyYVsYJEfAOI_nO2acc3NRZROLq-VgkXVD2RvqzVzKiMz3tdoVKc8NPhc8-5prI7VFZMWTtXpSKmp0J_HVsEyCS_1IrLYXYx');

const getDates = async (date2,) => {


    let date = {
        proposedLat: 40.738895,
        proposedLong: -73.928009,
        proposedTime: 1672338015512,
        type: 'dessert',
        utc_offset_min: 300,
    };

    let dates = 'no dates';

    //query yelp with these params
    let latitude = date.proposedLat;
    let longitude = date.proposedLong;
    //let price = date.priceMax;
    let proposedTime = date.proposedTime;
    let propsedTime2 = new Date(date.proposedTime);
    console.log('proposedTime2 is: '+propsedTime2);
    //proposedTime2.setHours(20, 30, 0); //8:30pm
    let dateType = date.type;
    let categories = '';
   // var openAt = new Date();
    //use users priceMax when they set it (drinks/dinner..), otherwise hardcode to 2, and 3 dollar signs. 
    //let priceMax = date.priceMax ? date.priceMax.toString() : "2, 3" ;
    let utc_offset = date.utc_offset_min/60; //300/60 = 5


    //map date type to yelp categories to query. 
    //date type can be: 
        //cocktails -> bars
        //coffee -> coffee,bubbletea,tea
        //dessert -> donuts,cupcakes,gelato,icecream,macarons
        //hookah -> hookah_bars
    switch(date.type) {
        case 'cocktails':
          categories = 'bars'; //bars
          openAt = new Date(date.proposedTime).setHours(20 + utc_offset, 30, 0); //8:30pm
          break;
        case 'coffee':
          categories = 'coffee, coffeeroasteries';
          openAt = new Date(date.proposedTime).setHours(11 + utc_offset, 30, 0); //11:30am
          break;
        case 'gallery':
          categories = 'galleries';
          openAt = new Date(date.proposedTime).setHours(15 + utc_offset, 30, 0); //3:30pm          break;
        case 'park':
          categories = 'parks';
          openAt = new Date(date.proposedTime).setHours(12 + utc_offset, 30, 0); //12:30am
          break;
        case 'museum':
          categories = 'artmuseums';
          openAt = new Date(date.proposedTime).setHours(15 + utc_offset, 30, 0); //3:30pm
          break;
        case 'tea':
          categories = 'coffee,bubbletea,tea';
          openAt = new Date(date.proposedTime).setHours(11 + utc_offset, 30, 0); //11:30am
          break;
        case 'dessert':
          categories = 'donuts,cupcakes,gelato,icecream,macarons,chocolate,bakeries';
          openAt = new Date(date.proposedTime).setHours(19 + utc_offset, 30, 0); //7:30pm
          break;
        case 'hookah':
          categories = 'hookah_bars';
          openAt = new Date(date.proposedTime).setHours(20 + utc_offset, 30, 0); //8:30pm
          break;
        default:
          categories = 'bars';
          openAt = new Date(date.proposedTime).setHours(20 + utc_offset, 30, 0); //8:30pm
      }

    //setup yelp api request
    client.search({
        // categories: categories,
        // latitude: date.proposedLat,
        // longitude: date.proposedLong,
        location: "NYC",
        // latitude: '40.738895',
        // longitude: '-73.928009',
        
        //radius: 5000, leave out since now results will usually always be returned. 
        limit: 20,
        //open_at: Math.floor(openAt/1000), //make sure venue will be open during proposed time. 
        //open_at: 1669915800,
        //sort_by: 'distance',
        sort_by: 'best_match',
        //sort_by: 'review_count',
        //price: '1,2,3,4',
        //price: priceMax, //include when price is relavent.. cocktails. 
        }).then(response => {

            //console.log(response.jsonBody.businesses[0].name);
            // check if response is empty, if empty update date to status = fulillError, else continue. 
            //return 'hola';
            const dates2 = response.jsonBody.businesses[0].name
            //const firstResult = response.jsonBody.businesses;

            return 'dates2';

        }).catch(e => {
        console.log(e);
        
    });

     //return 'dates3' ; //return response

};

module.exports = getDates;