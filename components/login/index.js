import React, { Component, useEffect } from "react";
import PropTypes from 'prop-types';
import { Keyboard, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, LayoutAnimation, Image, Alert, Dimensions, Animated, StyleSheet, TextInput, StatusBar, Linking } from "react-native";
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import Geocoder from 'react-native-geocoding';
import LinearGradient from 'react-native-linear-gradient';
import  SvgCssUri from 'react-native-svg-uri';
import { SvgUri } from 'react-native-svg';
import 'react-native-url-polyfill/auto';
import IAP, { purchaseUpdatedListener } from "react-native-iap";
import dynamicLinks from '@react-native-firebase/dynamic-links';
import FontAwesome, { Icons } from 'react-native-fontawesome';
const geofire = require('geofire-common');

import {
  ActionSheet,
  Item,
  Button,
  View,
  Text
} from "native-base";

//import styles from "./styles";
import { AccessToken, LoginButton, LoginManager, GraphRequest, GraphRequestManager } from 'react-native-fbsdk';

const logo = require("../../images/focus-logo-old.svg");
const logoTextSvg = require("../../images/logoText.svg");
const logoText2 = require("../../images/logoText3.svg");


const logoText = require("../../images/logoText.png");

const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";

var GENDER_OPTIONS = [
  'Male',
  'Female',
  'Cancel',
];

var DESTRUCTIVE_INDEX = 2;
var CANCEL_INDEX = 2;

class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {
      nextScreen: 'ManageAboutMe',
      searchParams: '',
      name: '',
      email: '',
      password: '',
      //gender: 'Gender Identity',
      createAccount: false,
      showModal: false,
      login: false,
      errorMessage: false,
      rotated: false, 
      splashScreenVisible: false,
      choice: true,
      slideUp: false,
      fadeInAnimation: new Animated.Value(0),
      rotation: new Animated.Value(0),
    };
  }

  //hide nav bar on the login screen
  static navigationOptions = {
    header: null,
  };

  componentDidMount() {

    //run analytics
    RNfirebase.analytics().setAnalyticsCollectionEnabled(true);
    RNfirebase.analytics().setCurrentScreen('Login', 'Login');

  
    //Hide Splash screen on app load.
    setTimeout(() => {
      this.spinLogo();
    }, 3000)

    LoginManager.logOut();

    const { navigate } = this.props.navigation;

    //check if user is logged in when component mounts. If logged in navigate to Swipes
    //set flag to redirect only once
    var authFlag = true;
    
    const config = {
      apiKey: "AIzaSyA5RHfMVtj36x0f9KAMw_iLFYKfCxFjuuo",
      authDomain: "blurred-195721.firebaseapp.com",
      databaseURL: "https://blurred-195721.firebaseio.com",
      projectId: "blurred-195721",
      storageBucket: "blurred-195721.appspot.com",
      messagingSenderId: "479759716253",
      appId: "1:479759716253:web:01edde286058b5deff2974"
    };

    //only initalize if not already. 
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    
    //check if user is authenticated in, if so, redirect to the appropriate flow. 
    firebase.auth().onAuthStateChanged( user => {

      if (user) {
        // User is signed in.
        console.log('user logged in');
        this.redirectUser(user.uid)
        //if user 
      }else{
        console.log('user not logged in');
      }
    });

    
  }

//function to get update users current location. 
getLocation = () => {

  //save ref to current user in db. 
  firebaseRefCurrentUser = firebase.database().ref('/users/' + userId);

  let date = new Date();
  let offsetInMin = date.getTimezoneOffset();
  console.log('offsetInHours is: '+offsetInMin);

  //convert location geo data into location data
  Geolocation.watchPosition(
    position => {
      Geocoder.from(position.coords.latitude, position.coords.longitude)
      .then(json => {
  
          //define placeholders for city state texts. 
          let cityText = '';
          let stateText = '';
          
          console.log('json is: x '+JSON.stringify(json));

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
          let city_state = cityText+', '+stateText;

          
          const hash = geofire.geohashForLocation([position.coords.latitude, position.coords.longitude]);
          //update firebase
          firebaseRefCurrentUser.update({ utc_offset_min: offsetInMin, city_state: city_state, latitude: position.coords.latitude, longitude: position.coords.longitude, geohash: hash });

        }).catch(error => console.warn(error));
    },
    error => console.log(error.message),
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
  );
}


