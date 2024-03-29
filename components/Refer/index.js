import React, { Component } from 'react';
import { StyleSheet, Dimensions, Alert, Share, StatusBar, Keyboard, KeyboardAvoidingView } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
// import * as firebase from "firebase";
// import RNfirebase from 'react-native-firebase';
import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import dynamicLinks from '@react-native-firebase/dynamic-links';

import LinearGradient from 'react-native-linear-gradient';


import {
  Container,
  Icon,
  Text,
  Item,
  Input,
  InputGroup,
  Form,
  Textarea,
  Button,
  H1,
  H2,
  List,
  ListItem,
  Body,
  View
} from "native-base";

//const primaryColor = "#8A6077";

// const primaryColor = "#914cd5";
// const secondaryColor = "#ee9e45";

const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";
const btnColor = 'white';
const btnTextColor = primaryColor;


class Refer extends Component {


//CONFIG 109

  constructor(props){
    super(props)
    const { state, navigate } = this.props.navigation;


    //set state to convos var
    this.state = {
      loading: true,
      gender: '',
      userId: '',
      reason: '',
      reasonRows: 6
    }

  }

  //hide nav bar on the login screen
  static navigationOptions = {
    header: null,
  };


  componentDidMount() {

    let userId = auth().currentUser.uid;
    let onCancel = this.props.navigation.getParam('onCancel');
    let name = this.props.navigation.getParam('name');
    let flow = this.props.navigation.getParam('flow');



    //build deeplink and save to state
    //this.setState({ deepLink: this.buildLink('testCode') }); 
    

    if (flow == 'invite'){
      //invite flow
      this.setState({ titleCopy: 'Invite Friend' }); 
      this.setState({ secondaryCopy: 'Both of you will skip \n to the front of the line.' }); 
      this.setState({ reasonCopy: "What's something great about "+name+" that others should know?" }); 
      this.setState({ primaryCTA: 'Invite Friend'}); 
      this.setState({ secondaryCTA: 'Go Back' });
      this.setState({ errorCopy: 'Invitation reason needs to be at least 100 characters. ' });
    }else if (flow == 'refer'){
      //refer flow
      this.setState({ titleCopy: 'Refer Friend' }); 
      this.setState({ secondaryCopy: 'Both of you will skip \n to the front of the line.' }); 
      this.setState({ reasonCopy: "What's something great about "+name+" that others should know?" }); 
      this.setState({ primaryCTA: 'Refer Friend' }); 
      this.setState({ secondaryCTA: 'Go Back' }); 
      this.setState({ errorCopy: 'Referral reason needs to be at least 100 characters. ' });

    }else if (flow == 'endorse'){
      //endorse flow
      this.setState({ titleCopy: 'Endorse Friend' }); 
      this.setState({ reasonCopy: "What's something great about "+name+" that others should know?" }); 
      this.setState({ secondaryCopy: 'Both of you will skip \n to the front of the line.' }); 
      this.setState({ primaryCTA: 'Endorse Friend' }); 
      this.setState({ secondaryCTA: 'Go Back' }); 
      this.setState({ errorCopy: 'Endorsement reason needs to be at least 100 characters. ' });

    }else if (flow == 'waitlist'){
      //waitlist flow
      this.setState({ titleCopy: 'Refer Friend' }); 
      this.setState({ secondaryCopy: 'Both of you will skip \n to the front of the line.' }); 
      this.setState({ reasonCopy: "What's something great about "+name+" that others should know?" }); 
      this.setState({ primaryCTA: 'Refer Friend' }); 
      this.setState({ secondaryCTA: 'Go Back' }); 
      this.setState({ errorCopy: 'Refer reason needs to be at least 100 characters. ' });

    }else if (flow == 'swipes'){
      //waitlist flow
      this.setState({ titleCopy: 'Refer Friend' }); 
      this.setState({ secondaryCopy: 'Get more matches immediately.' }); 
      this.setState({ reasonCopy: "What's something great about "+name+" that others should know?" }); 
      this.setState({ primaryCTA: 'Refer Friend' }); 
      this.setState({ secondaryCTA: 'Go Back' }); 
      this.setState({ errorCopy: 'Refer reason needs to be at least 100 characters. ' });
    }else if (flow == 'extendConversation1'){
      //waitlist flow
      this.setState({ titleCopy: 'Refer Friend' }); 
      this.setState({ secondaryCopy: 'Get more matches immediately.' }); 
      this.setState({ reasonCopy: "What's something great about "+name+" that others should know?" }); 
      this.setState({ primaryCTA: 'Refer Friend' }); 
      this.setState({ secondaryCTA: 'Go Back' }); 
      this.setState({ errorCopy: 'Refer reason needs to be at least 100 characters. ' });
    }else if (flow == 'moreMatches'){
      //waitlist flow
      this.setState({ titleCopy: 'Refer Friend' }); 
      this.setState({ secondaryCopy: 'Get more matches immediately.' }); 
      this.setState({ reasonCopy: "What's something great about "+name+" that others should know?" }); 
      this.setState({ primaryCTA: 'Refer Friend' }); 
      this.setState({ secondaryCTA: 'Go Back' }); 
      this.setState({ errorCopy: 'Refer reason needs to be at least 100 characters. ' });
    }
    

    this.setState({ name: name });  

    //query for logged in users information needed and set state with it.     
    database().ref('/users/' + userId).once('value', ((snapshot) => {
                
        //set state with user data. 
        this.setState({ 
          userId: userId,
          gender: snapshot.val().gender,
          user_name: snapshot.val().first_name,
          user_photo: snapshot.val().images[0].url,
        });  
    }))
      
    //run analytics
    analytics().logScreenView({
      screen_name: 'Refer',
      screen_class: 'Refer'
    });
    analytics().setUserId(userId)
  
  }


