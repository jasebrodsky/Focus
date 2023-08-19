import React, { Component } from 'react';
import { Linking, StatusBar, Image, Alert, Dimensions, Modal, ScrollView, Platform, TouchableOpacity, Keyboard, KeyboardAvoidingView, StyleSheet} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import database from '@react-native-firebase/database';
import analytics from '@react-native-firebase/analytics';
import auth from '@react-native-firebase/auth';
import ActionSheet from 'react-native-actionsheet';
import BlurOverlay,{closeOverlay,openOverlay} from 'react-native-blur-overlay';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Slider from '@react-native-community/slider';
import ImageViewer from 'react-native-image-zoom-viewer';
import LinearGradient from 'react-native-linear-gradient';
import Geocoder from 'react-native-geocoding';
import Geolocation from '@react-native-community/geolocation';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCog, faUsers, faPlus, faArrowAltCircleLeft } from '@fortawesome/free-solid-svg-icons';
import SplashScreen from 'react-native-splash-screen';
import { renderNotification, handleNotification } from '../Utilities/utilities.js';
const geofire = require('geofire-common');

import {
  Card,
  CardItem,
  Container,
  Content,
  Form,
  Text,
  Button,
  Item,
  Input,
  Label,
  ListItem,
  Left,
  Thumbnail,
  Toast,
  Right,
  Switch,
  Body,
  View,
  List,
  H1,
  H3,
} from "native-base";


const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";
const btnColor = 'white';
const btnTextColor = primaryColor;

var REVIEW_OPTIONS = [
  'Endorse Someone New',  
  'Endorse Back',
  'Remove Endorsement',
  'Cancel',
];

var PROFILE_OPTIONS = [
  'View Profile',  
  'Edit Profile',
  'Cancel',
];

var PHOTO_OPTIONS = [
  'View Photo',  
  'Make Main Photo',
  'Remove Photo',
  'Cancel',
];

var GENDER_OPTIONS = [
  'Male',
  'Female',
  'Nonbinary',
  'Cancel',
];

var GENDER_MATCH_OPTIONS = [
  'Male',
  'Female',
  'Everyone',
  'Cancel',
];
var DESTRUCTIVE_INDEX = 2;
var CANCEL_INDEX = 2;

Geocoder.init('AIzaSyCbt43Up1r0ywnqWX2xxMWGiwWJ3CSBrAI');

class Dashboard extends Component {

  constructor(props){
    super(props)

  this.state = {
      imageViewerVisible: false,
      selectedImage:[{url: ''}],
      imageIndex: 0,
      profileMaxHeight: "15%",
      profileViewerVisible: false,
      editProfileVisible: false,
      forceUpdate: false,
      profile: {
        showToast: false,
        images: [{0:{url:'https://focusdating.co/images/user.jpg'}}],
        first_name: null,
        last_name: null,
        latitude: null,
        longitude: null,
        gender: null,
        interested: 'Select',
        max_distance: 100,
        // birthday: 'Select a date',
        interested: null,
        min_age: 18,
        max_age: 50,
        error: null,
        notifications_message: true,
        notifications_match: true,
        error: null,
        work: '',
        status: 'active',
        reviews: {
        }
      }
    }
  }

  //configure navigation
  static navigationOptions = ({ navigation, }) => {
    return {
      headerLeft: () => (
        <View></View>
      ),
      headerTitle: () => (
        <FontAwesomeIcon size={ 32 } style={{ color: 'lightgrey'}} icon={ faCog } />
        ),
      headerRight: () => (
        <Button transparent style={{width: 100, flex: 1, justifyContent: 'flex-end', }} onPress={navigation.getParam('validate')}>
          <FontAwesomeIcon size={ 32 } style={{ right: 16, color: primaryColor}} icon={ faUsers } />
        </Button>
      ),

    };
  };


  //before component mounts, update state with value from database
  componentWillMount() {

  //save intial data for user
   userId = auth().currentUser.uid;
   firebaseRef = database().ref('/users/' + userId);

    //save data snapshot from firebaseRef
    firebaseRef.on('value', (dataSnapshot) => {
      //update sate with value from dataSnapShot. 
      this.setState({
        profile: dataSnapshot.val()
      }),

      //Run analytics
      analytics().logScreenView({
        screen_name: 'Dashboard',
        screen_class: 'Dashboard'
      });
      analytics().setUserId(userId)

  //   //trigger these user property functions when user updates each of their settings
      analytics().setUserProperty('name', dataSnapshot.val().first_name+' '+dataSnapshot.val().last_name);
      analytics().setUserProperty('birthday', (dataSnapshot.val().birthday ? dataSnapshot.val().birthday : 'empty' ));
      analytics().setUserProperty('education', dataSnapshot.val().education);
      analytics().setUserProperty('about', dataSnapshot.val().about);
      analytics().setUserProperty('gender', dataSnapshot.val().gender);
      analytics().setUserProperty('gender_pref', dataSnapshot.val().gender_pref);
      analytics().setUserProperty('interested', dataSnapshot.val().interested);
      analytics().setUserProperty('status', dataSnapshot.val().status);
      analytics().setUserProperty('work', dataSnapshot.val().work);
    //convert the below numbers to strings
      analytics().setUserProperty('last_conversation_count', dataSnapshot.val().last_conversation_count.toString());
      analytics().setUserProperty('swipe_count', dataSnapshot.val().swipe_count.toString());
      analytics().setUserProperty('max_age', dataSnapshot.val().max_age.toString());
      analytics().setUserProperty('max_distance', dataSnapshot.val().max_distance.toString());
      analytics().setUserProperty('min_age', dataSnapshot.val().min_age.toString());
      analytics().setUserProperty('last_login', dataSnapshot.val().last_login.toString());
      analytics().setUserProperty('notifications_match', dataSnapshot.val().notifications_match.toString());
      analytics().setUserProperty('notifications_message', dataSnapshot.val().notifications_message.toString());
    })

    this.getLocation();

  }  