//run this to check subscription status
haveSubscription = async (userid) => {
  //initialize connetion to store for in app purchases
  IAP.initConnection().catch(() =>{
    console.log("error connecting to store...")
  }).then(() => {
    console.log("connected to store...")
    //after intialized, also get purchase history and validate the receipt
    IAP.getPurchaseHistory().catch(() => {
      console.log('problem getPurchaseHistory')
    }).then((res) => {
      const receipt = res[res.length-1].transactionReceipt; 
      //if receipt returns, validate the reciept
      if (receipt){
        console.log('validated receipt');
        //return this._validateReceipt(receipt);
        this._validateReceipt(receipt, userid);
      }else{
        console.log('no receipt to validate');
        //if no reciept history, update db with subscription as false
        firebase.database().ref('/users/' + userid).update({subscribed: false})       
      }
    })
  })
}


  //validate receipt and update database with subscription status
  _validateReceipt = async (receipt, userid) => {
    const receiptBody = {
      "receipt-data": receipt,
      "password": 'e03a9014589647b0ba532ec17d7ee42a',
    }
    const result = await IAP.validateReceiptIos(receiptBody, true).catch(() =>{
      console.log('this is an error validating the receipt')
    }).then((reciept) => {
      try{
        //console.log('receipt is: '+receipt)
        const renewalHistory = reciept.latest_receipt_info;
        console.log('renewalHistory is: '+JSON.stringify(renewalHistory));
        const expiration = renewalHistory[0].expires_date_ms;
        console.log('expiration is: '+expiration);
        let expired = Date.now() > expiration;
        //delete unless doing someting when status
        if (!expired){
          console.log('Purchase history validated');
          //update firebase with subcription status, for logged in user
         firebase.database().ref('/users/' + userid).update({subscribed: true})
        }else{
          console.log('Purchase expired');
          //update firebase with subcription status, for logged in user
          firebase.database().ref('/users/' + userid).update({subscribed: false})
        }
      } catch (error) {
        console.log('error is: '+error)
      }
    })
  }



validateAccount = () => {

  let email = this.state.email;
  let password = this.state.password;
  //let gender = this.state.gender; 
  let errorMessage = '';

  if (email === '') {
    errorMessage = "Email is required.";
  }

  if (!email.includes("@") && email !== "") {
    errorMessage = "@ not included with email.";
  }

  if (!email.includes(".") && email !== "") {
    errorMessage = "period not included with email.";
  }
  
  if (password === '') {
    errorMessage = "Password is required.";
  }

  if (!email.includes("@") && email !== "") {
    errorMessage = "@ not included with email.";
  }
    
  // if (gender === 'Gender identity') {
  //   errorMessage = "Gender identity is required.";
  // }

  //return true if there's no more errors. Else, alert the error message.
  if (errorMessage == '') {
    this.handleSignUp();
  }else{
    this.alertError(errorMessage);
  }
}

alertError = (errorMessage) => {
  Alert.alert(
    'Problem Found',
    errorMessage,
    [
      {text: 'OK', onPress: () => console.log('OK Pressed')},
    ],
    {cancelable: false},
  );
}

forgotPassword = (email) => {

  Alert.prompt(
    'Enter email',
    'We will you an email to reset your password',
    [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {
        text: 'Submit',
        onPress: (email) => firebase.auth().sendPasswordResetEmail(email)
        .then((email) => {
          Alert.alert(
            'Email Sent',
            'Please check your email',
            [
              {text: 'OK', onPress: () => console.log('OK Pressed')},
            ],
            {cancelable: false},
          );
        })
        .catch(error => alert(error)),
      },
    ],
    'plain-text',
  );

}

