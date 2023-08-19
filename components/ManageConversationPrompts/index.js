import React, { Component } from 'react';
import {
  ActionSheetIOS,
  TouchableWithoutFeedback, 
  Keyboard, 
  KeyboardAvoidingView, 
  Image, 
  Alert, 
  Dimensions, 
  Modal, 
  ScrollView, 
  StatusBar,
  Platform, 
  TextInput, 
  TouchableOpacity 
} from 'react-native';

import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import analytics from '@react-native-firebase/analytics';

import * as Progress from 'react-native-progress';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faCamera, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

import {
  Text,
  Button,
  View,
  Card,
  List,
  ListItem,
  Left,
  Body
} from "native-base";

//styling consts
const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";
const btnColor = 'white';
const btnTextColor = primaryColor;

var PROMPT_OPTIONS = [
  'Edit prompt',  
  'Delete prompt',
  'Cancel',
];
    

class ManageConversationPrompts extends Component {

  constructor(props, contexts){
    super(props, contexts)

  this.state = {
      imageViewerVisible: false,
      title: 'Talk to me about',
      imageIndex: 0,
      aboutMeRows: 16,
      forceUpdate: false,
      progress: 0.3,
      stepIndex: 0,
      currentStepValidated: false,
      profile: {
        prompts: []
      },
      
    }

  }

   //hide nav bar on the login screen
   static navigationOptions = {
    header: null,
  };

  //before component mounts, update state with value from database
  componentWillMount() {
  //save intial data for user
   userId = auth().currentUser.uid;
   firebaseRef = database().ref('/users/' + userId);

    //save data snapshot from firebaseRef
    firebaseRef.on('value', (dataSnapshot) => {
      //update sate with value from dataSnapShot. 
      this.setState({
        profile: dataSnapshot.val()
      }),

    //run analytics
    analytics().logScreenView({
      screen_name: 'ManageConversationPrompts',
      screen_class: 'ManageConversationPrompts'
    });
    analytics().setUserId(userId)
    })
  }  


