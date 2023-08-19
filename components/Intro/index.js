import React, { Component } from 'react';
import { ActivityIndicator, StyleSheet, Alert, Share, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faRestroom, faHeart,  faCog, faCommentDots, faCoffee, faDoorOpen, faLockAlt,  faUnlockAlt,faMale, faFemale, faHeartbeat, faBriefcase, faBook, faSchool, faUniversity,  faUsers, faComments, faUserClock, faLockOpen, faBolt,  faEye, faUserLock, faUtensils, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
// import RNfirebase from 'react-native-firebase';
import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

import AppIntroSlider from 'react-native-app-intro-slider';
// import * as firebase from "firebase";

import DeepLinkContext from "../DeepLinkContext"
import {doSomethingWithInput, justAnAlert, linkReview} from "../DeepLinkContext/functions.js"
import PropTypes from 'prop-types';

import {
  Container,
  Icon,
  Text,
  Button,
  List,
  ListItem,
  Body,
  View,
  Thumbnail
} from "native-base";

//const primaryColor = "#8A6077";
//const primaryColor = "#914cd5";
const primaryColor = "#a83a59";
//const primaryColor = "#c8c8c8"A16AE8
//const secondaryColor = "#EF8275";

//const secondaryColor = "#b8cdc2";
const secondaryColor = "#c60dd9";
//const secondaryColor = "#6400c7";

const btnColor = 'white';
const btnTextColor = primaryColor;

const logo = require("../../images/Focus_dating2.png");



//LINE 234 TO TURN ON REDIRECT FOR TESTING - BUILD INTO CONFIG
// 412, 495


const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: primaryColor
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
    marginBottom: 50
  },
  title: {
    fontSize: 22,
    color: 'white',
    backgroundColor: 'transparent',
    textAlign: 'center',
    marginBottom: 20,
  },
});



class Intro extends Component {
  constructor(props, contexts){
    super(props, contexts)

    //set state to convos var
    this.state = {
      loading: true,
      deepLinkParams: {},
      reviewObj: {},
      gender: '',
      userId: auth().currentUser.uid,
      reason: '',
      slides: [

        {
          key: '1',
          // title: 'Welcome to Focus',
          title: 'Go on blind dates.',
          subtext: 'Experience a different way of dating.',
          // text: "where blind dating is re-imagined." ,
          icon: faUtensils,
          colors: ['#13131A', '#13131A'],
        },
        {
          key: '2',
          subtext: "Only people you've swiped right on.",
          //title: 'With your type.',
          title: "Someone you're into.",
          // text: 'as photos re-focus while chatting.', //'With each message, photos will re-focus.',
          icon: faHeartbeat,
          image: require('./assets/banner-chat.jpg'),
          imageStyle: styles.image,
          backgroundColor: primaryColor,
          colors: [primaryColor, secondaryColor],
        },
        {
          key: '3',
          title: "We'll coordinate it.",
          subtext:  "When you're both ready, we’ll set it up.", //'Only gentlemen', 'Invite a friend',
          // text:  "and connections are made with you not your photos.", //'Spread the word.',
          icon:   faCheckDouble, //faBolt, //faUserLock, //faUnlockAlt, //faRestroom //faShield
          colors: [primaryColor, secondaryColor],
          }
        ],

      slidesFemale: [

    {
      key: '1',
      title: 'Welcome to Focus',
      text: "Blind dating re-imagined." ,
      icon: faDoorOpen,
      colors: [primaryColor, secondaryColor],
      
    },
    {
      key: '2',
      title: 'Better conversations',
      text: 'Photos re-focus as messages are exchanged. Connections made with you and not your photos.', //'With each message, photos will re-focus.',
      icon: faComments,
      image: require('./assets/banner-chat.jpg'),
      imageStyle: styles.image,
      backgroundColor: primaryColor,
      colors: [primaryColor, secondaryColor],
    },
    {
      key: '3',
      title:  'Women empowered', //'Only gentlemen', 'Invite a friend',
      text:  'Men need to be invited by women to enter.', //'Spread the word.',
      icon:   faBolt, //faUserLock, //faUnlockAlt, //faRestroom //faShield
      colors: [primaryColor, secondaryColor],
      }
    ],
    slidesMale: [
      {
        key: '1',
        title: 'Welcome to Focus',
        text: "Focus on less." ,
        icon: faUtensils,
        image: require('./assets/banner-welcome.jpg'),
        imageStyle: styles.image,
        backgroundColor: primaryColor,
        colors: [primaryColor, secondaryColor],
      },
      {
        key: '2',
        title: 'Better conversations',
        text: 'Photos re-focus as messages are exchanged.',
        image: require('./assets/banner-chat.jpg'),
        icon: faComments,  //faCoffee faCommentDots
        imageStyle: styles.image,
        backgroundColor: primaryColor,
        colors: [primaryColor, secondaryColor],
      },
      {
        key: '3',
        title: 'Female invite required',
        text: 'Men need to be invited by women.',
        image: require('./assets/banner-gentlemen.jpg'),
        icon: faUserLock,
        imageStyle: styles.image,
        backgroundColor: primaryColor,
        colors: [primaryColor, secondaryColor],
      }
    ],

    slidesMaleInvited: [
      {
        key: '1',
        title: 'Welcome to Focus',
        text: "Focus on less." ,
        icon: faDoorOpen,
        image: require('./assets/banner-welcome.jpg'),
        imageStyle: styles.image,
        backgroundColor: primaryColor,
        colors: [primaryColor, secondaryColor],
      },
      {
        key: '2',
        title: 'Better conversations',
        text: 'Photos re-focus as messages are exchanged.',
        image: require('./assets/banner-chat.jpg'),
        icon: faComments,  //faCoffee faCommentDots
        imageStyle: styles.image,
        backgroundColor: primaryColor,
        colors: [primaryColor, secondaryColor],
      },
      {
        key: '3',
        title: 'Invite link applied',
        text: 'All men have been invited by women.',
        icon: faUnlockAlt,
        imageStyle: styles.image,
        backgroundColor: primaryColor,
        colors: [primaryColor, secondaryColor],
      }
    ],
  }

  }