redirectUser = async (userId) => {


  //setUserIid to analytics
  RNfirebase.analytics().setUserId(userId);

  //get subscriptions for updating firebase with
  //let subscribed = await this.haveSubscription(userId);

  //update users subscription if needed. 
  this.haveSubscription(userId);

  //let subscribed = true;

  //console.log('subscribed is: '+JSON.stringify(subscribed));

  firebase.database().ref('/users/' + userId).once('value')
  .then((snapshot) => {

      //update last login and timezone offset of user
      firebase.database().ref('/users/' + snapshot.val().userid).update({last_login: Date.now(), utc_offset_min: new Date().getTimezoneOffset()})

      //save user date in variables check that all required fields are present.
      let first_nameValidated = snapshot.val().first_name !== '';
      //let genderValidated = genderValidated = snapshot.val().gender !== 'select';
      let interestedValidated = snapshot.val().gender_pref !== 'select';
      let birthdayValidated = snapshot.val().birthday !== '';
      let code_accepted = snapshot.val().code_accepted;
      let workValidated = snapshot.val().work !== '';
      let educationValidated = snapshot.val().education !== '';
      let aboutValidated = snapshot.val().about !== '';
      //let gender = (snapshot.val().gender == 'female') ? 'female' : 'male' ;
      let intialUser = snapshot.val().intialUser;
      let status = snapshot.val().status;

      //save deeplink params from state or save as null if no deeplink.
      let type = this.state.searchParams ? this.state.searchParams.get('type') : null ;
      let code = this.state.searchParams ? this.state.searchParams.get('code') : null ;
      let user_id_creator = this.state.searchParams ? this.state.searchParams.get('user_id_creator') : null ;
      let gender_creator = this.state.searchParams ? this.state.searchParams.get('gender') : null ;
      let image_creator = this.state.searchParams ? this.state.searchParams.get('image') : null ;
      let name_creator = this.state.searchParams ? this.state.searchParams.get('name_creator') : null ;
      let name_created = this.state.searchParams ? this.state.searchParams.get('name_created') : null ;
      let reason = this.state.searchParams ? this.state.searchParams.get('reason') : null ;

      //compute if profile is complete
      let profileComplete = ( educationValidated && first_nameValidated && workValidated && birthdayValidated && interestedValidated);
    

      if(status == 'waitlist'|| status == 'onboard'){
          //show intro slides, with deeplink params if present
          this.setState({ showModal: false, choice: true});
          //alert('status is: '+status);
          this.props.navigation.navigate("Intro", {user_id_creator: user_id_creator, user_id: userId, code: code, image_creator: image_creator, reason: reason, name_creator: name_creator, name_created: name_created, type: type  });
      }
      else if(status == 'active'|| 'paused'){
        
        this.setState({ showModal: false, choice: true});
        //alert('status is: '+status);
        // if settings are valid - send to swipes. if not send to settings. 
        (profileComplete) ? this.props.navigation.navigate('Swipes') : this.props.navigation.navigate('Intro');

      }

      //update analytics
      RNfirebase.analytics().setUserProperty('status', this.state.profile.status);           
      RNfirebase.analytics().setUserProperty('city_state', this.state.profile.city_state);           
      RNfirebase.analytics().setUserProperty('intialUser', this.state.profile.intialUser);           
      RNfirebase.analytics().setUserProperty('latitude', this.state.profile.latitude); 
      RNfirebase.analytics().setUserProperty('longitude', this.state.profile.longitude); 
      RNfirebase.analytics().setUserProperty('max_age', this.state.profile.max_age); 
      RNfirebase.analytics().setUserProperty('min_age', this.state.profile.min_age); 


      

    //   //case 1 -- men who havent' entered valid code yet - show intro slides. 
    //   if((gender == 'male') && (code_accepted == false)){

    //     //show intro slides for men
    //     this.props.navigation.navigate("Intro", {user_id_creator: user_id_creator, user_id: userId, gender: gender, code: code, image_creator: image_creator, reason: reason, name_creator: name_creator, name_created: name_created, type: type  });
    //   }

    //   //men who have used a valid code previously -- either dashboard, registration, or swipes. 
    //   else if ((gender == 'male') && (code_accepted == true) && (type == 'refer')){
                
    //     // if it's not a new user, but they're using a refer deeplink, send to Dashboard, else send to Swipes 
    //     (profileComplete) ? this.props.navigation.navigate('Dashboard') : this.props.navigation.navigate('Registration');
    //   }

    //   //men who have used a valid code previously and not using a deeplink -- either dashboard or swipes. 
    //   else if ((gender == 'male') && (code_accepted == true  && (type !== 'refer') )){
          
    //     // if settings are valid - send to swipes. if not send to settings. 
    //     (profileComplete) ? this.props.navigation.navigate('Swipes') : this.props.navigation.navigate('Registration');
    //   }
      
    // //case 2 -females who are first time users - show intro slides. 
    //  if((gender == 'female') && (intialUser == true)){

    //   //show intro slides for females, with deeplink params if present
    //   this.props.navigation.navigate("Intro", {user_id_creator: user_id_creator, user_id: userId, gender: gender, code: code, image_creator: image_creator, reason: reason, name_creator: name_creator, name_created: name_created, type: type  });

    // }
    
    // //females who are not first time users - show either swipes or settings. 
    // else if ((gender == 'female') && (intialUser == false)){
      
    //   //if refer deeplink exists, send to Dashboard, else send to swipes
    //   if(type == 'refer'){
    //     (profileComplete) ? this.props.navigation.navigate('Dashboard') : this.props.navigation.navigate('Registration')
      
    //   }else{
    //     // if settings are valid - send to swipes. if not send to settings. 
    //     (profileComplete) ? this.props.navigation.navigate('Swipes') : this.props.navigation.navigate('Registration')
      
    //   }
    // }
  })
}

handleLogin = () => {
  const { email, password } = this.state
  var that = this;

  firebase.auth()
      //signin with email to firebase
      .signInWithEmailAndPassword(email, password)
      
      //query exisitng user in order to check where to redirect them to - intro, swipes, or setings. 
      .then((data) => this.redirectUser(data.user.uid))

      //alert any errors from firebase
      .catch(error => alert(error))

}

