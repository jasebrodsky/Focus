import React, { Component } from 'react';
import { ActivityIndicator, InteractionManager, PanResponder, TouchableWithoutFeedback, Dimensions, StyleSheet, Alert, Share, TouchableOpacity, StatusBar, Keyboard, KeyboardAvoidingView } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faRestroom, faHeart,  faCog, faCommentDots, faCoffee, faDoorOpen, faLockAlt,  faUnlockAlt,faMale, faFemale, faHeartbeat, faBriefcase, faBook, faSchool, faUniversity,  faUsers, faComments, faUserClock, faLockOpen, faBolt,  faEye, faUserLock } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
// import RNfirebase from 'react-native-firebase';
// import * as firebase from "firebase";
import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

import AppIntroSlider from 'react-native-app-intro-slider';


import {
  Container,
  Icon,
  Text,
  Input,
  InputGroup,
  Button,
  List,
  ListItem,
  Body,
  View,
  Form,
  Thumbnail,
  Textarea
} from "native-base";

const primaryColor = "#a83a59";
//const primaryColor = 'black';
const secondaryColor = "#c60dd9";
//const secondaryColor = 'black';
const btnColor = 'white';
const btnTextColor = primaryColor;

console.disableYellowBox = true;

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



class ManageConversationPromptsEdit extends Component {
  constructor(props, contexts){
    super(props, contexts)
    this.textArea = React.createRef();
    

    this.state = {
      loading: true,
      userId: auth().currentUser.uid,
      promptObj: {
        question: '',
        answer: ''
      },
      existingPrompts: [],
      prompts: [
        {
          key: '0',
          type: 'prompt',
          ///promptTitle: 'My ideal date today would be ...',
          promptTitle: 'When I have free time you can find me ...',
          promptAnswer: "" ,
        },
        {
          key: '1',
          type: 'prompt',
          //promptTitle: 'A major green flag is ...',
          promptTitle: 'A huge green flag is ...',
          promptAnswer: "" ,
        },
        {
          key: '2',
          type: 'prompt',
          //promptTitle: 'My life has never been the same since ... ',
          promptTitle: 'My entire life changed when ... ',
          promptAnswer: "" ,
        },
        {
          key: '3',
          type: 'prompt',
          //promptTitle: 'Something good that happend to me this week ...',
          promptTitle: 'The best part of my week was ...',
          promptAnswer: "" ,
        },
        {
          key: '4',
          type: 'prompt',
          //promptTitle: 'The most spontaneous thing I have ever done ...',
          promptTitle: "The craziest thing I've ever done ...",
          promptAnswer: "" ,
        },
        {
          key: '5',
          type: 'prompt',
          //promptTitle: "You can find me in my happy place by looking ...",
          promptTitle: "I'm in my happy place when ...",
          promptAnswer: "" ,
        },
        {
          key: '6',
          type: 'prompt',
          //promptTitle: "A personal goal I've been working on ...",
          promptTitle: "A personal goal I've been progressing on ...",
          promptAnswer: "" ,
        },
        {
          key: '7',
          type: 'prompt',
          promptTitle: "Would you rather...",
          promptAnswer: "" ,
        },
        {
          key: '8',
          type: 'prompt',
          promptTitle: "Most embarrassing thing I've bought online ...",
          promptAnswer: "" ,
        },
        {
          key: '9',
          type: 'prompt',
          promptTitle: "My spirit animal is ...",
          promptAnswer: "" ,
        },
        {
          key: '10',
          type: 'prompt',
          promptTitle: "My biggest secret is ...",
          promptAnswer: "" ,
        },
        
        ]
    }

  }


  //hide nav bar on the login screen
  static navigationOptions = {
    header: null,
  };

  
  componentWillMount() {

    //save which prompts to delete
    let promptDelete = this.props.navigation.getParam('prompts');
    let promptFlow = this.props.navigation.getParam('flow');
    let existingPrompts = this.props.navigation.getParam('existingPrompts');

    //if promptDelete is empty, save as empty array. 
    if(!promptDelete){
      promptDelete = [];
    }

    //if promptDelete is empty, save as empty array. 
    if(!existingPrompts){
      existingPrompts = [];
    }

    //convert promptDelete array to array of just keys
    let promptDeleteKeys = promptDelete.map(prompt => {
      return prompt.key;
    });
    
    //filter out PromptDelete array of prompts from state, and save into updatedPrompts. 
    let updatedPrompts = this.state.prompts.filter(prompt => !promptDeleteKeys.includes(prompt.key) );
                                                           
    //if user is editing, put edited prompt to top of array.
    if(promptFlow == 'edit'){
      updatedPrompts.unshift(promptDelete[0])
    }

    //update state with updatedPrompts array
    this.setState({ prompts: updatedPrompts, existingPrompts: existingPrompts });

    //run analytics
    analytics().logScreenView({
      screen_name: 'ManageConversationPromptsEdit',
      screen_class: 'ManageConversationPromptsEdit'
    });
    analytics().setUserId(userId)
      
  }


  _onDone = () => {
    //update firebease with saved prompt object, then goBack() on success.  
    //go back now. 
    this.props.navigation.goBack();
  }



