import React, { Component } from 'react';
import { Alert, ScrollView, TouchableOpacity, Image, ImageBackground, StyleSheet, Dimensions, StatusBar } from 'react-native';
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import { Modal } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFlag, faEye, faArrowLeft, faImages, faArrowAltCircleLeft } from '@fortawesome/free-solid-svg-icons';
import { withNavigation } from "react-navigation";
import {
  ActionSheet,
  Card,
  CardItem,
  Container,
  DeckSwiper,
  Header,
  Title,
  Content,
  Text,
  Button,
  Icon,
  Left,
  List,
  ListItem,
  Thumbnail,
  Right,
  Body,
  View,
  H3
} from "native-base";

import { GiftedChat } from 'react-native-gifted-chat';
import TimerMachine from 'react-timer-machine';
import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";
import { renderNotification, handleNotification } from '../Utilities/utilities.js';


const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";
const btnColor = 'white';
const btnTextColor = primaryColor;

var BUTTONS = ["Unmatch", "Report & Block", "Cancel"];
var DESTRUCTIVE_INDEX = 2;
var CANCEL_INDEX = 2;

class Chat extends Component {

  constructor(props){
    super(props)
    const { state, navigate } = this.props.navigation;

    this.state = {
      profile: {
        userid: 'state.params.match_userid',
      },
      messages:[],
      date: {
        status: 'none',
        waitingOnId: 'none'
      },
      block: true,
      blur: 30,
      chatActive: true,
      removed: false,
      timeLeft: null,
      matchDate: null,
      expirationDate: state.params.expiration_date,
      matchActive: true,
      name: null,
      birthday: '',
      gender: '',
      city_state: '',
      user_education: '',
      work: '',   
      userName: null,
      userId: null,
      userIdMatch: null,
      imageViewerVisible: false,
      profileViewerVisible: false,
      profileMaxHeight: "15%",
      images: [],
      imageIndex: 0,
      about: '', 
      subscribed: ''
      //image: null
    }

  }


  //configure navigation
  static navigationOptions = ({ navigation, state }) => {
    return {
      headerLeft: () => (
        <Button transparent style={{width: 100, flex: 1, justifyContent: 'flex-start', }} onPress={() => navigation.goBack()}>
          <FontAwesomeIcon size={ 32 } style={{left: 16, color: primaryColor}} icon={ faArrowLeft } />
       </Button>
      ),
      headerTitle: (props) => (
        <Button 
          transparent 
          style={{flexDirection: 'row', alignItems: 'center'}}

          onPress = {() =>  navigation.navigate("Profile", {
            profile: navigation.getParam('profile'), 
            blur: navigation.getParam('blur'), 
            conversationId: conversationId,  
            from: 'Chat',
          })}
          >
            <Thumbnail 
              blurRadius={navigation.getParam('blur')}
              style={{
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.8,
                shadowRadius: 4.65,
                width: 32, 
                height: 32,  
                overflow: "hidden", 
                borderRadius: 150, 
                borderWidth: 0.5, 
                borderColor: 'black' }} 
              source={{uri: navigation.getParam('images')["0"].url, cache: 'force-cache'}} 
            />
          <Title>{navigation.getParam('name')}</Title>
        </Button>

      ),
      
      headerRight: () => (
        <Button transparent style={{width: 100, flex: 1, justifyContent: 'flex-end' }} onPress={navigation.getParam('handleSneekPeek')}>
          <FontAwesomeIcon size={ 32 } style={{right: 16, color: primaryColor}} icon={ faEye } />
       </Button>
      ),
    };
  };


  //retrive msg from backend
  loadMessages(callback) {
    const { state, navigate } = this.props.navigation;
    conversationId = state.params.match_id;

    this.messageRef = firebase.database().ref('/conversations/'+conversationId+'/messages/');
    this.messageRef.off();
    const onReceive = (data) => {
      const message = data.val();
      callback({
        _id: data.key,
        text: message.text,
        createdAt: new Date(message.createdAt),
        system: message.system ? true : false, //system message true if set in db. 
        user: {
          _id: message.user._id,
          name: message.user._name,
        }
      });
    };
    this.messageRef.limitToLast(50).on('child_added', onReceive);
  }