  //After component mounts prompt for permission to recieve notifications and save fcmToken to database
  componentDidMount() {

    // Assign references to the ActionSheet components
   this.profileActionSheetRef = this.refs.profileActionSheet;
   this.genderPreferenceActionSheetRef = this.refs.genderPreferenceActionSheet;



    //hide splash screen after app loads
    SplashScreen.hide();
      
    //send vaidate function to nav as param, so that it can be referenced in the navigation. 
    this.props.navigation.setParams({ validate: this.validateSettings });
   
    //check permissions
    this.checkPermission();
      //listen for notifications when module Focus
      const didFocus = this.props.navigation.addListener(
        'didFocus',
        payload => {
            
          //get notifications when arriving
          this.handleNotification(userId, 'Dashbaord', null);
  
        }
      );


      //stop listening for notifications, since each module has different logic so lis
      const didBlur = this.props.navigation.addListener(
          'didBlur',
          payload => {
                    
            let query = database().ref('/matches/' + userId).orderByChild('showNotification');
    
            //remove listener when leaving. 
            query.off('child_changed', this.state.listener);
          }
        );

  }  

  componentWillUnmount() {
    //navigator.geolocation.clearWatch(this.watchId);
    firebaseRef.off(); //detach listener to ref, so that extra fbdb calls arent' made and unmounted component isn't updated
  }

  showInstructions = () => {
    
    if (this.state.profile.showInstructionsSettings) {
      //openOverlay();
    };
  } 
  //handle notifications
  handleNotification = (userId, screen, matchUseridExclude ) => {

    let query = database().ref('/matches/' + userId).orderByChild('showNotification');

    let listener = query.on('child_changed', (notifySnapshot) => {
 
      //first check if there's a notification to render by checking if showNotification is true on the child_changed event on the match, also check that notificaiton has happened since module mounted, so old notificaitons aren't served.  
      if((notifySnapshot.val().showNotification == true) && (notifySnapshot.val().last_message_date*-1 < new Date().getTime())){
        //render notification based off the notification type
        switch (notifySnapshot.val().notificationType) {
          case 'newMatch':
            //don't notify of new match while on Swipes screen.
            if(screen !== 'Swipes'){
              renderNotification('New Match with '+notifySnapshot.val().name);
            }
            break;
          case 'newChat':
            //alert('matchUseridExclude is: '+matchUseridExclude); //WHY IS matchUserId being set to null here? 
            //don't notify of new chat while on chat screen and chatting with that user. Match to exclude is only sent on chat page.
             if (matchUseridExclude == notifySnapshot.val().match_userid){ //then check if person to exclude is not who you're talking to
                //don't notify when chat is open with user
                //alert('dont notify since need to exclude this user from sending you a notificaiton');
                break;
              }else{
                //must not be on chat page, since match_user_exclude is not set
                renderNotification('New Chat from '+notifySnapshot.val().name);
                break;
              }
            
          case 'newBlindDate':
            renderNotification('New Blind Date requested.');
            break;
          case 'planned': //blind date accepted
            renderNotification('Blind Date ready!');
            break;
          case 'accepted': //blind date accepted
            renderNotification('Blind Date accepted!');
            break;
          case 'declined': //blind date declined
            renderNotification('Blind Date declined.');
            break;                   
          case 'pendingUpdate': //blind date updated
            renderNotification('Blind Date updated.');
            break;
          case 'pending': //blind date updated
            renderNotification('Blind Date updated.');
            break;                 
          case 'conversationExtended':
            renderNotification(notifySnapshot.val().name+' has extended the conversation!');
            break;
          default:
            console.log(`Sorry, no matching notification type`);
        }

        //turn off notificationShow bool so it doesn't show again. 
        database().ref('/matches/' + userId +'/'+ notifySnapshot.key).update({
          'showNotification': false
        });  
        
        //save to state listner, so that it specific listener can be turned off when leaving 
        this.setState({ listener: listener });

      }
    })

  }

  // check if permission for notification has been granted previously, then getToken. 
  async checkPermission() {
    const enabled = await messaging().requestPermission();                        
    if (enabled) {
        this.getToken();
    } else {
        this.requestPermission();
    }
  }


