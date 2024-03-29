import React, { Component } from 'react';
import {Dimensions, Animated, ScrollView, Share, StatusBar} from 'react-native';
// import RNfirebase from 'react-native-firebase';
// import * as firebase from "firebase";
import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import analytics from '@react-native-firebase/analytics';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUsers, faComments,faInbox } from '@fortawesome/free-solid-svg-icons';
import ProgressCircle from 'react-native-progress-circle';
import LinearGradient from 'react-native-linear-gradient';
import  SvgCssUri from 'react-native-svg-uri';
import { renderNotification, handleNotification } from '../Utilities/utilities.js';


import {
  Container,
  Text,
  Button,
  List,
  ListItem,
  Thumbnail,
  Separator,
  Body,
  View
} from "native-base";

const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";
//const btnColor = 'white';
const btnColor = primaryColor;
const btnTextColor = 'white';

class Messages extends Component {

  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      rotation: new Animated.Value(0),
      convoData: [],
      currentDate: new Date(),
      loading: true,
      isEmpty: false,
      expiredMatches: false,
      reservationFirstName: 'TESTIES',
      reservationLastName: 'TESTIES2'
    }
  }

  //configure navigation
  static navigationOptions = ({ navigation }) => {
    return {
      headerLeft: () => (
        <Button transparent style={{left: 16, }} onPress={() => navigation.navigate('Swipes', {forceUpdate: false})}>
          <FontAwesomeIcon size={ 32 } style={{color: primaryColor}} icon={ faUsers } />
        </Button>
      ),
      headerTitle: () => (
          <FontAwesomeIcon size={ 32 } style={{ color: 'lightgrey'}} icon={ faComments } />
      )
    };
  };


  //function to run animated loading in a rotation running indefinetly
  runAnimation = () => {
    this.state.rotation.setValue(0);
    Animated.timing(this.state.rotation, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => this.runAnimation());
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

  //Share function when sharing referral code native share functionality. 
  onShare = () => {

    //fetch from getCode cloud function
    fetch('https://us-central1-blurred-195721.cloudfunctions.net/getCode?userid='+this.state.userId)
    .then((response) => response.json())
    .then((responseJson) => {
               
        //save code var.
        let code = responseJson.sharable_code;
        let codeDelete = responseJson.code_id;

        //prompt native share functionality 
        Share.share({
          message: 'I think you\'ll love Focus. It\'s a different type of dating where only men invited by women can join. You\'ll need this code to enter: '+code,
          url: 'https://itunes.apple.com/us/app/hinge/id595287172',
          title: 'Wow, have you seen this yet?'
        }).then(({action, activityType}) => {
          if(action === Share.dismissedAction) {
            //delete unsent code from db
            database().ref('codes/' + codeDelete).remove();

          } 
          else {
            console.log('Share successful');
          }
        })
    })
    .catch(function(error) {
        alert("Data could not be saved." + error);
    });
  };
  //RE FORMATE IMAGES NOW THAT IT'S AN OBJECT (NOT AN ARRAY)

  //render each ListItem element
  //figure out how to locate the properties of the 'x' object passed in the function below. Looks like those properties are null for some reason 
  convoRender(x, i, type){
    const { navigate } = this.props.navigation; //needed for navigation functions
    let object = x.toJSON(); //convert to JSON
    let blur = Number(object.blur);
    //let blur = object.blur;
    let url = Object.values(object.images)[0].url;
    let images = object.images;
    let name = object.name;
    let about = object.about;
    let birthday = object.birthday;
    let gender = object.gender;
    let city_state = object.city_state;
    let education = object.education;
    let work = object.work;
    let reviews = object.reviews;
    let seen = object.seen;
    let match_date = object.match_date;
    let reservationFirstName = this.state.reservationFirstName; //needed to setup date
    let reservationLastName = this.state.reservationLastName; //needed to setup date
    let last_message = object.last_message;
    let last_message_date = object.last_message_date;
    let expiration_date = object.expiration_date;
    let timeRemaining = object.expiration_date - this.state.currentDate.getTime();
    //let timeRemaining =  86000000 - (this.state.currentDate.getTime() - match_date);
    let totalTime = 688000000 ; //time of matches - 1 week in ms. 
    let percent_left = (timeRemaining/totalTime)*100;
    let match_state = (timeRemaining > 0) ? 'active' : 'expired';
    let match_id = object.match_id;
    let unread_message = object.unread_message;
    let bold = (unread_message == true) ? '900' : 'normal';
    let match_userid = object.match_userid;
    let expiredMatches = false;

    let notifyUser = object.date_waiting_on == userId ? true : false; //check if current user needs is being waited on
    let dateStatus = (((object.date_status == 'pending') && notifyUser)  || ((object.date_status == 'pendingUpdate') && notifyUser) || object.date_status == 'accepted') ? true : false ; //dateStatus as true, if status is pending/pendingUpdate (and user needs is being waited on), or accepted
    let dateExpired = ((object.proposed_time - (6 * 3600000)) < this.state.currentDate.getTime()) ? true : false; 
    //let dateExpired = ( object.proposed_time < this.state.currentDate.getTime()) ? true : false; 



    // const currentDate = new Date().getTime();
    // const { proposedTime, confirmedTime, date_status } = object;

    // // Floor proposedTime to the beginning of the day
    // const proposedDate = new Date(proposedTime);
    // proposedDate.setHours(24, 0, 0, 0);
    // const proposedTimeEndOfDay = proposedDate.getTime();


    // if ((proposedTimeEndOfDay < currentDate && date_status !== 'accepted') || (confirmedTime < currentDate && date_status === 'accepted')) {
    //   dateExpired = true;
    // }else{
    //   dateExpired = false;
    // }



    if (type == 'active' && match_state == 'active'){
      
      return(
        <ListItem key={match_id} onPress={() => navigate("Chat", {profile: object, seen: seen, reservationFirstName: reservationFirstName, reservationLastName: reservationLastName,  blur: blur, time_remaining: timeRemaining, expiration_date: expiration_date , match_id: match_id, match_state: match_state, match_userid: match_userid, about: about, name: name, birthday: birthday, gender: gender, city_state: city_state, education: education, work: work, images:images, reviews: reviews })}>        
          <ProgressCircle
              matchStatus = {match_state}
              blur={blur}
              percent={percent_left}
              radius={35}
              borderWidth={5}
              color = {percent_left>50 ? '#3399FF' : percent_left>20 ? 'orange' : 'red'}
              shadowColor="#999"
              bgColor="#fff"
          >
              <Thumbnail blurRadius={blur} round size={80} source={{uri: url, cache: 'force-cache'}} />
            </ProgressCircle>
          <Body style={{flex: 1, padding: 5, flexDirection: 'row'}}>
            <View style={{flex: 1}}>
              <Text style={{fontWeight: bold, fontFamily:'Helvetica-Light' }} >{name}</Text>
              <Text note numberOfLines={1} style={{fontWeight: bold, fontFamily:'Helvetica-Light',  }}>
                {last_message}
              </Text>
            </View>

            { (dateStatus && !dateExpired) &&
            <View style={{
              flex: 1, 
              padding: 5,
              borderRadius: 20, 
              backgroundColor: primaryColor, 
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65,
              }}>
                <Text style={{color: 'white', fontSize: 16}}>Blind Date</Text>
            </View>

            }


          </Body>
        </ListItem>
        )
    }else if (type == 'expired' && match_state == 'expired'){
      
      return(
        
        
        <ListItem key={match_id} onPress={() => navigate("Chat", {profile: object, seen: seen, reservationFirstName: reservationFirstName, reservationLastName: reservationLastName,  blur: blur, time_remaining: timeRemaining, expiration_date: expiration_date , match_id: match_id, match_state: match_state, match_userid: match_userid, about: about, name: name, birthday: birthday, gender: gender, city_state: city_state, education: education, work: work, images:images, reviews: reviews })}>        
        <ProgressCircle
            matchStatus = {match_state}
            blur={blur}
            percent={percent_left}
            radius={35}
            borderWidth={5}
            color = {percent_left>50 ? '#3399FF' : percent_left>20 ? 'orange' : 'red'}
            shadowColor="#999"
            bgColor="#fff"
        >
            <Thumbnail blurRadius={blur} round size={80} source={{uri: url, cache: 'force-cache'}} />
          </ProgressCircle>
        <Body style={{flex: 1, padding: 5, flexDirection: 'row'}}>
          <View style={{flex: 1}}>
            <Text style={{fontWeight: bold, fontFamily:'Helvetica-Light' }} >{name}</Text>
            <Text note numberOfLines={1} style={{fontWeight: bold, fontFamily:'Helvetica-Light',  }}>
              {last_message}
            </Text>
          </View>

          { (dateStatus && !dateExpired) &&
          <View style={{
            flex: 1, 
            padding: 5,
            borderRadius: 20, 
            backgroundColor: primaryColor, 
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 3,
              },
              shadowOpacity: 0.29,
              shadowRadius: 4.65,
            }}>
              <Text style={{color: 'white', fontSize: 16}}>Blind Date</Text>
          </View>

          }


        </Body>
      </ListItem>
        
        
        
        
        
    
        )
    }

  }
  

  componentWillMount() {

    //rotate logo 
    this.runAnimation()
    

    const { state, navigate } = this.props.navigation;
    userId = auth().currentUser.uid;

    let firebaseRef = database().ref('/matches/'+userId+'/').orderByChild('last_message_date').limitToFirst(50);
    
    //let firebaseRefProfile = database().ref('/users/'+userId+'/');

    //query for logged in users information needed and set state with it.     
    database().ref('/users/' + userId).once('value', ((snapshot) => {
            
      //set state with user data. 
      this.setState({ 
        reservationFirstName: snapshot.val().first_name,
        reservationLastName: snapshot.val().last_name,
      });  
    }))
        

    //listen for notifications when module Focus
    const didFocus = this.props.navigation.addListener(
      'didFocus',
      payload => {
        
        //get notifications when arriving
        this.handleNotification(userId, 'Messages', null);

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


      var convos = [];
      //put message data into state in appropriate format
      firebaseRef.on('value', matchSnap => {

          //clear array, if there's exisiting data here to make sure all items are unique when db is updated. 
          convos = [];

          //push match objects into convos array. If match is removed, don't add to arrary. 
          matchSnap.forEach((match) => {
            
            //save variables to use in forEach loop
            let matchDate = match.val().match_date;
            let expirationDate = match.val().expiration_date;
            //let timeRemaining =  86000000 - (this.state.currentDate.getTime() - matchDate);
            let timeRemaining =  expirationDate - this.state.currentDate.getTime();
            let matchState = (timeRemaining > 0) ? 'active' : 'expired';
            let matchRemoved = match.val().removed;
            let matchStatus = match.val().status;
            let matchBlur = match.val().blur;

            //remove matches that have been removed by match
            if((matchRemoved !== true) && matchStatus !== 'paused'){
               convos.push(match);
            }

            //set flag expiredMatches so that render function can show the expired matches seperator. 
            if (matchState == 'expired' && this.state.expiredMatches == false){  
              this.setState({
                expiredMatches: true
              });

            }
          })

          //check if matchSnap is empty, if so show empty state else render matche
          if(convos === undefined || convos.length == 0 ){

            //put convos array into state and turn off loading
            this.setState({
              rotation: new Animated.Value(0),
              convoData: [],
              loading: false,
              isEmpty: true
            });

          }else{

            //clean convo array for duplicates if they exist


            //put convos array into state and turn off loading
            this.setState({
              convoData: convos,
              loading: false,
              current_conversations_count: convos.length
              }
            ),

              //run analytics
              analytics().logScreenView({
                screen_name: 'Messages',
                screen_class: 'Messages'
              });
              analytics().setUserId(userId)
            

              //firebase ref to user obj
              let firebaseProfileRef = database().ref('/users/' + userId);

              //update db with current_conversations_count, as the last_conversation_count, so that user won't see a notificaiotn until they have unseen match. 
              firebaseProfileRef.update({last_conversation_count: convos.length});


              //RESET current_conversations_count TO 0
              //firebaseProfileRef.update({unread_conversation_count: 0});
           

          }
      
          //console.log('StateConvos are: '+JSON.stringify(this.state.convoData));
       });
  }

  render() {

    //logo config
    const logo = require("../../images/focus-logo-old.svg");
    const rotation = this.state.rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });

    //other config
    const { navigate } = this.props.navigation; //needed for navigation functions, should combine with same const in the render function. 
    const dimensions = Dimensions.get('window');
    const height = dimensions.height;
    const width = dimensions.width

    //get notifications 
    //this.handleNotification(userId, 'Messages', null);


    return (
      <Container>
        <StatusBar 
          hidden={'hidden'} 
          barStyle={'dark-content'} 
          animated={true}
        />

        <View style={{  flex: 1, padding: 0 }}> 


          {(this.state.loading ) && 
            
            <LinearGradient style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              }}
              colors={['white', 'white']}
              //colors={[primaryColor, secondaryColor]}
              start={{ x: 0, y: 0.1 }}
              end={{ x: 0.1, y: 1 }}
              >  
                <Animated.View  style={{
                    flex: 1, 
                    flexDirection: 'column',
                    justifyContent: 'center',
                    transform: [{rotate: rotation}]
                  }}>
                      <SvgCssUri 
                        width="60" 
                        height="60"   
                        fill= {primaryColor}
                        fillOpacity="0"
                        strokeWidth="0"
                        source={logo}
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
                </LinearGradient>  
          }

          {(this.state.isEmpty  && !this.state.loading ) &&          
            
            <LinearGradient style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              //backgroundColor: primaryColor, dimensions
              }}
              colors={['white', 'white']}
              start={{ x: 0, y: 0.1 }}
              end={{ x: 0.1, y: 1 }}
              >
                <FontAwesomeIcon size={ 70 } style={{
                color: primaryColor, 
                backgroundColor: 'transparent', 
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65,}} icon={ faInbox }/>
                <Text style={{color: 'black', marginTop: 10, fontSize: 18, fontFamily:'Helvetica-Light', }}> No messages yet. </Text>
                <View style ={{marginTop: 20}}>
                  <Button rounded 
                    style={{ 
                      backgroundColor: btnColor, 
                      borderRadius: 20,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 3,
                      },
                      shadowOpacity: 0.29,
                      shadowRadius: 4.65, }} 
                      onPress = {() => this.props.navigation.goBack()}>
                    <Text style={{color: btnTextColor}}>Go Back</Text>
                  </Button>
                </View>
              </LinearGradient>
          }

          {(!this.state.isEmpty  && !this.state.loading ) &&          
          <ScrollView style={{  flex: 1, padding: 0 }}>
            <List>
              {
                this.state.convoData.map((n, i) => {
                    return this.convoRender(n, i, 'active');
                })
              }
              {this.state.expiredMatches &&
                <Separator bordered>
                  <Text style={{fontFamily:'Helvetica-Light', }}>Expired</Text>
                </Separator>
              }
              {
                this.state.convoData.map((n, i) => {
                    return this.convoRender(n, i, 'expired');
                })
              }
            </List>     
          </ScrollView>
            }

        </View>
      </Container>

    );
  }
}

export default Messages;
