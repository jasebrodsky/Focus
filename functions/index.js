// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

const yelp = require('yelp-fusion');
const client = yelp.client('CKia7Mz51NpAHxvG-thuvuZk0RGPeGmyVyYVsYJEfAOI_nO2acc3NRZROLq-VgkXVD2RvqzVzKiMz3tdoVKc8NPhc8-5prI7VFZMWTtXpSKmp0J_HVsEyCS_1IrLYXYx');

const createReservationFlow = require('./functions/createReservationFlow');
const createDateFlow = require('./functions/createDateFlow');
const getDates = require('./functions/getDates');
const geofire = require('geofire-common');
const Elo = require('arpad');


  //sync users btw firebase (for UX purposes) and firestore (for querying purposes)
  exports.syncUsers = functions.database.ref('/users/{userId}').onWrite((change, context) => {
    // Get the user data
    const user = change.after.val();

    // Add the user to the Firestore collection
    return admin.firestore().collection('users').doc(context.params.userId).set(user);
  });

  //sync swipes btw firebase (for UX purposes) and firestore (for querying purposes)
  exports.syncSwipesReceived = functions.database.ref('/swipesReceived/{userId}').onWrite((change, context) => {
    // Get the swipe data
    const swipe = change.after.val();

    // Add the swipe to the Firestore collection
    return admin.firestore().collection('swipesReceived').doc(context.params.userId).set(swipe);
  });

  //sync swipes btw firebase (for UX purposes) and firestore (for querying purposes)
  exports.syncSwipes = functions.database.ref('/swipes/{userId}').onWrite((change, context) => {
    // Get the user data
    const swipe = change.after.val();

    // Add the user to the Firestore collection
    return admin.firestore().collection('swipes').doc(context.params.userId).set(swipe);
  });

  //getMatchingUsers that query user colletion for all appropriate users based off current users preferences and swipe history
  exports.getMatchingUsers = functions.https.onRequest( async (req, res) => {

    const swipeCount = req.query.swipe_count;
    const remainingSwipes = 10 - swipeCount;

    //if remainingSwipe is greater than 0, continue script, otherwise stop.
    if(remainingSwipes <= 0 ){
      return res.status(200).json('no more swipes.');
    } 

    //continue script

    const currentUserId = req.query.userid;
    //const currentUserELOScore = req.query.currentUserELOScore;
    const currentUserELOScore = 5.0;
    const currentUserBirthday = req.query.birthday;
    const currentUserLatitude = req.query.latitude;
    const currentUserLongitude = req.query.longitude;
    const currentUserMaxDistance = req.query.max_distance;
    const minAgePreference = req.query.min_age;
    const maxAgePreference = req.query.max_age;
    const excludedUsers = req.query.excluded_users; //remember to pass this excluded_users=123&excluded_users=456&excluded_users=789

    // compute time current time to use to determin age data 
    const currentTime = new Date();
    const birthday = new Date(currentUserBirthday);
    const currentUserAge = currentTime.getFullYear() - birthday.getFullYear();

    //if users birthday hasn't occured this year, then subtract one from the birthday. 
    if (currentTime.getTime() < birthday.getTime()) {
      currentUserAge -= 1;
    }

    //save min and max ages 
    const minAgeBirthDate = currentTime.getFullYear() - minAgePreference;
    const maxAgeBirthDate = currentTime.getFullYear() - maxAgePreference;
    const maxBirthDay = new Date(maxAgeBirthDate, currentTime.getMonth(), currentTime.getDate());
    const minBirthDay = new Date(minAgeBirthDate, currentTime.getMonth(), currentTime.getDate());

    //if (maxBirthDay > currentTime) {
      // Subtract an additional year if the maximum birth date is in the future
      maxBirthDay.setFullYear(maxBirthDay.getFullYear() - 1);
    //}
    
    

    // compute array of users gender preferences, in order to be used to filter for appropriate matches.
    const currentUserGenderPreference = req.query.interested //can be either male,female, everyone
    const currentUserGender = req.query.gender; // can be: 'male', 'female', 'non-binary'

    // build geo coding data to use for start/end of queryies. 
   // const center = [Number(currentUserLatitude), Number(currentUserLongitude)];
    
  const center = isNaN(currentUserLatitude) || isNaN(currentUserLongitude) ?
    [40.7128, -74.0060] : // New York City
    [Number(currentUserLatitude), Number(currentUserLongitude)]; //else use lat/long
  
  const radiusInM = currentUserMaxDistance;

    // Each item in 'bounds' represents a startAt/endAt pair. We have to issue
    // a separate query for each pair. There can be up to 9 pairs of bounds
    // depending on overlap, but in most cases there are 4.
    const bounds = geofire.geohashQueryBounds(center, radiusInM);
    //console.log('bounds is: '+bounds);
    const promises = [];
    for (const b of bounds) {
      let q = admin.firestore().collection('users')
        .where("status", "==", 'active')
        .where("intialUser", "==", false)

      //if current user is into either male or females' (not 'everyone')
      if (currentUserGenderPreference !== 'everyone') {
        //look for users that have gender that the current user prefers (male or female)
        q = q.where("gender", "==", currentUserGenderPreference);
      }

      // //if curent user is binary (male or female)
      // if (currentUserGender !== 'nonbinary') {
      //   //look for users that are interested in the users gender (male or female)
      //   q = q.where("interested", "==", currentUserGender); //Or 'everyone'..  Might need to do this on client and filter for [currentUserGender, 'everyone']
      // }
    
      q = q.orderBy('geohash')
          .startAt(b[0])
          .endAt(b[1]);
    
      promises.push(q.get());
    }

    // Collect all the query results together into a single list
    Promise.all(promises).then((snapshots) => {
      const allUsers = [];

      for (const snap of snapshots) {
        for (const doc of snap.docs) {
          const lat = doc.get('latitude');
          const lng = doc.get('longitude');

          // We have to filter out a few false positives due to GeoHash
          // accuracy, but most will match
          const distanceInKm = geofire.distanceBetween([lat, lng], center);
          const distanceInM = distanceInKm * 1000;
          if (distanceInM <= radiusInM) {
            allUsers.push(doc.data());
          }
        }
      }

      return allUsers;
    }).then( async (allUsers) => {

      // First, create an arrays for all the swipe activity involving the current userid. 
      let swipesReceivedRight = []; //show these first since these are potetial matches
      let swipesReceivedLeft = [];  //show these last since these people don't like the current user abd won't be matches
      let swipesGivenLeft = []; //show these last since current user doesn't like them and won't be matches unless they change their mind later. 
      let swipesGivenRight = []; //show these never since these will eventually be a mutual match or never a match. 

      // Calculate the date 6 months ago to use to exclude old swipeLefts, to give users second chances after 6 months. 
      const sixMonthsAgo = new Date(currentTime.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

      //query for swipe given data
      await admin.firestore().collection("swipes")
      .doc(currentUserId)
      .get()
      .then(doc => {
        if (doc.exists) {
          // Loop through the maps in the document and save the IDs to the appropriate array
          for (const key in doc.data()) {
            if (doc.data().hasOwnProperty(key)) {
              const map = doc.data()[key];
              if (map.like) {
                swipesGivenRight.push(key);
              } else {
                  // Only push the key to the swipesGivenLeft array if the swipe date is within the last 6 months
                  if (map.swipe_date >= sixMonthsAgo) {
                    swipesGivenLeft.push(key);
                  }
              }
            }
          }
        }
      });

      //query for swipes Received data
      await admin.firestore().collection("swipesReceived")
      .doc(currentUserId)
      .get()
      .then(doc => {
        if (doc.exists) {
          // Loop through the maps in the document and save the IDs to the appropriate array
          for (const key in doc.data()) {
            if (doc.data().hasOwnProperty(key)) {
              const map = doc.data()[key];
              if (map.like) {
                swipesReceivedRight.push(key);
              } else {
                // Only push the key to the swipesReceivedLeft array if the swipe date is within the last 6 months
                if (map.swipe_date >= sixMonthsAgo) {
                  swipesReceivedLeft.push(key);
                }
              }
            }
          }
        }
      });

      //combine all users to be excluded (swipeGivenRight, swipeReceivedLeft, and excludedUsers
      const excludedUsersArrayNotUnique = [...new Set(swipesGivenRight.concat(swipesReceivedLeft, excludedUsers))];
      //add current userId to exclude array
      excludedUsersArrayNotUnique.push(currentUserId);

      //remove duplicate users to exclude
      let excludedUsersArray = excludedUsersArrayNotUnique.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
      
      //additional filters on client to exclude incompatiable users
      const rankedMatchesNoSort = allUsers.filter(
        user => 
          !excludedUsersArray.includes(user.userid) //exclude userids from the excludedUsersArray
          && user.birthdayTimeStamp > maxBirthDay.getTime() //exclude users who are too old for the current users preferences
          && user.birthdayTimeStamp <= minBirthDay.getTime() //exclude users who are too young for the current users preferences
          && user.min_age <= currentUserAge //exclude users who think the current user is too young for their preferences
          && user.max_age >= currentUserAge //exclude users who think the current user is too old for their preferences
          && ((user.interested == currentUserGender) || (user.interested == 'everyone'))  //exclude users who are not interested in the current users gender.
      );

      //only take the first 5 swipe rights, so that a max of 5 potential matches will be shown to avoid overwhelming popular users. 
      swipesReceivedRight.slice(0, 4);

      // For each user in swipesReceivedRight array add property potential_match in order to sort user to top of rankedMatches and include new property matchType: 'potential_match' for client. 
      const rankedMatchesSorted = rankedMatchesNoSort.map(user => {
        //if user recieved a swipe right, add property potential_match, in order to sort to top. 
        if (swipesReceivedRight.includes(user.userid)) {
          return {...user, matchType: 'potential_match'};
        }
        //if user aleady swiped left, add property unlikely match, in order to sort to bottom. 
        if (swipesGivenLeft.includes(user.userid)) {
          return {...user, matchType: 'unlikely_match'};
        }
        //else user is an eligible match. 
        else {
          return {...user, matchType: 'eligible_match'};
        }
      });

      //now sort by first potential matches, then by ELO score
      rankedMatchesSorted.sort((a, b) => {
        
        // Sort potential matches to the top // UPDATE: put first 5 potential matches randomly in top 10. 
        if (a.matchType === 'potential_match' && b.matchType !== 'potential_match') {
          return -1;
        }
        if (a.matchType !== 'potential_match' && b.matchType === 'potential_match') {
          return 1;
        }
      
        // Sort unlikely matches to the bottom
        if (a.matchType === 'unlikely_match' && b.matchType !== 'unlikely_match') {
          return 1;
        }
        if (a.matchType !== 'unlikely_match' && b.matchType === 'unlikely_match') {
          return -1;
        }
      
        // Within the eligible matches, sort by score
        if (a.matchType === 'eligible_match' && b.matchType === 'eligible_match') {
          //return b.score - a.score;
          return b.last_login - a.score;
        }

      });

      //get the top 10 matches
      const top10Matches = rankedMatchesSorted.slice(0, remainingSwipes);

      //randomize top10Matches
        for (let i = top10Matches.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [top10Matches[i], top10Matches[j]] = [top10Matches[j], top10Matches[i]];
        }
      

      console.log('currenUserAge is: '+currentUserAge);
      console.log('allUsers are: '+allUsers);
      console.log('excludedUsersArray are: '+excludedUsersArray);
      console.log('swipesReceivedRight are: '+(swipesReceivedRight));
      console.log('top10Matches are: '+(top10Matches));

      //return rankedMatches to client.
      // how to think about limits, since you only want to send 10 back.. should we paginate process until there's 10?
     
     //send array of user objects to client.
     //add flag matchType: potential_match OR eligible_match for the others. 
     //swipes should only get swipeData from this array, which is returned to it. handle potential matches with flag.  
     
      return res.status(200).json(top10Matches);
        
  });

  //schedule function to calculate/update users ELO score for all new swipes, and maybe other actions as well like logging in and sending messages? 

});



  //get dates from yelp http function
  exports.getDates = functions

      .runWith({
        timeoutSeconds: 540,
        memory: '4GB',
      })
      .region('us-central1')
      .https.onRequest(async (request, response) => {
          
        //convert type to categories to search. 
        switch(request.query.type) {
          case 'cocktails':
            categories = 'bars'; //bars
            // openAt = new Date(date.proposedTime).setHours(20 + utc_offset, 30, 0); //8:30pm
            break;
          case 'coffee':
            categories = 'coffee,coffeeroasteries';
            // openAt = new Date(date.proposedTime).setHours(11 + utc_offset, 30, 0); //11:30am
            break;
          case 'gallery':
            categories = 'galleries';
            // openAt = new Date(date.proposedTime).setHours(15 + utc_offset, 30, 0); //3:30pm          
            break;
          case 'park':
            categories = 'parks';
            // openAt = new Date(date.proposedTime).setHours(12 + utc_offset, 30, 0); //12:30am
            break;
          case 'museum':
            categories = 'artmuseums';
            // openAt = new Date(date.proposedTime).setHours(15 + utc_offset, 30, 0); //3:30pm
            break;
          case 'tea':
            categories = 'coffee,bubbletea,tea';
            // openAt = new Date(date.proposedTime).setHours(11 + utc_offset, 30, 0); //11:30am
            break;
          case 'dessert':
            categories = 'donuts,cupcakes,gelato,icecream,macarons,chocolate,bakeries';
            // openAt = new Date(date.proposedTime).setHours(19 + utc_offset, 30, 0); //7:30pm
            break;
          case 'hookah':
            categories = 'hookah_bars';
            // openAt = new Date(date.proposedTime).setHours(20 + utc_offset, 30, 0); //8:30pm
            break;
          default:
            categories = 'bars';
            // openAt = new Date(date.proposedTime).setHours(20 + utc_offset, 30, 0); //8:30pm
        }

        //map categories out
        client.search({
          //location: "NYC",
          latitude: request.query.lat,
          longitude: request.query.long,
          categories: categories,
          limit: 20,
          sort_by: 'best_match',
          }).then(dates => {
  
             // return 'dates';
              return response.status(200).send(dates);
  
          }).catch(e => {
          console.log(e);
          
      });

  })


  //Create date request trigger
  exports.createDate = functions

      .runWith({
        timeoutSeconds: 540,
        memory: '4GB',
      })
      .region('us-central1')
      .https.onRequest(async (request, response) => {
    
        //return promise of all dates that have been created status fulfill
        let datesFulfill = await admin.database().ref('dates').orderByChild('status').equalTo('fulfill').once('value');
      
        console.log('datesFulfill is: '+JSON.stringify(datesFulfill));
        //if dateFulfill isn't null, then create a date for each date
        if(datesFulfill){

          //MAKE SURE THIS IS SEQUENTIAL AND SLOW, IN ORDER TO NOT HAVE YELP NOT THROTTLE TRAFFICK DOWN. 
          Object.entries(datesFulfill.val()).forEach( async (date) => {
            //console.log('starting with date of: '+JSON.stringify(date)); 
            console.log('date1: '+date[1].status);      
            const dateDetails = await createDateFlow(date[1], date[0]); //THERE MUST BE A BETTER WAY.... 
            console.log('dateDetails returns: '+dateDetails);
          })
          return response;
        }

  })

  // exports.doThings = functions
  // .runWith({
  //   timeoutSeconds: 540,
  //   memory: '4GB',
  // })
  // .region('us-central1')
  // .https.onRequest(async (request, response) => {
  //   // Array to store all users that will be updated
  //   const updateUsers = [];

  //   // Function to convert a birthday to a timestamp
  //   const birthdayToTimestamp = (birthday) => {
  //     const date = new Date(birthday);
  //     return date.getTime();
  //   }

  //   // Function to convert latitude and longitude to a geohash
  //   const latLongToGeohash = (lat, long) => {
  //     const hash = geofire.geohashForLocation([lat, long]);
  //     return hash;
  //   }

  //   // Get the list of users from the database
  //   const usersRef = admin.database().ref('/users');
  //   const snapshot = await usersRef.once('value');
  //   const users = snapshot.val();

  //   console.log('users length: '+Object.keys(users).length);
  //   // Loop through users and update each one with the birthdayTimeStamp and geohash properties
  //   Object.values(users).forEach((user) => {
  //     const updatedUser = {
  //       ...user,
  //       genderOnProfile: true,
  //       // birthdayTimeStamp: birthdayToTimestamp(user.birthday),
  //       // geohash: latLongToGeohash(user.latitude, user.longitude),
  //     };
  //     updateUsers.push(updatedUser);
  //   });


  //   // Update the user object paths in the realtime database with the new properties
  //   updateUsers.forEach((user) => {

  //     //console.log('user is: '+user.first_name)

  //     //only if user has a birthday, then set the user
  //     if(true){
  //       //console.log('user birthday is: '+user.birthday)

  //       admin.database().ref(`users/${user.userid}`).set(user);
  //     }
  //   });

  //   // Send a response message indicating that the update was successful
  //   response.send('Users updated successfully');
  // });


    //schedule create date for all dates in fulfill status every x time. 
    //create reservations for all dates in fulfill,  make a non normative time to feel personalized
    exports.createDateSchedule = functions.pubsub.schedule('every 1 minutes').onRun(async ( context ) => {
    
        //return promise of all dates that have been created status fulfill
        let datesFulfill = await admin.database().ref('dates').orderByChild('status').equalTo('fulfill').once('value');
      
        //if dateFulfill isn't null, then create a date for each date
        if(datesFulfill){
          //MAKE SURE THIS IS SEQUENTIAL AND SLOW, IN ORDER TO NOT HAVE YELP NOT THROTTLE TRAFFICK DOWN. 
          Object.entries(datesFulfill.val()).forEach( async (date) => {
            //console.log('starting with date of: '+JSON.stringify(date)); 
            console.log('date1: '+date[1].status);      
            const dateDetails = await createDateFlow(date[1], date[0]); //THERE MUST BE A BETTER WAY.... 
            console.log('dateDetails returns: '+dateDetails);
          })
        }
              
        return null;
    })

      //update score for users every time a swipe write is trigered
        exports.updateScoresTrigger = functions
        .runWith({
          timeoutSeconds: 300,
          memory: '2GB',
        })
        .region('us-central1')
        .database.ref('/swipes/{userid}/{match_userid}/').onWrite(async (change, context) => {
        //query all swipesGiven with flag scoreUpdateNeeded = true (will only find swipes that haven't been reflect in score yet.)  
          
          const updates = {};

          //get variables from context and write
          const match_userid = context.params.match_userid;
          const user_userid = context.params.userid;

          //ref to user object to read and update their scores
          let userRef = admin.database().ref('users/'+user_userid+'/');
          let matchRef = admin.database().ref('users/'+match_userid+'/');

          let user_score = 1000;
          let match_score = 1000;

          //get realtime scores from realtime database here. 
          await userRef.once('value', (snapshot) => {
            user_score = snapshot.val().score;
          });

          await userRef.once('value', (snapshot) => {
            match_score = snapshot.val().score;
          });

          let like = change.after.val().like;
       
          //compute new scores
          const elo = new Elo();
          let new_user_score, new_match_score;
      
          //if user swiped right -- count as a loss and update scores
          if (like){ //if
            new_user_score = elo.newRatingIfLost(user_score, match_score);
            new_match_score = elo.newRatingIfWon(match_score, user_score);
          }else if(!like){ //if lost
            new_match_score = elo.newRatingIfLost(match_score, user_score );
            new_user_score = elo.newRatingIfWon(user_score, match_score);
          }
      
          //set new scores for users. 
          userRef.update({
            score: new_user_score,
          });
      
          matchRef.update({
            score: new_match_score,
          });

          // Add the updates for this user and match to the updates object
          updates[`users/${match_userid}/score`] = new_match_score;
          updates[`users/${user_userid}/score`] = new_user_score;

        // Perform all update operations in a single call
        console.log('update score in firebase');
        admin.database().ref().update(updates);            
        return null;
    })


  // //create date when a new date changes to fulfill status. 
  // exports.createDateTrigger = functions
  // .runWith({
  //   timeoutSeconds: 300,
  //   memory: '2GB',
  // })
  // .region('us-central1')
  // .database.ref('/dates/{dateId}').onUpdate( async (change, context) => {

  //   //UPDATE if status becomes fulfill and was before not fulfill, then createReservationFlow
  //   if(change.after.val().status == 'fulfill' ){

  //     const dateDetails = await createDateFlow(change.after.val(), context.params.dateId);
      
  //     //return response from createReservationFlow
  //     res.type('html').send(dateDetails);

  //    }
    
  // });






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
  
  //create empty array of fcmTokens
  let fcmTokens = [];
  
  //check if user is updated from waitlist to active status
  if(change.before.val().status == 'waitlist' && change.after.val().status == 'active' ){
    console.log('user is off waitlist.');
    //save data of message
    const fcmToken = change.after.val().fcmToken;
    //push fcmToken to fcmTokens array
    fcmTokens.push(fcmToken); 
    const messageTitle = 'Welcome to Focus Blind Dating \uD83D\uDE4C';
    const messageTxt = 'You are off the waitlist!';
    
    //build media messages notification
    // const payload = {
    //   notification: {
    //       title: messageTitle,
    //       body: messageTxt,
    //       sound : "default"
    //   },
    //   data: {
    //       VIEW: 'swipes'
    //   }
    // };

      //build media match notification
      const payload = {
        notification: {
          title: messageTitle,
          body: messageTxt,
        },
        data: {
          title: messageTitle,
          body: messageTxt,
          VIEW: 'swipes'
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: messageTitle,
                body: messageTxt,    
              },
              badge: 0,
              sound: 'default',
            },
          },
        },
        tokens: fcmTokens//end data
      }//end payload


    


    // Send a message to the device corresponding to the provided registration token.

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


    // return admin.messaging().sendToDevice(fcmToken, payload)
    //   .then((response) => {
    //     console.log('Successfully sent message:', response);
    //   })
    //   .catch((error) => {
    //     console.log('Error sending message:', error);
    //   });
  }
})