  //Assign context type of the DeeplinkContext
  static contextType = DeepLinkContext;

  //hide nav bar on the login screen
  static navigationOptions = {
    header: null,
  };

  
  componentDidMount() {
    
    const { navigate } = this.props.navigation;

    //check if user is active status now, if so redirect over to swipes
    database().ref('/users/' + auth().currentUser.uid).on('value', ((snapshot) => {
            
        //if status becomes active, redirect to swipes.
        if(snapshot.val().status == 'active'){
          //navigate to swipes when off waitlist
          navigate("Swipes");
        }
      })
    )

      //run analytics
      analytics().logScreenView({
        screen_name: 'Intro',
        screen_class: 'Intro'
      });
      analytics().setUserId(auth().currentUser.uid)
      
  }



  //invite flow
  _inviteFlow = () => {

    console.log('running invite flow now');

    //check if code is not expired
      if(this.context.deepLinkParams.expired == false){

        //linkReview in the background. 
        linkReview(this.context.reviewObj, this.state.userId);

      }else{
        //link is expired
         console.log('link is expired');
      }
    }


  _onDone = () => {
    const { navigate } = this.props.navigation;
      
    //go to Registration flow

    //navigate("ManageAboutMe");
    this.props.navigation.navigate("ManageAboutMeModal", {step: 0, userId: this.state.userId, from: 'Intro'}); 

    //if user canJoin redirect to Registration. 
    //if (this.context.deepLinkParams.gender_creator == 'female' || this.state.gender == 'female'){
    
    //check if deeplink is not expired, then route user to Registration since they off the waitlist.
    // if (this.context.deepLinkParams.expired == 'false'){

    //   //redirect to settings component, with onCancel param as "Intro", so that user is redirected to Settings afterwards. 
    //   const { navigate } = this.props.navigation;
    //   //navigate("Refer", {onCancel: 'Intro', flow: 'invite'});
      
    //   //comment on to turn on going to refer step here. 
    //   navigate("Registration");

    // }else{

    //   //else render ask to be invited
    //   Share.share({
    //     message: "Can you invite me to Focus. Men need to be invited by women to join.",
    //     url: 'https://focusdating.co', //make landing page with query param of reason. 
    //     title: 'Wow, have you seen this yet?' //what does this do?
    //   })

    // }
  }

