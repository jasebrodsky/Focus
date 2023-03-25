import React, { Component } from 'react';
import {
  ScrollView, 
  TouchableOpacity,
  TouchableWithoutFeedback, 
  Image, 
  ImageBackground,
  StatusBar,
  Linking,
  Modal,
  Dimensions, 
  Vibration,
  TouchableHighlight} from 'react-native';
import Carousel, { Pagination } from 'react-native-snap-carousel';

import {
  ActionSheet,
  Card,
  CardItem,
  Container,
  Text,
  Button,
  Left,
  List,
  ListItem,
  Thumbnail,
  Body,
  View,
  H1,
  H3
} from "native-base";

import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import Slider from '@react-native-community/slider';
import ImageViewer from 'react-native-image-zoom-viewer';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHistory, faUserEdit, faEdit, faRemoveFormat, faTrash, faTrashAlt, faCameraRetro, faCalendarDay, faUtensils, faMapMarkedAlt,   } from '@fortawesome/free-solid-svg-icons';
import { faArrowAltCircleLeft } from '@fortawesome/free-solid-svg-icons';
import { withNavigation } from "react-navigation";
import ReactNativeZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';
import Confetti from 'react-native-confetti';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps'
import { renderNotification, handleNotification } from '../Utilities/utilities.js';
import { min } from 'moment';


//colors consts
const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";
const btnColor = 'white';
const btnTextColor = primaryColor;
const sampleImage = require("../../images/nyc.png");


class BlindDate extends Component {
  constructor(props){

    super(props)

    this.state = {
      //flow: 'create', //create, approve, propose, proposeConfirmation, details, confirmationNextWaiting, confirmationNext
      hideAddress: true,
      userId: firebase.auth().currentUser.uid, 
      matchName: 'TEST',
      proposedTime: 3,
      proposedTimeTimeStamp: (new Date().getTime() + (86400000 * 3)), //default proposedTimeTimestamp to current time + 3 days in the future. 
      confirmedTime: 'date.confirmedTime',
      confirmedLat: '',
      confirmedLong: '',
      placeAddress: '',
      placeUrl: '',
      placeName: '',
      placeImage: '',
      showModal: false,
      yelpDates: [],
      flow: 'detailsShow',
      priceMax: 2,
      timeSelectedIndex: 2,
      dateType: '',
      dateTypeTime: {
        coffee: {
          timeRange: '10AM - 1PM',
          timeSliderValues: ['10:00 AM','10:15 AM','10:30 AM','10:45 AM','11:00 AM','11:15 AM','11:30 AM','11:45 AM','12:00 PM','12:15 PM','12:30 PM','12:45 PM','1:00 PM']
        },
        tea: {
          timeRange: '10AM - 1PM',
          timeSliderValues: ['10:00 AM','10:15 AM','10:30 AM','10:45 AM','11:00 AM','11:15 AM','11:30 AM','11:45 AM','12:00 PM','12:15 PM','12:30 PM','12:45 PM','1:00 PM']
        },
        gallery: {
          timeRange: '1PM - 5PM',
          timeSliderValues: ['1:00 PM','1:15 PM','1:30 PM','1:45 PM','2:00 PM','2:15 PM','2:30 PM','2:45 PM','3:00 PM','3:15 PM','3:30 PM','3:45 PM','4:00 PM','4:15 PM','4:30 PM','4:45 PM','5:00 PM']
        },
        museum: {
          timeRange: '1PM - 5PM',
          timeSliderValues: ['1:00 PM','1:15 PM','1:30 PM','1:45 PM','2:00 PM','2:15 PM','2:30 PM','2:45 PM','3:00 PM','3:15 PM','3:30 PM','3:45 PM','4:00 PM','4:15 PM','4:30 PM','4:45 PM','5:00 PM']
        },
        park: {
          timeRange: '11AM - 2PM',
          timeSliderValues: ['11:00 AM','11:15 AM','11:30 AM','11:45 AM','12:00 PM','12:15 PM','12:30 PM','12:45 PM','1:00 PM','1:15 PM','1:30 PM','1:45 PM','2:00 PM']
        },
        hookah: {
          timeRange: '7PM - 10PM',
          timeSliderValues: ['7:00 PM','7:15 PM','7:30 PM','7:45 PM','8:00 PM','8:15 PM','8:30 PM','8:45 PM','9:00 PM','9:15 PM','9:30 PM','9:45 PM','10:00 PM']
        },
        dessert: {
          timeRange: '7PM - 10PM',
          timeSliderValues: ['7:00 PM','7:15 PM','7:30 PM','7:45 PM','8:00 PM','8:15 PM','8:30 PM','8:45 PM','9:00 PM','9:15 PM','9:30 PM','9:45 PM','10:00 PM']
        },
        cocktails: {
          timeRange: '7PM - 10PM',
          timeSliderValues: ['7:00 PM','7:15 PM','7:30 PM','7:45 PM','8:00 PM','8:15 PM','8:30 PM','8:45 PM','9:00 PM','9:15 PM','9:30 PM','9:45 PM','10:00 PM']
        },
      },
      createNewProposalStep: 'type',
      latitudeDeltaMatch: 0.0922,
      longitudeDeltaMatch: 0.0421,
      reservationFirstName: 'First Name',
      reservationLastName: 'Last Name',
      activeIndex: 0,
      activeSlide: 0,
      carouselItems: [
        {
          title:"Cocktails",
          imageSrc: require("../../images/cocktails4.jpeg"),
          type: "cocktails"
        },
        {
          title:"Art Gallery",
          imageSrc: require("../../images/gallery.jpeg"),
          type: "gallery"
        },
        {
          title:"Dessert",
          imageSrc: require("../../images/ice_cream2.jpg"),
          type: "dessert"
        },
        {
          title:"Coffee",
          imageSrc: require("../../images/coffee3.jpeg"),
          type: "coffee"
        },
        {
          title:"Museum",
          imageSrc: require("../../images/museum.jpeg"),
          type: "museum"
        },
        {
          title:"Park",
          imageSrc: require("../../images/park.jpeg"),
          type: "park"
        },
        {
          title:"Tea",
          imageSrc: require("../../images/tea.jpg"),
          type: "tea"
        },
        {
          title:"Hookah",
          imageSrc: require("../../images/hookah.jpeg"),
          type: "hookah"
        },

      ],
      subheader: {
        createNewProposal: 'Create blind date',
        approveNewProposal: 'Blind date request',
        approveNewProposalPickLocation: 'Blind date request',
        approveNewProposalPickTime: 'Blind date request',
        updateProposal: 'Blind date request',
        approveUpdatedProposal: 'Blind date request',
        
        detailsShow: 'Blind date details',
        detailsHide: 'Blind date details',
        proposalAccepted: 'Blind date details',
        waitingAcceptanceUpdatedProposal: 'Blind date details',
        waitingAcceptanceNewProposal: 'Blind date details',
        confirmation: 'Create blind date',
      },
      mainCopyPrimary: {
        createNewProposal: 'If they accept, you’ll both receive',
        waitingAcceptanceUpdatedProposal: 'If they accept, you’ll both receive',
        approveNewProposal: 'Requested Blind Date with you.',
        updateProposal: 'Propose a new time for your Blind Date.',
        approveUpdatedProposal: 'New proposed time for your Blind Date.',
        waitingAcceptanceNewProposal: 'What happens next',
        proposalAccepted: 'What happens next',
      },      
      mainCopySecondary: {
        createNewProposal: "If they accept, you'll receive restaurant reservations near them.",
        approveNewProposal: "If you accept, you'll receive restaurant reservations near you.",
        updateProposal: "If they accept, you'll receive restaurant reservations near them.",
        approveUpdatedProposal: "If you accept, you'll receive restaurant reservations near you.",
        waitingAcceptanceNewProposal: "If they accept, you'll receive restaurant reservations near them.",
        waitingAcceptanceUpdatedProposal: "If they accept, you'll receive restaurant reservations near them.",
        proposalAccepted: "Expect to receive reservations within the next 24 hours.",
      }
    }
  }