//function to send notification after blindDate is created, accepted, proposed a new time.
exports.notifyBlindDate = functions.database.ref('/dates/{dateId}').onWrite( async (change, context) => {
  
  //save variables for notification copy
  let messageTitle = '';
  let messageTxt = '';
  let sendNotification = false; //flag to send notificaiton eventually. 
  let fcmTokens = [];

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
      messageTxt = "Your Blind Date has been accepted. We're now personalizing your date. Expect more details within 24 hours.";
      sendNotification = true;
      console.log('Blind Date ready to fulfill');

    //else
    }else if( (change.before.val().status == 'fulfill') && (change.after.val().status == 'accepted') ){
      messageTitle = 'Blind Date details';
      messageTxt = 'Your personalized blind date is ready. Open to see the details.';
      sendNotification = true;
      console.log('Blind Date accepted');

    //else pending -> accepted, date personalized. 
    }else if( (change.before.val().status == 'pending') && (change.after.val().status == 'accepted') ){
      messageTitle = 'Blind Date details';
      messageTxt = 'Your personalized blind date is ready. Open to see the details.';
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
    fcmTokens.push(fcmToken);
    
    // //build media messages notification
    // const payload = {
    //   notification: {
    //       title: messageTitle,
    //       body: messageTxt,
    //       sound : "default"
    //   },
    //   data: {
    //       VIEW: 'messages' //use date id from context here context.params.dateId, when building deeplink into BlindDate module. 
    //   }
    // };

      //build media match notification
      const payload = {
        notification: {
          title: messageTitle,
          body: messageTxt,
        },
        data: {
          title: messageTitle,
          body: messageTxt,
          VIEW: 'messages'
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: messageTitle,
                body: messageTxt,    
              },
              badge: 0,
              sound: 'default',
            },
          },
        },
        tokens: fcmTokens//end data
      }//end payload



    // Send a message to the device corresponding to the provided registration token.
    if(sendNotification){

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
      // return admin.messaging().sendToDevice(fcmToken, payload)
      // .then((response) => {
      //   console.log('Successfully sent message:', response);
      // })
      // .catch((error) => {
      //   console.log('Error sending message:', error);
      // });

    }

  }
)

