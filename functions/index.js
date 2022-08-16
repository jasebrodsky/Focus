// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();




// //delete users
// exports.deleteUsers = functions.https.onRequest((req, res) => {
  
//   const listAllUsers = (nextPageToken) => {
//     // List batch of users, 1000 at a time.
//     admin
//         .auth()
//         .listUsers(1000, nextPageToken)
//         .then(async (listUsersResult) => {
//             await admin.auth().deleteUsers(listUsersResult.users.map((u) => u.uid));
//             if (listUsersResult.pageToken) {
//                 // List next batch of users.
//                 listAllUsers(listUsersResult.pageToken);
//             }
//         })
//         .catch((error) => {
//             console.log('Error listing users:', error);
//         });
//     };
//   listAllUsers();

//   })

// //add users
// exports.addUser = functions.https.onRequest((req, res) => {
  
//     admin.auth()
//     .createUser({
//       uid: "FG7XgDBDXYZWX6RdzAayncklPwU2",
//       email: "sandeepdeepak@gmail.com",
//       emailVerified: false,
//       }
//     )
//     .then((userRecord) => {
//       // See the UserRecord reference doc for the contents of userRecord.
//       console.log('Successfully created new user:', userRecord.uid);
//     })
//     .catch((error) => {
//       console.log('Error creating new user:', error);
//     });
//   })


