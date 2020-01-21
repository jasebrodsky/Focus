import React, { Component } from 'react';
import { Alert, ScrollView, TouchableOpacity, Image, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import { Modal } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFlag, faArrowLeft, faImages } from '@fortawesome/free-solid-svg-icons';
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
//import TimerCountdown from 'react-native-timer-countdown'
import TimerMachine from 'react-timer-machine';
import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";


const primaryColor = "#8A6077";
var BUTTONS = ["Unmatch", "Report & Block", "Cancel"];
var DESTRUCTIVE_INDEX = 2;
var CANCEL_INDEX = 2;

class Chat extends Component {

  constructor(props){
    super(props)

    this.state = {
      messages:[],
      blur: null,
      chatActive: true,
      removed: false,
      timeLeft: null,
      matchDate: null,
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
      profileMaxHeight: "15%",
      images: [],
      imageIndex: 0,
      about: ''
      //image: null
    }

  }


  //configure navigation
  static navigationOptions = ({ navigation }) => {
    return {
      headerLeft: () => (
        <Button transparent onPress={() => navigation.goBack()}>
          <FontAwesomeIcon size={ 28 } style={{left: 16, color: primaryColor}} icon={ faArrowLeft } />
       </Button>
      ),
      headerTitle: () => (
        <Title>{navigation.getParam('name')}</Title>
      ),
      
      // headerRight: () => (
      //   <Button transparent onPress={navigation.getParam('block')}>
      //     <FontAwesomeIcon style={{right: 16, fontSize: 32, color: '#B2B2FF'}} icon={ faFlag } />
      //  </Button>
      // ),

      //NEED TO FIGURE OUT HOW TO PASS NAVIGATION OBJECT DOWN TO ACTIONSHEET AND ALERT CHILD COMPONENTS. Can call the function via getParam, only when it's in the parent component, like above. 
      headerRight: () => (
        <Button transparent onPress={() =>
          
          ActionSheet.show(
            {
              options: BUTTONS,
              cancelButtonIndex: CANCEL_INDEX,
              destructiveButtonIndex: DESTRUCTIVE_INDEX
              
            },
            buttonIndex => {

              //handle blocking profile
              if ((buttonIndex) == 0){

                navigation.getParam('block')
              
                //handle block and report a user
              }else if ((buttonIndex) == 1){

                Alert.alert(
                  'Report & Block',
                  'We take reports seriously and will investigate this person as well as block them from interacting with you in the future. If you just want to unmatch tap "unmatch" instead.',
                  [
                    {text: 'Unmatch', onPress: () => navigation.getParam('block')},
                    {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                    //{text: 'Report & Block', onPress: () => this.blockOrReport('report')},
                  ],
                  { cancelable: false }
                )         
              }
            }
          )} >
          <FontAwesomeIcon size={ 28 } style={{right: 16, color: primaryColor}} icon={ faFlag } />
       </Button>
      )
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
    let reviews = state.params.reviews;
    let city_state = state.params.city_state;
    let education = state.params.education;
    let work = state.params.work;
    let match_userid = state.params.match_userid; 
    let match_state = state.params.match_state;

    //save fb ref for quering conversation data
    firebaseRef = firebase.database().ref('/conversations/'+conversationId+'/');

    //firebase ref for user in context match obj, used to flag all messages have been read
    firebaseMatchesRef2 = firebase.database().ref('/matches/'+userId+'/'+match_userid+'/');

    //update the unread of my's match obj
    firebaseMatchesRef2.update({
      unread_message: false
    });


   //listen for new conversation data in db
      firebaseRef.on('value', (dataSnapshot) => {

        //create empty array
        var imagesArray = [];
        
        //create valure for the blur radius
        var blurRadius = dataSnapshot.val().blur;

        //create valure for the match status 
        var chatActive = dataSnapshot.val().active;

        //get name of user who is not me.
        var participantsList = dataSnapshot.val().participants;

        //convert participants list into array
        var participantArray = Object.entries(participantsList);

        //find participant who is not user in context
        //first users userid
        var participantArrayFirstID = Object.keys(participantsList)[0];

        //second participants userid
        var participantArraySecondID = Object.keys(participantsList)[1];
     
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
          imageObj = {'url':item.url, cache: 'force-cache', 'props':{'blurRadius': +blurRadius, source: {uri: item.url, cache: 'force-cache'}}};
          imagesArray.push(imageObj);
        })
          //setState with above elements
          this.setState({
            about: about,
            birthday: birthday,
            gender: gender,
            city_state: city_state,
            education: education,
            work: work,
            reviews: reviews,
            name: participantName,
            userName: participantLoggedInUserName,
            blur: dataSnapshot.val().blur,
            chatActive: chatActive,
            //timeLeft: dataSnapshot.val().time_left, //should be conversation start date. js would subtract today's date from that = time_left
            matchDate: dataSnapshot.val().match_date,
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

    firebaseMessagesRef = firebase.database().ref('/conversations/'+conversationId+'/messages/');
    firebaseConversationsRef = firebase.database().ref('/conversations/'+conversationId+'/');
    
    //save firebase refs to update matches with last messages
    firebaseMatchesRef1 = firebase.database().ref('/matches/'+this.state.userIdMatch+'/'+userId+'/');
    firebaseMatchesRef2 = firebase.database().ref('/matches/'+userId+'/'+this.state.userIdMatch+'/');

    //loop through new messages and push back to firebase, which will call loadmessages again. 
    for (let i = 0; i < message.length; i++) {
      firebaseMessagesRef.push({
        text: message[i].text, 
        user: message[i].user, 
        userTo: this.state.userIdMatch,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });

      //update the blur
      if(this.state.blur > 0){
        firebaseConversationsRef.update({
          blur: this.state.blur - 3
        });
      }

      //update the last message and read status of match's match obj
        firebaseMatchesRef1.update({
          last_message: message[i].text,
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

  expiredChat = () => {

    return (
      <View style={{ height: 150, backgroundColor: 'white', alignItems:'center', flexDirection:'column', justifyContent: 'center'}}>
        <Text style = {{paddingBottom: 5, fontWeight: '700'}}>Need some extra time?</Text>
        <Text>Ask for permission to extend</Text>
        <View style={{ paddingTop: 20}}>
          <Button rounded bordered><Text>Extend</Text></Button>
        </View>
      </View>
    );

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

      //return markup for each review
      return ( 
      reviews ? (
      <View style={{marginTop: 10}} >
        {Object.values(reviews).map((review, index) => (
          <Card>
          <List>
            <ListItem avatar noBorder>
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

  render() {


    const { state, navigate } = this.props.navigation;
    let currentDate = new Date();
    let timeRemaining =  86000000 - (currentDate.getTime() - this.state.matchDate);
    timeRemaining = timeRemaining > 0 ? timeRemaining : 0;

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
    let birthday = this.state.birthday;
    let age = this.getAge(birthday);
    let gender = this.state.gender;
    let city_state = this.state.city_state;
    let education = this.state.education;
    let work = this.state.work;
    let reviews = this.state.reviews;


    return (
      <Container>

          <Modal 
            visible={this.state.imageViewerVisible} 
            transparent={true}
            animationType="slide">
          
              <ImageViewer 
                index = {this.state.imageIndex}
                imageUrls={this.state.images}
                onChange = {(index) => this.setState({ imageIndex: index})}
                onSwipeDown = {() => this.setState({ imageViewerVisible: false, profileMaxHeight: '15%', imageIndex: this.state.imageIndex})}
                onClick = {() => this.setState({ imageViewerVisible: false, profileMaxHeight: '15%'})}
              />

                <View 
                  flex={1}
                  // alignItems="flex-start"
                  // justifyContent="center"
                  borderWidth={1}
                  borderColor="grey"
                  borderRadius={5}
                  backgroundColor="white"
                  maxHeight= {this.state.profileMaxHeight} //profileMaxHeight
                 
                >
                  <ScrollView 
                    ref='ScrollView_Reference'
                    onScroll={this._handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{
                      padding: 15,
                      backgroundColor:'white'
                    }}>
                      <TouchableOpacity>
                        <Card transparent>   
                          {/* <H3 numberOfLines={1} style={{textTransform: 'capitalize', color: primaryColor}} >{name}</H3> */}
                          <H3 numberOfLines={1} style={{textTransform: 'capitalize', color: primaryColor}} >{age}, {gender}, {city_state}</H3>
                          <Text numberOfLines={1} style={{}} >{work} </Text>
                          <Text numberOfLines={1} style={{marginBottom: 10}} >{education} </Text>
                          <Text note style={{marginTop: 10}}>{about}</Text>
                        </Card>
                        {this._renderReview(this.state.reviews)}
                      </TouchableOpacity>
                  </ScrollView>
                </View>          
          </Modal> 
        
        <View style={{padding:10,  alignItems:'center', flexDirection:'row', justifyContent: 'center'}}>
          <Text style={{fontWeight:'600', color:'red', paddingLeft: 5}}>TIME REMAINING: </Text>
          <Text numberOfLines ={1} style={{fontWeight:'400', color:'#888', width:200}}> 
          <TimerMachine
              timeStart={timeRemaining} // start at 10 seconds
              timeEnd={0 * 1000} // end at 20 seconds
              started={true}
              paused={false}
              countdown={true} // use as stopwatch
              interval={1000} // tick every 1 second
              formatTimer={(time, ms) =>
                moment.duration(ms, "milliseconds").format("h:mm:ss")
              }
              onStart={time =>
                console.info(`Timer started: ${JSON.stringify(time)}`)
              }
              onStop={time =>
                console.info(`Timer stopped: ${JSON.stringify(time)}`)
              }
              // onTick={time =>
              //   console.info(`Timer ticked: ${JSON.stringify(time)}`)
              // }
              onPause={time =>
                console.info(`Timer paused: ${JSON.stringify(time)}`)
              }
              onResume={time =>
                console.info(`Timer resumed: ${JSON.stringify(time)}`)
              }
              onComplete={time =>
                this.setState({ chatActive: false, timeRemaining:0})
              }
          />            
          </Text> 
        
              <FontAwesomeIcon onPress={() => this.setState({ imageViewerVisible: true})} size={ 28 } style={{ right: 15, color: 'grey',}} icon={ faImages } />

        </View>

        <View>
          <Image source={{uri: image, cache: 'force-cache'}} position="absolute" resizeMode="cover" blurRadius={Number(this.state.blur)}  
          style={[styles.backgroundImage, {height:height, width: width}]}
          />
        </View>
        

        <GiftedChat
          messages={this.state.messages}
          renderInputToolbar={matchActive == false ? () => null : undefined}
          minInputToolbarHeight = {matchActive == false ? 0 : undefined}
          onSend={
            (message) => {
              this.onSend(message);
            }
          }
          user={{_id: this.state.userId, _name: this.state.userName }}
        />

        {!matchActive &&

        <View style={{ height: 100, backgroundColor: 'white', alignItems:'center', flexDirection:'column', justifyContent: 'center'}}>
          <Text style = {{ fontWeight: '700'}}>This conversation has expired</Text>
          <Text>Better luck next time.</Text>
        </View>
         }

      </Container>
    );
  }

  componentDidMount() {
    
    //send blockOrReport function to nav as param, so that it can be referenced in the navigation. 
    this.props.navigation.setParams({ block: this.blockOrReport });

    this.loadMessages((message) => {
      this.setState((previousState) => {
        return {
          messages: GiftedChat.append(previousState.messages, message)
        };
      });
    });
  }


  componentWillUnmount() {
    () => this.setState({
      timeLeft: undefined
    })
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