  _onCancel = () => {

    let onCancel = this.props.navigation.getParam('onCancel');
    let from = this.props.navigation.getParam('from');
    const { navigate } = this.props.navigation;

    //goback
    this.props.navigation.goBack();

    //record in analytics link was shared 
    analytics().logEvent('buttonClicked', {
      buttonClicked: 'go back',
    });
    
  }

  //extend passed conversation
  _handleExtendConversation = () => {

      const { state, navigate } = this.props.navigation;
        //pass in from nav match_userid, conversationId
        //save userId into var
      
        //save refs to db for conversation and matches, to reflect new status
        let firebaseRef = database().ref('/conversations/'+state.params.conversationId+'/');
        let firebaseMatchesRef1 = database().ref('/matches/'+userId+'/'+state.params.match_userid+'/');
        let firebaseMatchesRef2 = database().ref('/matches/'+state.params.match_userid+'/'+userId+'/');
        
        //save system message that blind date status has changed. 
        let conversationsRef = database().ref('/conversations/'+state.params.conversationId+'/messages/');

        //86000000 - 1 day in ms
        let extendTimeBy = 86000000 * 7; //in ms
        let newExpirationDate = (new Date().getTime() + extendTimeBy);

        //query for fcmToken used for triggering notification in the cloud. 
        database().ref('/users/'+state.params.match_userid+'/').once("value", profile =>{

          let notifyFcmToken = profile.val().fcmToken;

          //update the conversation with extended expiration
          firebaseRef.update({
            expiration_date: newExpirationDate,
            active: true,
            notifyFcmToken: notifyFcmToken,
          });

          // Trigger custom notification request now
          const payload = {
            fcmToken: notifyFcmToken,
            messageTitle: 'Conversation Extended',
            messageTxt: 'The conversation has been extended.',
            view: 'messages',
          };

          // Make an HTTP request to trigger the custom notification
          fetch('https://us-central1-blurred-195721.cloudfunctions.net/sendCustomNotification?fcmToken=' + payload.fcmToken +
            '&messageTitle=' + payload.messageTitle +
            '&messageTxt=' + payload.messageTxt +
            '&view=' + payload.view)
            .then(response => {
              // Handle the response from the custom notification request if needed
              console.log('Custom notification request response:', response);
            })
            .catch(error => {
              // Handle any errors that occur during the request
              console.error('Custom notification request error:', error);
            });

          //update match to true status and set new expiration date
          firebaseMatchesRef1.update({
            active: true,
            expiration_date: newExpirationDate,
            last_message: 'Conversation Extended',
            last_message_date: (new Date().getTime()*-1), 
            //blur: this.state.blur,
            unread_message: true 
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
            createdAt: database.ServerValue.TIMESTAMP
          });

        })
  
    
  }



