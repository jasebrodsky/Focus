import React, { Component } from 'react';
import { ActivityIndicator, StyleSheet, Alert, Share } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import RNfirebase from 'react-native-firebase';

import AppIntroSlider from 'react-native-app-intro-slider';
import * as firebase from "firebase";
import { DrawerNavigator, NavigationActions } from "react-navigation";
import {
  Container,
  Icon,
  Text,
  Button,
  List,
  ListItem,
  Body,
  View
} from "native-base";

const primaryColor = "#8A6077";

//LINE 234 TO TURN ON REDIRECT FOR TESTING - BUILD INTO CONFIG

const styles = StyleSheet.create({
  buttonCircle: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, .2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 320,
    height: 320,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    color: 'white',
    backgroundColor: 'transparent',
    textAlign: 'center',
    marginBottom: 16,
  }
});

//create slides female and male
const slidesFemale = [
  {
    key: '1',
    title: 'Welcome to Focus',
    text: "Focus on what's important." ,
    // text: "Only women decide who can join." ,
    image: require('./assets/banner-welcome.jpg'),
    imageStyle: styles.image,
    backgroundColor: primaryColor,
  },
  {
    key: '2',
    title: 'Better conversations',
    text: 'With each message, photos will re-focus.',
    image: require('./assets/banner-chat.jpg'),
    imageStyle: styles.image,
    backgroundColor: primaryColor,
  },
  {
    key: '3',
    title: 'Only gentlemen',
    text: 'Men need to be invited by a female.',
    image: require('./assets/banner-gentlemen.jpg'),
    imageStyle: styles.image,
    backgroundColor: primaryColor,
  }
];

const slidesMale = [
  {
    key: '1',
    title: 'Welcome to Focus',
    text: "Focus on what's important." ,
    image: require('./assets/banner-welcome.jpg'),
    //image: {uri: 'https://edmullen.net/test/rc.jpg', cache: 'force-cache'},
    imageStyle: styles.image,
    backgroundColor: primaryColor,
  },
  {
    key: '2',
    title: 'Better conversations',
    text: 'With each message, photos will re-focus.',
    image: require('./assets/banner-chat.jpg'),
    imageStyle: styles.image,
    backgroundColor: primaryColor,
  },
  {
    key: '3',
    title: 'Enter your code',
    text: 'Men need to be invited by a female.',
    image: require('./assets/banner-gentlemen.jpg'),
    imageStyle: styles.image,
    backgroundColor: primaryColor,
  }
];