//function to send notification when conversation is extended.
exports.notifyConversationExtended = functions.database.ref('/conversations/{conversationId}').onUpdate((change, context) => {
  
  let fcmTokens = [];

  console.log('conversation has been updated');
  //check if user has an extended conversation 
  if((change.before.val().active == false) && (change.after.val().active == true)){
    
    console.log('conversation is extended.');
    //save data of message
    const fcmToken = change.after.val().notifyFcmToken;
    fcmTokens.push(fcmToken);
    const messageTitle = 'Conversation Extended \uD83D\uDE0D';
    const messageTxt = 'Open to find out who.';
    
    //build media messages notification
    // const payload = {
    //   notification: {
    //       title: messageTitle,
    //       body: messageTxt,
    //       sound : "default"
    //   },
    //   data: {
    //       VIEW: 'messages'
    //   }
    // };

      const payload = {
        notification: {
          title: messageTitle,
          body: messageTxt,
        },
        data: {
          title: messageTitle,
          body: messageTxt,
          VIEW: 'messages'
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: messageTitle,
                body: messageTxt,    
              },
              badge: 0,
              sound: 'default',
            },
          },
        },
        tokens: fcmTokens//end data
      }//end payload

    // Send a message to the device corresponding to the provided registration token.
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
    // return admin.messaging().sendToDevice(fcmToken, payload)
    //   .then((response) => {
    //     console.log('Successfully sent message:', response);
    //   })
    //   .catch((error) => {
    //     console.log('Error sending message:', error);
    //   });
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
        shared: false,
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
  let fcmTokens = [];

  //fetch fcmToken of reciepient in order to send push notification
  return admin.database().ref('/users/' + toId ).once('value').then((snapUser) => {
    //build media messages notification
    const sendNotificationMessage = snapUser.val().notifications_message;
    const fcmToken = snapUser.val().fcmToken;
    fcmTokens.push(fcmToken);

    console.log('fcmToken is: '+fcmToken);
    console.log('sendNotificationMessage is: '+sendNotificationMessage);

    //build media messages notification
    // const payload = {
    //     notification: {
    //       title: senderName + " sent you a message \uD83D\uDCAC" ,
    //       body: messageTxt,
    //       sound : "default"
    //     },
    //     data: {
    //       VIEW: 'messages'
    //     }
    // }

        //build media match notification
        const payload = {
          notification: {
            title: senderName + " sent you a message \uD83D\uDCAC",
            body: messageTxt,
            //sound : "default"
          },
          data: {
            title: senderName + " sent you a message \uD83D\uDCAC",
            body: messageTxt,
            VIEW: 'messages'
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title: senderName + " sent you a message \uD83D\uDCAC",
                  body: messageTxt,    
                },
                //badge: 1,
                sound: 'default',
              },
            },
          },
          tokens: fcmTokens//end data
        }//end payload

    //send message if user allows notifications for messages
    if ((sendNotificationMessage == true) && (notify == true)) {

      // return admin.messaging().sendToDevice(fcmToken, payload)
      // .then((response) => {
      //   console.log('Successfully sent message:', response);
      // })
      // .catch((error) => {
      //   console.log('Error sending message:', error);
      // });


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
   

    }

  })//end return-then
});


