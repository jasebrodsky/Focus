
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const yelp = require('yelp-fusion');
const client = yelp.client('CKia7Mz51NpAHxvG-thuvuZk0RGPeGmyVyYVsYJEfAOI_nO2acc3NRZROLq-VgkXVD2RvqzVzKiMz3tdoVKc8NPhc8-5prI7VFZMWTtXpSKmp0J_HVsEyCS_1IrLYXYx');

const createDateFlow = async (date, key) => {

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
    var openAt = new Date();
    //use users priceMax when they set it (drinks/dinner..), otherwise hardcode to 2, and 3 dollar signs. 
    let priceMax = date.priceMax ? date.priceMax.toString() : "2, 3" ;
    let utc_offset = date.utc_offset_min/60; //300/60 = 5

    console.log('date is: '+JSON.stringify(date));
    console.log('utc_offset is: '+utc_offset);
    //let utc_offset = 5; 


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

    //   //let date = date.proposedTime;
    //   let targetTime = new Date(openAt);
      
    //   //let timeZoneFromDB = date.utc_offset; //time zone value from database
    //   let timeZoneFromDB = 5; //time zone value from database
    //   //get the timezone offset from local time in minutes
    //   let tzDifference = timeZoneFromDB * 60 + targetTime.getTimezoneOffset();
    //   //convert the offset to milliseconds, add to targetTime, and make a new Date
    //   let offsetTime = new Date(targetTime.getTime() + tzDifference * 60 * 1000);

    //   console.log('openAt is '+openAt);
    //   console.log('offsetTime is '+offsetTime);

    console.log("Math.floor(openAt/1000) - 604800: "+Math.floor((openAt/1000) - 304800)); //make sure venue will be open during proposed time. 
    console.log('timestamp that works: '+1669915800);

    //setup yelp api request
    client.search({
        categories: categories,
        latitude: date.proposedLat,
        longitude: date.proposedLong,
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

        // check if response is empty, if empty update date to status = fulillError, else continue. 
        // count length of responsetype,
          let businessTotal = response.jsonBody.businesses.length; 
         // let reviewCount = response.jsonBody.businesses.review_count;
          let randomDate = Math.floor(Math.random() * businessTotal);
          console.log('response is: '+JSON.stringify(response));
          
          //create ref to list of dates 
          let datesRef1 = admin.database().ref('dates/'+key);
          let datesRef2 = admin.database().ref('conversations/'+key+'/date');
          let datesRef3 = admin.database().ref('matches/'+date.userCreator+'/'+date.userInvited);
          let datesRef4 = admin.database().ref('matches/'+date.userInvited+'/'+date.userCreator);

          //save system message that blind date status has changed. 
          let conversationsRef = admin.database().ref('/conversations/'+key+'/messages/');

          //compute system message to display
          //show date requested in all cases except when accepted - show, date accepted.
          let systemMessage = 'Date accepted.';

          console.log('openAt is: '+openAt);

          let updatedDate = {
            placeName: response.jsonBody.businesses[randomDate].name,
            //confirmedTime: date.proposedTime,
            confirmedTime: openAt,
            seen: false,
            placeAddress: response.jsonBody.businesses[randomDate].location.address1,
            confirmedLat: response.jsonBody.businesses[randomDate].coordinates.latitude,
            confirmedLong: response.jsonBody.businesses[randomDate].coordinates.longitude,
            url: response.jsonBody.businesses[randomDate].url,
            imageUrl: response.jsonBody.businesses[randomDate].image_url,
            status: 'accepted',
          };

          //save initial time of date, in order to overwrite it when accepting/declining date. 
          //let dateTimeInitial = this.context.deepLinkParams ? this.context.deepLinkParams.dateTime : this.props.navigation.getParam('dateTime');

          //if newStatus accepted or declined, do not update proposedTime
          //let proposedTime = ((newStatus == 'accepted' ) || (newStatus == 'declined' )) ? dateTimeInitial : ((Date.now()+(86400000*2)) + (86400000 * this.state.proposedTime)) ; 
          
          //let dateTimeUpdated = (proposedTime == dateTimeInitial) ? false : true ;
          //push new conversation to profile object.
          datesRef1.update(updatedDate);

          //push new date info to match objects.
          datesRef3.update(updatedDate);

          //push new date info to match objects.
          datesRef4.update(updatedDate);

          //push updated status to conversation object in fb, so that chat page can render date's status in button. 
          datesRef2.update(updatedDate);

          //push new system message that date has been managed. This will put conversation to top of messages. 
          conversationsRef.push({
            text: systemMessage, 
            notify: false,
            system: true,
            user: date.userInvited, 
            userTo: date.userCreator,
            createdAt: Date.now()
          });

        if (businessTotal > 0){
          return 'sucessfully created date';
        }else{
          return 'no search restults - date not created';
        }
        

        }).catch(e => {
        console.log(e);
        
    });





    // query Yelp's API for relevant dates, using location and preferences of users. 
    // select one of the dates
    // update the date in the database, to trigger notifications and updated UX. 

    //dateTime based off dateType 
    // coffee => 11-3
    // tea 11=> 11-3
    // dinner => 6-9
    // drinks => 7-10pm

    //Query Yelp Here.. 
    // const searchRequest = {
    //     term:'cafe',
    //     location: 'san francisco, ca'
    //   };
    
    // cors(searchRequest, response, () => {
    //     // request to yelp api
    //     axios.get("https://api.yelp.com/v3/businesses/search?location=NYC&categories=bars&open_now=true", {
    //         headers: { Authorization: `bearer CKia7Mz51NpAHxvG-thuvuZk0RGPeGmyVyYVsYJEfAOI_nO2acc3NRZROLq-VgkXVD2RvqzVzKiMz3tdoVKc8NPhc8-5prI7VFZMWTtXpSKmp0J_HVsEyCS_1IrLYXYx`}
    //     })
    //     .then(r => {
    //         console.log("Cloud yelp resp", r);
    //         response.send(r.data);
    //     })
    //     .catch(e => {
    //         console.log( "Cloud yelp error: ", e);
    //         response.sendStatus(500); // ¯\_(ツ)_/¯
    //     })
    // })


    //with response from yelp, update database



    // //UPDATE DATE IN DB WITH ABOVE DETAILS
    // //update date with info from yelp. 
    // let dateToUpdate = admin.database().ref('dates/'+date.key);
    
    // // //use yelp data here
    // dateToUpdate.update({
    //   restaurantName: restaurantName,
    //   confirmedTime: reservationTime,
    //   placeAddress: restaurantAddress,
    //   confirmedLat: proposedLat,
    //   confirmedLong: proposedLong,
    //   status: 'accepted',
    // }).then(function() {
    //   console.log("date updated.")
    // }).catch(function(error) {
    //   console.log("date updated failed: " + error.message)
    //   //return 'error: '+error.message;
    // });


    // let response = { 
    //   success: true,
    //   restaurantName: restaurantName,
    //   reservationTime: reservationTime,
    //   restaurantAddress: restaurantAddress,
    // }

  
    // return response ; //return response

};

module.exports = createDateFlow;