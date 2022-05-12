import React, { Component } from 'react';
import { ActivityIndicator, StyleSheet, Alert, Share, TouchableOpacity, StatusBar } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faRestroom, faHeart,  faCog, faCommentDots, faCoffee, faDoorOpen, faLockAlt,  faUnlockAlt,faMale, faFemale, faHeartbeat, faBriefcase, faBook, faSchool, faUniversity,  faUsers, faComments, faUserClock, faLockOpen, faBolt,  faEye, faUserLock, faUtensils, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import RNfirebase from 'react-native-firebase';
import AppIntroSlider from 'react-native-app-intro-slider';
import * as firebase from "firebase";
import dynamicLinks from '@react-native-firebase/dynamic-links';
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
      userId: firebase.auth().currentUser.uid,
      reason: '',
      slides: [

        {
          key: '1',
          // title: 'Welcome to Focus',
          title: 'Go on Blind Dates.',
          // text: "where blind dating is re-imagined." ,
          icon: faUtensils,
          colors: [primaryColor, secondaryColor],
        },
        {
          key: '2',
          title: "Only people you're already attracted to.",
          // title: 'Better conversations',
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
          // title:  'Because love is blind', //'Only gentlemen', 'Invite a friend',
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
    
    //check if deeplink exists of type refer, if so, run inviteFlow, which updates UX based off invite link
    
    //update state with gender passed from navigation
    // this.setState({
    //   gender: this.props.navigation.getParam('gender'), //get from login screen
    // });

      RNfirebase.analytics().setAnalyticsCollectionEnabled(true);
      RNfirebase.analytics().setUserId(this.state.userId);
      RNfirebase.analytics().setCurrentScreen('Intro', 'Intro');
  }



  //invite flow
  _inviteFlow = () => {

    console.log('running invite flow now');
    //save analytics in let
    let Analytics = RNfirebase.analytics();

    //check if code is also expired
      if(this.context.deepLinkParams.expired == false){
        //handle that code is not expired yet. 
        //linkReview in the background. 
        console.log('running link review now, since link is not expired');
        linkReview(this.context.reviewObj, this.state.userId);

        //if user is a male and invited by a female, update slides that invite link has been applied. 
        // if(this.context.deepLinkParams.gender_creator == 'female' && this.state.gender == 'male'){
        //     console.log('you may pass since you are a man invited by a female');
        // }


      }else{
        //link is expired
         console.log('link is expired');
      }
    }


  _onDone = () => {
    const { navigate } = this.props.navigation;
      
    //go to Registration flow
    //navigate("ManageAboutMe");
    this.props.navigation.navigate("ManageAboutMe", {step: 0, userId: this.state.userId}); 



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
      colors={item.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      >
        


        <FontAwesomeIcon blurRadius={100} size={ 150 } style={{
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
          shadowRadius: 4.65,}} icon={item.icon}/>
        <View>
          <Text style={{ 
            // shadowColor: "#000",
            // shadowOffset: {
            //   width: 0,
            //   height: 3,
            // },
            // shadowOpacity: 0.29,
            // shadowRadius: 4.65, 
            fontSize: 55,
            lineHeight: 70,
            fontFamily:'Helvetica',
            color: '#222222',
            backgroundColor: 'transparent',
            textAlign: 'left',
            marginBottom: 20,
            padding: 30}}>
            {item.title}
          </Text>
          
          <Text style={{  
            color: 'white',
            backgroundColor: 'transparent',
            textAlign: 'center',
            fontSize: 16,
            paddingHorizontal: 16,
            marginBottom: 50}}>
            {item.text}
          </Text>
        </View>

      </LinearGradient>
      
  );


  _renderDoneButton = () => {
        
    //done label will be "enter" if user is female, or user is male and has been invited by a female and link is not expired. 
    //let doneLabel = ((this.context.deepLinkParams.gender_creator == 'female' && this.context.deepLinkParams.expired == false ) || this.state.gender == 'female') ? 'Enter' : 'Ask for invite'; //'Invite and continue' was language when showing invtie flow here.  
    //done label will be enter if off waitlist, else 'invite fried'.
    //let doneLabel = (this.context.deepLinkParams.expired == false ) ? 'Enter' : 'Invite Friend'; //'Invite and continue' was language when showing invtie flow here.  
    let doneLabel = 'Continue';

    return (

      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 25}}>
        <View 
          bordered 
          rounded
          //onPress={() => this.slider.goToSlide(this.slider.i , true)}
          style={{
            width: 300, 
            height: 40,
            borderRadius: 20,
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
      </View>


    );
  };


_renderNextButton  =  ()  => {
    
    return (

      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 25}}>
        <View 
          bordered 
          rounded
          //onPress={() => this.slider.goToSlide(this.slider.i , true)}
          style={{
            width: 300, 
            height: 40,
            borderRadius: 20,
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
      </View>
      
    );
 };



    render() {
      const { navigate } = this.props.navigation;
      //set up intial slides, based off gender
      //let slides = (this.state.gender == 'male') ? this.state.slidesMale : this.state.slidesFemale; 

      //if refer link is used
      if(this.context.deepLinkParams.type == 'refer'){

        if(this.context.deepLinkParams.expired == false){
          //run invite flow if link is not expired
          this._inviteFlow();

        //   slides = this.state.slidesOffWaitlist;

        //   // //show slides for invited men who can join since invited by women.
        //   // if (this.state.gender == 'male' && this.context.deepLinkParams.gender_creator == 'female'){
        //   //   slides = this.state.slidesMaleInvited;
        //   // }
        //   // //show slides for men who are not yet invited by a female. 
        //   // else if (this.state.gender == 'male' && this.context.deepLinkParams.gender_creator !== 'female'){
        //   //   slides = this.state.slidesMale;
        //   // }    
        //   // //show slides for females who can always join.
        //   // else if (this.state.gender == 'female'){
        //   //   slides = this.state.slidesFemale;
        //   // }

        }else{
          //link has been used, ask for another one. 
          console.log('link has expired');
        }

      }


    //console.log('this.context is on render'+JSON.stringify(this.context));
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
        backgroundColor: 'black',
        flexDirection: 'row', 
        }}>

        <View style={{flex: 1, justifyContent: 'flex-end'}}>
          <Thumbnail round size={80} source={{uri: this.context.deepLinkParams.image_creator}} />
        </View>
        <View style={{flex: 4, justifyContent: 'flex-end', }}>
         
        {this.context.deepLinkParams.expired == false &&
          <Text style={{paddingLeft: 5, color: 'white'}} >
          Congratulations {this.context.deepLinkParams.name_created}. You’ve been referred to Focus by {this.context.name_creator}. See what they said about you after creating your profile.
          </Text>
        }
        {this.context.deepLinkParams.expired == true &&
          <Text style={{paddingLeft: 5, color: 'white'}} >
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
        />
      </View>
    </View> ;

     
    
  
    }
}

export default Intro;