  //function to update name or images or reviews
    updateData = (type, userid, payload) => {

      //record in analytics the event that a profile was updated successfully 
      analytics().logEvent('profileUpdated', {
        type: payload
      });
                                
      //create ref to list of coversations for userid
      const userConversations = database().ref('users/'+userid+'/conversations/');
  
      //create ref to list of matches for userid
      const userMatches = database().ref('matches/'+userid+'/');
  
      //save ref for reviews current user created
      const userReviews = database().ref('codes').orderByChild("created_by").equalTo(userId);
  
      //create empty placeholder object for all paths to update
      let updateObj = {};
      let updateObj2 = {};
  
      //return list of all users' conversations
      userConversations.once('value').then(snap => {
  
        //if user has had a conversation, prepare to update each of their convesations with updated data. 
        if(snap.exists()){
  
          //turn list of objects into array on it's keys
          let conversationsKeys = Object.keys(snap.val());
  
          //CONVERSATIONS: add path to update inside updateObj for each conversation record. Switch case for images and name updates. 
          conversationsKeys.forEach((key, $type) => {
            switch (type) {
              case 'images':
                updateObj[`conversations/${key}/participants/${userid}/images`] = payload;
                break;
              case 'name':
                updateObj[`conversations/${key}/participants/${userid}/name`] = payload;            
                break;
            }
          });
  
        }
      }).then(function() {
  
      //return list of all users' reviews
      userReviews.once('value').then(reviewsData => {
  
        //if user has reviews they created, prepare to update each of their reviews with updated data. 
        if(reviewsData.exists()){
  
          //turn dataSnapShot into array on it's values
          let userReviewArray = Object.values(reviewsData.val());
          let userReviewArrayKeys = Object.keys(reviewsData.val());
        
          console.log('userReviewArray is: '+userReviewArray);
          //for each of the current users' created reviews, find their associated matches, which need to be updated with new review data. 
          userReviewArray.forEach((friend, i) => {
  
            //let friend = friendObj.val();
            let friendKey = userReviewArrayKeys[i];
  
            console.log('friend is: '+JSON.stringify(friend));
            console.log('friendKey is: '+JSON.stringify(friendKey));
  
            
            //update code object only when code has yet to be used, in case the friend will use code. 
            //if (friend.expired == false){
  
              //save path to update the reviews object of each friend the current user reviewed. 
              switch (true) {
                case (type == 'images'):
                  updateObj[`users/${friend.created_for}/reviews/${friendKey}/photo`] = payload[0].url; 
                  updateObj[`codes/${friendKey}/photo_creator`] = payload[0].url;     
                  break;
                case (type == 'name'):
                  updateObj[`users/${friend.created_for}/reviews/${friendKey}/name`] = payload;
                  updateObj[`codes/${friendKey}/name_creator`] = payload; 
                  break;
                }  
            //}
  
  
            //query firebase for each users matches. 'friend.userid'
            database().ref('matches/'+friend.created_for+'/').once('value').then(friendMatchesSnap => {
            
              //convert friend objects into array of friend id's, so that can loop over them. . 
              let friendsMatches = Object.keys(friendMatchesSnap.val());
  
              //for each of my friends matches, update their match object with my updated name or images
              friendsMatches.forEach((my_friends_match, i) => {
  
                console.log('payload is: '+JSON.stringify(payload));
  
                //save path to update
                switch (type) {
                  case 'images':
                    updateObj2[`matches/${my_friends_match}/`+friend.created_for+`/reviews/`+friend.code_key+`/photo`] = payload[0].url;
                    break;
                  case 'name':
                    updateObj2[`matches/${my_friends_match}/`+friend.created_for+`/reviews/`+friend.code_key+`/name`] = payload;
                    break;
                  }             
               });
  
               //update all paths in multi-path update on udateObj2 array.
               database().ref().update(updateObj2, function(error) {
                if (error) {
                  // The write failed...
                  console.log('write failed updateObj2')
                } else {
                  // Data saved successfully!
                  console.log('Data saved successfully updateObj2')
                }
            })
          })
          })
        }
      })
      }).then(function() {
   
       //return list of all users' matches
        userMatches.once('value').then(snap => {
  
          //if user has matches start to prepare updating all matches with new data. 
          if (snap.exists()){
  
            //turn list of objects into array on it's keys
            let matchesKeys = Object.keys(snap.val());
  
            //MATCHES: add path to update inside updateObj for each appropriate match record
            matchesKeys.forEach((key, $type) => {
              switch (type) {
                case 'images':
                  updateObj[`matches/${key}/${userid}/images`] = payload;
                  break;
                case 'name':
                  updateObj[`matches/${key}/${userid}/name`] = payload;
                  break;
                case 'about':
                  updateObj[`matches/${key}/${userid}/about`] = payload;
                  break;
                case 'birthday':
                  updateObj[`matches/${key}/${userid}/birthday`] = payload;
                  break;
                case 'gender':
                  updateObj[`matches/${key}/${userid}/gender`] = payload;
                  break;
                case 'city_state':
                  updateObj[`matches/${key}/${userid}/city_state`] = payload;
                  break;
                case 'work':
                  updateObj[`matches/${key}/${userid}/work`] = payload;
                  break;
                case 'reviews':
                  updateObj[`matches/${key}/${userid}/reviews`] = payload;
                  break;
                case 'prompts':
                  updateObj[`matches/${key}/${userid}/prompts`] = payload;
                  break;
                case 'education':
                  updateObj[`matches/${key}/${userid}/education`] = payload;
                  break;
                case 'status':
                  updateObj[`matches/${key}/${userid}/status`] = payload;
                  break;
              }
            });
          }
        }).then(function() {
  
          //USERS: add path to update inside updateObj for userid record
          switch (type) {
            case 'images':
              updateObj[`users/${userid}/images`] = payload;
              break;
            case 'name':
              updateObj[`users/${userid}/first_name`] = payload;
              break;
            case 'about':
              updateObj[`users/${userid}/about`] = payload;
              break;
            case 'work':
              updateObj[`users/${userid}/work`] = payload;
              break;
            case 'education':
              updateObj[`users/${userid}/education`] = payload;
              break;
            case 'reviews':
              updateObj[`users/${userid}/reviews`] = payload;
              break;
            case 'prompts':
              updateObj[`users/${userid}/prompts`] = payload;
              break;
            case 'status':
              updateObj[`users/${userid}/status`] = payload;
              break;
          }
        }).then(function(){
            //console.log('updateObj outside .then function: '+JSON.stringify(updateObj));
            
            //return statement with updating all the paths that need to be updated
  
            console.log(updateObj);
            //return firebase.database().ref().update(updateObj);
  
            database().ref().update(updateObj, function(error) {
              if (error) {
                // The write failed...
                console.log('write failed')
              } else {
                // Data saved successfully!
                console.log('Data saved successfully')
  
              }
            });
        })
      })
    }