  componentWillMount() {

    const { state, navigate } = this.props.navigation;
    const userId = firebase.auth().currentUser.uid;
    let Analytics = RNfirebase.analytics();
    let conversationId = state.params.match_id;
    let images = state.params.images; //might make more sense to pull from db instead of previous componnet, since now won't be able to deeplink into chat
    let about = state.params.about; //might make more sense to pull from db instead of previous componnet, since now won't be able to deeplink into chat
    let birthday = state.params.birthday;
    let gender = state.params.gender;
    let profile = state.params.profile;
    let reviews = state.params.reviews;
    let city_state = state.params.city_state;
    let education = state.params.education;
    let work = state.params.work;
    let match_userid = state.params.match_userid; 
    //let match_state = state.params.match_state;
    let time_remaining = state.params.time_remaining;

    //update state with subscribed, if user is susbscribed. listen on changes if subscribes changes in db.
    firebase.database().ref('/users/'+userId+'/').on("value", profile =>{
      let subscribed = profile.val().subscribed;
      this.setState({'subscribed': subscribed })
    })
    
    //save fb ref for quering conversation data
    let firebaseRef = firebase.database().ref('/conversations/'+conversationId+'/');

    //firebase ref for user in context match obj, used to flag all messages have been read
    let firebaseMatchesRef2 = firebase.database().ref('/matches/'+userId+'/'+match_userid+'/');

    //update the unread of my's match obj
    firebaseMatchesRef2.update({
      unread_message: false
    });


   //listen for new conversation data in db
      firebaseRef.on('value', (dataSnapshot) => {

        //create empty array
        let imagesArray = [];
        
        //create valure for the blur radius
        let blur = dataSnapshot.val().blur;

        let date = dataSnapshot.val().date;

        //create value for the match status 
        let chatActive = dataSnapshot.val().active;

        //get name of user who is not me.
        let participantsList = dataSnapshot.val().participants;

        //convert participants list into array
        let participantArray = Object.entries(participantsList);

        //find participant who is not user in context
        //first users userid
        let participantArrayFirstID = Object.keys(participantsList)[0];

        //second participants userid
        let participantArraySecondID = Object.keys(participantsList)[1];
     
        //if user is first element in participants, then the 2nd element must be participant . 
        if (participantArrayFirstID == userId){
          //participant's  name and images are from second item in array. 
          var participantUser = participantArray['1'];
          var participantLoggedInUser = participantArray['0'];
          var participantUserId = participantArraySecondID;

        }else{
          //participant's  name and images are from first item in array. 
          var participantUser = participantArray['0'];        
          var participantLoggedInUser = participantArray['1'];
          var participantUserId = participantArrayFirstID;

        }

        //save participiant Name
        var participantName = participantUser[1].name;

        //set name to nav prop, to make available to the header
        this.props.navigation.setParams({ name: participantName });

        //save name of logged in user
        var participantLoggedInUserName = participantLoggedInUser[1].name;

        //save participiant Images
        var imagesList = participantUser[1].images;

        //convert imagesList to an array. 
        var imageArray = Object.values(imagesList);

        //loop through array and create an object now including it's blur radious. Push that object to imagesarray arrary.
        imageArray.forEach(function(item) {
          imageObj = {'url':item.url, cache: 'force-cache', 'props':{'blurRadius': +blur, source: {uri: item.url, cache: 'force-cache'}}};
          imagesArray.push(imageObj);
        })

        
          //setState with above elements
          this.setState({
            profile: profile,
            about: about,
            birthday: birthday,
            gender: gender,
            city_state: city_state,
            education: education,
            date: date,
            work: work,
            reviews: reviews,
            name: participantName,
            userName: participantLoggedInUserName,
            blur: dataSnapshot.val().blur,
            chatActive: chatActive,
            //timeLeft: dataSnapshot.val().time_left, //should be conversation start date. js would subtract today's date from that = time_left
            matchDate: dataSnapshot.val().match_date,
            expirationDate: dataSnapshot.val().expiration_date,
            matchActive: true,
            //matchActive: match_state == 'active' ? true : false,
            image: imagesArray[0].url,
            userId: userId,
            userIdMatch: participantUserId,
            images: imagesArray,
            removed: dataSnapshot.val().removed
          }),
          //run analytics
            Analytics.setAnalyticsCollectionEnabled(true);
            Analytics.setCurrentScreen('Chat', 'Chat');
            Analytics.setUserId(userId);

      })
  }