  _handlePress(evt){
   //alert(`target = ${evt.nativeEvent.target}`);

   //evt.nativeEvent.target.focus();
   
   //this.textArea.current.focus();
   //this.secondTextInput.focus()
   //this.textInput.current.focus();
  }

  //hande text change of prompt
  _handleTextChange = (promptAnswer, promptKey) => {
    
    //create copy of prompts
    let newPromptObj = this.state.prompts;

    //find index of object in state with appropriate key
    let objIndex = newPromptObj.findIndex((prompt => prompt.key == promptKey));

    //update promptAnswer at promptKey
    newPromptObj[objIndex].promptAnswer = promptAnswer;
    

    //update prompt to updated flag, for updating db later. 
    //newPromptObj[promptKey].updated = true;
    
    // update state with new prompt object
    this.setState({ prompts: newPromptObj });
    
   }

   //save prompt to database
    _savePrompt = () => {

			//copy prompts and remove prompts that haven't been just updated. 
			const updatedPrompts = this.state.prompts.filter(prompt => prompt.promptAnswer != "");

      //include exisiting prompts to the updatedPrompts object.       
      const newPrompts = [...updatedPrompts, ...this.state.existingPrompts ];

      //remove duplicate prompts
      const keys = newPrompts.map(prompt => prompt.key) //create array of just keys
      const filtered = newPrompts.filter(({key}, index) => !keys.includes(key, index + 1)) //filter out duplicate keys from newPrompts

			//update database using updateData
      this.updateData('prompts', this.state.userId, filtered);
      
      //then go close module
      this.props.navigation.goBack();

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
  


  _renderItem = ({ item, }) => (

    <LinearGradient style={{
      paddingLeft: 20,
      paddingRight: 20,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      //backgroundColor: primaryColor, dimensions
      }}
      colors={['#13131A', '#13131A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      >

      <View style={{flex: 1,}}></View>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'flex-start', 
          //backgroundColor: '#1C1C24',
          borderRadius: 30,
          padding: 20,
          width: 350,
          }}>
          <Text style={{ 
            fontSize: 30,
            color: 'white',
            textAlign: 'left',
            fontFamily:'HelveticaNeue',
          }}>
            {item.promptTitle}
          </Text>
        </View>

        <View style={{
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'flex-start', 
          //backgroundColor: '#1C1C24',
          borderRadius: 30,
          padding: 20,
          marginTop: 20,
          width: 350,
          }}>
            <InputGroup borderType="underline" style={{ paddingLeft: 0, marginBottom: 15}} >
              <Input 
                style={{  paddingLeft: 0, fontSize: 25, color: 'white', fontFamily:'HelveticaNeue',}}
                placeholder='Type here ... '
                placeholderTextColor = "white"
                opacity = {1}
                multiline={true}
                value={item.promptAnswer}  
                onChangeText={(newPrompt) => this._handleTextChange(newPrompt, item.key)}
                //onEndEditing={(e: any) => this.updateData('prompts', userId, this.state.prompts)} 
                //onEndEditing={() =>   this.setState({prompts, updated: true}) } 
                
              />
            </InputGroup> 

    
        </View> 
        <View style={{flex: 3, justifyContent: 'center', alignItems: 'center' }}>

              
        </View>
      </LinearGradient>
  );


_renderButton  =  ()  => { 
    return (
       
       <LinearGradient style={{
        flex: 1,
        alignSelf: 'center',
        justifyContent: 'center',
        padding: 70,
        top: 50, 
        }}
        colors={[primaryColor, primaryColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        >
       
        <Button 
          rounded
          onPress={() => this._savePrompt()}
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
          <Text style={{color: primaryColor, fontFamily:'HelveticaNeue'}}>Save</Text>
        </Button>
        <Button 
          transparent
          style={{width: 300, borderRadius: 20, justifyContent: 'center',}}
          onPress={() => this.props.navigation.goBack()}>
          <Text style={{ color: 'white', textAlign: 'center', fontFamily:'HelveticaNeue'}}>Close</Text>
        </Button>
      </LinearGradient>
      
    );
 };



    render() {
    
    //console.log('this.context is on render'+JSON.stringify(this.context));
      return <View style={{flex: 1, flexDirection: 'column',}}>
          <StatusBar hidden={true} />
          <View style={{flex: 7,}}>
            <KeyboardAvoidingView 
              behavior="height"
              keyboardVerticalOffset={-200}
              enabled
              style={{
                margin: 0,
                flex: 1,
                padding: 0,
                flexDirection: "column", 
                //justifyContent: "center",
                alignItems: "center"
              }}>   

              <AppIntroSlider 
                onSlideChange={() => Keyboard.dismiss()}
                slides={this.state.prompts} 
                //ref={component => {this.refSlider = component}}
                bottomButton={true}
                renderItem={this._renderItem}
                renderNextButton={this._renderButton}
                renderDoneButton={this._renderButton}
                //ref={(ref) => (this.slider = ref)}
                activeDotStyle={{backgroundColor: primaryColor}}
                dotStyle ={{backgroundColor: 'white'}}
                onDone={this._onDone}
              />

              </KeyboardAvoidingView>
          </View>
        </View>;
    }
}

export default ManageConversationPromptsEdit;