  _renderItem = ({ item, dimensions }) => (
    
    <LinearGradient style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      //backgroundColor: primaryColor, dimensions
      }}
      colors={['#13131A', '#13131A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 2 }}
      >
        


        {/* <FontAwesomeIcon blurRadius={100} size={ 150 } style={{
          color: 'white', 
          marginBottom: 20,
          //opacity:0.2,
          backgroundColor: 'transparent', 
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowOpacity: 0.29,
          shadowRadius: 4.65,}} icon={item.icon}/> */}
        <View style={{
            //padding: 50,
            flex: 1,
            justifyContent: 'center',
            alignItems: 'flex-start',
            //backgroundColor: 'blue',
            width: Dimensions.get('window').width -100

        }}>
          <Text style={{
            marginBottom: 50,
            color: 'white', 
            fontSize: 50,}}>
            {item.title}
          </Text>
          
          <Text style={{
           // flex: 1,
            fontSize: 24, 
            fontFamily:'Helvetica-Light', 
            lineHeight: 45, 
            color: 'white'}}>
            {item.subtext}
          </Text>
          
          <View style={{
            height: 250
          }}>

          </View>
        </View>

      </LinearGradient>
      
  );


  _renderDoneButton = () => {
        
    //done label will be "enter" if user is female, or user is male and has been invited by a female and link is not expired. 
    //let doneLabel = ((this.context.deepLinkParams.gender_creator == 'female' && this.context.deepLinkParams.expired == false ) || this.state.gender == 'female') ? 'Enter' : 'Ask for invite'; //'Invite and continue' was language when showing invtie flow here.  
    //done label will be enter if off waitlist, else 'invite fried'.
    //let doneLabel = (this.context.deepLinkParams.expired == false ) ? 'Enter' : 'Invite Friend'; //'Invite and continue' was language when showing invtie flow here.  
    let doneLabel = 'Continue';
    let deviceWidth = Dimensions.get('window').width


    return (

      <LinearGradient 
      style={{
          flex: 1,
          alignSelf: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 90,
          width: deviceWidth,
          top: 50,        
        }}
        colors={[primaryColor, primaryColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 2.5 }}
        >

        <View 
          bordered 
          rounded
          //onPress={() => this.slider.goToSlide(this.slider.i , true)}
          style={{
            width: 300, 
            height: 40,
            borderRadius: 20,
            bottom: 20,
            backgroundColor: btnColor,  
            justifyContent: 'center', 
            alignItems: 'center',
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowOpacity: 0.29,
            shadowRadius: 4.65,
            elevation: 7,
          }}>
          <Text style={{color: btnTextColor}}>{doneLabel}</Text>
        </View>
      </LinearGradient>


    );
  };


_renderNextButton  =  ()  => {

    let deviceWidth = Dimensions.get('window').width
    
    return (

      <LinearGradient style={{
        flex: 1,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 90,
        width: deviceWidth,
        top: 50,
        }}
        colors={[primaryColor, primaryColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 2.5 }}
        >    
       
       
        <View 
          bordered 
          rounded
          //onPress={() => this.slider.goToSlide(this.slider.i , true)}
          style={{
            width: 300, 
            height: 40,
            borderRadius: 20,
            bottom: 20,
            backgroundColor: btnColor,  
            justifyContent: 'center', 
            alignItems: 'center',
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowOpacity: 0.29,
            shadowRadius: 4.65,
            elevation: 7,
          }}>
          <Text style={{color: btnTextColor}}>Next</Text>
        </View>
      </LinearGradient>   
      
    );
 };



    render() {
      const { navigate } = this.props.navigation;
      
      //if refer link is used
      if(this.context.deepLinkParams.type == 'refer'){

        if(this.context.deepLinkParams.expired == false){
          //run invite flow if link is not expired
          this._inviteFlow();

        }else{
          //link has been used, ask for another one. 
          console.log('link has expired');
        }

      }

    return <View style={{flex: 1, flexDirection: 'column',}}>

    {this.context.deepLinkParams.type == 'refer' && 

      <View  style={{  
        flex: 1,  
        paddingTop: 15,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20,
        borderBottomWidth :0.2,
        borderBottomColor: '#000',
        backgroundColor: 'white',
        flexDirection: 'row', 
        }}>

        <View style={{flex: 1, justifyContent: 'flex-end'}}>
          <Thumbnail round size={80} source={{uri: this.context.deepLinkParams.image_creator}} />
        </View>
        <View style={{flex: 4, justifyContent: 'center', marginTop: 50 }}>
         
        {this.context.deepLinkParams.expired == false &&
          // <Text style={{paddingLeft: 5, color: 'black'}} >
          // Congratulations {this.context.deepLinkParams.name_created}. You’ve been referred to Focus by {this.context.name_creator}. See what {this.context.name_creator} said about you after creating your profile.
          // </Text>
          <Text style={{paddingLeft: 5, color: 'black'}} >
          See what {this.context.name_creator} said about you after creating your profile.
          </Text>
         
        }
        {this.context.deepLinkParams.expired == true &&
          <Text style={{paddingLeft: 5, color: 'black'}} >
          This link has already been used. Please ask your friend for another one.
          </Text>
        }
        
        </View>
      </View>
    }

      <View style={{flex: 7}}>
        <StatusBar 
            hidden={'hidden'} 
            barStyle={'dark-content'} 
            animated={true}
          />
        <AppIntroSlider 
          
          slides={this.state.slides} 
          //doneLabel={doneLabel}
          ref={component => {this.refSlider = component}}
          bottomButton={true}
          renderItem={this._renderItem}
          renderNextButton={this._renderNextButton}
          renderDoneButton={this._renderDoneButton}
          ref={(ref) => (this.slider = ref)}
          activeDotStyle={{backgroundColor: primaryColor}}
          dotStyle ={{backgroundColor: 'white'}}
          onDone={this._onDone}
          style={{padding: 0}}
        />
      </View>


    </View> ;

     
    
  
    }
}

export default Intro;