  //send msg to db
  onSend(message) {

    const { state, navigate } = this.props.navigation;
    conversationId = state.params.match_id;
    let Analytics = RNfirebase.analytics();

    let firebaseMessagesRef = firebase.database().ref('/conversations/'+conversationId+'/messages/');
    let firebaseConversationsRef = firebase.database().ref('/conversations/'+conversationId+'/');
    
    //save firebase refs to update matches with last messages
    let firebaseMatchesRef1 = firebase.database().ref('/matches/'+this.state.userIdMatch+'/'+userId+'/');
    let firebaseMatchesRef2 = firebase.database().ref('/matches/'+userId+'/'+this.state.userIdMatch+'/');

    //loop through new messages and push back to firebase, which will call loadmessages again. 
    for (let i = 0; i < message.length; i++) {
      firebaseMessagesRef.push({
        text: message[i].text, 
        user: message[i].user, 
        userTo: this.state.userIdMatch,
        notify: true,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });

      //update the blur
      if(this.state.blur > 0){
        firebaseConversationsRef.update({
          blur: this.state.blur - 3
        });
        this.props.navigation.setParams({ 
          blur: this.state.blur -3 
        });
      }

      //update the last message and read status of match's match obj
        firebaseMatchesRef1.update({
          last_message: message[i].text,
          showNotification: true,
          notificationType: 'newChat',
          last_message_date: (new Date().getTime()*-1), 
          blur: this.state.blur,
          unread_message: (this.state.removed == true) ? false : true //if conversation is removed dont set unread messages to true. 
        });

      //update the last message and read status of match's match obj
        firebaseMatchesRef2.update({
          last_message: message[i].text,
          last_message_date: (new Date().getTime()*-1), 
          blur: this.state.blur
        });

    }

    //Add event for message being sent here. 
    Analytics.logEvent('chatSent', {
      message: message,
      blur: this.state.blur
    });

  }


  goBack() {
    const { navigate } = this.props.navigation;
    this.setState({timeLeft:0}), navigate("Messages");
  }

  CloseChat() {
    if (this.messageRef) {
      this.messageRef.off();
    }
  }

  // expiredChat = () => {

  //   return (
  //     <View style={{ height: 150, backgroundColor: 'white', alignItems:'center', flexDirection:'column', justifyContent: 'center'}}>
  //       <Text style = {{paddingBottom: 5, fontWeight: '700'}}>Need some extra time?</Text>
  //       <Text>Ask for permission to extend</Text>
  //       <View style={{ paddingTop: 20}}>
  //         <Button rounded bordered><Text>Extend</Text></Button>
  //       </View>
  //     </View>
  //   );

  // }


  //function to toggle profile show/hide
  toggleProfile = () => {

    //if profileMaxHeight is 50%, then change to 15%, else change to 50%
    if (this.state.profileMaxHeight == '15%'){
      this.setState({
        profileMaxHeight: "50%"
      });
    }else{
      this.setState({
        profileMaxHeight: "15%"
      });
    }

    //Add event for message being sent here. 
    RNfirebase.analytics().logEvent('profileViewChat', {
      testParam: 'testParam',
    });

  }


  //function to show profile viewer modal
  showProfile = () => {

    if(this.state.profileViewerVisible == false){
      this.setState({ profileViewerVisible: true})
    }

  }

  //function to block or report a profile
  blockOrReport = (type) => {

    //create ref to set new match object with match_id associated with conversation_id generated above. 
    let matchesRef1 = firebase.database().ref('matches/'+userId+'/'+this.state.userIdMatch+'/');

    //create ref to set new match object with match_id associated with conversation_id generated above. 
    let matchesRef2 = firebase.database().ref('matches/'+this.state.userIdMatch+'/'+userId+'/');

    //save fb ref for quering conversation data
    let convoRef = firebase.database().ref('/conversations/'+conversationId+'/');

    //prepare for navigation  
    const { navigate } = this.props.navigation;

    //add removed property to match
    matchesRef1.update({removed: true});

    //add removed property to match
    matchesRef2.update({removed: true});

    //add removed property to conversation as well. 
    convoRef.update({removed: true});

    //record in analytics that user was successfully blocked
    RNfirebase.analytics().logEvent('profileBlocked', {
      userIdBlocking: userId,
      userIdBlocked: this.state.userIdMatch
    }); 

    //if type is report
    if (type == 'report'){
      console.log('profile reported');

      //add reported property to conversation as well. 
      convoRef.update({reported: userId}); 

      //record in analytics that user was successfully reported
      RNfirebase.analytics().logEvent('profileReported', {
        userIdReporting: userId,
        userIdReported: this.state.userIdMatch
      }); 
    }

    //navigate to swipes. 
    navigate("Swipes");
  }