handleSignUp = () => {
  const { navigate } = this.props.navigation;
  const { email, password } = this.state
  //gender = this.state.gender.toLocaleLowerCase();
  var that = this;

  let offsetInMin = new Date().getTimezoneOffset();

  firebase.auth()
      .createUserWithEmailAndPassword(email, password)
      //.then((data) => console.log('user id is: '+data.user.uid))
      .then((data) => firebase.database().ref('/users/' + data.user.uid).set({
        userid: data.user.uid,
        first_name: '',
        fb_id: '',
        last_name: '',
        email: email,
        images: [{type: 'image', file: 0, url: "https://focusdating.co/images/user.jpg", cache: 'force-cache'}],
        last_login: Date.now(),
        utc_offset_min: offsetInMin,
        intialUser: true,
        showInstructionsSettings: false,
        showInstructionsSwipes: false,
        swipe_count: 0,
        score: 1000,
        //last_swipe_sesh_date: Date.now(),
        locationDeclined: 'null',
        fcmToken: 'null',
        latitude: 40.71797067746141, //default to NYC
        longitude: -73.98527588801655, //default to NYC
        city_state: 'NYC', //default to NYC
        gender: 'Select',
        genderOnProfile: true,
        //gender_pref: (gender == 'male') ? 'male_straight' : 'female_straight', //default gender_pref to straight to have less required field to validate.
        //interested: (gender == 'male') ? 'female' : 'male', //default interested in to straight to have less required field to validate.         
        //code_accepted: (gender == 'female') ? true : false, //if new user is female set code accepted to true, check this before letting user (men) in next time. 
        gender_pref: '',
        interested: '',
        birthday: '',
        about: '',
        work: '',
        education: '',
        status: 'onboard',
        min_age: 18,
        max_age: 60,
        max_distance: 160934.4,
        error: null,
        last_conversation_count: 0,
        notifications_message: true,
        notifications_match: true,
        notifications_daily_match: true,
        error: null,
        }, function(error) {
          if (error) {
            console.log("Data could not be saved." + error);
          } else {
            console.log("Data saved successfully.");
            //redirect to Intro flow. Send gender and user id via navigation prop.                           
            //that.props.navigation.navigate("Intro", {user_id: data.user.uid, gender: gender});
            that.props.navigation.navigate("Intro", {user_id: data.user.uid});

          }
        })
      ) 
      .catch(error => that.alertError(error.message))
}

//handle when to spin logo
spinLogo = () => {

  //set up layout animation for next state transition
  // LayoutAnimation.configureNext(LayoutAnimation.create(2000, 'easeInEaseOut', 'opacity'));
  
  LayoutAnimation.configureNext(LayoutAnimation.create(2000, 'easeInEaseOut', 'opacity'));

  this.setState({ slideUp: true})
  
  //check state if logo has been rotated. If true, rotate back and set state flag to false. 
  let rotateTo = (this.state.rotated == false) ? 1 : 0;

  //rotate either left or right
  Animated.timing(this.state.rotation, {
    useNativeDriver: true,
    duration: 2000,
    toValue: rotateTo,
  }).start();

  //update state with new rotated value 
  this.state.rotated == true ? this.setState({ rotated: false}) : this.setState({ rotated: true});

  //fade in form
    Animated.timing(this.state.fadeInAnimation, {
      useNativeDriver: true,
      duration: 1000,
      toValue: 1,
  }).start();

}

handleDynamicLink = link => {

  // // get query string of deeplink 
  // let paramsString = decodeURI(link.url).substring((link.url).indexOf('?') + 1);
  // // convert to URLSearchParams obj
  // let searchParams = new URLSearchParams(paramsString);
  // //save searchParams to state, so that redirectUser() can reference, when sending params to next screens
  // this.setState({ searchParams: searchParams });

  // console.log('deep link is:  '+link.url);
  //if link is type navigation:
  //save nextScreen into state as Chat, Messages, Swipes, ...
  //Redirect if user is logged in, else login user then redirect afterwards

  //if link is type refer:
  //save nextScreen into state as Intro
  //pass link params into navigation, for registration to access it. 
  // (if login UX is updated with Review info, save that info into state to render in UX)

  // if (searchParams.get('type') == 'refer') {
    
};
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