  //function to build deep link. pass code from getCode function into link, then trigger share dialog
  _buildLinkAndShare = async () => {
    

    let name = this.state.name;
    let reason = this.state.reason;
    let reasonLength = reason.length;

    if(!name || reasonLength < 15){

      Alert.alert(
        'More info required ',
        "Please enter more than 15 characters.",
        [
          {text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
        ],
        { cancelable: false }
      ) 


    }else{
      //fetch from getCode cloud function, then build short link from returned code
      await fetch('https://us-central1-blurred-195721.cloudfunctions.net/getCode?name_creator='+this.state.user_name+'&gender_creator='+this.state.gender+'&photo_creator='+this.state.user_photo+'&reason='+this.state.reason+'&userid='+this.state.userId)
      .then((response) => response.json())
      .then((responseJson) => {
    
        console.log('responseJson is: '+responseJson);
        //save code var.
        let code = responseJson.sharable_code;
        let codeDelete = responseJson.code_id;
        this.setState({codeDelete: codeDelete}); //save codeDelete to state, in case user cancels share. 

        const link = dynamicLinks().buildShortLink({
          link: encodeURI('https://focusdating.co/refer/?type=refer&code='+code+'&user_id_creator='+this.state.userId+'&gender_creator='+this.state.gender+'&name_creator='+this.state.user_name+'&name_created='+this.state.name+'&reason='+this.state.reason),
          domainUriPrefix: 'https://focusdating.page.link',
          social: {
            title: "Download Focus",
            descriptionText: "Go on Blind Dates. With your type. We'll coodinate it.",
            //descriptionText: this.state.user_name + 'says: '+this.state.reason,
            imageUrl: 'https://focusdating.co/images/share2.png'
          },     
          ios: {
            bundleId: 'com.helm.focus',
            appStoreId: '1492965606',
          },
        })
        //record in analytics link was created 
        analytics().logEvent('linkCreated', {
          linkCreated: true
        });
        
        return link;


      })


        .then( async (link) => {

          //let link2 = 'testlink';
          console.log(`got link: ${link}`);

          //set up share 
          const result = await Share.share({
            message: this.state.name+' - just referred you to Focus and shared the following: "'+this.state.reason.substring(0, 50)+'..." read the rest on the app.',  
            url: link, //make landing page with query param of reason. 
            title: 'Check this out' //what does this do?
          });
          
          if (result.action === Share.sharedAction) {
            if (result.activityType) {
              // shared with activity type of result.activityType
              console.log('shared with activity type of');
              // shared
              console.log('shared! check if code was ');

              //record in analytics link was shared 
              analytics().logEvent('referShareSent', {
                activityType: result.activityType,
                reason: this.state.reason
              });

              //add shared to true, for cleaning up later. 
             let codeRef = database().ref('codes/' + this.state.codeDelete+'/');

              //update ref
             codeRef.update({  
                shared: true,
                shareType: result.activityType
              });
            
              //update swipeCount in firebase, so that cloud function will return fresh batch of matches. 
              let userRef = database().ref('users/'+this.state.userId+'/');
              
              //update swipe count in db to 0 and in callback call getMatches for fresh batch. 
              userRef.update({  
                swipe_count: 0,
                //status: 'active', //should users only become active via the waitlist admin flow? if so, comment out this line so status never changes here. 
                referStatus: 'sentReferral',
                referReason: this.state.reason,
              }).then(()=>{
                
                //check if coming from swipes
                if ( this.props.navigation.getParam('from') == 'swipes' ) {

                  //redirect to messages and pass params freeExtend: true, so that . 
                  this.props.navigation.navigate("Swipes", {forceUpdate: true, swipeCount: 0});
                  console.log("successfully updated swipecount, getting more matches.");
                
                }else if(this.props.navigation.getParam('from') == 'waitlist'){
                  
                  this.props.navigation.navigate("Waitlist");

                }else if ( this.props.navigation.getParam('from') == 'conversations' ) {
                  
                  //if coming from conversations, extend the conversation and redirect back messages.           
                  this._handleExtendConversation()
                                  
                  //then redirect back messages
                  this.props.navigation.navigate("Messages");
                }
                          
                else{
                  //goback
                  this.props.navigation.goBack();
                }
              }).catch(error => {
                console.log("couldnt update swipdconnt with error: " + error);
              });
            }
          } else if (result.action === Share.dismissedAction) { //STOPPED WORKING SOMETIME AGO?
            // dismissed
            console.log('shared dismissed');

            //delete unsent code from db
            database().ref('codes/' + this.state.codeDelete).remove();

            //record in analytics the event that a share was cancelled  
            analytics().logEvent('referShareDismissed', {
              reason: this.state.reason
            });
          }
        })
        
        .catch((err) => {
          console.log('unable to build link?', err);
        })
      }



    
              
    return link;
  }


  render() {
    const { navigate } = this.props.navigation;

    //count character remaining deviceWdith
    let charRemainingCopy1 = 'This will be shown on their profile.';
    let charRemainingCopy2 = (15 - this.state.reason.length)+' charaters remaining';

    let deviceWidth = Dimensions.get('window').width
            
    return (


      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#13131A',
        paddingBottom: 25
        }}
        >
          <StatusBar hidden={true} />

        <View 
          style={{ flex: 1, alignItems: 'center', }} 
          onStartShouldSetResponder={Keyboard.dismiss}
          behavior="padding"
          enabled>

          <LinearGradient 
            colors={[primaryColor, primaryColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1.5, y: 2.5 }}
            style={{paddingTop: 20, flex: 3, justifyContent: 'center', alignItems: 'center', width: deviceWidth, backgroundColor: primaryColor}}>
            
            
            <View style={{
              flex:2, 
              minWidth: deviceWidth-80,
              //backgroundColor: '#1C1C24',
              borderRadius: 30,
              paddingLeft: 40,
              paddingRight: 40,
              justifyContent: 'center',
              maxHeight: 160,
              marginBottom: 10,
              marginTop: 10, 
              }}>

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
                    shadowRadius: 4.65,}} >Refer your friend
                </Text>
                {/* <Text 
                  style={{ 
                    color: 'white', 
                    fontFamily:'HelveticaNeue',
                    fontSize: 30, 
                    color: 'white'}}>Friend
                </Text> */}

            </View>
          
          
          </LinearGradient>


        {/* <View 
          style={{ 
            flex: 1,        
            marginTop: 20,              
            borderRadius: 30,
            padding: 20,
            justifyContent: "center", 
            width: 300,
            maxHeight: 70, 
            //backgroundColor: '#1C1C24'
           }}>
          
            <InputGroup  borderType="underline" style={{ paddingLeft: 0, marginBottom: 0}} >

              <Input 
                placeholder='Name'
                value={this.props.navigation.getParam('name')}
                onChangeText={(name) => this.setState({name})}
                onFocus={ () => this.setState({reasonRows:5})}
                onBlur={ () => this.setState({reasonRows:8})}
                style={{ paddingLeft: 0, fontSize: 18, height: 40, color: 'white',}}
                placeholderTextColor = "white"
                multiline={false}
                borderType="underline"
                />  
            </InputGroup>

        </View> */}




        <KeyboardAvoidingView 
          style={{ flex: 9, alignItems: 'center', }} 
          onStartShouldSetResponder={Keyboard.dismiss}
          behavior="padding"
          enabled>

          <View style={{ 
            flex: 4,        
            borderRadius: 30,
            paddingLeft: 15,
            paddingRight: 15,
            paddingTop: 5,
            paddingBottom: 20,
            marginTop: 40,
            //paddingBottom: 20,
            justifyContent: "flex-start", 
            width: 300, 
            //maxHeight: 200,
            backgroundColor: '#1C1C24', 
            borderStyle: 'dashed',
            borderRadius: 30,
            borderWidth: 2,
            borderColor: 'white',
            
            }}>
          

            <Form>
              <Textarea
              style={{fontSize: 24, fontFamily:'Helvetica-Light', color: 'white'}}
              placeholder={this.state.reasonCopy}
              placeholderTextColor="#585858"
              rowSpan={this.state.reasonRows} 
              onFocus={ () => this.setState({reasonRows:4})}
              onBlur={ () => this.setState({reasonRows:8})}
              onChangeText={(reason) => this.setState({reason})}
              value={this.state.reason}           
              />
            </Form>
            
          </View>  


          <View style={{
          flex: 1,
          justifyContent: 'flex-start',
          padding: 10,
          //paddingLeft: 25,
          maxHeight: 60,
          width: 300,
        }}>
            <Text style={{fontSize:16, fontFamily:'Helvetica-Light', textAlign: 'center', color: 'white'}} >{((this.state.reason.length < 15) && this.state.reason)? charRemainingCopy2 : charRemainingCopy1 }</Text>
        </View>


          <View style={{ flex: 6, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 0}}>
            
            <View style={{
              flex: 1,
              //backgroundColor: 'blue',
              justifyContent: 'flex-end',
              padding: 0,
              marginBottom: 10,
              width: 300,
            }}>
                <Text style={{fontSize:12, fontFamily:'Helvetica-Light', lineHeight: 15, textAlign: 'center', color: 'white'}} >{((this.state.reason.length > 14) && this.state.reason)? 'Personal refer link generated.' : null }</Text>
            </View>
            
            <Button 
              bordered 
              style={{
                width: 300,
                justifyContent: 'center',
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
              onPress={() => this._buildLinkAndShare()}
              //onPress={() => this._handleExtendConversation()}

              >
                <Text style={{color: primaryColor, textAlign:'center'}}>{this.state.primaryCTA}</Text>
            </Button>

            <Button 
               transparent
               full 
               onPress={() => {this._onCancel();}} >
              <Text style={{color: primaryColor, }}>{this.state.secondaryCTA}</Text>
            </Button>
          </View>

        </KeyboardAvoidingView>


       
        </View>
      </View>
    );
  }
}

export default Refer;