  //before component mounts, setup state with passed data from nav params so that profile loads immediately. 
  componentWillMount() {

    //save data from params sent by button or deeplink
    let status = this.context.deepLinkParams ? this.context.deepLinkParams.flow: this.props.navigation.getParam('status');
    let dateId = this.context.deepLinkParams ? this.context.deepLinkParams.dateId : this.props.navigation.getParam('dateId');
    let dateType = this.context.deepLinkParams ? this.context.deepLinkParams.dateType : this.props.navigation.getParam('dateType');
//    let dateType = this.props.navigation.getParam('dateType') ? this.props.navigation.getParam('dateType') : this.state.dateType;

// WHEN CLICKING NEXT BUTTON, and getting to the confirm page, dateType is rendering as current saved dateType instead of lastest from state. Since this data is checked from nav first. Problem when a date exists but is changed (deleted/proposed new time) and the wrong/expired dateType is shown

    let confirmedTime = this.context.deepLinkParams ? this.context.deepLinkParams.confirmedTime : this.props.navigation.getParam('confirmedTime');
    let placeAddress = this.context.deepLinkParams ? this.context.deepLinkParams.placeAddress : this.props.navigation.getParam('placeAddress');
    let placeUrl = this.context.deepLinkParams ? this.context.deepLinkParams.placeUrl : this.props.navigation.getParam('placeUrl');
    let placeImage = this.context.deepLinkParams ? this.context.deepLinkParams.placeImage : this.props.navigation.getParam('placeImage');
    let proposedLong = this.context.deepLinkParams ? this.context.deepLinkParams.proposedLong : this.props.navigation.getParam('proposedLong');
    let proposedLat = this.context.deepLinkParams ? this.context.deepLinkParams.proposedLat : this.props.navigation.getParam('proposedLat');
    let confirmedLong = this.context.deepLinkParams ? this.context.deepLinkParams.confirmedLong : this.props.navigation.getParam('confirmedLong');
    let confirmedLat = this.context.deepLinkParams ? this.context.deepLinkParams.confirmedLat : this.props.navigation.getParam('confirmedLat');
    let placeName = this.context.deepLinkParams ? this.context.deepLinkParams.placeName : this.props.navigation.getParam('placeName');
    let priceMax = this.context.deepLinkParams ? this.context.deepLinkParams.priceMax : this.props.navigation.getParam('priceMax');
    let matchName = this.context.deepLinkParams ? this.context.deepLinkParams.matchName : this.props.navigation.getParam('matchName');
    let userIdMatch = this.context.deepLinkParams ? this.context.deepLinkParams.userIdMatch : this.props.navigation.getParam('userIdMatch');
    let reservationFirstName = this.context.deepLinkParams ? this.context.deepLinkParams.reservationFirstName : this.props.navigation.getParam('reservationFirstName');
    let reservationLastName = this.context.deepLinkParams ? this.context.deepLinkParams.reservationLastName : this.props.navigation.getParam('reservationLastName');
    let conversationId = this.context.deepLinkParams ? this.context.deepLinkParams.conversationId : this.props.navigation.getParam('conversationId');
    let blur = this.context.deepLinkParams ? this.context.deepLinkParams.blur : this.props.navigation.getParam('blur');

    // let userIdMatchFcmToken = this.context.deepLinkParams ? this.context.deepLinkParams.userIdMatchFcmToken : this.props.navigation.getParam('userIdMatchFcmToken');
    let flow = this.context.deepLinkParams ? this.context.deepLinkParams.flow : this.props.navigation.getParam('flow');
    let profile = this.context.deepLinkParams ? this.context.deepLinkParams.profile : this.props.navigation.getParam('profile');
      
    
    //listen for notifications when module Focus
    const didFocus = this.props.navigation.addListener(
      'didFocus',
      payload => {
        
        //get notifications when arriving
        this.handleNotification(userId, 'BlindDate', null);

      }
    );


    //stop listening for notifications, since each module has different logic so lis
    const didBlur = this.props.navigation.addListener(
        'didBlur',
        payload => {
                
          let query = firebase.database().ref('/matches/' + userId).orderByChild('showNotification');
  
          //remove listener when leaving. 
          query.off('child_changed', this.state.listener);
        }
      );

  
    // Define flow based off dates' status and current userid
    
    //Date Status: Pending, Declined, Accepted, PendingUpdate, 
    //UX flows, derived from Status
   
    // Pending
    //   - approveNewProposal
    //   - newProposalAcceptedPickLocation -- pick date location
    //   - proposalAcceptedPickTime -- pick date time
    //   - waitingAcceptanceNewProposal //confirmationNextWaiting 

    // PendingUpdate
    //   - approveUpdatedProposal
    //   - updatedProposalAcceptedPickLocation -- pick date location
    //   - updatedProposalAcceptedPickTime -- pick date time
    //   - waitingAcceptanceUpdatedProposal //confirmationNextWaiting
    
    // Fulfill
    //   - proposalAccepted
    
    // Accepted
    //   - detailsShow
    //   - detailsHide
    
    // Declined/None
    //   - createNewProposal



    //get matches real-time geo location, to eventually create date with. 
    firebaseRef = firebase.database().ref('/users/' + userIdMatch);

    //save data snapshot from firebaseRef, so that geo code can be updated in realtime. 
    firebaseRef.on('value', (dataSnapshot) => {

      this.setState({
        latitudeMatch: dataSnapshot.val().latitude,
        longitudeMatch: dataSnapshot.val().longitude,
        utc_offset_min: dataSnapshot.val().utc_offset_min,
        matchName: dataSnapshot.val().first_name,
        notifyFcmToken: dataSnapshot.val().fcmToken,
        blur: blur,
      })
    })

        //set initial state from params sent by button else deeplink
        this.setState({
          flow: flow,
          profile: profile, 
          dateId: dateId,
          dateType: dateType,
          confirmedTime: confirmedTime,
          proposedLong: proposedLong,
          proposedLat: proposedLat,
          confirmedLat: confirmedLat,
          confirmedLong: confirmedLong,
          placeAddress: placeAddress,
          placeUrl: placeUrl,
          placeImage: placeImage,
          placeName: placeName,
          priceMax: priceMax,
          matchName: matchName,
          reservationFirstName: reservationFirstName,
          reservationLastName: reservationLastName,
          userIdMatch: userIdMatch,
          conversationId: conversationId,
          blur: blur,
          mainCopyPrimary: {
            createNewProposal: 'When '+ matchName+' accepts, you both will receive reservations at a resturant close to their neighborhood',
            approveUpdatedProposal: matchName+' requests a Blind Date with you.',
            approveNewProposal: matchName+' requests a Blind Date with you.',
            updateProposal: 'Propose a new time for your Blind Date with '+ matchName+'.',
            proposeConfirmation: matchName+' proposed a new time for your Blind Date.',
            waitingAcceptanceNewProposal: 'What happens next',
            waitingAcceptanceUpdatedProposal: 'What happens next',
            proposalAccepted: 'What happens next'
          }, 
    
          mainCopySecondary: {
            createNewProposal: "If they accept, you'll receive instructions for a "+dateType+" date near them.",
            approveNewProposal: "If you accept, you'll receive instructions for a "+dateType+" date near you.",
            updateProposal: "If they accept, you'll receive instructions for a "+dateType+"date near them.",
            approveUpdatedProposal: "If you accept, you'll receive instructions for a "+dateType+" date near you.",
            waitingAcceptanceNewProposal: "If they accept, you'll receive instructions for a "+dateType+" date near them.",
            waitingAcceptanceUpdatedProposal: "If they accept, you'll receive instructions for a "+dateType+" date near them.",
            proposalAccepted: "Expect to receive instructions for a "+dateType+" date within the next 24 hours.",
          }
        })

    //get dates real-time data, to eventually create date with. 
    let firebaseDateRef = firebase.database().ref('/dates/' + dateId);

    //save date snapshot from firebaseDateRef, so that dates can be updated in realtime. 
    firebaseDateRef.on('value', (dateSnap) => {

      let flow = '';

      //if a date exists, update ux state to match updated date in real time. 
      if (dateSnap.val()){

        //if date is in the passed (proposed or confirmed), go to flow createNewProposal
        if( (dateSnap.val().proposedTime < new Date().getTime() && dateSnap.val().status !== 'accepted') || (dateSnap.val().confirmedTime < new Date().getTime() && dateSnap.val().status == 'accepted') ){
          flow = 'createNewProposal' ;
        }else{ //date is in the future configure flow. 
          switch (dateSnap.val().status) {
            case 'pending': 
              flow = (userId == dateSnap.val().waitingOnId) ? 'approveNewProposal' : 'waitingAcceptanceNewProposal' ;
              break;
            case 'pendingUpdate': 
              flow = (userId == dateSnap.val().waitingOnId) ? 'approveUpdatedProposal' : 'waitingAcceptanceUpdatedProposal' ;
              break;
            case 'fulfill': 
              flow = 'proposalAccepted' ; //go to proposal Acccepted flow
              break;
            case 'accepted': 
              //flow = (this.state.date.proposedTime < Date.now()+(86400000*1)) ? 'detailsHide' : 'detailsShow' ; //show details when 24 hours before proposedTime
              flow = 'detailsShow' ; 
              break;
            case 'declined':
              flow = 'createNewProposal' ;
              break;
            case 'none':
              flow = 'createNewProposal' ;
              break;
            default:
              flow = 'createNewProposal' ;
          }
        }

        // set state with updated date data.
        this.setState({
          flow: flow,
          dateType: dateSnap.val().type,
          //confirmedTime: dateSnap.val().confirmedTime,
          proposedTimeTimeStamp: dateSnap.val().proposedTime,
          proposedLong: dateSnap.val().proposedLong,
          proposedLat: dateSnap.val().proposedLat,
          confirmedLat: dateSnap.val().confirmedLat,
          confirmedLong: dateSnap.val().confirmedLong,
          placeAddress: dateSnap.val().placeAddress,
          placeUrl: dateSnap.val().url,
          placeImage: dateSnap.val().imageUrl,
          placeName: dateSnap.val().placeName,
          priceMax: dateSnap.val().priceMax,
          blur: blur,
        })
      }

    })




    //Run analytics
    RNfirebase.analytics().setAnalyticsCollectionEnabled(true);
    RNfirebase.analytics().setCurrentScreen('BlindDate', 'BlindDate');
    RNfirebase.analytics().setUserId(userId);
  }

    //get age function
    _getAge(dateString) {
      var today = new Date();
      var birthDate = new Date(dateString);
      var age = today.getFullYear() - birthDate.getFullYear();
      var m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  }