onLoginOrRegister = () => {
  
  LoginManager.logInWithPermissions(['public_profile', 'email', 'user_birthday', 'user_gender'])
    .then((result) => {
      if (result.isCancelled) {
        console.log("Login cancelled");
      }
        console.log( "Login success with permissions: " + result.grantedPermissions.toString());
      
        // Return the access token
      return AccessToken.getCurrentAccessToken();
      
    }) 
    .then((data) => {
      // Create a new Firebase credential with the token
      const credential = firebase.auth.FacebookAuthProvider.credential(data.accessToken);
      //console.log('credential is: '+credential);
      // Login with the credential
      return firebase.auth().signInWithCredential(credential);

    })
    .then((data) => {
      let userId = data.user.uid;
      console.log('user id is: '+userId);

      firebase.database().ref('/users/' + userId).once('value').then((snapshot) => {
        //check if user exists
        let existing_user = snapshot.exists();

        if (existing_user){
          //user already exists
          console.log('user already exists!');
          
          //redirect user to appropriate flow. 
          this.redirectUser(userId);
          
        }else{
        
        var that = this;

        console.log('user doesnt exist start making profile form fb data');
          
        //user does not exist yet
         AccessToken.getCurrentAccessToken().then(
            (data) => {
              
              let accessToken = data.accessToken;

              console.log('accessToken is: '+accessToken);
              
              const responseInfoCallback = (error, result) => {
                if (error) {
                  console.log(error)
                  alert('Error fetching data: ' + error.toString());
                } else {
                  fb_result = result;
                  let gender = (fb_result.gender == null) ? 'select' : fb_result.gender;
                  let birthday = (fb_result.birthday == null) ? '' : fb_result.birthday; 
                  largePhotoURL = "https://graph.facebook.com/"+fb_result.id+"/picture?width=600&height=800";
                  let location = (fb_result.location == null) ? 'select' : fb_result.location; ////gets the location object you get from your response now
                  let latitude = 40.759211;
                  let longitude = -73.984638;
                  let city_state = 'New York City';
                  let database = firebase.database();
                  // FB.api('/' + location.id, {
                  //     fields: 'location'
                  // }, function(locationResponse) {
                  //     console.log('locationResponse is: '+JSON.stringify(locationResponse)); //will print your desired location object               
                  //     let latitude =  locationResponse.latitude;             
                  //     let longitude = locationResponse.latitude;             
                  // });

                  console.log('userId is: '+userId);
                  
                  database.ref('users/' + userId).set({
                    userid: userId,
                    first_name: fb_result.first_name,
                    fb_id: fb_result.id,
                    last_name: fb_result.last_name,
                    email: fb_result.email,
                    images: [{file: '0', url: largePhotoURL, cache: 'force-cache'}],
                    last_login: Date.now(),
                    intialUser: true,
                    showInstructionsSettings: false,
                    showInstructionsSwipes: false,
                    swipe_count: 0,
                    score: 1000,
                    //last_swipe_sesh_date: Date.now(),
                    latitude: latitude,
                    fcmToken: 'null',
                    longitude: longitude,
                    city_state: city_state,
                    gender: gender,
                    genderOnProfile: true,
                    gender_pref: (gender == 'male') ? 'male_straight' : (gender == 'female') ? 'female_straight' : 'select', //default to straight
                    interested: (gender == 'male') ? 'female' : (gender == 'female') ? 'male' : 'select', //default to straight
                    birthday: birthday,
                    about: '',
                    work: '',
                    education: '',
                    status: 'onboard',
                    code_accepted: (fb_result.gender == 'female') ? true : false, //if new user is female set code accepted to true, check this before letting user (men) in next time. 
                    min_age: 18,
                    max_age: 60,
                    max_distance: 160934.4,
                    error: null,
                    last_conversation_count: 0,
                    notifications_message: true,
                    notifications_match: true,
                    notifications_daily_match: true,
                    error: null,
                    //religion: fb_result.religion,
                    //political: fb_result.political,
                    //hometown: fb_resutl.hometown
                  }, function(error) {
                    if (error) {
                      console.log("Data could not be saved." + error);
                    } else {
                      console.log("Data saved successfully.");
                      //redirect to Intro flow. Send gender and user id via navigation prop.                           
                      that.props.navigation.navigate("Intro", {user_id: userId, gender: gender});
                    }
                  });
                }
              }

              const infoRequest = new GraphRequest(
                '/me',
                {
                  accessToken: accessToken,
                  parameters: {
                    fields: {
                      string: 'email,gender,name,first_name,last_name,birthday'
                    }
                  }
                },
                responseInfoCallback
              );

              // Start the graph request.
              new GraphRequestManager().addRequest(infoRequest).start()

            }
            
          )
        }
      })
    })
}

  render() {


    const { navigate } = this.props.navigation;
    
    const rotation = this.state.rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });

    const fadeInAnimation = this.state.fadeInAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1]
    });

    let deviceWidth = Dimensions.get('window').width

  
    return (

        <LinearGradient style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: primaryColor, 
                }}
                colors={[primaryColor, primaryColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.1, y: 2.5 }}
                >


        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.showModal}>
          


          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} >
           
            <View style={{ flex: 1, flexDirection: 'column', backgroundColor: '#13131A' }}>
    
              <View style={{ flex: 7, flexDirection: 'column', alignContent: 'flex-end', alignItems: 'center', marginTop: 100 }}>
                
                  {/* Show login with facebook, with email, create account, forgot password elements */}
                  {(this.state.login) &&
                  <View style={{
                    flex: 1, 
                    width: 300,
                    flexDirection: 'column',
                    marginBottom: 45,
                    //opacity: fadeInAnimation, 
                    justifyContent: 'center', 
                    alignItems: 'center'
                    }}>

                      <TextInput
                          style={styles.inputBox}
                          value={this.state.email}
                          onChangeText={email => this.setState({ email })}
                          placeholder='Email'
                          textContentType='username'
                          autoCapitalize='none'
                          placeholderTextColor='white'
                          color='white'
                          keyboardType='email-address'
                      />
                      <TextInput
                          style={styles.inputBox}
                          value={this.state.password}
                          onChangeText={password => this.setState({ password })}
                          placeholder='Password'
                          secureTextEntry={true}
                          textContentType= {this.state.createAccount ? 'newPassword' : 'password' }
                          placeholderTextColor='white'
                          color='white'
                      />

                      <Button 
                        onPress = {() => this.handleLogin()} 
                        rounded 
                        bordered 
                        style={{
                          justifyContent: 'center', 
                          marginTop: 20,
                          marginBottom: 10,
                          width: 250, 
                          backgroundColor: 'white',
                          borderColor: 'white',
                          shadowColor: "#000",
                          shadowOffset: {
                            width: 0,
                            height: 3,
                          },
                          shadowOpacity: 0.5,
                          shadowRadius: 4.65,
                          elevation: 7}}>
                            <Text style={{fontFamily:'Helvetica', color: primaryColor}}>Login</Text>
                        </Button>
                        
                        <Button transparent onPress = {() => this.forgotPassword()} style={{ justifyContent: 'center', }}>
                            <Text style={{fontFamily:'Helvetica', color: primaryColor}}>Forgot Password</Text>
                        </Button>

                        <Button transparent 
                          onPress = {() => this.setState({choice: true, showModal: false, email: '', password: ''})} 
                          style={{ justifyContent: 'center', }}>
                            <Text style={{fontFamily:'Helvetica', color: primaryColor}}>Go Back</Text>
                        </Button>
                        
                      
                      {/* Login with Facebook button */}
                      {/* <Button 
                        rounded 
                        onPress = {() => this.onLoginOrRegister()} 
                        style={{
                          justifyContent: 'center', 
                          margin: 10, 
                          backgroundColor: '#4267B2',
                          shadowColor: "#000",
                          shadowOffset: {
                            width: 0,
                            height: 3,
                          },
                          shadowOpacity: 0.29,
                          shadowRadius: 4.65,
                          elevation: 7}}>
                            <Text>Login with Facebook</Text>
                        </Button>    */}
                  
                  </View>
                }

                {/* if create account is clicked, show create account button */}
                {(this.state.createAccount) &&
                <View style={{
                  //backgroundColor: 'brown', 
                  flex: 2, 
                  width: 300, 
                  marginBottom: 45,
                  justifyContent: 'center',
                  alignItems: 'center' }}>

                    <TextInput
                        style={styles.inputBox}
                        value={this.state.email}
                        onChangeText={email => this.setState({ email })}
                        placeholder='Email'
                        textContentType='username'
                        autoCapitalize='none'
                        placeholderTextColor='white'
                        color='white'
                        keyboardType='email-address'
                    />
                    <TextInput
                        style={styles.inputBox}
                        value={this.state.password}
                        onChangeText={password => this.setState({ password })}
                        placeholder='Password'
                        secureTextEntry={true}
                        textContentType= {this.state.createAccount ? 'newPassword' : 'password' }
                        placeholderTextColor='white'
                        color='white'
                    /> 
                      <View style={{flexDirection: 'row', marginTop: 20, }}>
                        <Text         
                          style={{
                            fontSize: 10,
                            color: 'white',
                            fontFamily:'Helvetica-Light',
                            color: 'white',

                          }}>By creating an account you’re agreeing to        
                        </Text>
                        <Text         
                            onPress = {() => this.linkOut('https://focusdating.co/terms.html')}
                            style={{
                              color: 'white',
                              textDecorationLine: 'underline',
                              fontFamily:'Helvetica-Light',
                              fontSize: 10,
                              marginLeft: 3,
                              }}>our terms.
                        </Text>
                      </View> 
                    <Button 
                        onPress = {() => this.validateAccount()} 
                        bordered 
                        rounded 
                        style={{
                          justifyContent: 'center', 
                          marginTop: 20,
                          marginBottom: 10,
                          width: 250, 
                          backgroundColor: 'white',
                          borderColor: 'white',
                          shadowColor: "#000",
                          shadowOffset: {
                            width: 0,
                            height: 3,
                          },
                          shadowOpacity: 0.6,
                          shadowRadius: 4.65,
                          elevation: 7}}>
                          <Text style={{fontFamily:'Helvetica', color: primaryColor}}>Create Account</Text>
                      </Button>  

                      <Button transparent 
                          onPress = {() => this.setState({choice: true, showModal: false, email: '', password: ''})} 
                          style={{ justifyContent: 'center', }}>
                            <Text style={{fontFamily:'Helvetica', color: primaryColor}}>Go Back</Text>
                      </Button>
                                  
                    </View>
              }
                
              </View>
              
              <View style={{ flex: 4, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: primaryColor }}>



                <Animated.View  style={{
                        flex: 1, 
                        flexDirection: 'column',
                        justifyContent: 'center',
                        //alignItems: 'center',
                        //backgroundColor: 'blue',
                        //height: 200,
                        //margin: 0,
                        //padding:50, 
                        transform: [{rotate: rotation}]
                      }}>
                  
                  <Button transparent onPress = {() => this.spinLogo()} >
                    <SvgCssUri 
                      width="120" 
                      height="120"   
                      fill="white"
                      fillOpacity="0"
                      strokeWidth="0"
                      source={logo}
                      style={{          
                        shadowColor: "#000",
                        shadowOffset: {
                        width: 0,
                        height: 1,
                        },
                      shadowOpacity: 0.5,
                      shadowRadius: 8.65,}}
                    />
                </Button>

                </Animated.View>

                {/* <View style={{flex:1, justifyContent: 'flex-start'}}>
                    <SvgCssUri 
                          width="300" 
                          height="150"   
                          fill="white"
                          fillOpacity="0"
                          strokeWidth="0"
                          source={logoText2}
                          style={{          
                            shadowColor: "#000",
                            shadowOffset: {
                            width: 0,
                              height: 3,
                            },
                          shadowOpacity: 0.8,
                          shadowRadius: 8.65,}}
                      />
                </View> */}

                
                {/* <View style={{flex:1, backgroundColor: 'green'}}>
                  <Button 
                    transparent
                    onPress = {() => this.setState({choice: true, showModal: false, email: '', password: ''})} 
                    style={{justifyContent: 'center', }}>
                      <Text style={{fontFamily:'Helvetica', color: primaryColor}}>Go Back</Text>
                  </Button> 
                </View> */}

                
    
              </View>
            </View>
        
          </TouchableWithoutFeedback>
        </Modal>


                  <View style={{
                      flex: 1, 
                      flexDirection: 'column', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                    }}>
                    <StatusBar 
                      hidden={'true'} 
                      barStyle={'dark-content'} 
                      animated={true}
                    />


                    {(this.state.slideUp) && 
                      <View style={{
                          flex: 1, 
                          //flexDirection: 'column', 
                          //justifyContent: 'center', 
                          //alignItems: 'center', 
                          // backgroundColor: 'black',
                          //width: 400,
                          //height: 10,
                          //marginBottom: 30
                        }}> 
                        
                      </View>
                      }
                    
                    
                    <Animated.View  style={{
                      flex: 1, 
                      flexDirection: 'column',
                      justifyContent: 'center',
                      //alignItems: 'center',
                      //backgroundColor: 'blue',
                      //height: 200,
                      //margin: 0,
                      //padding:50, 
                      transform: [{rotate: rotation}]
                    }}>


                    
                      <Button transparent onPress = {() => this.spinLogo()} >
                        <SvgCssUri 
                          width="120" 
                          height="120"   
                          fill="white"
                          fillOpacity="0"
                          strokeWidth="0"
                          source={logo}
                          style={{          
                            shadowColor: "#000",
                            shadowOffset: {
                            width: 0,
                            height: 1,
                            },
                          shadowOpacity: 0.5,
                          shadowRadius: 8.65,}}
                        />
                      </Button>

                    </Animated.View>
                      

                </View>

                  
              {(this.state.slideUp) &&
              
              <View style={{flex: 3, flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>

                    <Animated.View style={{ 
                      //backgroundColor: 'lightgrey', 
                      flex: 2,  
                      flexDirection: "column",
                      justifyContent: 'flex-start', 
                      marginTop: 20,
                      marginBottom: 80,
                      
                    }}>

                      <SvgCssUri 
                          width="300" 
                          height="150"   
                          fill="white"
                          fillOpacity="0"
                          strokeWidth="0"
                          source={logoText2}
                          style={{          
                            shadowColor: "#000",
                            shadowOffset: {
                            width: 0,
                              height: 3,
                            },
                          shadowOpacity: 0.8,
                          shadowRadius: 8.65,}}
                      />



                  </Animated.View>




                  <View style={{
                    flex: 7,
                    //backgroundColor: 'yellow',
                    flexDirection: 'column',
                    justifyContent: 'center',


                  }}>
                  
                  
                  <Animated.View style={{ 
                    flex: 2, 
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    //backgroundColor: 'brown',
                    opacity: fadeInAnimation, 
                    //width: 200
                    }}>
                      



                    <View 
                      style={{
                        backgroundColor: '#13131A', 
                        //paddingBottom: 5, 
                        width: deviceWidth, 
                        flex: 1, 
                        flexDirection: "column" , 
                        justifyContent: 'center', 
                        alignItems: 'center' 
                      }}>






                        {/* Show login with facebook, with email, create account, forgot password elements */}
                        {(this.state.choice) &&
                        <Animated.View style={{
                          flex: 1, 
                          width: 300,
                          flexDirection: 'column',
                          marginBottom: 45,
                          opacity: fadeInAnimation, 
                          justifyContent: 'center', 
                          }}>                      
                          
                            <Button 
                              onPress = {() => this.setState({createAccount: true, login: false, choice: false, showModal: true, email: '', password: ''})} 
                              bordered 
                              rounded 
                              style={{
                                justifyContent: 'center', 
                                margin: 20,
                                width: 250, 
                                backgroundColor: 'white',
                                borderColor: 'white',
                                shadowColor: "#000",
                                shadowOffset: {
                                  width: 0,
                                  height: 3,
                                },
                                shadowOpacity: 0.6,
                                shadowRadius: 4.65,
                                elevation: 7}}>
                                 <Text style={{fontFamily:'Helvetica', color: primaryColor}}>Create Account</Text>
                            </Button>
                            
                            <Button transparent onPress = {() => this.setState({login: true, createAccount: false, showModal: true, choice: false, email: '', password: ''})} style={{flexDirection: 'column', justifyContent: 'center'}}>
                                <Text style={{fontFamily:'Helvetica', color: primaryColor}}>Already have an account?</Text>
                            </Button>


  

                        </Animated.View>
                        }





                    </View>

                    
                    {/* if create account is clicked, show gender dropdown in form */}
                    {/* {(this.state.createAccount) &&
                    
                    <Item style={{borderBottomWidth: 1, height: 60, width: 250}}             
                      onPress={
                        ()=> ActionSheet.show
                        (
                          {
                            options: GENDER_OPTIONS,
                            cancelButtonIndex: CANCEL_INDEX,
                            destructiveButtonIndex: DESTRUCTIVE_INDEX,
                            title: 'Gender identity'
                          },
                          (buttonIndex) => {
                            if ((buttonIndex) === 2) {
                                console.log(GENDER_OPTIONS[buttonIndex])
                            } else {
                              this.setState({ gender: GENDER_OPTIONS[buttonIndex]})    
                            } 
                          }
                        )
                      }           
                    >

                    

                      <Button  disabled transparent >
                        <Text style={{paddingLeft: 15, color: (this.state.gender == 'Gender Identity') ? 'white' : 'white', textTransform: 'capitalize'}}>{this.state.gender}</Text>
                      </Button>
                  

                  </Item>
                              
                    } */}

                


                </Animated.View>
                    
                  </View>

              </View>
          }



          </LinearGradient>


   )
  }
}


const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      
  },
  inputBox: {
      width: 250,
      margin: 5,
      padding: 15,
      fontSize: 16,
      fontFamily:'Helvetica-Light',
      borderColor: '#d3d3d3',
      borderBottomWidth: 1,
      textAlign: 'left'
  },
  buttonEmail: {
      marginTop: 30,
      marginBottom: 20,
      paddingVertical: 5,
      alignItems: 'center',
      backgroundColor: '#F6820D',
      borderColor: '#F6820D',
      borderWidth: 1,
      borderRadius: 5,
      //width: 200
  },
  buttonFacebook: {
    marginTop: 30,
    marginBottom: 20,
    paddingVertical: 5,
    alignItems: 'center',
    backgroundColor: '#4267B2',
    borderColor: '#4267B2',
    borderWidth: 1,
    borderRadius: 5,
    //width: 200
},
  buttonText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff'
  }
})

export default Login;