//function to send notification when user is off waitlist.
exports.notifyOffWaitlist = functions.database.ref('/users/{userId}').onUpdate((change, context) => {
  
  //check if user is updated from waitlist to active status
  if(change.before.val().status == 'waitlist' && change.after.val().status == 'active' ){
    console.log('user is off waitlist.');
    //save data of message
    const fcmToken = change.after.val().fcmToken;
    const messageTitle = 'Welcome to Focus \uD83D\uDE4C';
    const messageTxt = 'You are off the waitlist!';
    
    //build media messages notification
    const payload = {
      notification: {
          title: messageTitle,
          body: messageTxt,
          sound : "default"
      },
      data: {
          VIEW: 'swipes'
      }
    };


    // Send a message to the device corresponding to the provided registration token.
    return admin.messaging().sendToDevice(fcmToken, payload)
      .then((response) => {
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
  }
})

//function to send notification after blindDate is created, accepted, proposed a new time.
exports.notifyBlindDate = functions.database.ref('/dates/{dateId}').onWrite( async (change, context) => {
  
  //save variables for notification copy
  let messageTitle = '';
  let messageTxt = '';
  let sendNotification = false; //flag to send notificaiton eventually. 

  //if a new date has been created (didnt exist before), notify user of a new date
  if (!change.before.exists()) {
      messageTitle = 'New Blind Date request';
      messageTxt = 'Open to find out who wants to meet you.';
      sendNotification = true;
      console.log('New Blind Date request');
    }
  else{ //date must have existed, notify that exisitng date has been updated 
    
    //when date status is pendingUpdateis AND the proposedTime has changed. 
    if(change.after.val().status == 'pendingUpdate' && (change.before.val().proposedTime !== change.after.val().proposedTime) ){
      messageTitle = 'Blind Date update';
      messageTxt = 'A new time has been proposed for your Blind Date. Open to find out the details.';
      sendNotification = true;
      console.log('Blind Date update');
      
    //when date goes to acepted status from pending or pendingUpdate status //UPDATE TO PENDING -> FULFILL
    }else if( ((change.before.val().status == 'pending') || (change.before.val().status == 'pendingUpdate')) && (change.after.val().status == 'fulfill') ){
      messageTitle = 'Blind Date accepted';
      messageTxt = 'Your Blind Date has been accepted. Open to find out the details.';
      sendNotification = true;
      console.log('Blind Date ready to fulfill');

    //else
    }else if( (change.before.val().status == 'fulfill') && (change.after.val().status == 'accepted') ){
      messageTitle = 'Blind Date details';
      messageTxt = 'Your Blind Date details are ready. Open to see.';
      sendNotification = true;
      console.log('Blind Date accepted');

    //else
    }else {
      sendNotification = false; //don't send notificaiotn in any other scenario (declined for example)
      console.log('else');
    }
  }

    //save data of message
    const fcmToken = change.after.val().fcmToken;
    
    //build media messages notification
    const payload = {
      notification: {
          title: messageTitle,
          body: messageTxt,
          sound : "default"
      },
      data: {
          VIEW: 'messages' //use date id from context here context.params.dateId, when building deeplink into BlindDate module. 
      }
    };

    // Send a message to the device corresponding to the provided registration token.
    if(sendNotification){
      return admin.messaging().sendToDevice(fcmToken, payload)
      .then((response) => {
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
    }

  }
)

//function to send notification when conversation is extended.
exports.notifyConversationExtended = functions.database.ref('/conversations/{conversationId}').onUpdate((change, context) => {
  
  console.log('conversation has been updated');
  //check if user has an extended conversation 
  if((change.before.val().active == false) && (change.after.val().active == true)){
    
    console.log('conversation is extended.');
    //save data of message
    const fcmToken = change.after.val().notifyFcmToken;
    const messageTitle = 'Conversation Extended \uD83D\uDE0D';
    const messageTxt = 'Open to find out who.';
    
    //build media messages notification
    const payload = {
      notification: {
          title: messageTitle,
          body: messageTxt,
          sound : "default"
      },
      data: {
          VIEW: 'messages'
      }
    };

    // Send a message to the device corresponding to the provided registration token.
    return admin.messaging().sendToDevice(fcmToken, payload)
      .then((response) => {
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
  }
})



//delete users
exports.getCode = functions.https.onRequest((req, res) => {
  const userid = req.query.userid;
  const reason = req.query.reason;
  const name_creator = req.query.name_creator;
  const photo_creator = req.query.photo_creator;
  const gender_creator = req.query.gender_creator;


  console.log('userid is: '+userid);
  let number = '';
  console.log('reason is: '+reason);

  //query for last code in db 
  admin.database().ref('/codes').orderByChild('created').limitToLast(1).once('value').then(codeSnap => {
                                                

    //query for last valid code, order by created date, limit to one. 
    // .val().number to get the last codes number
    // iterate the +1
    // save new code witih newNumber


      //convert codeSnap into it's data 
      let codeObj = Object.values(codeSnap.toJSON());
      //let codeId = Object.keys(codeSnap.toJSON())[0];
      number = codeObj[0].number;
      let newNumber = number+1;

      var words = ['FOCUS','RESPECT','LOVE','CONNECT']
      var word = words[Math.floor(Math.random()*words.length)];

      //create newCode object
      var newCode = {
        //code_id: codeId,
        created: new Date().getTime(),
        created_by: userid,
        expired: false,
        number: newNumber,
        redeemed_by: false,
        reason: reason,
        name_creator: name_creator,
        photo_creator: photo_creator,
        gender_creator: gender_creator,
        sharable_code: word+"@"+newNumber
      };

      //push newCode into database
      admin.database().ref('/codes').push(newCode).then(newCodeSnap => {
        console.log('newCodeSnap.key is: '+newCodeSnap.key);
        newCode.code_id = newCodeSnap.key;
        return res.status(200).send(newCode);
      })
      .catch(error => console.log(error));
  })  
})


//function to send notification when message is recieved. 
exports.notifyNewMessage = functions.database.ref('/conversations/{conversationId}/messages/{messageId}').onCreate((snap, context) => {
  
  console.log('trigged message notification');


  //save data of message
  const message = snap.val();
  const senderName = message.user._name;
  const toId = message['userTo'];
  const fromId = message.user._id;
  const messageTxt = message ['text'];
  const notify = message ['notify'];

  //fetch fcmToken of reciepient in order to send push notification
  return admin.database().ref('/users/' + toId ).once('value').then((snapUser) => {
    //build media messages notification
    const sendNotificationMessage = snapUser.val().notifications_message;
    const fcmToken = snapUser.val().fcmToken;

    console.log('fcmToken is: '+fcmToken);
    console.log('sendNotificationMessage is: '+sendNotificationMessage);

    //build media messages notification
    const payload = {
        notification: {
          title: senderName + " sent you a message \uD83D\uDCAC" ,
          body: messageTxt,
          sound : "default"
        },
        data: {
          VIEW: 'messages'
        }
    }

    //send message if user allows notifications for messages
    if ((sendNotificationMessage == true) && (notify == true)) {

      return admin.messaging().sendToDevice(fcmToken, payload)
      .then((response) => {
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
    }

  })//end return-then
});


//function to send notification at noon local time for newMatchBatch. 
//run function every 15 min and check which user has offset that equals noon, to send notificaiotn and reset swipe counts. 
exports.notifyNewMatchBatch = functions.pubsub.schedule('15,30,45,0 * * * *').onRun(async ( context ) => {

  // today date
  let today = new Date();
  console.log('today is: '+today);
  
  // today's minitues in UTC -- use this, since some timezones are offsetted by 15, 30, 60 min. 
  let currentUTCMinutes = today.getUTCMinutes();
  console.log('CurrentUTCMinutes is: '+currentUTCMinutes);

  // today's hour in UTC
  let currentUTChour = today.getUTCHours();
  console.log('currentUTChour is: '+currentUTChour);

  // put (hours * 60) + min together, for total min. 
  let currentUTCtimeMin = (currentUTChour * 60) + currentUTCMinutes;
  console.log('currentUTCtimeMin is: '+currentUTCtimeMin);

  //the local UTCoffset which equals noon, is the current UTC time - (12 hours * 60 min). 
  let localUtcOffsetMin = currentUTCtimeMin - (12 * 60); 
  console.log('localUtcOffsetMin is: '+localUtcOffsetMin);

  //what UTC Offset to target, at noon ....  currentUTC - 12 = localUtcOffset
  //UTC (GMT) = 0, local UTC offset = -12
  //UTC (GMT) = 1, local UTC offset = -11
  //UTC (GMT) = 2, local UTC offset = -10
  //UTC (GMT) = 3, local UTC offset = -9
  //UTC (GMT) = 4, local UTC offset = -8
  //UTC (GMT) = 5, local UTC offset = -7    
  //UTC (GMT) = 6, local UTC offset = -6
  //UTC (GMT) = 7, local UTC offset = -5    
  //UTC (GMT) = 8, local UTC offset = -4
  //UTC (GMT) = 9, local UTC offset = -3
  //UTC (GMT) = 10, local UTC offset = -2  
  //UTC (GMT) = 11, local UTC offset = -1
  //UTC (GMT) = 12, local UTC offset = 0
  //UTC (GMT) = 13, local UTC offset = 1
  //UTC (GMT) = 14, local UTC offset = 2
  //UTC (GMT) = 15, local UTC offset = 3
  //UTC (GMT) = 16, local UTC offset = 4
  //UTC (GMT) = 17, local UTC offset = 5
  //UTC (GMT) = 18, local UTC offset = 6    
  //UTC (GMT) = 19, local UTC offset = 7
  //UTC (GMT) = 20, local UTC offset = 8    
  //UTC (GMT) = 21, local UTC offset = 9 
  //UTC (GMT) = 22, local UTC offset = 10 
  //UTC (GMT) = 23, local UTC offset = 11 
  //UTC (GMT) = 24, local UTC offset = 12
  
  
  //return promise of users who are in their local noon time
  let fcmTokenFetchPromise = await admin.database().ref('users').orderByChild('utc_offset_min').equalTo(localUtcOffsetMin).once('value');
    //save empty array of tokens
    let fcmTokens = [];

    //for each returned user, put their token into an array.
    fcmTokenFetchPromise.forEach(user => {
      //handle when fcmToken is null by excluding from array and also check if user has permission to send notifications
      if(user.val().fcmToken && user.val().notifications_daily_match == true){
        //push fcmToken to fcmTokens array
        fcmTokens.push(user.val().fcmToken);
      }

      console.log('fcmTokens are: '+fcmTokens);

      //update swipe count to 0 sine it's noon for userday. 
       admin.database().ref('/users/' + user.val().userid).update({
        swipe_count: 0,
      }).catch(reason => {
        console.log(reason);
        res.status(500).send('error: '+reason)
      });   
    })

    //construct the payload for the Multicast function.
    const payload = {
      data: {
        title: 'Hello again.',
        body: 'Your daily matches have arrived',
        VIEW: 'swipes'
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: 'Hello again',
              body: 'Your daily matches have arrived. \uD83D\uDE0D',    
            },
            badge: 99,
            sound: 'default',
          },
        },
      },
      tokens: fcmTokens
    };



    // send message to each token in the payload
    return admin.messaging().sendMulticast(payload)
      .then((response) => {
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(fcmTokens[idx]);              
            }
          });
          console.log('List of tokens that caused failures: ' + failedTokens);
        }
        console.log('response:', JSON.stringify(response));
      });
    })
  


//function to send notification when new match is recieved. 
exports.notifyNewMatch = functions.database.ref('/matches/{reciepientId}/{newMatchId}').onCreate((snap, context) => {
  
  //save data of match
  const match = snap.val();
  const matchName = match.name;
  console.log('matchName is: '+matchName);
  const toId = context.params.reciepientId;
  console.log('reciepientId is: '+toId);
  const messageTitle = 'You have a new match \uD83D\uDE0D';
  const messageTxt = 'Chat with '+matchName+' to focus their photos.';

  //fetch fcmToken of reciepient in order to send push notification
  return admin.database().ref('/users/' + toId ).once('value').then((snapUser) => {
    //build media messages notification
    const sendNotificationMatch = snapUser.val().notifications_match;
    const fcmToken = snapUser.val().fcmToken;

    console.log('fcmToken is: '+fcmToken);
    console.log('sendNotificationMatch is: '+sendNotificationMatch);

    //build media match notification
    const payload = {
      notification: {
        title: messageTitle,
        body: messageTxt,
        sound : "default"
      },
      data: {
        // SENDER_NAME: senderName,
        // SENDER_ID: fromId,
        VIEW: 'messages'
      }//end data
    }//end payload

    //send message if user allows notifications for matches
    if (sendNotificationMatch == true) {
      return admin.messaging().sendToDevice(fcmToken, payload)
      .then((response) => {
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
    }
  })
});


// add in age range/location (in db and function query start and end strings)

//get matches
exports.getMatches = functions.https.onRequest((req, res) => {
    const userid = req.query.userid;
    let rankedMatches = [];
    let remainingSwipes = 10;
    let max_age = 50;
    let min_age = 18;
    let gender_pref = '';
    let latitude = '';
    let longitude = '';
    let max_distance = 100;

    //save eligibleMatches into const which returns promise -- these will be the users who fit user in context preferences
    const eligibleMatches = admin.database().ref('/users/' + userid).once('value').then(userPrefSnap => {
        
        // save preferences of user to use later in following query
        latitude = userPrefSnap.val().latitude;
        longitude = userPrefSnap.val().longitude;
        max_distance = userPrefSnap.val().max_distance;
        max_age = userPrefSnap.val().max_age == 50 ? 100 : userPrefSnap.val().max_age;
        min_age = userPrefSnap.val().min_age;
        swipe_count = userPrefSnap.val().swipe_count;
  
        //convert max and min ages into DOB. Put DOB into gender_pref when logging in. 
        // gender_pref = City_Gender_Pref_DOB
        // query_start = NYC_female_bi_23
        // query_end = NYC_female_straight_32


        // check user used all their swipes by checking if swipeCount is 10 or above
        if (swipe_count >= 10){
          console.log('user should not see matches, swipe_count: '+ swipe_count);
          
          //return null object
          return null;

        }else{
          //else continue generating eligble matches

          //calculate remaining swipes from original 10
          remainingSwipes = 10 - swipe_count; 

          // update gender pref variable       
          gender_pref = userPrefSnap.val().gender_pref;

          // translate user's gender_pref into who they're interested in. 
          switch (true) {
            case (gender_pref == 'female_straight'):
              var query_start = 'male_bi';
              var query_end = 'male_straight';
              //above query will include male_gay since it's inbetween male_bi and male_straight
              break;
            case (gender_pref == 'male_straight'):
              var query_start = 'female_bi';
              var query_end = 'female_straight';
              break;

            case (gender_pref == 'nonbinary_into_male'): //handle non-binary genders
              var query_start = 'male_bi';
              var query_end = 'male_bi';
              break;

            case (gender_pref == 'male_gay'):
              var query_start = 'male_bi';
              var query_end = 'male_gay';
              break;
            case (gender_pref == 'female_gay'):
              var query_start = 'female_bi';
              var query_end = 'female_gay';
              break;

            case (gender_pref == 'nonbinary_into_female'): //handle non-binary genders
                var query_start = 'female_bi';
                var query_end = 'female_bi';
                break;

            case (gender_pref == 'male_bi'):
              var query_start = 'female_bi';
              var query_end = 'male_straight';
              break;
            case (gender_pref == 'female_bi'):
              var query_start = 'female_bi';
              var query_end = 'male_straight';
              break;
            
            case (gender_pref == 'nonbinary_bi'): //handle non-binary genders
              var query_start = 'female_bi';
              var query_end = 'non_binary_bi';
              break;

           
                default:
              console.log('Sorry, we are out of ' + expr + '.');
          }

          //return promise of users who are fit users preferences and limited to their remaining swipes
          return admin.database().ref('users').orderByChild('gender_pref').startAt(query_start).endAt(query_end).once('value', (eligibleMatchesSnap) => {
            return eligibleMatchesSnap
            //if user is BI, append male_gay or female_gay users to eligiblematch array here. 
          })   
        }
     
      }).catch(reason => {
        console.log(reason);
        res.status(500).send('error: '+reason)
      });

    //save swipesReveivedLeft into const which returns promise -- show these last since these won't be matches
    const swipesReceivedLeft = admin.database().ref('/swipesReceived/' + userid).orderByChild('like').equalTo(false).once('value').then(swipesReceivedLeftSnap => {
      return swipesReceivedLeftSnap
      }).catch(reason => {
        console.log(reason);
        res.status(500).send('error: '+reason)
      });

    //save swipesReveivedRight into const which returns promise -- show these first since these are potetial matches
    const swipesReceivedRight = admin.database().ref('/swipesReceived/' + userid).orderByChild('like').equalTo(true).once('value').then(function(swipesReceivedRightSnap) {
      return swipesReceivedRightSnap
      }).catch(reason => {
        console.log(reason);
        res.status(500).send('error: '+reason)
      });

    //save swipesGivenLeft into const which returns promise -- show these last since these won't be matches
    const swipesGivenLeft = admin.database().ref('/swipes/' + userid).orderByChild('like').equalTo(false).once('value').then(function(swipesGivenLeftSnap) {
      return swipesGivenLeftSnap
      }).catch(reason => {
        console.log(reason);
        res.status(500).send('error: '+reason)
      });

    //save swipesGivenRight into const which returns promise -- show these first since these are potetial matches
    const swipesGivenRight = admin.database().ref('/swipes/' + userid).orderByChild('like').equalTo(true).once('value').then(function(swipesGivenRightSnap) {
      return swipesGivenRightSnap
      }).catch(reason => {
        console.log(reason);
        res.status(500).send('error: '+reason)
      });

    //save all const into promise, so that data manipultion can start after realtime db resolves
    const all_pr = Promise.all([eligibleMatches, swipesReceivedLeft, swipesReceivedRight, swipesGivenLeft, swipesGivenRight]).then(results => {
      //DATA MANIPULATION AFTER PROMISE.ALL RESOLVES

      //create empty arrays for all list of users. If db returns a value, replace array with returned value. 
      let sortedEligibleMatchesArray = [];
      let swipesReceivedLefts = [];
      let swipesReceivedRights = [];
      let swipesGivenLefts = [];
      let swipesGivenRights = [];
      let remove = false;
          
      //save all matches into variables. If empty object create empty array. 
      if (results[1].toJSON() !== null) {
        swipesReceivedLefts = Object.keys(results[1].toJSON());      
      }

      if (results[2].toJSON() !== null) {
        swipesReceivedRights = Object.keys(results[2].toJSON());      
      } 

      if (results[3].toJSON() !== null) {
        swipesGivenLefts = Object.keys(results[3].toJSON());      
      } 

      if (results[4].toJSON() !== null) {
        swipesGivenRights = Object.keys(results[4].toJSON());      
      }

      //save eligible matches and sort by last_login here
      if (results[0] !== null) {

        //Create var for unsorted matchs obj
        let eligibleMatchesSnap = results[0].toJSON();

        //Create empty array for match objects to live, will sort eventually
        let eligibleMatchesSnapArray = [];

        //convert result from firebase into an array.
        Object.keys(eligibleMatchesSnap).forEach(userid => {

          //create var for user data, which will be injected into object           
          let userData = eligibleMatchesSnap[userid];

          // create object with flat userData inside in order to sort easier
          let eligbleMatchObj = userData;
          
          //push eligibleMatchObj to eligbleMatchesSnapArray
          eligibleMatchesSnapArray.push(eligbleMatchObj);
        });

        //remove non 'active' profiles and profiles outside of user prefs by removing those objects
        eligibleMatchesSnapArray = eligibleMatchesSnapArray.filter(( matchObj ) => {
          
          //convert matchObject birthday into age
          let matchObjAge = ((new Date()).getTime() - (new Date(matchObj.birthday).getTime())) / (1000 * 60 * 60 * 24 * 365);
          let genderPrefRemove = '';
          //check if users is bi, if so remove same-sex straight users. 
          if (gender_pref == 'male_bi'){
            genderPrefRemove = 'male_straight';
          }else if (gender_pref == 'female_bi'){
            genderPrefRemove = 'female_straight';
          }else{
            genderPrefRemove = null;
          }

          // number of km per degree = ~111km (111.32 in google maps, but range varies between 110.567km at the equator and 111.699km at the poles)
          // 1km in degree = 1 / 111.32km = 0.0089
          // 1m in degree = 0.0089 / 1000 = 0.0000089
          let coef = max_distance * 0.0000089;

          //max coordiantes is user current lat + distance
          let max_lat = latitude + coef;
          let max_long = longitude + coef / Math.cos(latitude * 0.018);

          //min coordiantes is user current lat + distance
          let min_lat = latitude - coef;
          let min_long = longitude - coef / Math.cos(latitude * 0.018);

          //logging for tests
          console.log('current lat is: '+latitude);
          console.log('current long is: '+longitude);
          console.log('coef is: '+coef);

          console.log('min_lat is: '+min_lat);
          console.log('min_long is: '+min_long);
          console.log('max_lat is: '+max_lat);
          console.log('max_long is: '+max_long);
          console.log('max_age is: '+max_age);

          console.log('matchObj.latitude is: '+matchObj.latitude);
          console.log('matchObj.longitude is: '+matchObj.longitude);

          //return matches after passing requirements
          return matchObj.status == 'active' && //only active profiles
                 matchObj.intialUser == false && //remove incomplete profiles. 
                 matchObj.userid !== userid && //remove users own profile. 
                 matchObj.gender_pref !== genderPrefRemove && //remove same-sex straight profiles, if user is bi. 
                 matchObj.latitude >= min_lat && // greater than min latidude
                 matchObj.latitude <= max_lat && //less than max latidude  
                 matchObj.longitude >= min_long && // greater than min longitude
                 matchObj.longitude <= max_long && //less than max longitude  
                 matchObjAge >= min_age && // greater than min_age
                 matchObjAge <= max_age; //less than max_age
        });

        //sort array by child property lastLogin
        eligibleMatchesSnapArray.sort(function(a,b){return a.last_login - b.last_login});

        //need to convert into array of id's 
        sortedEligibleMatchesArray = eligibleMatchesSnapArray.map(a => a.userid);
      }

      // iterate sortedEligibleMatchesArray in reverse, so that when splicing array we arent' skipping next item due to the index incrementing while list decreasing
      for (index = sortedEligibleMatchesArray.length - 1; index >= 0; --index) {

        //console.log('sortedEligibleMatchesArray[index].status: '+sortedEligibleMatchesArray[index]);

        //save flag for when eligibleMatch is user in context or in swipesRecieved or swipesGivenRights or swipesGivenLefts 
        remove = (sortedEligibleMatchesArray[index] == userid) || swipesReceivedRights.includes(sortedEligibleMatchesArray[index]) || swipesReceivedLefts.includes(sortedEligibleMatchesArray[index]) || swipesGivenLefts.includes(sortedEligibleMatchesArray[index]) || swipesGivenRights.includes(sortedEligibleMatchesArray[index]);

        //if removed = true, remove that element from eligbleMatchList array.
        if (remove) {
          sortedEligibleMatchesArray.splice(index, 1);
        }else{
          //if eligible match is unique, create object and add to rankedMatches array with appropriate properties
          let eligibleMatchObject = {
            [sortedEligibleMatchesArray[index]]: {
              matchType:"eligible_match",
              userId: sortedEligibleMatchesArray[index]
            }
          };

          //add object to rankedMatches
          rankedMatches.push(eligibleMatchObject);
        }
      };


     // iterate swipesReceivedRights in reverse, so that when splicing array we arent' skipping next item due to the index incrementing while list decreasing
      for (index = swipesReceivedRights.length - 1; index >= 0; --index) {

        //save flag for user is active match, since both users swiped right on eachother.  
        remove = swipesGivenRights.includes(swipesReceivedRights[index]);

        //if removed = true, remove that element from swipesReceivedRights array.
        if (remove) {
          swipesReceivedRights.splice(index, 1);
        }else{
        
        // after cleaning swipesRecievedRight, create object with it's data. 
        let potentialMatchObject = {
          [swipesReceivedRights[index]]: {
            matchType:"potential_match",
            userId: swipesReceivedRights[index]
          }
        };

          //add potential match objet to rankedMatch array at the start. 
          rankedMatches.unshift(potentialMatchObject);

        }
      }

      //limit ranked matches to to swipesRemaining
      let rankedMatchesSliced = rankedMatches.slice(0, remainingSwipes);
      
      //return response
      return res.status(200).send(rankedMatchesSliced);
    })
});



      //IMPROVE PEFORAMANCE
      //create new object (user_stats?) in db with all info needed in alg (lastlogin/gender_pref/location/score?). 
      //create db triggered cloud function to update object with computed scores used for ranking. 
      // after login, update 'user_stats' with ranked score (likesGiven/LikesRecieved)

      //cases to cover: 
      // 1. no swipes from either dater
      // 2. dater x and dater y swiped yes -- active match, remove from each others lists
      // 3. dater x and dater y swiped no - no interest, can reappear
      // 4. dater x swipes yes and dater y hasn't swiped -- sort top of dater y's
      // 5. dater x swipes yes and dater y swiped no -- sort to bottom of dater y's

      //results array: 
      // results[0] = eligibleMatches -- (age,location,gender_pref)
      // -----------
      // results[1] = swipesReceivedLeft - sort to bottom
      // results[2] = swipesReceivedRight - sort to top (potential matches)
      // results[3] = swipesGivenLeft -- sort to bottom user disliked already
      // results[4] = swipesGivenRight -- remove, user already liked