  // getToken if permission has been granted previously
  async getToken() {
    fcmToken = await messaging().getToken();
    firebaseRef.update({fcmToken: fcmToken});
    // try {
    //   let fcmToken = await AsyncStorage.getItem('fcmToken');
    //   if (!fcmToken) {
    //       fcmToken = await RNfirebase.messaging().getToken();
    //       if (fcmToken) {
    //           // user has a device token

    //           // update fcmToken in firebase
    //           firebaseRef.update({fcmToken: 'fcmToken'});

    //           //set fcmToken to asyncStorage for use later
    //           await AsyncStorage.setItem('fcmToken', fcmToken);
    //       }
    //   }else{
    //     // update fcmToken in firebase
    //     firebaseRef.update({fcmToken: 'fcmToken'});
    //   }     
    // } catch (error) {
    //   console.log('error is: '+error);
    //   firebaseRef.update({fcmToken: fcmToken});

    // }

  }

  // if permission has not been granted, request for permission. 
  async requestPermission() {
    try {
        await messaging().requestPermission();
        // User has authorised
        this.getToken();
    } catch (error) {
        // User has rejected permissions
        console.log('permission rejected');
    }
  }

  onPressHandle1 = () => {

    //take opposite of current value from state
    let bool = this.state.profile.notifications_message == true ? false : true;

    //record in analytics that user was doesn't want notifications 
     analytics().setUserProperty('notifications_message', this.state.profile.notifications_message.toString());

    //update firebase with new value, then update state
    firebaseRef.update({notifications_message: bool})
    .then(this.setState({profile: { ...this.state.profile, notifications_message: bool}}))

  }

  onPressHandle2 = () => {

    //take opposite of current value from state
    let bool = this.state.profile.notifications_match == true ? false : true;

    //record in analytics that user was doesn't want notifications 
    analytics().setUserProperty('notifications_match', this.state.profile.notifications_match.toString());

    //update firebase with new value, then update state
    firebaseRef.update({notifications_match: bool})
    .then(this.setState({profile: { ...this.state.profile, notifications_match: bool}}))

  }

  onPressHandle3 = () => {

    //take opposite of current value from state
    let bool = this.state.profile.notifications_daily_match == true ? false : true;

    //record in analytics that user was doesn't want notifications 
    analytics().setUserProperty('notifications_daily_match', this.state.profile.notifications_daily_match.toString());

    //update firebase with new value, then update state
    firebaseRef.update({notifications_daily_match: bool})
    .then(this.setState({profile: { ...this.state.profile, notifications_daily_match: bool}}))

  }


