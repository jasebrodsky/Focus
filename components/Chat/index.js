import React, { Component } from 'react';
import { Alert, ScrollView, Animated, TouchableOpacity, Image, ImageBackground, StyleSheet, Dimensions, StatusBar } from 'react-native';
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import { Modal, Keyboard, TouchableWithoutFeedback } from 'react-native';
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
        waitingOnId: 'none',
        reservationLastName: 'adsf',
      },
      block: true,
      blur: 30,
      showModal: false,
      removed: false,
      timeLeft: null,
      matchDate: null,
      expirationDate: state.params.expiration_date,
      matchActive: true,
      chatActive: true,
      name: null,
      //seen: true,
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
            { navigation.getParam('blur') &&
              <Thumbnail 
                blurRadius={  parseInt(navigation.getParam('blur'), 10)  }
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
             }
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
    let seen = state.params.seen;
    let city_state = state.params.city_state;
    let education = state.params.education;
    let work = state.params.work;
    let match_userid = state.params.match_userid; 
    let reservationFirstName = state.params.reservationFirstName;
    let reservationLastName = state.params.reservationLastName;
    let match_state = state.params.match_state;
    let time_remaining = state.params.time_remaining;

    //update state with subscribed, if user is susbscribed. listen on changes if subscribes changes in db.
    firebase.database().ref('/users/'+userId+'/').on("value", profile =>{
      let subscribed = profile.val().subscribed;
      this.setState({'subscribed': subscribed })
    })


    //update state with most recent match data, so that can render modal when date needs approval. 
    firebase.database().ref('matches/'+userId+'/'+match_userid).on("value", matchSnap =>{
      this.setState({showModal: !matchSnap.val().seen })
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
          imageObj = {'url':item.url, cache: 'force-cache', 'props':{'blurRadius': +parseInt(blur,10), source: {uri: item.url, cache: 'force-cache'}}};
          imagesArray.push(imageObj);
      })

        
          //setState with above elements
          this.setState({
            profile: profile,
            about: about,
            birthday: birthday,
            gender: gender,
            //seen: seen,
            //showModal: !seen, //show modal true => when not seen yet. 
            city_state: city_state,
            education: education,
            date: date,
            work: work,
            reviews: reviews,
            name: participantName,
            reservationFirstName: reservationFirstName,
            reservationLastName: reservationLastName,
            userName: participantLoggedInUserName,
            blur: dataSnapshot.val().blur,
            chatActive: chatActive,
            //timeLeft: dataSnapshot.val().time_left, //should be conversation start date. js would subtract today's date from that = time_left
            matchDate: dataSnapshot.val().match_date,
            expirationDate: dataSnapshot.val().expiration_date,
            //matchActive: true,
            matchActive: match_state == 'active' ? true : false,
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
          showNotificationTime: (new Date().getTime()*-1), 
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


  handleNotification = (userId, screen, matchUseridExclude ) => {
    
    //this.setState({ matchUseridExclude: matchUseridExclude });

    let query = firebase.database().ref('/matches/' + userId).orderByChild('showNotification');

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
            
            console.log('matchUseridExclude is: '+matchUseridExclude); //WHY IS matchUserId being set to null here? 
            console.log('notifySnapshot.val().match_userid is: '+notifySnapshot.val().match_userid); //WHY IS matchUserId being set to null here? 

            //don't notify of new chat while on chat screen and chatting with that user. Match to exclude is only sent on chat page.
            if ((screen == 'Chat') && (matchUseridExclude == notifySnapshot.val().match_userid)){ //then check if person to exclude is not who you're talking to
            //if ((screen == 'Chat')){ //then check if person to exclude is not who you're talking to
    
               //don't notify when chat is open with user

                //alert('dont notify since need to exclude this user from sending you a notificaiton');
                break;
              }else{
                //must not be on chat page, since match_user_exclude is not set
                renderNotification('New Chat from '+notifySnapshot.val().name);
                break;
              }
            
          case 'newBlindDate':
            renderNotification('New blind date requested.');
            break;
          case 'planned': //blind date accepted
            renderNotification('Blind date ready!');
            break;
          case 'accepted': //blind date accepted
            renderNotification('Blind date accepted!');
            break;
          case 'declined': //blind date declined
            renderNotification('Blind date declined.');
            break;                   
          case 'pendingUpdate': //blind date updated
            renderNotification('Blind date updated.');
            break;
          case 'pending': //blind date updated
            renderNotification('Blind date updated.');
            break;                 
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

  //trigger actionsheets and alerts for blocking and reporting and hiding flow. 
  blockReportFlow = (from) => {
  
    //from = Swipes, Dashboard, ChatOrBlindDate

    ActionSheet.show(
      {
        options: [
          from == 'Swipes' ? 'Just hide':'Just unmatch',
          from == 'Swipes' ? 'Hide and report':'Unmatch and report', 
            "Cancel"
        ],
        title: 'Confirm',
        cancelButtonIndex: 2,
        destructiveButtonIndex: 2
        
      },
      buttonIndex => {

        //handle blocking profile
        if ((buttonIndex) == 0){

          //block user
          this.profileAction('unmatch');
          console.log('this is block report flow: UNMATCHING');

        
          //handle block and report a user
        }else if ((buttonIndex) == 1){

          Alert.alert(
            'Report',
            "We take reports seriously. We'll investigate this person and block them from interacting with you in the future.",
            [

              {text: from == 'Swipes' ? 'Just hide':'Just unmatch', 
                onPress: () =>  
                  //if from swipes and not a match -> hide. If not coming from swipes and is a match -> unmatch.
                from == 'Swipes' ? this.profileAction('hide') : this.profileAction('unmatch')
              },    
              
              {text: from == 'Swipes' ? 'Report and hide':'Report and unmatch', 
                onPress: () => 
                //if from swipes and not a match -> report and hide. If not coming from swipes and is a match -> report and unmatch.
                from == 'Swipes' ? this.profileAction('hideAndReport') : this.profileAction('unmatchAndReport')
              },   
              {text: 'Cancel', 
              onPress: () => console.log('Cancel Pressed'), style: 'destructive'
            },  
            
            ],
            { cancelable: false }
          )         
        }
      }
    )
  }

  excludeUsers = (useridExcluded, useridExcluder) => {

    //save ref to users to exclude from eachother
    let firebaseRefUseridExcluded = firebase.database().ref('/users/' + useridExcluded +'/excludedUsers');
    let firebaseRefUseridExcluder = firebase.database().ref('/users/' + useridExcluder +'/excludedUsers');

    //add excluded data to profile of the excluded user
    firebaseRefUseridExcluded.push({
        useridExcluder: useridExcluder, 
        useridExcluded: useridExcluded, 
        time: Date.now()
    });

    //add excluded data to profile of the excluder user
    firebaseRefUseridExcluder.push({
        useridExcluder: useridExcluder, 
        useridExcluded: useridExcluded, 
        time: Date.now()
    });

  }

  //handle hiding, unmatching, reporting users. 
  profileAction = (action) => {
    //actions: hide, unmatch, hideAndReport, unmatchAndReport

    //let userId = firebase.auth().currentUser.uid;
    //hide (unmatched user)
    if (action == 'hide' || action == 'hideAndReport') {
      this.excludeUsers(this.state.userIdMatch, firebase.auth().currentUser.uid);
    }

    //unmatch user
    if (action == 'unmatch' || action == 'unmatchAndReport') {
      this.excludeUsers(this.state.userIdMatch, firebase.auth().currentUser.uid);
      
      // disable matches anddisable conversation
      //create ref to set new match object with match_id associated with conversation_id generated above. 
      let matchesRef1 = firebase.database().ref('matches/'+firebase.auth().currentUser.uid+'/'+this.state.userIdMatch+'/');

      //create ref to set new match object with match_id associated with conversation_id generated above. 
      let matchesRef2 = firebase.database().ref('matches/'+this.state.userIdMatch+'/'+firebase.auth().currentUser.uid+'/');

      //save fb ref for quering conversation data
      let convoRef = firebase.database().ref('/conversations/'+conversationId+'/');

      //add removed property to match
      matchesRef1.update({removed: true});

      //add removed property to match
      matchesRef2.update({removed: true});

      //add removed property to conversation as well. 
      convoRef.update({removed: true});
    
    }

    //report user
    if (action == 'hideAndReport' || action == 'unmatchAndReport') {
      //first exclude users from eachother
      this.excludeUsers(this.state.userIdMatch, firebase.auth().currentUser.uid);

      //save ref to users to involved in report
      let firebaseRefUseridReported = firebase.database().ref('/users/' + this.state.userIdMatch +'/report');
      let firebaseRefUseridReporter = firebase.database().ref('/users/' + firebase.auth().currentUser.uid +'/report');

      //push data report to profile of user who is being reported
      firebaseRefUseridReported.push({
          useridReporter: firebase.auth().currentUser.uid, 
          useridReported: this.state.userIdMatch, 
          //reason: '',
          time: Date.now()
      });
      
      //push data report to profile of user who is reporting
      firebaseRefUseridReporter.push({
        useridReporter: firebase.auth().currentUser.uid, 
        useridReported: this.state.userIdMatch,
        //reason: '', 
        time: Date.now()
    });
    }

    //go to swipes now and forceUpdate
    this.props.navigation.navigate('Swipes', {forceUpdate: true});             

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

    // //handle scroll of profile by growing/shrinking container when user scrolls and expects that. 
    // _handleScroll = (event: Object) => {

    //   var currentOffset = event.nativeEvent.contentOffset.y;
    //   var direction = currentOffset > this.offset ? 'down' : 'up';
    //   this.offset = currentOffset;
    //   if((direction == 'down') && (currentOffset > 0) && (this.state.profileMaxHeight == '15%')){
      
    //     //grow up to 15%
    //     this.setState({ profileMaxHeight: '40%'});

    //   }else if ((direction == 'up') && (currentOffset < 0) && ((this.state.profileMaxHeight == '40%')) ){
        
    //     //shrink down to 15%
    //     this.setState({ profileMaxHeight: '15%'});
           
    //   }
    // }
    
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
            //this.setState({blur:'0'});
            this.deBlur('100',0)
            this.deBlur('90',100)
            this.deBlur('80',200)
            this.deBlur('70',300)
            this.deBlur('50',400)
            this.deBlur('40',500)
            this.deBlur('30',550)
            this.deBlur('20',600)
            this.deBlur('10',650)
            this.deBlur('0',700)

          //update images in imageViewer to blurRadious of 0 as well. 
            let newImages = this.state.images.map(image => (
                { ...image, props: {...this.props, blurRadius: 0} }
              )
            );
          
          this.setState({images: newImages});

          //Add event for sneak peek being used. 
          RNfirebase.analytics().logEvent('sneakPeek', {
            matchExpired: true,
          });

        }else{

          //match must be active, alert user what button will do after expiration. 
          //alert("Send a message to focus their photos. After this conversation expires, you'll be able use this button to focus their photos.");

          Alert.alert(
            '',
            "Sending messages will focus their photos. After expiration, this button will reveal who they were.",
            [
              {text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
            ],
            { cancelable: false }
          )  

          //navigate to payments component, since user is not subscribed.
          //navigate("Payments", { flow: 'peek'});

          //Add event for sneak peek being used. 
          RNfirebase.analytics().logEvent('sneakPeek', {
            matchExpired: true,
          });

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
          
          //Add event extending conversation. 
          RNfirebase.analytics().logEvent('extendConversation', {
            subscribed: true,
          });

      }else{
        //navigate to payments component, since user is not subscribed.

          //Add event extending conversation. 
          RNfirebase.analytics().logEvent('extendConversation', {
            subscribed: false,
          });

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
        active: false,
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
    console.log('seen is: '+ this.state.showModal);
  
    //console.log('time remaining is: '+ timeRemaining);
    let {height, width} = Dimensions.get('window');
    let image = this.state.image; //pull first image from images array instead.
    let about = this.state.about;
    let chatActive = this.state.chatActive;
    let matchActive = this.state.matchActive;
    let blur = Number(this.state.blur);
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
    let datePrimaryButtonCopy = 'Go on a blind date';
    let flow = 'createNewProposal' ;
    let modalHeadline = 'Make the first move.';
    let modalPrimaryCTA = 'Go on a blind date';
    let modalSecondaryCTA = 'Chat first'

    console.log('state.params.match_userid: '+state.params.match_userid);

    //if date is in the passed (proposed or confirmed), go to flow createNewProposal
    if( (this.state.date.proposedTime < new Date().getTime() && this.state.date.status !== 'accepted') || (this.state.date.confirmedTime < new Date().getTime() && this.state.date.status == 'accepted') ){
      flow = 'createNewProposal' ;
    }else{
      //configuration for date button
      switch (this.state.date.status) {
        case 'pending': 
          datePrimaryButtonCopy = (userId == this.state.date.waitingOnId) ? 'Blind date requested' : 'Blind date requested' ;
          flow = (userId == this.state.date.waitingOnId) ? 'approveNewProposal' : 'waitingAcceptanceNewProposal' ;
          type = this.state.date.type;
          modalHeadline = 'Blind date requested.';
          modalPrimaryCTA = 'Blind date details';
          modalSecondaryCTA = 'Chat first'
          break;
        case 'pendingUpdate': 
          datePrimaryButtonCopy = (userId == this.state.date.waitingOnId) ? 'Blind date requested' : 'Blind date requested' ;
          flow = (userId == this.state.date.waitingOnId) ? 'approveUpdatedProposal' : 'waitingAcceptanceUpdatedProposal' ;
          type = this.state.date.type;
          modalHeadline = 'Blind date requested.';
          modalPrimaryCTA = 'Blind date details';
          modalSecondaryCTA = 'Chat first'
          break;
        case 'fulfill': 
          datePrimaryButtonCopy = 'Blind date coordinating';
          flow = 'proposalAccepted' ; //go to proposal Acccepted flow
          type = this.state.date.type;
          modalHeadline = "Personalizing your date now.";
          modalPrimaryCTA = 'Blind date details';
          modalSecondaryCTA = 'Chat first';
          break;
        case 'accepted': 
          datePrimaryButtonCopy = 'Blind date details';
          //flow = (true) ? 'detailsHide' : 'detailsShow' ; //1642837974 //1642833434708
          flow = (this.state.date.proposedTime < Date.now()+(86400000*1)) ? 'detailsHide' : 'detailsShow' ; //show details when 24 hours before proposedTime
          type = this.state.date.type;
          modalHeadline = "Blind date accepted.";
          modalPrimaryCTA = 'Blind date details';
          modalSecondaryCTA = 'Chat first';
          break;
        case 'declined':
          datePrimaryButtonCopy = 'Go on a blind date';
          flow = 'createNewProposal' ;
          type = this.state.date.type;
          break;
        case 'none':
          datePrimaryButtonCopy = 'Go on a blind date';
          flow = 'createNewProposal' ;
          type = this.state.date.type;
          break;
        default:
          datePrimaryButtonCopy = 'Go on a blind date';
          flow = 'createNewProposal' ;

      }
    }

    


    return (
      <Container>
          <StatusBar 
            hidden={'hidden'} 
            barStyle={'dark-content'} 
            animated={true}
          />


          {/* WHY RENDERING AFTER DECLINING A DATE? NOT seen in db is not changing, so why would this.state.showModal?*/}
          
            <Modal 
            visible={this.state.showModal} 
            transparent={true}
            animationType="slide">
                  
              <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)'}}>
               
               
               
               <View style={{flex: 1, justifyContent: 'flex-end'}}>

               
                <TouchableOpacity

                    onPress={() => 
                                            
                      { 
                        this.setState({ showModal: false }); //dont see this modal again

                        //update db to never see modal again. 
                        firebase.database().ref('/matches/'+userId+'/'+this.state.userIdMatch+'/').update({
                          seen: true
                        });

                        //navigate to profile module
                        this.props.navigation.navigate("Profile", {
                          profile: this.props.navigation.getParam('profile'), 
                          blur: this.props.navigation.getParam('blur'), 
                          conversationId: conversationId,  
                          from: 'Chat',
                        });
                      }
                    }

              
                    style={{ 
                      //width: deviceWidth-180,
                      flex: 1,
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-end',
                      flexDirection: 'row', 
                      }}>

                  <Thumbnail 
                  blurRadius={  blur  }
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
                        borderWidth: 1, 
                        borderColor: 'white' }} 
                        source={{uri: this.state.image, cache: 'force-cache'}} 

                        
                    />
                    <View style={{}}>
                      <Text style={{color: primaryColor, fontSize: 20, fontFamily: 'Helvetica' }}>{this.state.profile.name} | {age}</Text>
                      <Text style={{color: 'white', fontSize: 20, fontFamily: 'Helvetica-Light' }}>{this.state.profile.city_state}</Text>
                    </View>

                  


                </TouchableOpacity>
              </View>
               
               
               
               <View style={{flex: 1, justifyContent: 'flex-start', alignItems: 'center'}}>


              
                  <Text style={{
                    color: 'white',
                    textAlign: 'center', 
                    fontFamily: 'Helvetica-Light',
                    fontSize: 32,
                    //width: deviceWidth-130,
                    margin: 15,
                    }}>{modalHeadline}
                  </Text>
                  <Button 
                        rounded
                        onPress={() => 
                        
                          { 

                            this.setState({ showModal: false }) //dont see this modal again

                            //update db to never see modal again. 
                            firebase.database().ref('/matches/'+userId+'/'+this.state.userIdMatch+'/').update({
                              seen: true
                            });

                            //if match is active or date has been set up (in status fulfill or accepted) go to blindDate module, if it's expired alert that chat needs to be extended first
                            if(matchActive || (this.state.date.status == 'fulfill' || this.state.date.status == 'accepted')){


                              this.props.navigation.navigate('BlindDate', {
                                //status: this.state.date.status, 
                                flow: flow,
                                //dateType: type, 
                                dateId: conversationId, //dateId is the conversation id
                                //userId: this.state.userId, 
                                matchName: this.props.navigation.getParam('name'), 
                                userIdMatch: this.state.userIdMatch,
                                reservationFirstName: this.state.reservationFirstName,
                                reservationLastName: this.state.reservationLastName,
                                userCreator: date.userCreator,
                                dateType: date.type,
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
                                placeUrl: date.url, 
                                placeImage: date.imageUrl,
                                placeName: date.placeName,
                                priceMax: date.priceMax,
                              })}else{
                                Alert.alert(
                                  "Conversation expired",
                                  "You'll need to extend the Conversation in order to go on a blind date.",
                                  [
                                    {text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                                  ],
                                  { cancelable: false }
                                )  
                              }
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
                        <Text style={{fontFamily:'Helvetica-Light'}}>{modalPrimaryCTA}</Text>
                      </Button>
                      <Button 
                          rounded
                          bordered
                          onPress={() => { 
                              this.setState({ showModal: false }) //dont see this modal again

                              //update db to never see modal again. 
                              firebase.database().ref('/matches/'+userId+'/'+this.state.userIdMatch+'/').update({
                                seen: true
                              });
                          
                          }}
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
                            <Text style={{fontFamily:'Helvetica-Light', color: primaryColor}}>{modalSecondaryCTA}</Text>
                        </Button>
                    </View>
              </View>

            </Modal> 
          

        
                
          <View style={{padding:0,  alignItems:'center', flexDirection:'row', justifyContent: 'space-around', paddingLeft: 15, paddingRight: 20}}>
            <Text style={{fontFamily:'Helvetica-Light', marginRight: 10,  fontWeight:'600', color: primaryColor}}>TIME REMAINING: </Text>
            <Text numberOfLines ={1} style={{fontWeight:'400', color:'#888', width:200}}>        
              {this.state.timeRemaining} 
            </Text> 
    
            <Button 
              transparent 
              style={{width: 100, flex: 1, justifyContent: 'flex-end', }} 
              onPress = {() =>  this.blockReportFlow('Chat') } 
            >
            <FontAwesomeIcon size={ 20 } style={{ color: 'lightgrey'}} icon={ faFlag } />
        </Button>
        </View>

        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
          
            <Button 
                rounded
                style={{
                  //marginLeft: deviceWidth/5,
                  zIndex: 1,
                  width: deviceWidth-80,
                  margin: 15,
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
                    //if match is active or date has been set up (in status fulfill or accepted) go to blindDate module, if it's expired alert that chat needs to be extended first
                    if(matchActive || (this.state.date.status == 'fulfill' || this.state.date.status == 'accepted')){
                      this.props.navigation.navigate('BlindDate', {
                        //status: this.state.date.status, 
                        flow: flow,
                        //dateType: type, 
                        dateId: conversationId, //dateId is the conversation id
                        //userId: this.state.userId, 
                        matchName: this.props.navigation.getParam('name'), 
                        userIdMatch: this.state.userIdMatch,
                        reservationFirstName: this.state.reservationFirstName,
                        reservationLastName: this.state.reservationLastName,
                        userCreator: date.userCreator,
                        dateType: date.type,
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
                        placeUrl: date.url, 
                        placeImage: date.imageUrl,
                        placeName: date.placeName,
                        priceMax: date.priceMax,
                      })}else{
                        Alert.alert(
                          "Conversation expired",
                          "You'll need to extend the Conversation in order to go on a blind date.",
                          [
                            {text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                          ],
                          { cancelable: false }
                        )  
                      }
                    }


                
              }
                

                >
                <Text style={{fontFamily:'Helvetica-Light'}}>{datePrimaryButtonCopy}</Text>
              </Button>
          

            
              {this.state.blur &&
                <Image source={{uri: image, cache: 'force-cache'}} position="absolute" resizeMode="cover" blurRadius={parseInt(this.state.blur, 10)}  
                style={[styles.backgroundImage, {height:height, width: width}]}
                />
              }

        </View>
        
          
        {/* <GiftedChat
          messages={this.state.messages}
          renderInputToolbar={!matchActive ? () => null : undefined}
          minInputToolbarHeight = {matchActive == false ? 0 : undefined}
          bottomOffset={33}      
          isAnimated
          onSend={
            (message) => {
              this.onSend(message);
            }
          }
          user={{_id: this.state.userId, _name: this.state.userName }}
        /> */}

        <TouchableWithoutFeedback onPress={() => {Keyboard.dismiss()}}>
          <View style={{ flex: 6, }}>
            <GiftedChat
                keyboardShouldPersistTaps={'never'}
                messages={this.state.messages}
                renderInputToolbar={!matchActive ? () => null : undefined}
                minInputToolbarHeight = {matchActive == false ? 0 : undefined}
                bottomOffset={35}      
                onSend={
                  (message) => {
                    this.onSend(message);
                  }
                }
                isAnimated={true}
                user={{_id: this.state.userId, _name: this.state.userName }}
                />
          </View>
        </TouchableWithoutFeedback>


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
                colors={[primaryColor, primaryColor  ]}
                // colors={[primaryColor, secondaryColor  ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 2, y: 2 }}
                >
          
          <View style = {{flex: 1, justifyContent: 'center',}}>
            <Text style={{fontSize: 18, color: 'white', fontFamily:'Helvetica-Light'}}>Conversation Expired</Text>
          </View>
      
          <View style={{flex: 1}}>
            <Button 
              style={{ 
                width: deviceWidth-80,
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
                  <Text style={{color: btnTextColor, fontFamily:'Helvetica-Light'}}>Extend Conversation</Text>
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

    //listen for notifications when module Focus
    const didFocus = this.props.navigation.addListener(
      'didFocus',
      payload => {
        
        //get notifications when arriving
        this.handleNotification(userId, 'Chat', this.props.navigation.getParam('match_userid'));

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


  }

  


  componentWillUnmount() {

    clearInterval(this.interval);

    this.closeChat;

    //firebase.database().ref('example').child(this.state.somethingDyamic).off('value');

    firebase.database().ref('/matches/' + userId).off('child_changed');

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