class Intro extends Component {

  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      loading: true,
      gender: '',
      userId: ''
    }

  }

  //hide nav bar on the login screen
  static navigationOptions = {
    header: null,
  };


  componentWillMount() {

    const { state } = this.props.navigation;

    //if returned gender is male, return male flow, for all other genders returned, return female flow
    let gender = (state.params.gender == 'male') ? 'male' : 'female';
    let userId = state.params.user_id;
  
     //set state with user data. 
      this.setState({ 
        userId: userId,
        gender: gender
      });    

      RNfirebase.analytics().setAnalyticsCollectionEnabled(true);
      RNfirebase.analytics().setUserId(userId);
      RNfirebase.analytics().setCurrentScreen('Intro', 'Intro');
  }
  
  //check code is valid
  _checkCode = (userCode) => {
    //save analytics in let
    let Analytics = RNfirebase.analytics();
    //call firebase if code exists and is not expired
    firebase.database().ref("/codes").orderByChild("sharable_code").equalTo(userCode.toUpperCase()).once("value",codeSnap => {
        //check if code exists
        if (codeSnap.exists()){

          //get save code to obj
          let code = codeSnap.val();
          let key = Object.keys(code);
          let codeData = code[key];
          let expired = codeData.expired;
          let reason = codeData.reason;
          let name_creator = codeData.name_creator;
          let photo_creator = codeData.photo_creator;
                
          //check if code is also expired
          if(expired == true){

            //handle that code is expired. 
            console.log('sorry code is expired already. Ask your friend for another.');
            
            //record in analytics that code was expired 
            Analytics.logEvent('codeExpired', {
              codeData: 'codeData'
            });

            Alert.alert('Whoops!','Code: '+userCode+' has already been used. Please ask your friend for another.');

          }else{
            const { navigate } = this.props.navigation;
   
            //code must exist AND code not expired
            console.log('code exists and is valid!');
            
            //record in analytics that code was expired 
            Analytics.logEvent('codeValid', {
              codeData: 'codeData'
            });

            //update code to expired at the specific code key and add created_for as well, to reference later. 
            firebase.database().ref('/codes/'+key).update({expired_date: new Date().getTime(), expired: true, created_for: this.state.userId });
            
            //save db ref for profile 
            firebaseProfileRef = firebase.database().ref('/users/' + this.state.userId);
            
            // save reference to where to save the new review object 
            firebaseProfileRefReviews = firebase.database().ref('/users/'+this.state.userId+'/reviews/'+key);

            //update code_accepted to true
            firebaseProfileRef.update({code_accepted: true});

            //build review object to update db with. 
            let reviewObj = {name: name_creator, photo: photo_creator, reason: reason, code_key: key[0]}

            //push new review into users profile object
            firebaseProfileRefReviews.set(reviewObj);

            //alert welcome message, then navigate to settings. 
            Alert.alert(
              'Welcome to Focus!',
              'Click ok to enter community.',
              [
                {
                  text: 'Ok',
                  onPress: () => navigate("Settings"),
                  //onPress: () => navigate("Swipes"),
                },
              ],
            );
            

          }
        //code doesnt exist
        }else{

          //handle that code doesnt exist. 
          console.log('sorry code doesnt exist. ask your friend for another');
           //record in analytics that code was expired 
          Analytics.logEvent('codeInvalid', {
            codeData: 'codeData'
          });         
          
          //alert user that code does not exist. 
          //Alert.alert('Whoops!','Code: '+userCode+' does not exist. Please ask your friend for another.');

          //let people in for testing
          // const { navigate } = this.props.navigation;

          // Alert.alert(
          //     'Welcome to Focus!',
          //     'actually check code before launching.',
          //     [
          //       {
          //         text: 'Ok',
          //         onPress: () => navigate("Settings"),
          //       },
          //     ],
          //   );
        }
    });
  }

  _onDone = () => {
    const { navigate } = this.props.navigation;
    //navigate("Settings");

    //if gender is male then render redeem code flow. 
    if (this.state.gender == 'male'){


      // // Works on both Android and iOS
      // Alert.alert(
      //   'Alert Title',
      //   'My Alert Msg',
      //   [
      //     {text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
      //     {
      //       text: 'Cancel',
      //       onPress: () => console.log('Cancel Pressed'),
      //       style: 'cancel',
      //     },
      //     {text: 'OK', onPress: () => console.log('OK Pressed')},
      //   ],
      //   {cancelable: false},
      // );


      Alert.prompt(
        'Enter code',
        'Enter your referral code you received from a friend',
        [
          {
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          {
            text: 'Submit',
            onPress: (code) => this._checkCode(code),
          },
        ],
        'plain-text',
      );

    }else{
      //user must be female, render invite friend flow
      //redirect to settings component, with onCancel param as "Intro", so that user is redirected to Settings afterwards. 
      const { navigate } = this.props.navigation;
      navigate("Refer", {onCancel: 'Intro', flow: 'invite'});
    }
  }

  render() {
    const { navigate } = this.props.navigation;
    const slides = (this.state.gender == 'male') ? slidesMale : slidesFemale;      
    const doneLabel = (this.state.gender == 'male') ? 'Enter code' : 'Invite and continue';      
    
    
    return <AppIntroSlider 
      slides={slides} 
      doneLabel={doneLabel}
      bottomButton={true}
      onDone={this._onDone}/>;
  }
}

export default Intro;