  //function to get update users current location. 
  getLocation = () => {
    
    //save ref to current user in db. 
    firebaseRefCurrentUser = database().ref('/users/' + userId);

    let date = new Date();
    let offsetInMin = date.getTimezoneOffset();
  

    //request authorization to location services
    Geolocation.requestAuthorization();

    //convert location geo data into location data
    Geolocation.watchPosition(
      position => {
        Geocoder.from(position.coords.latitude, position.coords.longitude)
        .then(json => {

                //define placeholders for city state texts. 
                let cityText = '';
                let stateText = '';
                
                //find long_name where arraddress has type of locality and administrative_area_level_1
                json.results[0].address_components.forEach((place) => {                               
                  if (place.types.includes("locality")) {
                    console.log('locality is: '+JSON.stringify(place.long_name));
                    cityText = place.short_name;
                  }
                  if (place.types.includes('sublocality_level_1')) {
                    console.log('sublocality_level_1 is: '+JSON.stringify(place.long_name));
                    cityText = place.short_name;
                  }
                  if (place.types.includes('administrative_area_level_1')) {
                    //console.log('state is: '+JSON.stringify(place.short_name));
                    console.log('place is: ');
                    stateText = place.short_name;
                    
                  }               
                })

                //contenate strings
                let city_state = cityText+', '+stateText.toUpperCase();
  
                //save hash of location.
                const hash = geofire.geohashForLocation([position.coords.latitude, position.coords.longitude]);
                //update firebase
                firebaseRefCurrentUser.update({ utc_offset_min: offsetInMin, city_state: city_state, latitude: position.coords.latitude, longitude: position.coords.longitude, geohash: hash });
      


              })

        .catch(error => console.warn(error));
      },
      error => console.log(error.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  }



  profileComplete = () => {
    
    //check that all required fields are present.
    // let first_nameValidated = this.state.profile.first_name !== '';
    // let genderValidated = this.state.profile.gender !== 'select' ;
    // let birthdayValidated = this.state.profile.birthday !== 'select';
    // let workValidated = this.state.profile.work !== '';
    // let educationValidated = this.state.profile.education !== '';
    // let aboutValidated = this.state.profile.about !== '';
    // let interestedValidated = this.state.profile.interested !== 'select';

    //if all items are true, return true, else return false. 
    // if ( educationValidated && first_nameValidated && workValidated && genderValidated && birthdayValidated && interestedValidated ){
    //   return true; 
    // }else {
    //   return false
    // } 

    return true;
  }
  
  //update forceUpdate in state, so that swipes will be forced to updated when re-rendering. Needed for data 
  forceUpdate = () => {
    this.setState({ forceUpdate: true});
    
    analytics().setUserProperty('min_age', this.state.profile.min_age.toString())
    analytics().setUserProperty('max_age', this.state.profile.max_age.toString())
    analytics().setUserProperty('max_distance', this.state.profile.max_distance.toString())

  }
  

  //function to validate settings
  validateSettings = () => {

    const { state, navigate } = this.props.navigation;
    let firebaseRef = database().ref('/users/' + userId);

    //check that all required fields are present.
    //let profileComplete = this.profileComplete();
    let profileComplete = true;


    //if one of gender,interested, birthday is false, ask to update. Else, go to swipes. 
    if (!profileComplete){
        Toast.show({
          text: "Please update your: Name, Gender, Birthday, Work, Education, About, or who you're interested in meeting.",
          buttonText: "OK",
          duration: 6000
        })
      }else{
        
        //update db to intialUser = false, if not already. This will move user to swipes on login and they will appear in matches
        firebaseRef.update({intialUser: false});

        //redirect to swipes and pass params if getMatches needs to be force updated. 
        this.props.navigation. navigate("Swipes", {forceUpdate: this.state.forceUpdate, swipeCount: this.state.profile.swipe_count});
      }
    }

  //function to sign out user
  signOutUser = async () => {
      const { state, navigate } = this.props.navigation;

      try {
          //record in analytics that user was logged out successfully 
          analytics().logEvent('userLoggedOut', {
            testParam: 'testParamValue1'
          });
          navigate("Login");
          await auth().signOut();
      } catch (e) {
          console.log(e);
      }
  }

  //functions to convert miles to/from meters to use for writing/reading from db. 
  getMiles = (i) => Math.round(parseFloat(i*0.000621371192));

  getMeters = (i) => i*1609.344;

  getAge = (dateString)  => {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  }

  //function to handle linking out to browser
  linkOut = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
      }
    });
  };

  //function to pause user in db
  pauseUser = () => this.updateData('status', userId, 'paused');

  //function to resume user in db
  resumeUser = () => this.updateData('status', userId, 'active');

  //function to guide user through the delete flow
  deleteUser = async () => {
      const { navigate } = this.props.navigation;

      var user = auth().currentUser;

      //alert user for confirmation. On ok delete user's authentication
      Alert.alert(
        'Are you sure you want to delete your account?',
        'If you delete your account, you will loose touch with everyone within Focus. If you would like to take a break, tap the pause button below',
        [
          {text: 'Delete Account', onPress: () => userDelete(), style: 'destructive'},
          {text: 'Pause', onPress: () => this.pauseUser()},
          {text: 'Cancel', onPress: () => console.log('Canceled')},
        ],
        { cancelable: false }
      )

      //function to delete user
      var userDelete = () => 

        //set user to deleted status in db, then delete authentication, then go to login page. 
        firebaseRef.update({status: 'deleted'}).then(function() {
          user.delete().then(function() {

          //record in analytics that user was deleted successfully 
          analytics().logEvent('userDeleted', {
            testParam: 'testParamValue1'
          });

          // User deleted.
          navigate("Login");

          }).catch(function(error) {
          // An error happened.
          console.log(error);
        });
      }) 

    }


  //function to update name or images or reviews
  updateData = (type, userid, payload) => {

    //record in analytics the event that a profile was updated successfully 
    analytics().logEvent('profileUpdated', {
      type: payload
    });

    // console.log('type: '+JSON.stringify(type) +'payload length is: '+JSON.stringify(payload.length.toString()));
    //THIS IS BREAKING SINCE WHEN PASSING TO DB OBJECT FOR CASE REVIEWS, IT CAN'T BE CONVERTED TO STRING. 
    //record in analytics the updated user property 
    analytics().setUserProperty(type, payload.length.toString());
                                                  
    //create ref to list of coversations for userid
    const userConversations = database().ref('users/'+userid+'/conversations/');

    //create ref to list of matches for userid
    const userMatches = database().ref('matches/'+userid+'/');

    //save ref for reviews current user created
    const userReviews = database().ref('codes').orderByChild("created_by").equalTo(userId);

    //create empty placeholder object for all paths to update
    let updateObj = {};
    let updateObj2 = {};

    //return list of all users' conversations
    userConversations.once('value').then(snap => {

      //if user has had a conversation, prepare to update each of their convesations with updated data. 
      if(snap.exists()){

        //turn list of objects into array on it's keys
        let conversationsKeys = Object.keys(snap.val());

        //CONVERSATIONS: add path to update inside updateObj for each conversation record. Switch case for images and name updates. 
        conversationsKeys.forEach((key, $type) => {
          switch (type) {
            case 'images':
              updateObj[`conversations/${key}/participants/${userid}/images`] = payload;
              break;
            case 'name':
              updateObj[`conversations/${key}/participants/${userid}/name`] = payload;            
              break;
          }
        });

      }
    }).then(function() {

    //return list of all users' reviews
    userReviews.once('value').then(reviewsData => {

      //if user has reviews they created, prepare to update each of their reviews with updated data. 
      if(reviewsData.exists()){

        //turn dataSnapShot into array on it's values
        let userReviewArray = Object.values(reviewsData.val());
        let userReviewArrayKeys = Object.keys(reviewsData.val());
      
        console.log('userReviewArray is: '+userReviewArray);
        //for each of the current users' created reviews, find their associated matches, which need to be updated with new review data. 
        userReviewArray.forEach((friend, i) => {

          //let friend = friendObj.val();
          let friendKey = userReviewArrayKeys[i];

          console.log('friend is: '+JSON.stringify(friend));
          console.log('friendKey is: '+JSON.stringify(friendKey));

          
          //update code object only when code has yet to be used, in case the friend will use code. 
          //if (friend.expired == false){

            //save path to update the reviews object of each friend the current user reviewed. 
            switch (true) {
              case (type == 'images'):
                updateObj[`users/${friend.created_for}/reviews/${friendKey}/photo`] = payload[0].url; 
                updateObj[`codes/${friendKey}/photo_creator`] = payload[0].url;     
                break;
              case (type == 'name'):
                updateObj[`users/${friend.created_for}/reviews/${friendKey}/name`] = payload;
                updateObj[`codes/${friendKey}/name_creator`] = payload; 
                break;
              }  
          //}


          //query firebase for each users matches. 'friend.userid'
          database().ref('matches/'+friend.created_for+'/').once('value').then(friendMatchesSnap => {
          
            //convert friend objects into array of friend id's, so that can loop over them. . 
            let friendsMatches = Object.keys(friendMatchesSnap.val());

            //for each of my friends matches, update their match object with my updated name or images
            friendsMatches.forEach((my_friends_match, i) => {

              console.log('payload is: '+JSON.stringify(payload));

              //save path to update
              switch (type) {
                case 'images':
                  updateObj2[`matches/${my_friends_match}/`+friend.created_for+`/reviews/`+friend.code_key+`/photo`] = payload[0].url;
                  break;
                case 'name':
                  updateObj2[`matches/${my_friends_match}/`+friend.created_for+`/reviews/`+friend.code_key+`/name`] = payload;
                  break;
                }             
             });

             //update all paths in multi-path update on udateObj2 array.
             database().ref().update(updateObj2, function(error) {
              if (error) {
                // The write failed...
                console.log('write failed updateObj2')
              } else {
                // Data saved successfully!
                console.log('Data saved successfully updateObj2')
              }
          })
        })
        })
      }
    })
    }).then(function() {
 
     //return list of all users' matches
      userMatches.once('value').then(snap => {

        //if user has matches start to prepare updating all matches with new data. 
        if (snap.exists()){

          //turn list of objects into array on it's keys
          let matchesKeys = Object.keys(snap.val());

          //MATCHES: add path to update inside updateObj for each appropriate match record
          matchesKeys.forEach((key, $type) => {
            switch (type) {
              case 'images':
                updateObj[`matches/${key}/${userid}/images`] = payload;
                break;
              case 'name':
                updateObj[`matches/${key}/${userid}/name`] = payload;
                break;
              case 'about':
                updateObj[`matches/${key}/${userid}/about`] = payload;
                break;
              case 'birthday':
                updateObj[`matches/${key}/${userid}/birthday`] = payload;
                break;
              case 'gender':
                updateObj[`matches/${key}/${userid}/gender`] = payload;
                break;
              case 'city_state':
                updateObj[`matches/${key}/${userid}/city_state`] = payload;
                break;
              case 'work':
                updateObj[`matches/${key}/${userid}/work`] = payload;
                break;
              case 'reviews':
                updateObj[`matches/${key}/${userid}/reviews`] = payload;
                break;
              case 'education':
                updateObj[`matches/${key}/${userid}/education`] = payload;
                break;
              case 'status':
                updateObj[`matches/${key}/${userid}/status`] = payload;
                break;
            }
          });
        }
      }).then(function() {

        //USERS: add path to update inside updateObj for userid record
        switch (type) {
          case 'images':
            updateObj[`users/${userid}/images`] = payload;
            break;
          case 'name':
            updateObj[`users/${userid}/first_name`] = payload;
            break;
          case 'about':
            updateObj[`users/${userid}/about`] = payload;
            break;
          case 'work':
            updateObj[`users/${userid}/work`] = payload;
            break;
          case 'education':
            updateObj[`users/${userid}/education`] = payload;
            break;
          case 'reviews':
            updateObj[`users/${userid}/reviews`] = payload;
            break;
          case 'status':
            updateObj[`users/${userid}/status`] = payload;
            break;
        }
      }).then(function(){
          //console.log('updateObj outside .then function: '+JSON.stringify(updateObj));
          
          //return statement with updating all the paths that need to be updated

          console.log(updateObj);
          //return firebase.database().ref().update(updateObj);

          database().ref().update(updateObj, function(error) {
            if (error) {
              // The write failed...
              console.log('write failed')
            } else {
              // Data saved successfully!
              console.log('Data saved successfully')

            }
          });
      })
    })
  }

	//when user updates gender derive their gender_pref bases on who they're interested in. trigger in callback of updating state with dropdown, since will be using state data to derive gender_pref. 
	updateGenderOrInterested = (type) => {

		//update gender variable with selected gender
		let gender = this.state.profile.gender.toLowerCase(); //can be male or female
		let interested = this.state.profile.interested.toLowerCase() //can be either male,female, everyone, select. Will remain same. 
    let gender_pref = '';

    // console.log('type is: '+type);
    // console.log('gender is: '+gender);
    // console.log('interested is: '+interested);
    // console.log('gender_pref is: '+gender_pref);

    //run below if input used is gender
    if (type == 'gender'){
      //console.log('running for case type = gender');
      if (gender == 'male') {
        //console.log('running for case gender = male');
        //switch cases for what gender_pref will be when user is male
        switch(interested) {
          case 'male':
            gender_pref = 'male_gay';
            break;
          case 'female':
            gender_pref = 'male_straight';
            break;
          case 'everyone':
            gender_pref = 'male_bi';
            break;
          case 'Select':
            gender_pref = 'select';
            break;
        }
      }else if (gender == 'female') {
        //switch cases for what gender_pref  will be when user is female
        switch(interested) {
          case 'female':
            gender_pref = 'female_gay';
            break;
          case 'male':
            gender_pref = 'female_straight';
            break;
          case 'everyone':
            gender_pref = 'female_bi';
            break;
          case 'Select':
            gender_pref = 'select';
            break;
        }
      }

      //console.log('running for case type = gender');
      if (gender == 'nonbinary') {
        //console.log('running for case gender = male');
        //switch cases for what gender_pref will be when user is male
        switch(interested) {
          case 'male':
            gender_pref = 'nonbinary_into_male';
            break;
          case 'female':
            gender_pref = 'nonbinary_into_female';
            break;
          case 'everyone':
            gender_pref = 'nonbinary_bi';
            break;
          case 'Select':
            gender_pref = 'select';
            break;
        }
      }

    }else if (type == 'interested') {

      // else run below when input used is interested in
      if (interested == 'male') {
        //switch cases for what gender_pref will be when user is interested in males
        switch(gender) {
          case 'male':
            gender_pref = 'male_gay';
            break;
          case 'female':
            gender_pref = 'female_straight';
            break;
          case 'nonbinary':
            gender_pref = 'nonbinary_into_male';
            break;
          case 'Select':
            gender_pref = '';
            break;
        }
      }else if (interested == 'female') {
        //switch cases for what gender_pref  will be when user is interested in females
        switch(gender) {
          case 'female':
            gender_pref = 'female_gay';
            break;
          case 'male':
            gender_pref = 'male_straight';
            break;
          case 'nonbinary':
            gender_pref = 'nonbinary_into_female';
            break;
          case 'Select':
            gender_pref = '';
            break;
        }
      }else if (interested == 'everyone') {
        gender_pref = gender+'_bi'; //can be male_bi or female_bi
      }else if (interested == 'select') {
        gender_pref = '';   
      }      

    }

    //update db with gender_pref
    firebaseRef.update({gender_pref: gender_pref, interested: interested, gender: gender});
  
    //update state with gender_pref
    this.setState({
      profile: { ...this.state.profile, interested: interested, gender: gender, gender_pref: gender_pref}
    });

	}
  
  renderBlurChilds() {
    return (
      <View >
          <Text style={{textAlign: 'center', color: 'white', margin: 35}}> Use this screen to manage your profile, preferences, and settings. Tap anywhere to close. </Text>
      </View>
    );
  }

  //show proile action sheet
  showProfileActionSheet = () => {
    this.profileActionSheetRef.show();
  };

  //show gender pref actions sheet
  showGenderPreferenceActionSheet = () => {
    this.genderPreferenceActionSheetRef.show();
  };



  render() {
    const { navigate } = this.props.navigation;
    let status; 

    

    if (this.state.profile.status == 'paused') {
      status = <Button transparent onPress = {() => this.resumeUser()}>
                  <Text style={{color: 'red', fontFamily:'HelveticaNeue' }}>Resume Account</Text>
                </Button> ;

    } else if (this.state.profile.status == 'active') {
      status = <Button transparent onPress = {() => this.pauseUser()}>
                  <Text style={{color: 'red', fontFamily:'HelveticaNeue'}}>Pause Account</Text>
                </Button>;
    }



    //determine width of device in order for custom margin between iphones
    let deviceWidth = Dimensions.get('window').width
    let deviceHeight = Dimensions.get('window').height


    //if device width is 414 (iphone+), then margins should be 58, else 40. 
    let genderMargin = deviceWidth == 414 ? 37 : 25;
    let birthdayMargin = deviceWidth == 414 ? 50 : 38;
    //calculate 18 year old birthday as the max date picker value. 
    var date = new Date();
    date.setFullYear(date.getFullYear() - 18, date.getMonth());

    
    
    //console.log('deviceWidth is: '+deviceWidth);
        
    return (
      <Container>
          <StatusBar 
            hidden={'hidden'} 
            barStyle={'dark-content'} 
            animated={true}
          />
        <BlurOverlay
          radius={14}
          downsampling={2}
          brightness={-200}
          onPress={() => {
              //close overylay and set showInstructions to false, so they want show again. 
              closeOverlay();
              firebaseRef.update({showInstructionsSettings: false})
          }}
          customStyles={{alignItems: 'center', justifyContent: 'center'}}
          blurStyle="dark"
          children={this.renderBlurChilds()}
        />
        
        <Modal visible={this.state.imageViewerVisible} transparent={true}>
            <ImageViewer 
              imageUrls={this.state.selectedImage}
              onSwipeDown = {() => this.setState({ imageViewerVisible: false})}
              onClick = {() => this.setState({ imageViewerVisible: false})}
            />
        </Modal>


        <ActionSheet
            ref="profileActionSheet"
            title={'Profile'}
            options={[ 'View Profile', 'Edit Profile', 'Cancel']}  
            cancelButtonIndex={2}
            destructiveButtonIndex={2}
            onPress={buttonIndex => {
              // Handle profile selection -- edit or view
              // based on the index
                Keyboard.dismiss();
                if ((buttonIndex) === 0) {
                //open view profile modall
                this.props.navigation.navigate("Profile", {profile: this.state.profile, from: 'Dashboard', flow: 'view'}); 
                }
    
                if ((buttonIndex) === 1) {
                //open edit profile modal
                this.props.navigation.navigate("Profile", {profile: this.state.profile, from: 'Dashboard', flow: 'edit'}); 
                }  
              }                    
            }
          />


          <ActionSheet
            ref="genderPreferenceActionSheet"
            title={'Gender'}
            options={GENDER_MATCH_OPTIONS}  
            cancelButtonIndex={3}
            destructiveButtonIndex={3}
            onPress={buttonIndex => {
              // Handle profile selection -- edit or view
              // based on the index
                Keyboard.dismiss();

                if ((buttonIndex) === 3) {
                      
                  console.log('GENDER_MATCH_OPTIONS[buttonIndex] is: '+GENDER_MATCH_OPTIONS[buttonIndex])
               } else {
               
                 this.setState({
                   profile: { ...this.state.profile, interested: GENDER_MATCH_OPTIONS[buttonIndex]}
                   }, () => {
                     this.updateGenderOrInterested('interested');
                     this.forceUpdate(); //make swipes force update
                   })                         
               }
              }                    
            }
          />
              
        <Content>      
          
          <View style={{  flex: 1, padding: 0 }}>
                     
           <LinearGradient style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            //backgroundColor: primaryColor, dimensions
            }}
            colors={['#13131A', '#13131A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1.5, y: 1.5 }}
            >


            <TouchableOpacity 
              style={{marginTop: 20}}   
              
              onPress={this.showProfileActionSheet}

              >
                <Thumbnail 
                  style={{
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 3,
                    },
                    shadowOpacity: 0.8,
                    shadowRadius: 4.65,
                    width: 200, 
                    height: 200, 
                    marginBottom: 10, 
                    overflow: "hidden", 
                    borderRadius: 150, 
                    borderWidth: 1, 
                    borderColor: 'white' }} 
                  source={{uri: this.state.profile.images["0"].url, cache: 'force-cache'}} 
                />
            </TouchableOpacity>


              <Text numberOfLines={1} 
                  style={{
                    textTransform: 'capitalize', 
                    fontFamily:'HelveticaNeue-Bold', 
                    fontSize: 35,
                    color: primaryColor,
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 3,
                    },
                    shadowOpacity: 0.8,
                    shadowRadius: 4.65,}} >
                  {this.state.profile.first_name} | {this.getAge(this.state.profile.birthday)}
              </Text>
              <Text numberOfLines={1} style={{fontFamily:'Helvetica', fontSize: 20, color: 'white', marginBottom: 10}} >{this.state.profile.city_state}</Text>
              {/* <Text numberOfLines={1} style={{marginBottom: 10}} >{this.state.profile.work} </Text> */}
              {/* <Text numberOfLines={1} style={{marginBottom: 10}} >{this.state.profile.education} </Text> */}

           </LinearGradient>


            <Form>
 

              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text style={styles.title}>My Preferences </Text>
              </ListItem>

              <Item 
                fixedLabel
                onPress={this.showGenderPreferenceActionSheet}
                  >
                <Label style={styles.subtitle}>Gender</Label>
                <View style={styles.subtitle}>
                  <Button full disabled transparent >
                    <Text style={styles.subtitle}>{this.state.profile.interested}</Text>
                  </Button>                  
                </View>
              </Item>
            
              <Item fixedLabel>
                <Label style={styles.subtitle}>Age Range</Label>
                <MultiSlider 
                    min={18}
                    max={70}
                    values={[this.state.profile.min_age,this.state.profile.max_age]} 
                    unselectedStyle = {{backgroundColor: primaryColor}} 
                    selectedStyle = {{backgroundColor: primaryColor}} 
                    sliderLength={160} 
                    markerStyle={{ height:30, width: 30, borderRadius: 15, backgroundColor:'white', borderColor: 'white', borderWidth: 1}} 
                    trackStyle={{ borderRadius: 7, height: 4 }} 
                    containerStyle={{ width: 200, justifyContent: 'center', alignItems: 'flex-start'}}                                                         
                    onValuesChange={(val) => 
                        this.setState(prevState => ({
                            profile: {
                                ...prevState.profile,
                                min_age: val[0], max_age: val[1]
                            }
                        }))              
                    }
                                  
                    onValuesChangeFinish={(val) =>
                      firebaseRef.update({min_age: val[0], max_age: val[1]}).then(()=>{
                        this.forceUpdate();
                      })}                                                     
                  />
                  <Text style={{fontSize: 15, fontFamily:'Helvetica-Light', right:20}}>
                    {this.state.profile.min_age} - {this.state.profile.max_age == 70 ? '70+' : this.state.profile.max_age+' '}
                  </Text>

              </Item>

              <Item fixedLabel>
                <Label style={styles.subtitle}>Max Dist</Label>
                <Slider
                  style={{ width: 168, right:40 }}
                  step={1}
                  minimumValue={10}
                  maximumValue={200}
                  minimumTrackTintColor={primaryColor}
                  maximumTrackTintColor={primaryColor}
                  value={this.getMiles(this.state.profile.max_distance)}
                  
                  onSlidingComplete={(val) => 
                    firebaseRef.update({max_distance: this.getMeters(val)},
                    this.forceUpdate() //make swipes force update
                  )}
                  
                  onValueChange={(val) => 
                   this.setState({profile: { ...this.state.profile, max_distance: this.getMeters(val)}})
                 }
                />
                <Text style={{ fontSize: 15, fontFamily:'Helvetica-Light', right:20}}>
                    {this.getMiles(this.state.profile.max_distance)} miles
                </Text>
              </Item>

              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text style={styles.title}>My notifications</Text>
              </ListItem>
              
          <ListItem>
            <Left>
              <Label style={styles.subtitle}>New Message</Label>
            </Left>
            
            <Body>              
            </Body>
            
            <Right>
              <Switch 
                value={this.state.profile.notifications_message}
                onValueChange={this.onPressHandle1}
                trackColor={{true: primaryColor,}}
               />
            </Right>
          </ListItem>

          <ListItem>
            <Left>
              <Label style={styles.subtitle}>New Match</Label>
            </Left>
            
            <Body>              
            </Body>
            
            <Right>
              <Switch 
                value={this.state.profile.notifications_match}
                onValueChange={this.onPressHandle2}
                trackColor={{true: primaryColor,}}
               />
            </Right>
          </ListItem>
          <ListItem>
            <Left>
              <Label style={styles.subtitle}>Daily Matches</Label>
            </Left>
            
            <Body>              
            </Body>
            
            <Right>
              <Switch 
                value={this.state.profile.notifications_daily_match}
                onValueChange={this.onPressHandle3}
                trackColor={{true: primaryColor,}}
               />
            </Right>
          </ListItem>

       
              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text style={styles.title}>Other...</Text>
              </ListItem>

               <Item fixedLabel onPress = {() => navigate("Intersitial", { flow: 'refer'})}>

                <Label style={styles.subtitle}>Refer Friend</Label>
                <Input disabled />
              </Item> 

              <Item fixedLabel onPress = {() => this.linkOut('https://focusdating.co')} >
                <Label style={styles.subtitle}>Help/Support</Label>
                <Input disabled />
              </Item>


              <Item fixedLabel onPress = {() => 
                 Linking.openURL('https://apps.apple.com/us/app/focus-blind-dating/1492965606') //use native review module here.
                }>
                <Label style={styles.subtitle}>Rate Us</Label>
                <Input disabled />
              </Item>
              <Item fixedLabel onPress = {() => this.linkOut('https://focusdating.co/privacy.html')}  >
                <Label style={styles.subtitle}>Privacy Policy</Label>
                <Input disabled />
              </Item>
              <Item fixedLabel onPress = {() => this.linkOut('https://focusdating.co/terms.html')} >
                <Label style={styles.subtitle}>Terms</Label>
                <Input disabled />
              </Item>

              <View style={{flexDirection: "row", justifyContent: "center"}}>
                <Button transparent onPress = {() => this.signOutUser()}  >
                  <Text style = {{color: 'red', fontFamily:'HelveticaNeue',}}>Log out</Text>
                </Button>
              </View>
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                <Button transparent onPress = {() => this.deleteUser()}>
                  <Text style = {{color: 'red', fontFamily:'HelveticaNeue',}}>Delete Account</Text>
                </Button>
              </View>
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                {status}
              </View>
            </Form>
          </View>
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20, 
    fontFamily:'Helvetica-Light', 
    lineHeight: 25, 
    color: 'black',
    textTransform: 'capitalize'
  },
  subtitle: {
    fontSize: 15, 
    fontFamily:'Helvetica-Light', 
    lineHeight: 25, 
    color: 'black',
    textTransform: 'capitalize'
  }
});



export default Dashboard;