//function to send notification at noon local time for newMatchBatch. 
//run function every 15 min and check which user has offset that equals noon, to send notificaiotn and reset swipe counts. 


// exports.notifyNewMatchBatch = functions.pubsub.schedule('15,30,45,0 * * * *').onRun(async ( context ) => {

//   // today date
//   let today = new Date();
//   console.log('today is: '+today);
  
//   // today's minitues in UTC -- use this, since some timezones are offsetted by 15, 30, 60 min. 
//   let currentUTCMinutes = today.getUTCMinutes();
//   console.log('CurrentUTCMinutes is: '+currentUTCMinutes);

//   // today's hour in UTC
//   let currentUTChour = today.getUTCHours();
//   console.log('currentUTChour is: '+currentUTChour);

//   // put (hours * 60) + min together, for total min. 
//   let currentUTCtimeMin = (currentUTChour * 60) + currentUTCMinutes;
//   console.log('currentUTCtimeMin is: '+currentUTCtimeMin);

//   //the local UTCoffset which equals noon, is the current UTC time - (12 hours * 60 min). 
//   let localUtcOffsetMin = currentUTCtimeMin - (12 * 60); 
//   console.log('localUtcOffsetMin is: '+localUtcOffsetMin);

//   //what UTC Offset to target, at noon ....  currentUTC - 12 = localUtcOffset
//   //UTC (GMT) = 0, local UTC offset = -12
//   //UTC (GMT) = 1, local UTC offset = -11
//   //UTC (GMT) = 2, local UTC offset = -10
//   //UTC (GMT) = 3, local UTC offset = -9
//   //UTC (GMT) = 4, local UTC offset = -8
//   //UTC (GMT) = 5, local UTC offset = -7    
//   //UTC (GMT) = 6, local UTC offset = -6
//   //UTC (GMT) = 7, local UTC offset = -5    
//   //UTC (GMT) = 8, local UTC offset = -4
//   //UTC (GMT) = 9, local UTC offset = -3
//   //UTC (GMT) = 10, local UTC offset = -2  
//   //UTC (GMT) = 11, local UTC offset = -1
//   //UTC (GMT) = 12, local UTC offset = 0
//   //UTC (GMT) = 13, local UTC offset = 1
//   //UTC (GMT) = 14, local UTC offset = 2
//   //UTC (GMT) = 15, local UTC offset = 3
//   //UTC (GMT) = 16, local UTC offset = 4
//   //UTC (GMT) = 17, local UTC offset = 5
//   //UTC (GMT) = 18, local UTC offset = 6    
//   //UTC (GMT) = 19, local UTC offset = 7
//   //UTC (GMT) = 20, local UTC offset = 8    
//   //UTC (GMT) = 21, local UTC offset = 9 
//   //UTC (GMT) = 22, local UTC offset = 10 
//   //UTC (GMT) = 23, local UTC offset = 11 
//   //UTC (GMT) = 24, local UTC offset = 12
  
  
//   //return promise of users who are in their local noon time
//   let fcmTokenFetchPromise = await admin.database().ref('users').orderByChild('utc_offset_min').equalTo(localUtcOffsetMin).once('value');
//     //save empty array of tokens
//     let fcmTokens = [];