  getAge(dateString) {
      var today = new Date();
      var birthDate = new Date(dateString);
      var age = today.getFullYear() - birthDate.getFullYear();
      var m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  }

  //function to renderReviews into markup
  _renderReview = (reviews) => {
    const { navigate } = this.props.navigation;
    let deviceWidth = Dimensions.get('window').width

      //return markup for each review
      return ( 
      reviews ? (
      <View style={{marginTop: 10}} >
        {Object.values(reviews).map((review, index) => (
               
        <Card style={{flex: 1, width: deviceWidth-25,}}>
          <List>
            <ListItem avatar noBorder button >
              <Left>
                <Thumbnail large source={{uri: review.photo}} />
              </Left>
              <Body>
                <Text style={{color: primaryColor}}>{review.name+' says:'}</Text>
                <Text note>{review.reason}</Text>
            </Body>
          </ListItem>
        </List>
      </Card>

       ))}
      </View>) : null
      );
    }

    //handle scroll of profile by growing/shrinking container when user scrolls and expects that. 
    _handleScroll = (event: Object) => {

      var currentOffset = event.nativeEvent.contentOffset.y;
      var direction = currentOffset > this.offset ? 'down' : 'up';
      this.offset = currentOffset;
      if((direction == 'down') && (currentOffset > 0) && (this.state.profileMaxHeight == '15%')){
      
        //grow up to 15%
        this.setState({ profileMaxHeight: '40%'});

      }else if ((direction == 'up') && (currentOffset < 0) && ((this.state.profileMaxHeight == '40%')) ){
        
        //shrink down to 15%
        this.setState({ profileMaxHeight: '15%'});
           
      }
    }
    
    //deblur to a specific amount at a certain time. 
    deBlur = (blur, time) =>{
      setTimeout(function(){
        this.setState({blur:blur});
        }.bind(this),time);  
    }