  render() {

    //btnColor is purple if first_name is completed, else it's grey. 
    let btnColorState = this.state.currentStepValidated  ? 'white' : 'grey'; 
    let placeHolderColor = this.state.currentStepValidated ? 1 : 0.25;
    let textColor = '#404040';

    //determine width of device in order for custom margin between iphones
    let deviceWidth = Dimensions.get('window').width
    let deviceHeight = Dimensions.get('window').height

    return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} >
      
      <LinearGradient style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        }}
        colors={['#13131A', '#13131A']}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 0.1, y: 1 }}
        >
        <StatusBar 
          hidden={'hidden'} 
          barStyle={'dark-content'} 
          animated={true}
        />
        <KeyboardAvoidingView 
        behavior="padding"
        enabled
        style={{
          flex: 1,
          paddingTop: 0,
          flexDirection: "column", 
          //justifyContent: "center",
          alignItems: "center"
        }}>


        <LinearGradient style={{
        flex: 3,
        alignItems: 'center',
        justifyContent: 'center',
        }}
        colors={[primaryColor, primaryColor]}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 0.1, y: 3.8 }}
        >

        <View style={{
            flex: 2,
            paddingTop: 0,
            flexDirection: "column"
          }}>
            <View style={{backgroundColor: 'white', height: 50}}>
            </View>
            <View style={{}}>
              <Progress.Bar borderWidth={0} borderRadius={0} unfilledColor={'#13131A'} color={primaryColor} progress={this.state.progress} height={15} width={deviceWidth} />
            </View>
          

            <View style={{ flexDirection: "row", marginBottom: 15, }}>
              
              <View style={{ 
                display: 'none' , // hide back button
                flex: 1, 
                alignItems: "flex-start",
                
                }}>
                <Button  transparent >
                  <FontAwesomeIcon size={ 28 } style={{ color: 'white'}} icon={ faChevronLeft } />
                </Button>
              </View>

              <View style={{
                display : 'none', //if required is false, show skip button
                flex: 1, 
                alignItems: "flex-end",
                }}>
                <Button transparent >
                  <Text style={{color: 'white'}} >Skip</Text>
                </Button>
              </View>
            </View>
          </View>



        <View 
          style={{
            marginBottom: 30, 
            padding: 20, 
            borderRadius: 18, 
            //backgroundColor: 'red', 
            flex:2, 
            justifyContent: 'center', 
            //width: deviceWidth-100,
          }} >
          
        <Text style={{ 
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
                shadowRadius: 4.65,}} >{this.state.title}
              </Text>
          
            {/* <Text style={{ 
              color: 'white', 
              fontFamily:'HelveticaNeue',
              fontSize: 30, 
              textAlign: 'left',
              }} >{this.state.title}
            </Text> */}
        </View>

        </LinearGradient>


        <View style={{ flex:4, justifyContent: 'center'}}>
         <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator ={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 15,}}>
           
           {this.state.profile.prompts && //if prompts exist, then map each prompt into ux

              this.state.profile.prompts.map((prompt, index) => (
          
                <Card 
                  style={{ 
                    backgroundColor: '#13131A',
                    borderColor: '#13131A',
                    marginBottom:15, 
                    marginTop: 15,
                    }}>
                  <List style={{
                   //backgroundColor: '#1C1C24',
                   borderStyle: 'dashed',
                   borderRadius: 30,
                   borderWidth: 2,
                   borderColor: 'white',
                   padding: 10,
                 
                    }}>
                    <ListItem 
                      style={{
                        borderStyle: 'dashed',
                      }}
                      key={index} button
                      onPress={()=> ActionSheetIOS.showActionSheetWithOptions(
                      {
                        options: PROMPT_OPTIONS,
                        cancelButtonIndex: 2,
                        destructiveButtonIndex: 2,
                        title: 'Prompt'
                      },
                      (buttonIndex) => {
                        if ((buttonIndex) === 0) {
                          //edit prompt selected, navigate to ManageConversationPrompsEdit component and pass data for handling correct flow.

                          let promptArray = [];

                          promptArray.push(prompt); 

                          this.props.navigation.navigate("ManageConversationPromptsEdit", {prompts: promptArray, flow: 'edit', existingPrompts: this.state.profile.prompts });

                        }
            
                        if ((buttonIndex) === 1) {

                          //delete prompt selected              

                          //create updatedPrompts array, and filter out prompt at key that has been delelted
                          const updatedPrompts = this.state.profile.prompts.filter(promptState => promptState.key != prompt.key);

                          //update database with updatedPrompts
                          this.updateData('prompts', this.state.profile.userid, updatedPrompts );
                      
                          //record in analytics that prompt was deleted successfully 
                          analytics().logEvent('promptDeleted', {
                            testParam: 'testParamValue1'
                          });
                        }
                      }                       
                    )} 
                    >
                      <Body>
                        <Text style={{fontSize: 24, color: primaryColor, fontFamily:'HelveticaNeue',}}>{prompt.promptTitle}</Text>
                        <Text style={{fontSize: 20, color: 'white', fontFamily:'HelveticaNeue', }}>{prompt.promptAnswer}</Text>
                      </Body>
                    </ListItem>
                  </List>
                </Card> 
              ))   
           }
          <Button 
          rounded  
          onPress = {() => this.props.navigation.navigate("ManageConversationPromptsEdit", {prompts: this.state.profile.prompts, flow: 'pick', existingPrompts: this.state.profile.prompts})}
          style={{ 
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center', 
            width: 300, 
            height: 100,
            backgroundColor: '#13131A',
            borderStyle: 'dashed',
            borderRadius: 30,
            borderWidth: 2,
            borderColor: 'white',
            padding: 30,
            marginTop: 20,

           }}> 
            <Text style={{alignItem: 'flex-start', color: 'white', fontSize: 25, marginBottom: 5}}>Pick a Question</Text>
            <FontAwesomeIcon size={ 40 } style={{ color: 'white'}} icon={ faPlusCircle } />
          </Button> 
    
        </ScrollView>
       </View>

        <View style={{ flex: 2, justifyContent: 'center'}}>
         <View>
          <Button 
            rounded  
            //onPress = {() => this.props.navigation.navigate("Waitlist")}
            //go back or go to waitlist, if goback param is true in nav param. 
            onPress = {() => this.props.navigation.getParam("goback") ? this.props.navigation.goBack() : this.props.navigation.navigate("Waitlist")}
            style={{ 
              justifyContent: 'center', 
              marginBottom: 10,
              width: 300, 
              backgroundColor: 'white',
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 3,
              },
              shadowOpacity: 0.29,
              shadowRadius: 4.65,}}> 
              <Text style={{color: primaryColor, fontFamily:'HelveticaNeue'}}>Continue</Text>
            </Button> 
            
            {(this.state.profile.status == 'onboard' || this.state.profile.status == 'waitlist') && //show see profile link only when user is an initial user -- onboarding or on waitlist
            <Button                      
            transparent
            //disabled = {!this.state.currentStepValidated}
            onPress = {() => this.props.navigation.navigate("Profile", {profile: this.state.profile, goback: true, from: 'ManageConversationPrompts', flow: 'edit'})}
            //opacity = {placeHolderColor}
            style={{                     
              justifyContent: 'center', 
              width: 300, }}> 
              <Text style={{ color: primaryColor}}>{ this.props.navigation.getParam("from") == 'ManagePreferences' ? 'See Profile' : 'Go Back'}</Text>
            </Button>  
            }
     
           </View>
          </View>
      </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
        

    );
  }
}


export default ManageConversationPrompts;