  //handle notifications
  handleNotification = (userId, screen, matchUseridExclude ) => {
    
    let query = firebase.database().ref('/matches/' + userId).orderByChild('showNotification');

    let listener = query.on('child_changed', (notifySnapshot) => {
            
      //first check if there's a notification to render by checking if showNotification is true on the child_changed event on the match, also check that notificaiton has happened since module mounted, so old notificaitons aren't served.  
      if((notifySnapshot.val().showNotification == true) && (notifySnapshot.val().last_message_date*-1 < new Date().getTime())){
        //render notification based off the notification type
        switch (notifySnapshot.val().notificationType) {
          case 'newMatch':
            //don't notify of new match while on Swipes screen.
            if(screen !== 'Swipes' && screen !== 'BlindDate' ){
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
            
          // case 'newBlindDate':
          //   renderNotification('New Blind Date requested.');
          //   break;
          // case 'planned': //blind date accepted
          //   renderNotification('Blind Date ready!');
          //   break;
          // case 'accepted': //blind date accepted
          //   renderNotification('Blind Date accepted!');
          //   break;
          // case 'declined': //blind date declined
          //   renderNotification('Blind Date declined.');
          //   break;                   
          // case 'pendingUpdate': //blind date updated
          //   renderNotification('Blind Date updated.');
          //   break;
          // case 'pending': //blind date updated
          //   renderNotification('Blind Date updated.');
          //   break;                 
          case 'conversationExtended':
            renderNotification(notifySnapshot.val().name+' has extended the conversation!');
            break;
          default:
            console.log(`Sorry, no matching notification type`);
        }

        //turn off notificationShow bool so it doesn't show again. 
        firebase.database().ref('/matches/' + userId +'/'+ notifySnapshot.key).update({
          'showNotification': false
        });       

        //save to state listner, so that it specific listener can be turned off when leaving 
        this.setState({ listener: listener });
 
      }
    })

  }


  //bind renderItem ... not sure why this is needed .. 
  _renderItem = this._renderItem.bind(this);

  //render carosel of date types
  _renderItem({item,index}){


    console.log('INDEX IS: '+index);
    
    return (
      <TouchableOpacity
        onPress={
          
          () => this.setState({
            createNewProposalStep: 'date', 
            dateType: item.type,
            //update mainCopySecondary  
            mainCopySecondary: {
              createNewProposal: "If they accept, you'll receive instructions for a "+item.type+" date near them.",
              approveNewProposal: "If you accept, you'll receive instructions for a "+item.type+" date near you.",
              updateProposal: "If they accept, you'll receive instructions for a "+item.type+" date near them.",
              approveUpdatedProposal: "If you accept, you'll receive instructions for a "+item.type+" date near you.",
              waitingAcceptanceNewProposal: "If they accept, you'll receive instructions for a "+item.type+" date near them.",
              waitingAcceptanceUpdatedProposal: "If they accept, you'll receive instructions for a "+item.type+" date near them.",
              proposalAccepted: "Expect to instructions for a "+item.type+" date within the next 24 hours.",
            }
        
         })
      
      }
        style={{
          //backgroundColor:'black',
          flex: 1,
          //justifyContent: 'flex-start',
          alignItems: 'center',
          borderRadius: 50,
          //height: 250,
          padding: 10,
          marginTop: 25,
          marginBottom: 25,
          //marginLeft: 2,
          //marginRight: 25, 
          shadowOffset: {
            width: 4,
            height: 4,
          },
          shadowOpacity: 0.5,
          shadowRadius: 4.65
        }}>

          <ImageBackground
              //style={{width : '100%', height: 275, borderRadius: 50}}
              imageStyle={{ borderRadius: 50}}
              //source={{uri : item.uri}}
              source={item.imageSrc}
              style={{width: '100%', height: '100%'}} >
              <LinearGradient 
                  colors={['#00000000', '#000000']} 
                  style={{flex: 1, justifyContent: 'flex-end', alignItems: 'center', padding: 20, height : '100%', width : '100%', borderRadius: 50}}>
                  <Text style={{fontSize: 25, color: primaryColor, textAlign: 'center'}}>{item.title}</Text>

              </LinearGradient>

          </ImageBackground>


      </TouchableOpacity>

    )
}

//get random index but exclude one of them. 
 _randNum = (arr,excludeNum) => {
  let randNumber = Math.floor(Math.random()*arr.length);
  if(arr[randNumber]==excludeNum){
      return randNum(arr,excludeNum);
  }else{
      return randNumber;
  }
}

  //bind renderItem ... not sure why this is needed .. 
  _renderItem2 = this._renderItem2.bind(this);

  //render carosel of specific dates
  _renderItem2({item,index}){

    //map categories to array of titles
    let getCategoriesArray = item.categories.map((category) => {
      return category['title'];
    });

    //slice and join categegories toghether with commas and 'and' when at the last element. 
    let getCategories = [getCategoriesArray.slice(0, -1).join(', '), getCategoriesArray.slice(-1)[0]].join(getCategoriesArray.length < 2 ? '' : ' and ');
    
    
    return (
      <TouchableOpacity
        onPress={
          
          //do things
          () => this.setState({
            flow: 'approveNewProposalPickTime',
            placeImage: item.image_url,
            placeName: item.name,
            placeCoordinatesLat: item.coordinates.latitude,
            placeCoordinatesLong: item.coordinates.longitude,
            placeUrl: item.url

            
            
         })
      
      }
        style={{
          flex: 1,
          alignItems: 'center',
          borderRadius: 50,
          padding: 20,
          marginTop: 20,
          marginBottom: 20,
          shadowOffset: {
            width: 4,
            height: 4,
          },
          shadowOpacity: 0.5,
          shadowRadius: 4.65
        }}>

          <ImageBackground
              //style={{width : '100%', height: 275, borderRadius: 50}}
              imageStyle={{ borderRadius: 50}}
              //source={{uri : item.uri}}
              source={{uri: item.image_url}}
              style={{width: '100%', height: '100%'}} >
              <LinearGradient 
                  colors={['#00000000', 'black']} 
                  style={{flex: 1, justifyContent: 'flex-end', alignItems: 'center', padding: 15, height : '100%', width : '100%', borderRadius: 50}}>
                  <Text 
                    onPress={() => {Linking.openURL(item.url)}}
                    style={{fontSize: 20, padding: 0, lineHeight: 20, paddingBottom: 0, color: primaryColor, textAlign: 'center', fontFamily: 'HelveticaNeue', fontWeight: 'bold'}}>{item.name}
                  </Text>
                  <Text style={{fontSize: 12, lineHeight: 15, paddingLeft: 10, paddingRight: 10, color: 'grey', textAlign: 'center', fontFamily: 'HelveticaNeue',}}>{getCategories}</Text>

              </LinearGradient>

          </ImageBackground>


      </TouchableOpacity>

    )
}

//get pagination of date type slider
get pagination () {
  const { carouselItems, activeSlide } = this.state;
  return (

      <Pagination
          dotsLength={carouselItems.length}
          activeDotIndex={activeSlide}
          containerStyle={{ 
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignContent: 'flex-end',
            //backgroundColor: 'blue',
            padding: 0,
            marginBottom: 0 
          }}
          dotStyle={{
              width: 15,
              height: 15,
              borderRadius: 10,
              marginHorizontal: 0,
              backgroundColor: primaryColor
          }}
          inactiveDotStyle={{
              backgroundColor: 'white'
              // Define styles for inactive dots here
          }}
          inactiveDotOpacity={0.4}
          inactiveDotScale={0.6}
        />
    

  );
}


    //function to get dates from yelp
    _getDates = async () => {
      console.log('start _getDates function');
     
      try {
        let response = await fetch(
          'https://us-central1-blurred-195721.cloudfunctions.net/getDates?lat='+this.state.proposedLat+'&long='+this.state.proposedLong+'&type='+this.state.dateType
          //'http://127.0.0.1:5001/blurred-195721/us-central1/getDates?lat='+this.state.proposedLat+'&long='+this.state.proposedLong+'&type='+this.state.dateType

          );
        let json = await response.json();
        let businesses = json.jsonBody.businesses //array of business
        
        //console.log('json is: '+JSON.stringify(json));
        //console.log(businesses[0].name);

        //put array of business into state for carousel to reference. 
        this.setState({
          yelpDates: businesses,
          randomDateIndex: businesses[Math.floor(Math.random()*businesses.length)]
        })

        console.log('yelp dates in state now');
        console.log('yelp dates are (in state): '+this.state.yelpDates);


        //return json.movies;


      } catch (error) {
         console.error(error);
      }
      
    }



  _manageBlindDate = ( newStatus) => {

          //route to payments if out of free blind dates
          //this.props.navigation.navigate("Payments", { flow: 'peek'})
  
          //record in analytics the event that a date status was updated 
          RNfirebase.analytics().logEvent('dateStatusUpdated', {
            dateStatusUpdated: newStatus
          });
                                      
          //create ref to list of dates 
          let datesRef1 = firebase.database().ref('dates/'+this.state.conversationId);
          let datesRef2 = firebase.database().ref('conversations/'+this.state.conversationId+'/date');
          let datesRef3 = firebase.database().ref('matches/'+this.state.userIdMatch+'/'+this.state.userId);
          let datesRef4 = firebase.database().ref('matches/'+this.state.userId+'/'+this.state.userIdMatch);

          //save system message that blind date status has changed. 
          let conversationsRef = firebase.database().ref('/conversations/'+this.state.conversationId+'/messages/');

          //compute system message to display
          //show date requested in all cases except when accepted - show, date accepted.
          let systemMessage = ( (newStatus == 'pending') || (newStatus == 'pendingUpdate') || (newStatus == 'declined') ) ? 'Date requested.' : 'Date accepted.';
              
          
          //when new status is accepted, update with these values. 
          if(newStatus == 'accepted'){

            //day, month, year. - but no time (hour and min)
            const confirmedTime = new Date(this.state.proposedTimeTimeStamp);
            console.log('confirmedTime is initally: '+confirmedTime);

            // timeString from UX -10am,10:30am,...
            const timeString = this.state.dateTypeTime[this.state.dateType].timeSliderValues[this.state.timeSelectedIndex]; //hour and min
            console.log('timeString is: '+timeString);
            
            // split the time string into hours and minutes
            const convertTimeString = (timeString) => {
              let hours = parseInt(timeString.slice(0, timeString.indexOf(':')));
              let minutes = parseInt(timeString.slice(timeString.indexOf(':') + 1, timeString.indexOf(' ')));
              let ampm = timeString.slice(-2);
              if (ampm === "PM" && hours !== 12) {
                hours += 12;
              } else if (ampm === "AM" && hours === 12) {
                hours = 0;
              }
              return { hours, minutes };
            }

            //convert timestrings to ints for hours and min. 
            let timeHours = convertTimeString(timeString).hours;
            let timeMinutes = convertTimeString(timeString).minutes;
            console.log('timeHours is: '+timeHours);
            console.log('timeMinutes is: '+timeMinutes);

            
            //CONFIRM WHY MINUTES IS NOT REFLECTING 15,30, OR 45 VALUES
            //CONFIRM WHY CONVERTING TO UTC TIME IS DOUBLE CONVERTING OR - looks like i wasn't converting utc time back to local in UX...
              //1. convert time to UX when saving to db. 
              //2. convert time back to local time when reading from db. 

            // format and set the hours and minutes as a 24-hour time string
            //confirmedTime.setHours(timeHours + (this.state.utc_offset_min/60)); // set the hours to confirmed
            confirmedTime.setHours(timeHours); // set the hours to confirmed
            confirmedTime.setMinutes(timeMinutes); // set the hours to confirmed
            console.log('confirmedTime after adjusting for UTC hours:'+ confirmedTime);

            //convert confirmed to time to timestamp and ajust for UTC offset - 
            let confirmedTimeUTC = confirmedTime.getTime()  // Pass the confirmedTime Date object itself

            console.log('confirmedTimeUTC now is: '+new Date(confirmedTimeUTC));


            //update date object
            datesRef1.update({
              status: newStatus,
              confirmedTime: confirmedTimeUTC,
              seen: false,
              //placeAddress: this.state.yelpDates[randomDate].location.address1,
              placeName: this.state.placeName,
              confirmedLat: this.state.placeCoordinatesLat,
              confirmedLong: this.state.placeCoordinatesLong,
              placeUrl: this.state.placeUrl,
              imageUrl: this.state.placeImage,
            })
            
            datesRef2.update({
              status: newStatus,
              confirmedTime: confirmedTimeUTC,
              seen: false,
              //placeAddress: this.state.yelpDates[randomDate].location.address1,
              placeName: this.state.placeName,
              confirmedLat: this.state.placeCoordinatesLat,
              confirmedLong: this.state.placeCoordinatesLong,
              placeUrl: this.state.placeUrl,
              imageUrl: this.state.placeImage,
            }) 

            datesRef3.update({
              status: newStatus,
              confirmedTime: confirmedTimeUTC,
              seen: false,
              //placeAddress: this.state.yelpDates[randomDate].location.address1,
              placeName: this.state.placeName,
              confirmedLat: this.state.placeCoordinatesLat,
              confirmedLong: this.state.placeCoordinatesLong,
              placeUrl: this.state.placeUrl,
              imageUrl: this.state.placeImage,
            }) 

            datesRef4.update({
              status: newStatus,
              confirmedTime: confirmedTimeUTC,
              //seen: false,
              //placeAddress: this.state.yelpDates[randomDate].location.address1,
              placeName: this.state.placeName,
              confirmedLat: this.state.placeCoordinatesLat,
              confirmedLong: this.state.placeCoordinatesLong,
              placeUrl: this.state.placeUrl,
              imageUrl: this.state.placeImage,
            }) 

            //push new system message that date has been managed. This will put conversation to top of messages. 
              conversationsRef.push({
              text: systemMessage, 
              notify: false,
              system: true,
              user: this.state.userId, 
              userTo: this.state.userIdMatch,
              createdAt: firebase.database.ServerValue.TIMESTAMP
            });


            //update state to flow = confirmationNextWaiting
            this.setState({
              flow: 'detailsShow',
              confirmedTime: confirmedTimeUTC,
              confetti: true
            })

            //start confetti
            this._confettiView.startConfetti();

          }else{ //else update with these values


            //push new conversation to profile object.
            datesRef1.update({
              created: Date.now(),
              type: this.state.dateType,
              status: newStatus,
              proposedTime: this.state.proposedTimeTimeStamp,
              utc_offset_min: this.state.utc_offset_min,
              proposedLat: (this.state.proposedLat ? this.state.proposedLat : this.state.latitudeMatch ), 
              proposedLong: (this.state.proposedLat ? this.state.proposedLong : this.state.longitudeMatch ),
              priceMax: (newStatus == 'declined' ? 2 : this.state.priceMax )  ,
              userCreator: this.state.userId,
              userInvited: this.state.userIdMatch,
              initiatedById: this.state.userId,
              reservationFirstName: this.state.reservationFirstName,
              reservationLastName: this.state.reservationLastName,
              waitingOnId: this.state.userIdMatch,
              fcmToken: this.state.notifyFcmToken,
            });

            //push updated status to conversation object in fb, so that chat page can render date's status in button. 
            datesRef2.update({
              status: newStatus,
              type: this.state.dateType,
              initiatedById: this.state.userId,
              waitingOnId: this.state.userIdMatch,
              reservationFirstName: this.state.reservationFirstName,
              reservationLastName: this.state.reservationLastName,
              proposedTime: this.state.proposedTimeTimeStamp,
              utc_offset_min: this.state.utc_offset_min,
              proposedLat: (this.state.proposedLat ? this.state.proposedLat : this.state.latitudeMatch ), 
              proposedLong: (this.state.proposedLat ? this.state.proposedLong : this.state.longitudeMatch ),
              priceMax: (newStatus == 'declined' ? 2 : this.state.priceMax )  ,
              fcmToken: this.state.notifyFcmToken,
            });

            //push new date info to match objects.
            datesRef3.update({
              date_status: newStatus,
              type: this.state.dateType,
              priceMax: (newStatus == 'declined' ? 2 : this.state.priceMax )  ,
              proposedTime: this.state.proposedTimeTimeStamp,
              date_waiting_on: this.state.userIdMatch,
              utc_offset_min: this.state.utc_offset_min,
              last_message: systemMessage,
              last_message_date: (new Date().getTime()*-1), 
              //blur: this.state.blur,
              showNotification: true,
              seen: (newStatus == 'declined' || newStatus == 'fulfill')? true : false, //make sure the modal opens for the match (unless declined or in fulfill), since an update has happened to the date. 
              notificationType: newStatus,
              unread_message: (this.state.removed == true) ? false : true //if conversation is removed dont set unread messages to true. 
            });

          
            //push new date info to match objects.
            datesRef4.update({
              date_status: newStatus,
              type: this.state.dateType,
              priceMax: (newStatus == 'declined' ? 2 : this.state.priceMax )  ,
              proposedTime: this.state.proposedTimeTimeStamp,
              utc_offset_min: this.state.utc_offset_min,
              date_waiting_on: this.state.userIdMatch,
              last_message: systemMessage,
              last_message_date: (new Date().getTime()*-1), 
              //showNotification: true,
              //notificationType: newStatus,
              //blur: this.state.blur
            });



            //push new system message that date has been managed. This will put conversation to top of messages. 
            conversationsRef.push({
              text: systemMessage, 
              notify: false,
              system: true,
              user: this.state.userId, 
              userTo: this.state.userIdMatch,
              createdAt: firebase.database.ServerValue.TIMESTAMP
            });

          //notification handled via cloud functions
            
              //update state to flow = confirmationNextWaiting
              this.setState({
                flow: 'waitingAcceptanceNewProposal',
              })

              //show confetti after creating/accepted/proposing a new date
              if(this._confettiView) {
                this._confettiView.startConfetti();
            }
          }

          



  }


  render() {

    let deviceWidth = Dimensions.get('window').width


    // convert priceMax into dollar sign string -- CONVERT TO INLINE FOR LOOP
    switch (this.state.priceMax) {
      case 1:
        priceMax = '$';
        break;
      case 2:
        priceMax = '$$';
        break;
      case 3:
        priceMax = '$$$';
        break;
      case 4:
        priceMax = '$$$$';
        break;
      case 5:
        priceMax = '$$$$$';
        break;
    }

    switch(this.state.dateType) {
      case 'cocktails':
        whichText = 'Which bar?'; //bars
        // openAt = new Date(date.proposedTime).setHours(20 + utc_offset, 30, 0); //8:30pm
        break;
      case 'coffee':
        whichText = 'Which coffee shop?'; //bars
        // openAt = new Date(date.proposedTime).setHours(11 + utc_offset, 30, 0); //11:30am
        break;
      case 'gallery':
        whichText = 'Which art gallery?'; //bars
        // openAt = new Date(date.proposedTime).setHours(15 + utc_offset, 30, 0); //3:30pm          
        break;
      case 'park':
        whichText = 'Which park?'; //bars
        // openAt = new Date(date.proposedTime).setHours(12 + utc_offset, 30, 0); //12:30am
        break;
      case 'museum':
        whichText = 'Which museum?'; //bars
        // openAt = new Date(date.proposedTime).setHours(15 + utc_offset, 30, 0); //3:30pm
        break;
      case 'tea':
        whichText = 'Which tea place?'; //bars
        // openAt = new Date(date.proposedTime).setHours(11 + utc_offset, 30, 0); //11:30am
        break;
      case 'dessert':
        whichText = 'Which dessert place?'; //bars
        // openAt = new Date(date.proposedTime).setHours(19 + utc_offset, 30, 0); //7:30pm
        break;
      case 'hookah':
        whichText = 'Which hookah bar?'; //bars
        // openAt = new Date(date.proposedTime).setHours(20 + utc_offset, 30, 0); //8:30pm
        break;
      default:
        whichText = 'Which place?'; //bars
        // openAt = new Date(date.proposedTime).setHours(20 + utc_offset, 30, 0); //8:30pm
    }

      // convert timeSelectedIndex into time 
      switch (this.state.timeSelectedIndex) {

        //convert timeSelectedIndex to human readable time. 
        //use date object, so that can also use in data model. 
        case 1:
          timeSelectedIndex = '1';
          break;
        case 2:
          timeSelectedIndex = '11:30am';
          break;
        case 3:
          timeSelectedIndex = '3';
          break;
        case 4:
          timeSelectedIndex = '4';
          break;
        case 5:
          timeSelectedIndex = '5';
          break;
      }


    //save which index the of the carrousal items have the current date type's content, in order to pick the right image. 
    const dateTypeindex = this.state.carouselItems.findIndex(object => {
      return object.type === this.state.dateType;
    });
    
      
    return (
      <Container style={{ flex: 1, alignItems: 'center', backgroundColor: 'black'  }}>
        <StatusBar hidden={true} />


        <Modal 
            visible={this.state.showModal} 
            transparent={true}
            animationType="slide">
                  
              <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)'}}>
               
            
               
               <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>

                  <Text style={{
                    color: 'white',
                    textAlign: 'center', 
                    fontFamily: 'Helvetica-Light',
                    fontSize: 32,
                    //width: deviceWidth-130,
                    margin: 15,
                    }}>Personalize your date {'\n'} or surprise me?
                  </Text>
                  <Button 
                        rounded
                        onPress={() => 
                          { 
                            this.setState({showModal: false, flow: 'approveNewProposalPickLocation'})
                            //if match is active or date has been set up (in status fulfill or accepted) go to blindDate module, if it's expired alert that chat needs to be extended first
                          }
                        }
                        style={{
                          //marginLeft: deviceWidth/5,
                          width: deviceWidth-80,
                          margin: 10,
                          justifyContent: 'center',
                          backgroundColor: primaryColor,
                          borderRadius: 50,
                          shadowColor: "#000",
                          shadowOffset: {
                            width: 0,
                            height: 3,
                          },
                          shadowOpacity: 0.29,
                          shadowRadius: 4.65,
                        }}>
                        <Text style={{fontFamily:'Helvetica-Light'}}>Personalize date</Text>
                      </Button>
                      <Button 
                          rounded
                          bordered
                          onPress={() => 
                            { 
                              this._manageBlindDate('fulfill'), this.setState({flow: 'proposalAccepted', confetti: true, showModal: false})
                              //if match is active or date has been set up (in status fulfill or accepted) go to blindDate module, if it's expired alert that chat needs to be extended first
                            }
                          }

                          style={{
                            //marginLeft: deviceWidth/5,
                            width: deviceWidth-80,
                            margin: 10,
                            justifyContent: 'center',
                            borderColor: primaryColor,
                            borderRadius: 50,
                            shadowColor: "#000",
                            shadowOffset: {
                              width: 0,
                              height: 3,
                            },
                            shadowOpacity: 0.29,
                            shadowRadius: 4.65,
                          }}>
                            <Text style={{fontFamily:'Helvetica-Light', color: primaryColor}}>Surprise me</Text>
                        </Button>
                        <Text style={{
                          color: 'white',
                          textAlign: 'center', 
                          fontFamily: 'Helvetica-Light',
                          fontSize: 16,
                          //width: deviceWidth-130,
                          margin: 15,
                          }}>You can always personalize later.
                        </Text>
                    </View>
              </View>

            </Modal> 



                {/* top section */}
                <LinearGradient 
                  colors={[primaryColor, primaryColor]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1.5, y: 2.5 }}
                  style={{flex: 2, justifyContent: 'center', alignItems: 'center', width: deviceWidth, backgroundColor: primaryColor}}>
                    
                    <Confetti confettiCount={1000} ref={(node) => this._confettiView = node}/>

                    <View style={{
                      flex: 1, 
                      //minWidth: deviceWidth-80,
                      //backgroundColor: '#1C1C24',
                      borderRadius: 30,
                      paddingLeft: 30,
                      paddingRight: 30,
                      justifyContent: 'center', 
                      marginLeft: 10,
                      marginRight: 10,
                      marginTop: 40,
                      marginBottom: 20 }}>
                        <Text 
                           style={{ 
                            color: 'white', 
                            fontSize: 32,
                            fontWeight: '900', 
                            fontFamily:'HelveticaNeue',
                            shadowColor: "#000",
                            shadowOffset: {
                              width: 0,
                              height: 3,
                            },
                            shadowOpacity: 0.29,
                           shadowRadius: 4.65,}}>{this.state.subheader[this.state.flow]}</Text>
                        {/* <Text  
                          style={{ 
                            color: 'white', 
                            fontFamily:'HelveticaNeue',
                            fontSize: 30, 
                            color: 'white'}}>
                              {this.state.subheader[this.state.flow]}
                        </Text> */}

                    </View>


                </LinearGradient>
                
                <View                   
                  style={{flex: 10, justifyContent: 'center', alignItems: 'center', width: deviceWidth, backgroundColor: '#1C1C24' }}>
                  <View  contentContainerStyle={{flex: 1,}}>


                  { ((this.state.flow == 'createNewProposal' || this.state.flow == 'updateProposal') && this.state.createNewProposalStep == 'type') && // select type of date module


                        <View style = {{
                          flex: 2,
                          borderColor:'grey',
                          borderTopWidth:0.6,
                          borderBottomWidth:0.6,
                          justifyContent: 'center',
                          alignItems: 'center',
                          //marginBottom: 15,
                          }}>

                          <Text 
                           style={{ 
                            color: 'white', 
                            fontSize: 25,                       
                            fontFamily:'HelveticaNeue',
                            shadowColor: "#000",
                            shadowOffset: {
                              width: 0,
                              height: 3,
                            },
                            shadowOpacity: 0.29,
                           shadowRadius: 4.65,}}>What type of date?</Text> 
                        </View>

                    }

                    {/* { (this.state.flow == 'approveNewProposal' || this.state.flow == 'approveUpdatedProposal' || this.state.flow == 'proposalAccepted' || this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide' || this.state.flow == 'proposalUpdated'|| this.state.flow == 'waitingAcceptanceNewProposal' || this.state.flow == 'waitingAcceptanceUpdatedProposal' || this.state.createNewProposalStep == 'confirm' ) && // map */}
                    {/* { ( this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide'  ) && // map */}
                    { false && // map

                      

                        <MapView

                        style={{ 
                          flexGrow: 3, 
                          minWidth: deviceWidth,
                          //backgroundColor: 'grey',
                          //paddingBottom: 20,
                          //justifyContent: 'center',
                          //marginBottom: 20,
                          
                        }}
                        //provider={MapView.PROVIDER_GOOGLE}
                        //customMapStyle={mapStyle} //need to setup googlemap support and use generated JSON styling:  https://github.com/react-native-maps/react-native-maps/issues/693#issuecomment-262656417
                        region={{
                          latitude: (this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') ? ( this.state.confirmedLat) : (this.state.proposedLat ? this.state.proposedLat : this.state.latitudeMatch) , //check if on details page, then show confirmed lat/longs. If not on details page and proposed lat/longs exist, show proposed lat/longs, else show match lat/longs. 
                          longitude: (this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') ? ( this.state.confirmedLong) : (this.state.proposedLong ? this.state.proposedLong :this.state.longitudeMatch) ,
                          latitudeDelta: ((this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide')) ? 0.0108 : this.state.latitudeDeltaMatch,
                          longitudeDelta: ((this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide')) ? 0.0208 : this.state.longitudeDeltaMatch,

                                                  

                        }}
                        userInterfaceStyle={'dark'}
                        initialRegion={{
                          latitude: (this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') ? ( this.state.confirmedLat) : (this.state.proposedLat ? this.state.proposedLat : this.state.latitudeMatch) , //check if on details page, then show confirmed lat/longs. If not on details page and proposed lat/longs exist, show proposed lat/longs, else show match lat/longs. 
                          longitude: (this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') ? ( this.state.confirmedLong) : (this.state.proposedLong ? this.state.proposedLong :this.state.longitudeMatch) ,
                          
                          
                          latitudeDelta: ((this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide')) ? 0.0108 : this.state.latitudeDeltaMatch,
                          longitudeDelta: ((this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide')) ? 0.0208 : this.state.longitudeDeltaMatch,



                          // latitudeDelta: (this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') ? 0.0108 : this.state.latitudeDeltaMatch , //check if on details page, then show confirmed lat/longs. If not on details page and proposed lat/longs exist, show proposed lat/longs, else show match lat/longs. 
                          // longitudeDelta: (this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') ? 0.0108 : this.state.longitudeDeltaMatch , //check if on details page, then show confirmed lat/longs. If not on details page and proposed lat/longs exist, show proposed lat/longs, else show match lat/longs. 
                          
                          // latitudeDelta: ((this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') || this.state.flow == 'approveNewProposal') ? 0.0108 : this.state.latitudeDeltaMatch,
                          // longitudeDelta: ((this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') || this.state.flow == 'approveNewProposal') ? 0.0208 : this.state.longitudeDeltaMatch



                          // latitudeDelta: ((this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') || this.state.flow == 'proposalAccepted') ? 0.0108 : this.state.latitudeDeltaMatch,
                          // longitudeDelta: ((this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') || this.state.flow == 'proposalAccepted') ? 0.0108 : this.state.longitudeDeltaMatch

                        
                        }}>
                          <MapView.Circle
                            center = { {
                                                          
                              latitude: (this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') ? ( this.state.confirmedLat) : (this.state.proposedLat ? this.state.proposedLat : this.state.latitudeMatch) , //check if on details page, then show confirmed lat/longs. If not on details page and proposed lat/longs exist, show proposed lat/longs, else show match lat/longs. 
                              longitude: (this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide') ? ( this.state.confirmedLong) : (this.state.proposedLong ? this.state.proposedLong : this.state.longitudeMatch) ,
    
                          } }
                            radius = { ((this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide')) ? 50 : 2500 }
                            
                            
  
                           
                           
                            strokeWidth = { 0.5 }
                            strokeColor = { 'black' }
                            fillColor = { 'rgba(168,58,89,0.6)' }
                            //onRegionChangeComplete = { this.onRegionChangeComplete.bind(this) }
                          />     

                        </MapView>
                    }
                   
                   
                   
                    { (this.state.flow == 'approveNewProposal' || this.state.flow == 'approveUpdatedProposal' || this.state.flow == 'proposalAccepted' ||  this.state.flow == 'proposalUpdated'|| this.state.flow == 'waitingAcceptanceNewProposal' || this.state.flow == 'waitingAcceptanceUpdatedProposal' || this.state.createNewProposalStep == 'confirm' ) && // show stock image, since place isn't confirmed yet
                      // approveNewProposal
                      // waitingAcceptanceNewProposal
                      // approveUpdatedProposal
                      // waitingAcceptanceUpdatedProposal
                      // proposalAccepted

                        <ImageBackground
                          source={this.state.carouselItems[dateTypeindex].imageSrc}
                          style={{
                            flex: 3,
                            borderColor:'grey',
                            borderTopWidth:0.6, 
                            }} >
                          <LinearGradient 
                              start={{x: 0.5, y: 0}} end={{x: 0.5, y: 1}} 
                              //colors={['#00000000', '#1C1C24']} 
                              colors={[ 'transparent', 'black', ]}
                              style={{flex: 1, }}>
                          </LinearGradient>
                        </ImageBackground>
                    }

                    { (this.state.flow == 'detailsHide' || this.state.flow == 'detailsShow' || this.state.flow == 'approveNewProposalPickTime'  ) && // show image of place pulled from yelp
                      //detailsShow
                      //detailsHide

                        <ImageBackground
                          source={{uri : this.state.placeImage}}
                          style={{
                            flex: 3,
                            borderColor:'grey',
                            borderTopWidth:0.6,
                          }} >
                          <LinearGradient 
                              start={{x: 0.5, y: 0}} end={{x: 0.5, y: 1}} 
                              colors={[ 'transparent', 'black', ]}
                              style={{flex: 1, }}>
                          </LinearGradient>
                        </ImageBackground>
                    }
                  


                    <View style={{  
                      flex: 5, 
                      //backgroundColor: 'red', 
                      //justifyContent: 'center', 
                      alignContent: 'center', 
                      marginTop: 0,  }}>                
                     


                    { (this.state.flow == 'approveNewProposal' || this.state.flow == 'approveNewProposalPickLocation' || this.state.flow == 'approveUpdatedProposal' || this.state.flow == 'proposalAccepted' || this.state.flow == 'proposalUpdated' || this.state.flow == 'waitingAcceptanceNewProposal' || this.state.flow == 'waitingAcceptanceUpdatedProposal' || this.state.createNewProposalStep == 'confirm' ) && // date details module
                        <View style={{
                          flex: 7, 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          //backgroundColor: 'blue'
                          
                          }}>

                              <View 
                                  style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    borderColor:'grey',
                                    borderTopWidth:0.6,
                                    borderBottomWidth:0.6,
                                    padding: 0
                                  }}
                                >

                                  <TouchableOpacity
                                    onPress = {() =>  this.props.navigation.navigate("Profile", {profile: this.state.profile, conversationId: this.state.conversationId, blur: this.state.blur, from: 'BlindDate',})}
                                    style={{flex: 1, flexDirection: 'row', justifyContent: 'center',}}
                                    >
                                    <View style={{flex: 1, padding: 0,  alignItems: 'center', flexDirection: 'row', justifyContent: 'center'}}>

                                    <Thumbnail 
                                        blurRadius={Number(this.state.blur)}
                                        style={{
                                          marginRight: 10,
                                          shadowColor: "#000",
                                          shadowOffset: {
                                            width: 0,
                                            height: 3,
                                          },
                                          shadowOpacity: 0.8,
                                          shadowRadius: 4.65,
                                          width: 45, 
                                          height: 45, 
                                          //overflow: "hidden", 
                                          borderRadius: 150, 
                                          borderWidth: 0.6, 
                                          borderColor: 'grey' }} 
                                        source={{
                                          uri: this.state.profile.images[0].url,
                                          cache: 'force-cache'}} 
                                      />
                                      <View style={{}}>
                                        <Text style={{color: primaryColor, fontSize: 20, fontFamily: 'Helvetica-Light', textTransform: 'capitalize' }}>{this.state.profile.name} | {this._getAge(this.state.profile.birthday)}</Text>
                                        <Text style={{color: 'white', fontSize: 20, fontFamily: 'Helvetica-Light' }}>{this.state.profile.city_state}</Text>
                                      </View>

                                    </View>


                                  </TouchableOpacity>

                                </View>

                                <View 
                                  style={{
                                    width: deviceWidth,
                                    //padding: 15,
                                    borderColor:'grey',
                                    borderBottomWidth:0.6,
                                    flex: 1,
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                    }}>
                                  <Text style={{fontFamily: 'Helvetica-Light', textAlign: 'center', color: 'grey', fontSize: 16, marginBottom: 5}}>{new Date(this.state.proposedTimeTimeStamp).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>  
                                  <Text style={{fontFamily: 'Helvetica-Light', textAlign: 'center', color: 'grey', fontSize: 16}}>Sometime between {this.state.dateTypeTime[this.state.dateType].timeRange}</Text>  
                                </View>
                     
                      </View>
                      }

                    { (this.state.flow == 'proposalAccepted' || (this.state.flow == 'createNewProposal' && this.state.createNewProposalStep == 'confirm') || this.state.flow == 'approveNewProposal' || this.state.flow == 'waitingAcceptanceNewProposal' || this.state.flow == 'approveUpdatedProposal' || this.state.flow == 'waitingAcceptanceUpdatedProposal' ) && // main content module
                      
                        <View style={{ //main content module
                          flex: 6, 
                          //backgroundColor: 'blue',
                          //maxHeight: 200,
                          width: deviceWidth,
                          //paddingBottom: 20,
                          justifyContent: 'center', 
                          //marginLeft: 35,
                          //marginRight: 35,     
                          }}>
                            <Text style={{ fontFamily: 'Helvetica-Light', textAlign: 'center', lineHeight: 25, padding: 25, color: 'white', fontSize: 18}}>{this.state.mainCopySecondary[this.state.flow]}</Text>
                        </View>
                        
                        }





                        


                        { (this.state.flow == 'createNewProposal' && this.state.createNewProposalStep == 'price') && // price module
                        <View style={{
                          flexGrow: 1, 
                          minWidth: deviceWidth-80,
                          //backgroundColor: 'blue',
                          //borderRadius: 30,
                          padding: 40,
                          justifyContent: 'center', 
                          alignItems: 'center',
                          // marginLeft: 40,
                          // marginRight: 40,
                          //marginTop: 20
                          }}>
                          
                          <Text style={{fontFamily: 'Helvetica-Light', textAlign: 'left', color: 'white', fontSize: 28, marginBottom: 60, marginTop: 60, width: 300 }}>What's your maximum price range?</Text> 

                          <Text style={{fontFamily: 'Helvetica-Light', textAlign: 'center', color: 'white', fontSize: 20}}>Price Range: {priceMax}</Text>
                          <Slider
                            step={1}
                            minimumValue={1}
                            maximumValue={5}
                            style={{width: 280, height: 75}}
                            minimumTrackTintColor={'grey'}
                            maximumTrackTintColor={'grey'}
                            thumbTintColor={primaryColor}
                            value={this.state.priceMax}
                            onValueChange={(val) => 
                              this.setState({ priceMax: val})
                            }
                          />
                          <Text style={{fontFamily: 'Helvetica-Light', paddingTop: 15, textAlign: 'center', color: 'grey', lineHeight: 25, fontSize: 16}}>Based off Yelp.</Text>  

                        </View>
                        }
                         
                         
                         



                        { ((this.state.flow == 'createNewProposal' || this.state.flow == 'updateProposal') && this.state.createNewProposalStep == 'type') && // select type of date module
                        
                        <View style={{
                          flex: 1, 
                          minWidth: deviceWidth,
                          backgroundColor: 'white',
                          justifyContent: 'flex-start', 
                          alignItems: 'center',
                          marginBottom: 15,
                          }}>

                          <View style={{ flex: 1, flexDirection:'row', justifyContent: 'center', alignContent: 'center', backgroundColor: '#D7D7D7',  }}>
                            <Carousel
                              layout={"default"}
                              loop={true}
                              ref={ref => this.carousel = ref}
                              data={this.state.carouselItems}
                              sliderWidth={deviceWidth}
                              removeClippedSubviews={false}
                              itemWidth={deviceWidth-110}
                              firstItem={this.state.activeIndex}
                              renderItem={this._renderItem}
                              onSnapToItem={(index) => this.setState({ activeSlide: index, activeIndex: index }) }
                            />
                          </View>


                        </View>
                        }


                        { ((this.state.flow == 'createNewProposal' || this.state.flow == 'updateProposal') && this.state.createNewProposalStep == 'date') && // select date module
                        
                        <View style={{
                          flex: 1, 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          }}>
                          
                          <View style={{
                              borderColor:'grey',
                              flex: 2,
                              justifyContent: 'center',
                              borderBottomWidth:0.6,
                              borderTopWidth:0.6,
                          }}>
                            <Text style={{
                              width: deviceWidth,
                              fontFamily: 'Helvetica-Light', 
                              textAlign: 'center', 
                              color: 'white', 
                              fontSize: 25, 
                              padding:25
                            }}>When are you free{'\n'}for a {this.state.dateType} date?
                            </Text> 
                          </View>
  


                          <View style={{
                            flex: 3,
                            //margin: 40,
                            justifyContent: 'center'
                          }}>

                          <Text style={{width: 300, fontFamily: 'Helvetica-Light', textAlign: 'center', color: 'white', fontSize: 20}}> {(this.state.proposedTime < 5) ? 'This' : 'Next' } {new Date(this.state.proposedTimeTimeStamp).toLocaleDateString('en-US', {weekday: 'long', })}</Text> 
                          
                            <Slider
                              step={1}
                              minimumValue={0}
                              maximumValue={6}
                              style={{width: 280, height: 75}}
                              minimumTrackTintColor={'grey'}
                              maximumTrackTintColor={'grey'}
                              thumbTintColor={primaryColor}
                              value={this.state.proposedTime}
                              onValueChange={(val) => 
                                this.setState({proposedTimeTimeStamp: (new Date().getTime() + (86400000 * val)), proposedTime: val})

                              }
                            />
                                <Text style={{fontFamily: 'Helvetica-Light', textAlign: 'center', color: 'grey', fontSize: 16, marginBottom: 5}}>{new Date(this.state.proposedTimeTimeStamp).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>  
                                <Text style={{fontFamily: 'Helvetica-Light', textAlign: 'center', color: 'grey', fontSize: 16}}>Sometime between {this.state.dateTypeTime[this.state.dateType].timeRange}</Text>  

                          </View>
                        </View>
                        }
                        

                        { (this.state.flow == 'detailsShow' || this.state.flow == 'detailsHide' || this.state.flow == 'approveNewProposalPickTime' )  && // detail module
                      <View style={{
                        borderColor:'grey',
                        borderTopWidth:0.6
                        }}>


                        { !( this.state.flow == 'approveNewProposalPickTime' )  && 
                        <View style={{
                          flexDirection: 'row', 
                          padding: 10,
                          width: deviceWidth,
                          // borderColor:'grey',
                          // borderTopWidth:0.6
                        }}>                          
                          <TouchableOpacity
                            onPress = {() =>  this.props.navigation.navigate("Profile", {profile: this.state.profile, conversationId: this.state.conversationId, blur: this.state.blur, from: 'BlindDate',})}
                            style={{
                              flex:1, 
                              flexDirection: 'row', 
                              justifyContent: 'center', 
                              alignItems: 'center'}}
                            >
                            <Thumbnail 
                              blurRadius={Number(this.state.blur)}
                              style={{
                                //flex: 1,
                                justifyContent: 'center',
                                marginRight: 15,
                                shadowColor: "#000",
                                shadowOffset: {
                                  width: 0,
                                  height: 3,
                                },
                                shadowOpacity: 0.8,
                                shadowRadius: 4.65,
                                width: 45, 
                                height: 45, 
                                //overflow: "hidden", 
                                borderRadius: 150, 
                                borderWidth: 0.6, 
                                borderColor: 'grey' }} 
                              source={{
                                uri: this.state.profile.images[0].url,
                                cache: 'force-cache'}} 
                            />
                          <View style={{flexDirection: 'column', }}>
                            <Text style={{color: primaryColor, fontSize: 20, fontFamily: 'Helvetica-Light'  }}>{this.state.profile.name} | {this._getAge(this.state.profile.birthday)}</Text>
                            <Text style={{color: 'white', fontSize: 20, fontFamily: 'Helvetica-Light', }}>{this.state.profile.city_state}</Text>
                          </View>
                        </TouchableOpacity>
                      </View>

                        }

                        { !( this.state.flow == 'approveNewProposalPickTime' )  && 

                        <View  
                          style={{
                            flexDirection: 'row', 
                            justifyContent: 'center',
                            width: deviceWidth,
                            padding: 20,
                            borderColor:'grey',
                            borderBottomWidth:0.6,
                            borderTopWidth:0.6
                          }}>
                            <Text style={{ fontFamily: 'Helvetica-Light', color: 'white', fontSize: 20}}> {new Date(this.state.confirmedTime).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true}  )  }</Text>                          

                        </View>
                        }



                        <View style={{
                          justifyContent: 'center', 
                          alignItems: 'center',
                          //backgroundColor: 'blue',
                          //padding: 10,
                          }}>
                          <View 
                            style ={{
                              //backgroundColor: 'blue', 
                              width: deviceWidth,
                              padding: 20,
                              borderColor:'grey',
                              borderBottomWidth:0.6
                            }}>

                            <TouchableOpacity 
                              onPress={() => Linking.openURL(this.state.placeUrl)} //use lat and long of restaurant here. 
                              style ={{
                                //flexGrow: 1,
                                flexDirection: this.state.placeName.length > 18 ? 'column' : 'row', //if long placeName style as column, if short name style as row.
                                justifyContent: 'center',
                                alignItems: 'center',
                                alignContent: 'flex-end',
                                //backgroundColor: 'blue',
                                //width: deviceWidth - 50
                              }}
                            > 
                              <Text style={{ fontSize: 20, textAllign: 'right', fontFamily: 'Helvetica-light', color: primaryColor, textTransform: 'capitalize',  }}>{this.state.dateType+ ' @ '}</Text>               
                              <Text numberOfLines={1} ellipsizeMode='tail' style={{ fontSize: 20, marginLeft: (this.state.placeName.length > 18) ? 20 : 0, marginRight: (this.state.placeName.length > 18) ? 20 : 0, fontFamily: 'Helvetica-light', color: primaryColor, textTransform: 'capitalize', textDecorationLine: 'underline'}}>{this.state.placeName}</Text>               
                            </TouchableOpacity>

                          </View>

                          { ( this.state.flow == 'approveNewProposalPickTime' )  && //pick time slider


                          <View style={{}}>

                            <View 
                              style={{
                                width: deviceWidth,
                                padding: 20,
                                borderColor:'grey',
                                borderBottomWidth:0.6,
                                //flex: 1,
                                flexDirection: 'column',
                                justifyContent: 'center'
                                }}>
                              <Text style={{fontFamily: 'Helvetica-Light', textAlign: 'center', color: 'grey', fontSize: 16, marginBottom: 5}}>{new Date(this.state.proposedTimeTimeStamp).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>  
                              <Text style={{fontFamily: 'Helvetica-Light', textAlign: 'center', color: 'grey', fontSize: 16}}>Sometime between {this.state.dateTypeTime[this.state.dateType].timeRange}</Text>  
                            </View>

    

                            <View  
                              style={{
                                flexDirection: 'column', 
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 20,
                                //backgroundColor: 'blue'
                              }}>                            
                                    
                                  
                            <Text style={{fontFamily: 'Helvetica-Light', textAlign: 'center', color: 'white', fontSize: 20}}>Time: {this.state.dateTypeTime[this.state.dateType].timeSliderValues[this.state.timeSelectedIndex]}</Text>
                                  <Slider
                                    step={1}
                                    minimumValue={0}
                                    maximumValue={this.state.dateTypeTime[this.state.dateType].timeSliderValues.length-1}
                                    style={{width: 280, height: 75}}
                                    minimumTrackTintColor={'grey'}
                                    maximumTrackTintColor={'grey'}
                                    thumbTintColor={primaryColor}
                                    value={this.state.priceMax}
                                    onValueChange={(val) => 
                                      this.setState({ timeSelectedIndex: val})
                                    }
                                  />
                                  <Text style={{color: 'grey', fontSize: 18, fontFamily: 'Helvetica', textAlign: 'center',  }}>{ (this.state.dateType == 'museum' || this.state.dateType == 'gallery') ? 'Remember to confirm operating hours & tickets, if required.' : (this.state.dateType == "park") ? "Enjoy the park." : "Remember to confirm operating hours."} </Text>                

                                </View>
                        
                            
                           

                          </View>


                            }

                        </View> 
                            
                        { !( this.state.flow == 'approveNewProposalPickTime' )  && //hide if on pick time slider

                          <View style={{flexDirection: 'column', justifyContent: 'center', padding: 25, }}>
                           <View style={{flexDirection: 'row', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{color: 'grey', fontSize: 18, fontFamily: 'Helvetica', textAlign: 'center',  }}>{ (this.state.dateType == 'museum' || this.state.dateType == 'gallery') ? 'Remember to confirm operating hours & tickets, if required.' : (this.state.dateType == "park") ? "Enjoy the park." : "Remember to confirm operating hours."} </Text>                
                            </View>
                          </View>
                          }



                    </View>
 
                      }

                    </View>

                    { (this.state.flow == 'approveNewProposalPickLocation' ) && // main content module
                      

                      <View style={{
                          flex: 12, 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          }}>
                          <View 
                            style={{
                              width: deviceWidth,
                              borderColor:'grey',
                              borderBottomWidth:0.6,
                              flex: 1,
                              flexDirection: 'column',
                              justifyContent: 'center'
                              }}>
  
                            <Text style={{fontFamily: 'Helvetica-Light', textAlign: 'center', color: 'white', fontSize: 25}}>{whichText}</Text>  
                          </View>
                            
                          <View style={{ flex: 3, flexDirection:'row', justifyContent: 'center', alignContent: 'center', backgroundColor: '#D7D7D7', marginBottom: 30 }}>
                            <Carousel
                              layout={"default"}
                              loop={true}
                              autoplay={false}
                              //ref={ref => this.carousel = ref}
                              //ref={'carousel2'}
                              ref={c => {
                                this._carousel = c;
                              }}
                              data={this.state.yelpDates}
                              sliderWidth={deviceWidth}
                              removeClippedSubviews={false}
                              itemWidth={deviceWidth-110}
                              enableMomentum={true}
                              firstItem={this.state.activeIndex}
                              renderItem={this._renderItem2}
                              onSnapToItem={(index) => {this.setState({ activeSlide: index, activeIndex: index })}} 
                              //onScrollIndexChanged={(index) => console.log('scroll') }

                            
                            
                            />
                          </View>
  
  
                        </View>
  
                        }
                    
                    {/* footer */}
                    <View style={{ flex: 3, alignItems: 'center', justifyContent: 'center', paddingBottom:40, paddingTop:0, marginBottom: 0, }}>
                    
                    { ((this.state.flow == 'createNewProposal' || this.state.flow == 'updateProposal') && this.state.createNewProposalStep == 'type') && this.pagination }
                    
                    { (this.state.flow == 'createNewProposal' && this.state.createNewProposalStep == 'type') && //Set Up new blindDate //AND STEP 1 //SET STATE TO STEP2
                    <Button 
                    bordered 
                    style={{
                      marginTop: 0, 
                      borderColor: 'white', 
                      backgroundColor: 'white', 
                      borderRadius: 20,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 3,
                      },
                      shadowOpacity: 0.29,
                      shadowRadius: 4.65, }} 
                      onPress={
          
                        () => this.setState({
                          createNewProposalStep: 'date', 
                          dateType: this.state.carouselItems[this.state.activeIndex].type,
                          //update mainCopySecondary  
                          mainCopySecondary: {
                            createNewProposal: "If they accept, you'll receive instructions for a "+this.state.carouselItems[this.state.activeIndex].type+" date near them.",
                            approveNewProposal: "If you accept, you'll receive instructions for a "+this.state.carouselItems[this.state.activeIndex].type+" date near you.",
                            updateProposal: "If they accept, you'll receive instructions for a "+this.state.carouselItems[this.state.activeIndex].type+" date near them.",
                            approveUpdatedProposal: "If you accept, you'll receive instructions for a "+this.state.carouselItems[this.state.activeIndex].type+" date near you.",
                            waitingAcceptanceNewProposal: "If they accept, you'll receive instructions for a "+this.state.carouselItems[this.state.activeIndex].type+" date near them.",
                            waitingAcceptanceUpdatedProposal: "If they accept, you'll receive instructions for a "+this.state.carouselItems[this.state.activeIndex].type+" date near them.",
                            proposalAccepted: "Expect to receive instructions for a "+this.state.carouselItems[this.state.activeIndex].type+" date within the next 24 hours.",
                          }
                       })                  
                    }
                    >
                      <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>I want {this.state.carouselItems[this.state.activeIndex].type}</Text>
                  </Button>
                    }

                    { (this.state.flow == 'createNewProposal' && this.state.createNewProposalStep == 'date') && //Set Up new blindDate //AND STEP 2
                    <Button 
                    bordered 
                    style={{
                      marginTop: 0, 
                      borderColor: 'white', 
                      backgroundColor: 'white', 
                      borderRadius: 20,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 3,
                      },
                      shadowOpacity: 0.29,
                      shadowRadius: 4.65, }} 
                      onPress={() => this.setState({
                        //createNewProposalStep: (this.state.dateType == 'dessert' || this.state.dateType == 'cocktails')? 'price' : 'confirm', //only go to price if on dessert or cocktails type. 
                        createNewProposalStep: 'confirm', //go to confirm step for all scenarios. 
                     })
                   }>
                      <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Next</Text>
                  </Button>
                    }

                    { (this.state.flow == 'createNewProposal' && this.state.createNewProposalStep == 'price') && //Set Up new blindDate //AND STEP 2
                    <Button 
                    bordered 
                    style={{
                      marginTop: 0, 
                      borderColor: 'white', 
                      backgroundColor: 'white', 
                      borderRadius: 20,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 3,
                      },
                      shadowOpacity: 0.29,
                      shadowRadius: 4.65, }} 
                      onPress={() => this.setState({createNewProposalStep: 'confirm' })}
                      
                      
                    >
                      <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Next</Text>
                  </Button>
                    }

                    { (this.state.flow == 'createNewProposal' && this.state.createNewProposalStep == 'confirm') && //Set Up new blindDate //AND STEP 2
                    <Button 
                    bordered 
                    style={{
                      marginTop: 0, 
                      borderColor: 'white', 
                      backgroundColor: 'white', 
                      borderRadius: 20,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 3,
                      },
                      shadowOpacity: 0.29,
                      shadowRadius: 4.65, }} 
                      onPress={() => this._manageBlindDate('pending')}
                      
                      
                    >
                      <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Create date</Text>
                  </Button>
                    }      

                  { (this.state.flow == 'approveNewProposalPickLocation' ) && 
                  <View>
                    <Button 
                    bordered 
                    style={{
                      marginTop: 0, 
                      borderColor: 'white', 
                      backgroundColor: 'white', 
                      borderRadius: 20,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 3,
                      },
                      shadowOpacity: 0.29,
                      shadowRadius: 4.65, }} 
                      onPress={() => {
                          //this._carousel.snapToItem(Math.floor(Math.random() * this._carousel.props.data.length), true)
                          this._carousel.snapToItem(this._randNum(this._carousel.props.data, this.state.activeIndex ), true)
                        }
                      }

                    >
                      <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Shuffle</Text>
                    </Button>
                    <Button 
                      transparent 
                      style={{
                        marginTop: 0, 
                        //borderColor: 'white', 
                        //backgroundColor: primaryColor, 
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOffset: {
                          width: 0,
                          height: 3,
                        },
                        shadowOpacity: 0.29,
                        shadowRadius: 4.65, }} 
                        onPress={() => this.setState({flow: 'approveNewProposal' })}
                    >
                      <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Go back</Text>
                    </Button>

                  </View>

                    }

                    { (this.state.flow == 'approveNewProposalPickTime' ) && 
                  <View>
                    <Button 
                    bordered 
                    style={{
                      marginTop: 0, 
                      borderColor: 'white', 
                      backgroundColor: 'white', 
                      borderRadius: 20,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 3,
                      },
                      shadowOpacity: 0.29,
                      shadowRadius: 4.65, }} 
                      onPress={() => {
                        this._manageBlindDate('accepted')
                        // this.setState({
                        //   flow: 'detailsShow', 
                        //   confetti: true
                        
                        // }) 





                      }}

                      //onPress={() => this.setState({flow: 'approveNewProposalPickTime' })}

                    >
                      <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Confirm date</Text>
                    </Button>
                    <Button 
                      transparent 
                      style={{
                        marginTop: 0, 
                        //borderColor: 'white', 
                        //backgroundColor: primaryColor, 
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOffset: {
                          width: 0,
                          height: 3,
                        },
                        shadowOpacity: 0.29,
                        shadowRadius: 4.65, }} 
                        onPress={() => this.setState({flow: 'approveNewProposalPickLocation' })}
                    >
                      <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Go back</Text>
                    </Button>

                  </View>

                    }   



                    { (this.state.flow == 'approveNewProposal' || this.state.flow == 'approveUpdatedProposal') &&  //approve/decline/propose buttons
                     <View>
                     <Button 
                          bordered 
                          style={{
                            marginTop: 15, 
                            borderColor: 'white', 
                            backgroundColor: 'white', 
                            borderRadius: 20,
                            shadowColor: "#000",
                            shadowOffset: {
                              width: 0,
                              height: 3,
                            },
                            shadowOpacity: 0.29,
                            shadowRadius: 4.65, }} 
                            
                            //onPress={() => {this.getDates(), this.setState({showModal: true })}
                            onPress={() => {  this._getDates(); this.setState({showModal: true });}


                            //onPress={() => {this._manageBlindDate('fulfill'), this.setState({flow: 'proposalAccepted', confetti: true } )}
                            }
                                              
                          
                            >
                            <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Accept</Text>
                        </Button>
  
                        <Button 
                          transparent 
                          style={{
                            marginTop: 0, 
                            borderColor: 'white', 
                            //backgroundColor: 'white', 
                            borderRadius: 20,
                            shadowColor: "#000",
                            shadowOffset: {
                              width: 0,
                              height: 3,
                            },
                            shadowOpacity: 0.29,
                            shadowRadius: 4.65, }} 
                            onPress={() => {this._manageBlindDate('declined'), this.props.navigation.goBack()}}

                          >
                            <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Decline</Text>
                        </Button>  
                        <Button 
                          transparent 
                          style={{
                            marginTop: -10, 
                            borderColor: 'white', 
                            //backgroundColor: 'white', 
                            borderRadius: 20,
                            shadowColor: "#000",
                            shadowOffset: {
                              width: 0,
                              height: 3,
                            },
                            shadowOpacity: 0.29,
                            shadowRadius: 4.65, }} 
                                onPress={
                                  () => {
                                    this.setState({
                                      flow: 'updateProposal',
                                      createNewProposalStep: 'date', 
                                    })
                                  }
                                }                            >
                            <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Change date</Text>
                        </Button>  
                      </View>
                          }

                        { this.state.flow == 'updateProposal' &&
                        <Button 
                          bordered 
                          style={{
                            marginTop: -10, 
                            borderColor: 'white', 
                            backgroundColor: 'white', 
                            borderRadius: 20,
                            shadowColor: "#000",
                            shadowOffset: {
                              width: 0,
                              height: 3,
                            },
                            shadowOpacity: 0.29,
                            shadowRadius: 4.65, }}  
                            onPress={() => {this._manageBlindDate('pendingUpdate'), this.setState({flow: 'waitingAcceptanceUpdatedProposal' })}}

                          >
                            <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Change date</Text>
                        </Button>  
                          }

                          {/* { this.state.flow == 'proposalAccepted' &&
                          <Button 
                            bordered 
                            style={{
                              //marginTop: 20, 
                              borderColor: 'white', 
                              backgroundColor: 'white', 
                              borderRadius: 20,
                              shadowColor: "#000",
                              shadowOffset: {
                                width: 0,
                                height: 3,
                              },
                              shadowOpacity: 0.29,
                              shadowRadius: 4.65, }} 
                              onPress={() => {this.setState({flow: 'detailsShow' })}}
                            >
                              <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Blind Date Details</Text>
                          </Button>  
                          } */}

                        { !(this.state.flow == 'approveNewProposal' || this.state.flow == 'approveNewProposalPickLocation' || this.state.flow == 'approveNewProposalPickTime' ||  this.state.flow == 'approveUpdatedProposal' || (this.state.flow == 'createNewProposal' && (this.state.createNewProposalStep == 'price' || this.state.createNewProposalStep == 'date' || this.state.createNewProposalStep == 'confirm') ) ) &&
                            <Button 
                              transparent 
                              style={{
                                //marginTop: 5, 
                                backgroundColor: (this.state.flow == 'proposalAccepted' || this.state.flow == 'detailsShow' || this.state.flow == 'waitingAcceptanceNewProposal' || this.state.flow == 'waitingAcceptanceUpdatedProposal') ? 'white' : null, //make close button primary button when on these flows
                                borderRadius: 20,
                                shadowColor: "#000",
                                shadowOffset: {
                                  width: 0,
                                  height: 3,
                                },
                                shadowOpacity: 0.29,
                                shadowRadius: 4.65, }} 
                                onPress={() => {this.props.navigation.goBack()}}>
                                <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Close</Text>
                            </Button> 
                          } 

                        { (this.state.flow == 'createNewProposal' && (this.state.createNewProposalStep == 'price' || this.state.createNewProposalStep == 'date' || this.state.createNewProposalStep == 'confirm') ) &&
                            <Button 
                              transparent 
                              style={{
                                //marginBottom: -30,
                                borderRadius: 20,
                                shadowColor: "#000",
                                shadowOffset: {
                                  width: 0,
                                  height: 3,
                                },
                                shadowOpacity: 0.29,
                                shadowRadius: 4.65, }} 
                                onPress={() => { 
                                  //logic to where back button should go
                                  if(this.state.createNewProposalStep == 'date'){ //if on date select step
                                    this.setState({createNewProposalStep: 'type'}); // go back to type select                        
                                  } else if(this.state.createNewProposalStep == 'price') { //if on price step
                                    this.setState({createNewProposalStep: 'date'}); //go back to date select step
                                  }else if(this.state.createNewProposalStep == 'confirm') { //if on confirm step 
                                    
                                    //go back should go to price only when dessert or cocktails, else go to date selction. 
                                    //this.setState({createNewProposalStep: (this.state.dateType == 'dessert' || this.state.dateType == 'cocktails')? 'price' : 'date'}); //go back to price step
                                    this.setState({createNewProposalStep: (this.state.dateType == 'dessert' || this.state.dateType == 'cocktails')? 'date' : 'date'}); //go back to price step

                                    
                                  
                                  }
                                  else{
                                    this.setState({createNewProposalStep: 'type'}); //else go to beginning. 
                                  }
                                
                                
                                }}>
                                <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Go back</Text>
                            </Button> 
                          } 
                          
                          { this.state.flow == 'detailsShow' &&
                          <View>
                            <Button 
                              transparent 
                              style={{
                                borderRadius: 20,
                                shadowColor: "#000",
                                //backgroundColor: 'white',
                                shadowOffset: {
                                  width: 0,
                                  height: 3,
                                },
                                shadowOpacity: 0.29,
                                shadowRadius: 4.65, }} 
                                
                                onPress={
                                  () => {
                                    this.setState({
                                      flow: 'updateProposal',
                                      createNewProposalStep: 'date', 
                                    })
                                  }
                                }


                              >
                                <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Change date</Text>
                            </Button> 
                            <Button 
                            transparent 
                            style={{
                              marginTop: -10,
                              borderRadius: 20,
                              shadowColor: "#000",
                              shadowOffset: {
                                width: 0,
                                height: 3,
                              },
                              shadowOpacity: 0.29,
                              shadowRadius: 4.65, }} 
                              onPress={() => {this._manageBlindDate('declined'), this.props.navigation.goBack()}}
                            >
                              <Text style={{color: primaryColor, width: 300, textAlign:'center'}}>Decline</Text>
                          </Button>  
                        </View> 
                          }
                        
                    </View>
                    
                  </View>
                </View>
                


                  
              

      </Container> 
    );
  }
}


export default withNavigation(BlindDate);