    //handle when sneakpeek is pushed. Unblur photos for n time or show payments modal if user is not subscribed. 
    _handleSneekPeek = () => {

        const { state, navigate } = this.props.navigation;

        //if match is expired, deblur photos when sneekpeek is clicked. 
        if (this.state.matchActive == false){
          //set blur to 0 if subscribed
            this.deBlur(75,100)
            this.deBlur(60,200)
            this.deBlur(45,300)
            this.deBlur(30,400)
            this.deBlur(15,500)
            this.deBlur(0,600)

          //update images in imageViewer to blurRadious of 0 as well. 
            let newImages = this.state.images.map(image => (
                { ...image, props: {...this.props, blurRadius: 0} }
              )
            );
          
          this.setState({images: newImages});

        }else{

          //match must be active, alert user what button will do after expiration. 
          //alert("Send a message to focus their photos. After this conversation expires, you'll be able use this button to focus their photos.");

          Alert.alert(
            'Reveal',
            "Sending messages will reveal their photos. After expiration, this button will reveal who they were. ",
            [
              {text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
            ],
            { cancelable: false }
          )  

          //navigate to payments component, since user is not subscribed.
          //navigate("Payments", { flow: 'peek'});

        }
    }

    //handle when extend conversation is pushed. Reset. 
    //ADD SYSTEM MESSAGE AS LATEST MESSAGE, SO THAT USER WILL SEE THIS USER ON TOP. 
    _handleExtendConversation = () => {

      const { state, navigate } = this.props.navigation;

      if (this.state.subscribed == true){
       
          //save refs to db for conversation and matches, to reflect new status
          let firebaseRef = firebase.database().ref('/conversations/'+conversationId+'/');
          let firebaseMatchesRef1 = firebase.database().ref('/matches/'+userId+'/'+state.params.match_userid+'/');
          let firebaseMatchesRef2 = firebase.database().ref('/matches/'+state.params.match_userid+'/'+userId+'/');
          
          //save system message that blind date status has changed. 
          let conversationsRef = firebase.database().ref('/conversations/'+conversationId+'/messages/');

          //86000000 - 1 day in ms
          let extendTimeBy = 86000000 * 7; //in ms
          let newExpirationDate = (new Date().getTime() + extendTimeBy);

          //query for fcmToken used for triggering notification in the cloud. 
          firebase.database().ref('/users/'+state.params.match_userid+'/').once("value", profile =>{

            let notifyFcmToken = profile.val().fcmToken;

            //update the conversation with extended expiration
            firebaseRef.update({
              expiration_date: newExpirationDate,
              active: true,
              notifyFcmToken: notifyFcmToken,
            });

            //update match to true status and set new expiration date
            firebaseMatchesRef1.update({
              active: true,
              expiration_date: newExpirationDate,
              last_message: 'Conversation Extended',
              last_message_date: (new Date().getTime()*-1), 
              //blur: this.state.blur,
              unread_message: (this.state.removed == true) ? false : true //if conversation is removed dont set unread messages to true. 
  
            });

            //update match to true status and set new expiration date
            firebaseMatchesRef2.update({
              active: true,
              expiration_date: newExpirationDate,
              notifyFcmToken: notifyFcmToken, //notify the person who has their converation
              last_message: 'Conversation Extended',
              last_message_date: (new Date().getTime()*-1), 
              showNotification: true,
              notificationType: 'conversationExtended',
            });

            //push new system message that date has been managed. This will put conversation to top of messages. 
            conversationsRef.push({
              text: 'Conversation Extended', 
              notify: false,
              system: true,
              user: this.state.userId, 
              userTo: state.params.match_userid,
              createdAt: firebase.database.ServerValue.TIMESTAMP
            });

          })

          //DEBUG WHY CHAT IS NOT UPDATING TO ACTIVE AFTER EXTENDING IT. IT SEEMS TO WORK IN THE DB FOR THE MATCH, BUT NOT THE CHAT, CHECK chatActive property. 

          //update local state so chat is active. listen to db if timeremaining is updated. This way the match can extend the conversation and the other person can send first chat. 
          this.setState({  matchActive: true, chatActive: true, expirationDate: newExpirationDate })

      }else{
        //navigate to payments component, since user is not subscribed.
         //navigate("Payments", { flow: 'peek'});
         navigate("Intersitial", { 
           flow: 'extendConversation1',
           from: 'conversations',
           match_userid: state.params.match_userid,
           conversationId: conversationId,
          })

         //USE THE BELOW TO REMOVE THE REFER OPTION. 
         //navigate("Intersitial", { flow: 'extendConversation2'})



      }

  }


  //render time left based off difference btw expiration date and current date. then update state to reflect for the UI. 
  //Call this function every second until componetn is unmounted
  _renderCountdownTimer = () => {
    const { state, navigate } = this.props.navigation;

    //save expiration date sent via messages, into let, for calculating timeLeft
    let expiration_date = this.state.expirationDate;

    //calculate time left based off difference btw expiration date and current date. 
    let timeLeft = expiration_date - new Date().getTime();
           
    //if theres time left update the time, if not turn chat off 
    if (timeLeft > 0){

      //format text for days, hours, minutes, and seconds
      let daysLeft = Math.floor( timeLeft/(1000*60*60*24)) //days
      let hoursLeft = Math.floor( (timeLeft/(1000*60*60)) % 24 ) //hours
      let minutesLeft = Math.floor( (timeLeft/1000/60) % 60 ) //minutes
      let secondsLeft = Math.floor( (timeLeft/1000) % 60 ) //seconds

      console.log('days left are: '+ daysLeft);
      console.log('hours left are: '+ hoursLeft);
      console.log('minutes left are: '+minutesLeft);
      console.log('seconds left are: '+secondsLeft);


      let timeRemainingText = '';

      //if theres more than 6 days, just show 1 week left
      if (daysLeft == 6) {
        timeRemainingText = '1 week';
      }
      //if theres more than 1 day, just show the days left
      else if (daysLeft > 0) {
        timeRemainingText = daysLeft == 1 ? daysLeft+' day' : daysLeft+' days';
      }
      //if theres less than one day but more than 0 hours, just show hours left
      else if(daysLeft == 0 && hoursLeft > 0){
        timeRemainingText = hoursLeft == 1 ? hoursLeft+' hour' : hoursLeft+' hours';
      }
      //if theres less than one hour, just show minutes left
      else if(daysLeft == 0 && hoursLeft == 0 && minutesLeft > 0){
        timeRemainingText = minutesLeft == 1 ? minutesLeft+' minute' : minutesLeft+' minutes';

      } 
      //if theres less than one min, just show seconds left
      else if(daysLeft == 0 && hoursLeft == 0 && minutesLeft == 0 && secondsLeft > 0){
        timeRemainingText = secondsLeft == 1 ? secondsLeft+' second' : secondsLeft+' seconds';
      }          
      
      //set state with text for UI to reference
      this.setState({ timeRemaining: timeRemainingText  })//set state with new timeLeft

    }else{
      
      //set state to expired and disable the chat with matchActive = false
      //INVESTIGATE WHY THIS CONDITION IS BEING CALLED AFTER MESSAGE IS SENT?
      this.setState({ matchActive: false, timeRemaining: 'Expired'})

      //save refs to db for conversation and matches, to reflect new status
      let firebaseRef = firebase.database().ref('/conversations/'+conversationId+'/');
      let firebaseMatchesRef1 = firebase.database().ref('/matches/'+userId+'/'+state.params.match_userid+'/');
      let firebaseMatchesRef2 = firebase.database().ref('/matches/'+state.params.match_userid+'/'+userId+'/');

      //update the unread of my's match obj
      firebaseMatchesRef1.update({
        active: false
      });

      //update the unread of my's match obj
      firebaseMatchesRef2.update({
        active: false
      });

      //update the conversation with active = false 
      firebaseRef.update({
        active: false
      });

    }

  }

  render() {
    const { state, navigate } = this.props.navigation;
    console.log('match date is: '+ this.state.matchDate);
    console.log('chatActive is: '+ this.state.chatActive);
    console.log('matchActive is: '+ this.state.matchActive);
  
    //console.log('time remaining is: '+ timeRemaining);
    let {height, width} = Dimensions.get('window');
    let image = this.state.image; //pull first image from images array instead.
    let about = this.state.about;
    let chatActive = this.state.chatActive;
    let matchActive = this.state.matchActive;
    let name = this.state.name;
    let date = this.state.date;
    console.log('date is: '+JSON.stringify(date));
    let birthday = this.state.birthday;
    let age = this.getAge(birthday);
    let gender = this.state.gender;
    let city_state = this.state.city_state;
    let education = this.state.education;
    let work = this.state.work;
    let reviews = this.state.reviews;

    let deviceWidth = Dimensions.get('window').width
    let deviceHeight = Dimensions.get('window').height
    let datePrimaryButtonCopy = 'Go on Blind Date';
    let flow = 'createNewProposal' ;


    //get notifications 
    //handleNotification(userId, 'Chat', 'e6GZxn9yZrX2rRFZVKtrhqo11qD2');
    handleNotification(userId, 'Chat', state.params.match_userid);


    console.log('this.state.date.status: '+this.state.date.status);

      //configuration for date button
      switch (this.state.date.status) {
        case 'pending': 
          datePrimaryButtonCopy = (userId == this.state.date.waitingOnId) ? 'Blind Date requested' : 'Blind Date requested' ;
          flow = (userId == this.state.date.waitingOnId) ? 'approveNewProposal' : 'waitingAcceptanceNewProposal' ;
          break;
        case 'pendingUpdate': 
          datePrimaryButtonCopy = (userId == this.state.date.waitingOnId) ? 'Blind Date requested' : 'Blind Date requested' ;
          flow = (userId == this.state.date.waitingOnId) ? 'approveUpdatedProposal' : 'waitingAcceptanceUpdatedProposal' ;
          break;
        case 'fulfill': 
          datePrimaryButtonCopy = 'Blind Date coordinating';
          flow = 'proposalAccepted' ; //go to proposal Acccepted flow
          break;
        case 'accepted': 
          datePrimaryButtonCopy = 'Blind Date details';
          //flow = (true) ? 'detailsHide' : 'detailsShow' ; //1642837974 //1642833434708
          flow = (this.state.date.proposedTime < Date.now()+(86400000*1)) ? 'detailsHide' : 'detailsShow' ; //show details when 24 hours before proposedTime
          break;
        case 'declined':
          datePrimaryButtonCopy = 'Go on Blind Date';
          flow = 'createNewProposal' ;
          break;
        case 'none':
          datePrimaryButtonCopy = 'Go on Blind Date';
          flow = 'createNewProposal' ;
          break;
        default:
          datePrimaryButtonCopy = 'Go on Blind Date';
          flow = 'createNewProposal' ;
      }
    


    return (
      <Container>
          <StatusBar 
            hidden={'hidden'} 
            barStyle={'dark-content'} 
            animated={true}
          />
        <Modal 
          visible={this.state.profileViewerVisible} 
          //transparent={false}
          animationType="slide">
            
            {(this.state.profileViewerVisible && !this.state.imageViewerVisible) && 
              <ScrollView 
                style={{
                  flex: 1,
                  backgroundColor: 'lightgrey'
                }} 
                
                contentContainerStyle={{
                  backgroundColor: 'white',
                  flexGrow: 1,
                  paddingTop: 40,
                  alignItems: 'center',
                  paddingBottom: 50
                }}>
                  <View style={{ 
                    position: 'absolute',
                    zIndex: 2,
                    left: 5,
                    top: 40,}}>                  
                    <Button  
                      transparent 
                      style={{  
                        width: 90, 
                        height: 90, 
                        justifyContent: 'center',
                        shadowColor: "#000",
                        shadowOffset: {
                          width: 0,
                          height: 3,
                        },
                        shadowOpacity: 0.29,
                        shadowRadius: 4.65, }}
                      onPress = {() => this.setState({ profileViewerVisible: false})}>
                        <FontAwesomeIcon size={ 50 }     
                          style={{color: primaryColor}} 
                          icon={ faArrowAltCircleLeft } />
                    </Button>                  
                  </View>

                  <TouchableOpacity activeOpacity={1.0} onPress = {() => this.setState({ imageViewerVisible: true})}>
                    <Image style={{}} 
                      blurRadius={Number(this.state.blur)}
                      source={{
                        uri: this.state.image,
                        width: deviceWidth,
                        height: deviceHeight-200
                      }} 
                    />

                  </TouchableOpacity>
                  <View style={{flex: 1, flexDirection: 'row', alignSelf: 'flex-start'}}>
                    <View>
                      <Card transparent style={{padding: 10}}>   
                        <H3 numberOfLines={1} style={{textTransform: 'capitalize', color: primaryColor}} >{name}</H3>
                        <H3 numberOfLines={1} style={{textTransform: 'capitalize', color: primaryColor}} >{age}, {gender}, {city_state}</H3>
                        <Text numberOfLines={1} style={{}} >{work} </Text>
                        <Text numberOfLines={1} style={{marginBottom: 10}} >{education} </Text>
                        <Text note style={{marginTop: 10}}>{about}</Text>
                      </Card>
                      <View style={{flex: 1,padding:10}}>
                        {this._renderReview(this.state.reviews)}

                      </View>
                    </View>
                  </View>
                </ScrollView>
              }

          
              {this.state.imageViewerVisible && 
                <ImageViewer 
                  index = {this.state.imageIndex}
                  imageUrls={this.state.images}
                  onChange = {(index) => this.setState({ imageIndex: index})}
                  onSwipeDown = {() => this.setState({ imageViewerVisible: false})}
                  onClick = {() => this.setState({ imageViewerVisible: false})}
                />  
               }   
          </Modal> 
        
                
          <View style={{padding:0,  alignItems:'center', flexDirection:'row', justifyContent: 'space-around', paddingLeft: 15, paddingRight: 20}}>
            <Text style={{marginRight: 10, fontWeight:'600', color: primaryColor}}>TIME REMAINING: </Text>
            <Text numberOfLines ={1} style={{fontWeight:'400', color:'#888', width:200}}>        
              {this.state.timeRemaining} 
            </Text> 
    
            <Button transparent style={{width: 100, flex: 1, justifyContent: 'flex-end', }} onPress={() =>
            
            ActionSheet.show(
              {
                options: BUTTONS,
                cancelButtonIndex: CANCEL_INDEX,
                destructiveButtonIndex: DESTRUCTIVE_INDEX
                
              },
              buttonIndex => {

                //handle blocking profile
                if ((buttonIndex) == 0){

                  //block user
                  this.blockOrReport('block')
                
                  //handle block and report a user
                }else if ((buttonIndex) == 1){

                  Alert.alert(
                    'Report & Block',
                    'We take reports seriously and will investigate this person as well as block them from interacting with you in the future. If you just want to unmatch tap "unmatch" instead.',
                    [
                      {text: 'Unmatch', onPress: () => this.blockOrReport('block')},
                      {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                      {text: 'Report & Block', onPress: () => this.blockOrReport('report')},
                    ],
                    { cancelable: false }
                  )         
                }
              }
            )} >
            <FontAwesomeIcon size={ 20 } style={{ color: 'lightgrey'}} icon={ faFlag } />
        </Button>
        </View>

        <View>
          
            <Button 
                rounded
                style={{
                  marginLeft: deviceWidth/4,
                  zIndex: 1,
                  width: 200,
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
                }}                       
                
                onPress={() => 
                  
                  { 
                    //if match is active go to blindDate module, if it's expired alert that chat needs to be extended first
                    if(matchActive){
                      this.props.navigation.navigate('BlindDate', {
                        //status: this.state.date.status, 
                        flow: flow, 
                        dateId: 'dateIdHere',
                        //userId: this.state.userId, 
                        matchName: this.props.navigation.getParam('name'), 
                        userIdMatch: this.state.userIdMatch,
                        dateTime: date.proposedTime,
                        proposedLat: date.proposedLat,
                        proposedLong: date.proposedLong,
                        conversationId: this.props.navigation.getParam('match_id'),
                        blur: this.state.blur,
                        profile: this.state.profile,
                        //userIdMatchFcmToken: userIdMatchFcmToken
                        confirmedTime: date.confirmedTime,
                        confirmedLat: date.confirmedLat,
                        confirmedLong: date.confirmedLong,
                        location: date.location,
                        placeAddress: date.placeAddress,
                        placeName: date.placeName,
                        priceMax: date.priceMax,
                      })}else{
                        Alert.alert(
                          "Conversation expired",
                          "You'll need to extend the Conversation in order to go on a Blind Date.",
                          [
                            {text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                          ],
                          { cancelable: false }
                        )  
                      }
                    }


                
              }
                

                >
                <Text>{datePrimaryButtonCopy}</Text>
              </Button>
          

            
          
              <Image source={{uri: image, cache: 'force-cache'}} position="absolute" resizeMode="cover" blurRadius={Number(this.state.blur)}  
              style={[styles.backgroundImage, {height:height, width: width}]}
              />

        </View>
        
          
        <GiftedChat
          messages={this.state.messages}
          renderInputToolbar={!matchActive ? () => null : undefined}
          minInputToolbarHeight = {matchActive == false ? 0 : undefined}
          bottomOffset={33}
          onSend={
            (message) => {
              this.onSend(message);
            }
          }
          user={{_id: this.state.userId, _name: this.state.userName }}
        />
        <View 
          style={{
            position: 'absolute',
            bottom: 0,
            width: deviceWidth,
            height: 35,
            backgroundColor: 'white'
          }}>

        </View>

        {!matchActive &&

        <LinearGradient style={{
                
                height: 180,             
                alignItems: 'center',
                justifyContent: 'center',
                //backgroundColor: primaryColor, dimensions
                }}
                colors={[primaryColor, secondaryColor  ]}
                // colors={[primaryColor, secondaryColor  ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 2, y: 2 }}
                >
          
          <View style = {{flex: 1, justifyContent: 'center',}}>
            <Text style={{color: 'white'}}>This conversation has expired</Text>
          </View>
      
          <View style={{flex: 1}}>
            <Button 
              style={{ 
                justifyContent: 'center',
                backgroundColor: btnColor,
                borderRadius: 20,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65,
                marginBottom: 20 }}                       
                rounded  
                onPress={ () => {this._handleExtendConversation()} } >                         
                  <Text style={{color: btnTextColor}}>Extend Conversation</Text>
              </Button>  
          </View>
        </LinearGradient>
         }

      </Container>
    );
  }

  componentDidMount() {

    //TURN THIS ON
    this.interval = setInterval(() => this._renderCountdownTimer(this.state.expirationDate), 1000);
   
    //send blockOrReport function to nav as param, so that it can be referenced in the navigation. 
    this.props.navigation.setParams({ 
      block: this.blockOrReport, 
      showProfile: this.showProfile,
      handleSneekPeek: this._handleSneekPeek,
      blur: this.state.blur 
    });
    
    this.loadMessages((message) => {
      this.setState((previousState) => {
        return {
          messages: GiftedChat.append(previousState.messages, message)
        };
      });
    });
  }


  componentWillUnmount() {

    clearInterval(this.interval);

    this.closeChat;
  }

}

let styles = StyleSheet.create({
  backgroundImage: {
  flex: 1,
  backgroundColor:'transparent',
  justifyContent: 'center',
  alignItems: 'center',

 }
});

export default withNavigation(Chat);