//     //for each returned user, put their token into an array.
//     fcmTokenFetchPromise.forEach(user => {
//       //handle when fcmToken is null by excluding from array and also check if user has permission to send notifications
//       if(user.val().fcmToken && user.val().notifications_daily_match == true){
//         //push fcmToken to fcmTokens array
//         fcmTokens.push(user.val().fcmToken);
//       }

//       console.log('fcmTokens are: '+fcmTokens);

//       //update swipe count to 0 sine it's noon for userday. 
//        admin.database().ref('/users/' + user.val().userid).update({
//         swipe_count: 0,
//       }).catch(reason => {
//         console.log(reason);
//         res.status(500).send('error: '+reason)
//       });   
//     })

//     //construct the payload for the Multicast function.
//     const payload = {
//       data: {
//         title: 'Hello again.',
//         body: 'Your daily matches have arrived',
//         VIEW: 'swipes'
//       },
//       apns: {
//         payload: {
//           aps: {
//             alert: {
//               title: 'Hello again',
//               body: 'Your daily matches have arrived. \uD83D\uDE0D',    
//             },
//             //badge: 0,
//             sound: 'default',
//           },
//         },
//       },
//       tokens: fcmTokens
//     };



//     // send message to each token in the payload
//     return admin.messaging().sendMulticast(payload)
//       .then((response) => {
//         if (response.failureCount > 0) {
//           const failedTokens = [];
//           response.responses.forEach((resp, idx) => {
//             if (!resp.success) {
//               failedTokens.push(fcmTokens[idx]);              
//             }
//           });
//           console.log('List of tokens that caused failures: ' + failedTokens);
//         }
//         console.log('response:', JSON.stringify(response));
//       });
//     })
  

    //clean up codes that have bever been sent, first of the month at 9am 
    exports.cleanCodes = functions.pubsub.schedule('0 9 1 * *').onRun(async ( context ) => {
    
      //return promise of all codes that have been created over 30 days ago
      let codesDelete = await admin.database().ref('codes').orderByChild('shared').equalTo(false).once('value');
        
      //for each returned code, delete it. 
        codesDelete.forEach(code => {

            console.log('code.key is: '+code.key);

            let refDelete = admin.database().ref('codes/'+code.key);
            
            refDelete.remove().then(function() {
              console.log("Remove succeeded.")
              //return 'Remove succeeded';
            }).catch(function(error) {
              console.log("Remove failed: " + error.message)
              //return 'error: '+error.message;
            });
          
        })  
        
        return null;
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
  //save empty array of tokens
  let fcmTokens = [];

  //fetch fcmToken of reciepient in order to send push notification
  return admin.database().ref('/users/' + toId ).once('value').then((snapUser) => {
    //build media messages notification
    const sendNotificationMatch = snapUser.val().notifications_match;
    const fcmToken = snapUser.val().fcmToken;
    //push fcmToken to fcmTokens array
    fcmTokens.push(fcmToken);

    console.log('fcmToken is: '+fcmToken);
    console.log('sendNotificationMatch is: '+sendNotificationMatch);

    //build media match notification
    const payload = {
      notification: {
        title: messageTitle,
        body: messageTxt,
      },
      data: {
        title: messageTitle,
        body: messageTxt,
        VIEW: 'messages'
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: messageTitle,
              body: messageTxt,    
            },
            //badge: 0,
            sound: 'default',
          },
        },
      },
      tokens: fcmTokens//end data
    }//end payload


    //send message if user allows notifications for matches
    if (sendNotificationMatch == true) {

      // return admin.messaging().sendToDevice(fcmToken, payload)
      // .then((response) => {
      //   console.log('Successfully sent message:', response);
      // })
      // .catch((error) => {
      //   console.log('Error sending message:', error);
      // });
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
        // save empty array for excluded users
        excluded_users_array = [123];
               
        //convert result from firebase into an array, if user has excludedUsers
        if(userPrefSnap.val().excludedUsers){

          Object.values(userPrefSnap.val().excludedUsers).forEach(excluded_user => {  
            //make sure array is unique to users to exclude

            if(userid == excluded_user.useridExcluded){

              //push exluded user to array
              excluded_users_array.push(excluded_user.useridExcluder)

            }else if(userid == excluded_user.useridExcluder){
                
              //push exluded user to array
                excluded_users_array.push(excluded_user.useridExcluded)
            } else{

              // do nothing
              console.log('doing nothing since user is not excludedUsers array. ')
            }
          })
        }
        
        
        // // excluded users data from userPrefSnap
        // excluded_users_data = userPrefSnap.val().excludedUsers;
        // // for each excluded user, put the userid of both users into array
        // excluded_users_data.map((excluded_user)=>{
        //   excluded_users_array.push(excluded_user.useridExcluded);
        //   excluded_users_array.push(excluded_user.useridExcluder);
        // })


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
          console.log('min_age is: '+min_age);  
          console.log('matchObjAge is: '+matchObjAge);

          // console.log('matchObj.latitude is: '+matchObj.latitude);
          // console.log('matchObj.longitude is: '+matchObj.longitude);
          
        

    
          //console.log('excluded_users_array is: '+excluded_users_array);

          //return matches after passing requirements
          return matchObj.status == 'active' && //only active profiles
                 !excluded_users_array.includes(matchObj.userid) && //match user is is not in excluded user array
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

        //save flag for when eligibleMatch is user in context or in swipesReceivedRights or swipesReceivedLefts or swipesGivenLefts or swipesGivenRights 
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

        //save flag to remove user, if user is active match, since both users swiped right on eachother.
        //or save flag to remove user if loggged in user swiped left on user that liked them, they shouldn't see same not liked person again. 
        remove = swipesGivenRights.includes(swipesReceivedRights[index]) || swipesGivenLefts.includes(swipesReceivedRights[index]);

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



