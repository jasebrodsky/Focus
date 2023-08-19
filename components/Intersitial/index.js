import React, { Component } from 'react';
import { StyleSheet, Alert, Share, StatusBar, Keyboard, KeyboardAvoidingView, Dimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faHistory, faUsers, faAddressCard } from '@fortawesome/free-solid-svg-icons';
import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import { getStatusBarHeight } from 'react-native-status-bar-height';

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



class Intersitial extends Component {


  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      loading: true,
      // titleCopy: "You're on the list",
      titleCopy1: "Refer Friend",
      titleCopy2: "Friend",
      primaryCopy: "You’ll both immediately skip to the front of the line. ",
      secondaryCopy: "We verify everyone first to ensure we have the highest quality community. We’ll notify you after your profile has been reviewed.",
      primaryCTA: "Continue",
      secondaryCTA: "Go Back",
      gender: '',
      userId: '',
    }

  }

  //hide nav bar on the login screen
  static navigationOptions = {
    header: null,
  };


  componentDidMount() {

    //Check what flow intersitial is being used for, then set to state appropriate content. 
    let flow = this.props.navigation.getParam('flow');
    //let flow = 'waitlist';


    //run analytics
    analytics().logScreenView({
      screen_name: 'Intersitial',
      screen_class: 'Intersitial'
    });
    analytics().setUserId(userId)
    
    //record in analytics that which flow intersitial is in.  
    analytics().logEvent('flow',{
        flow: flow
    });
    
    //if flow = refer, then set primary copy
    switch (flow) {
      case 'waitlist':
        // set primary copy for refer
        this.setState({ 
          titleCopy1: 'Refer your friend',
          titleCopy2: 'Friend',
          primaryCopy: 'You’ll both immediately skip to the front of the line.',
          secondaryCopy: '',
          primaryCTA: 'Continue',
          secondaryCTA: 'Go Back',
          showFriendNameInput: true,
        }); 
      break;

      case 'moreMatches':
        // set primary copy for moreMatch
        this.setState({ 
          titleCopy1: 'Refer your friend',
          titleCopy2: 'Friend',
          primaryCopy: "You'll get more matches afterwards or you can subscribe.",
          secondaryCopy: '',
          primaryCTA: 'Continue',
          secondaryCTA: 'Go Back',
          secondaryCTA2: 'Subscribe',
          showFriendNameInput: true,
        }); 
      break;

      case 'extendConversation1':
          // set primary copy for extendConversation1
          this.setState({ 
            titleCopy1: 'Refer your friend',
            titleCopy2: 'Friend',
            primaryCopy: "You'll be able to extend this conversation for free.",
            secondaryCopy: '',
            primaryCTA: 'Continue',
            secondaryCTA: 'Go Back',
            secondaryCTA2: 'Subscribe',
            showFriendNameInput: true,
          }); 
      break;

      case 'extendConversation2':
          // set primary copy for extendConversation2
          this.setState({ 
            titleCopy1: 'Extend the conversation',
            titleCopy2: 'Conversation',
            primaryCopy: "Subscribe and you'll be able to extend all conversations.",
            secondaryCopy: '',
            primaryCTA: 'Subscribe',
            secondaryCTA: 'Go Back',
            showFriendNameInput: false,
          }); 
      break;

      case 'refer':
          // set primary copy for extendConversation2
          this.setState({ 
            titleCopy1: 'Refer your friend',
            titleCopy2: 'Friend',
            primaryCopy: "Who do you want to refer?",
            secondaryCopy: '',
            primaryCTA: 'Refer',
            secondaryCTA: 'Go Back',
            showFriendNameInput: true,
          }); 
      break;
    }

  }


  //define function to validate name is valid, then navigate to refer. then call that in onPress of contineu button



  render() {
    const { navigate, state } = this.props.navigation;
    let deviceWidth = Dimensions.get('window').width
            
    return (

      <LinearGradient style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        //backgroundColor: primaryColor, dimensions
        }}
        colors={['#13131A', '#13131A']}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 0.1, y: 1 }}
        >
        <StatusBar 
          hidden={'true'} 
          animated={true}
        />

          <LinearGradient style={{
            flex: 3,
            paddingTop: 10,
            width: deviceWidth,
            alignItems: 'center',
            justifyContent: 'center',
            //backgroundColor: primaryColor, dimensions
            }}
            colors={[primaryColor, primaryColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1.5, y: 2.5 }}
          > 

            <View style={{
              flex:1, 
              //minWidth: deviceWidth-80,
              //backgroundColor: '#1C1C24',
              borderRadius: 30,
              padding: 20,
              justifyContent: 'center',
              //alignItems: 'flex-start', 
              maxHeight: 160,
              margin: 5, 

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
                    shadowRadius: 4.65,}}>{this.state.titleCopy1}
                  </Text>
                {/* <Text 
                  style={{ 
                    color: 'white', 
                    fontFamily:'HelveticaNeue',
                    fontSize: 30, 
                    color: 'white'}}>
                      {this.state.titleCopy2}
                </Text> */}

            </View>
          </LinearGradient>



          <KeyboardAvoidingView 
            style={{ flex: 6, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', }}
            onStartShouldSetResponder={Keyboard.dismiss}
            behavior="padding"
            enabled
          >
          
            
            <View style={{  flex: 1, borderRadius: 30, width: deviceWidth-50, alignItems: 'flex-start', justifyContent: 'space-around', padding: 30,}}>
              <Text style={{fontSize: 20, fontFamily:'Helvetica-Light', lineHeight: 25, color: 'white'}}>{this.state.primaryCopy}</Text>
              
              { this.state.showFriendNameInput &&
                
                  <InputGroup  borderType="underline" style={{ paddingLeft: 0, marginBottom: 0}} >
                    <Input 
                      placeholder="Friend's name"
                      value={this.props.navigation.getParam('name')}
                      onChangeText={(name) => this.setState({name})}
                      onFocus={ () => this.setState({reasonRows:5})}
                      onBlur={ () => this.setState({reasonRows:8})}
                      style={{ paddingLeft: 0, fontSize: 20, height: 40, color: 'white', fontFamily:'HelveticaNeue'}}
                      placeholderTextColor = "white"
                      multiline={false}
                      borderType="underline"
                      />  
                  </InputGroup>

                
              }
            </View>

            



          
          </KeyboardAvoidingView> 

    
        


            
          <LinearGradient style={{
            flex: 3,
            width: deviceWidth,
            alignItems: 'center',
            justifyContent: 'center',
            
            //backgroundColor: primaryColor, dimensions
            }}
            colors={['#13131A', '#13131A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1.5, y: 2.5 }}
            >
            
            
            { (this.props.navigation.getParam('flow') == 'waitlist' || this.props.navigation.getParam('flow') == 'moreMatches' || this.props.navigation.getParam('flow') == 'refer') &&

            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <Button rounded 
              style={{ 
                backgroundColor: btnColor, 
                borderRadius: 20,
                justifyContent: 'center',
                width: deviceWidth-80,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65, }} 
              onPress={
                () => (!this.state.name) ?           
                    Alert.alert(
                    'Missing Name',
                    "Enter your friend's name.",
                    [
                      {text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                    ],
                    { cancelable: false }
                  ) 
                  : 
                  navigate("Refer", { 
                    onCancel: this.props.navigation.getParam('from'), 
                    flow: this.props.navigation.getParam('flow'), 
                    from: this.props.navigation.getParam('from'), 
                    name: this.state.name
                })
              }>
                <Text style={{color: btnTextColor, width: 260, textAlign:'center', fontFamily:'HelveticaNeue'}}>{this.state.primaryCTA}</Text>
              </Button>
              
              { this.props.navigation.getParam('flow') == 'moreMatches' &&
                <Button 
                  transparent 
                  style={{
                    paddingTop: 20,
                    alignSelf: 'center',
                    textAlign: 'center',
                    shadowOffset: {
                    width: 0,
                    height: 3,
                    },
                  shadowOpacity: 0.29,
                  shadowRadius: 4.65, }} 
                  onPress={() => navigate("Payments")}            
                >
                  <Text style={{color: primaryColor, textAlign: 'center'}}>{this.state.secondaryCTA2}</Text>
              </Button>  

              }



              <Button transparent  
                style={{ 
                  alignSelf: 'center',
                  textAlign: 'center',
                  fontFamily:'HelveticaNeue',
                  alignSelf: 'center',
                  shadowOffset: {
                  width: 0,
                  height: 3,
                  },
                shadowOpacity: 0.29,
                shadowRadius: 4.65, }} 
                onPress={() => this.props.navigation.goBack()}            
              >
                <Text style={{color: primaryColor, textAlign: 'center'}}>{this.state.secondaryCTA}</Text>
              </Button>         
            </View>  
            }



            { this.props.navigation.getParam('flow') == 'extendConversation1' &&

            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
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
              onPress={
                () => (!this.state.name)?           
                  Alert.alert(
                    'Missing Name',
                    "Please enter your friends name.",
                    [
                      {text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                    ],
                    { cancelable: false }
                  )   
                  : 
                  navigate("Refer", {
                    onCancel: 'conversations', 
                    flow: state.params.flow, 
                    from: state.params.from,
                    match_userid: state.params.match_userid,
                    conversationId: state.params.conversationId, 
                    name: this.state.name,
                  })
              }>
                <Text style={{color: btnTextColor, width: deviceWidth-80, textAlign:'center'}}>{this.state.primaryCTA}</Text>
              </Button>
             
              <Button 
                transparent 
                style={{
                  alignSelf: 'center',
                  paddingTop: 20,
                  textAlign: 'center',
                  shadowOffset: {
                  width: 0,
                  height: 3,
                  },
                shadowOpacity: 0.29,
                shadowRadius: 4.65, }} 
                onPress={() => navigate("Payments")}            
              >
                <Text style={{color: primaryColor, textAlign: 'center'}}>{this.state.secondaryCTA2}</Text>
              </Button>  
             
              <Button transparent  
                style={{ 
                  alignSelf: 'center',
                  textAlign: 'center',
                  shadowOffset: {
                  width: 0,
                  height: 3,
                  },
                shadowOpacity: 0.29,
                shadowRadius: 4.65, }} 
                onPress={() => this.props.navigation.goBack()}            
              >
                <Text style={{color: primaryColor, textAlign: 'center'}}>{this.state.secondaryCTA}</Text>
              </Button>         
            </View>  
            }


{ this.props.navigation.getParam('flow') == 'extendConversation2' &&

<View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
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
  onPress={() => navigate("Payments")
  }>
    <Text style={{color: btnTextColor, width: deviceWidth-80, textAlign:'center'}}>{this.state.primaryCTA}</Text>
  </Button>
  
  <Button transparent  
    style={{ 
      
      textAlign: 'center',
      shadowOpacity: 0.29,
      shadowRadius: 4.65, 
      shadowOffset: {
        width: 0,
        height: 3,
      },
    }} 
    onPress={() => this.props.navigation.goBack()}            
  >
    <Text style={{color: primaryColor, textAlign: 'center'}}>{this.state.secondaryCTA}</Text>
  </Button>         
</View>  
}


          </LinearGradient>

        
      </LinearGradient>
    );
  }
}

export default Intersitial;
