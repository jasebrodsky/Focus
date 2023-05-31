import React, { Component } from 'react';
import { StyleSheet, Alert, Share, StatusBar, Keyboard, KeyboardAvoidingView, Dimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faHistory, faUsers, faAddressCard } from '@fortawesome/free-solid-svg-icons';import * as firebase from "firebase";
import RNfirebase from 'react-native-firebase';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import LinearGradient from 'react-native-linear-gradient';


import {
  Container,
  Icon,
  Text,
  Item,
  Input,
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


class Waitlist extends Component {


  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      loading: true,
      referStatus: '',
      // titleCopy: "You're on the list",
      titleCopy: "You're on the waitlist.",
      primaryCopy1: "Wait your turn",
      primaryCopy2: "Or skip the line",
      //secondaryCopy1: "We verify everyone first to ensure we have the highest quality community. We’ll notify you after your profile has been reviewed.",
      secondaryCopy1: 'We verify everyone to have the best community posible. You can wait or you can skip the line.',
      secondaryCopy2: "Refer a friend and you’ll both immediately skip to the front of the waitlist.",
      secondaryCopy1ReferSent: "You're moved to the top of the waitlist. You'll be notified when you're off.",
      primaryCTA: "Skip the Line",
      primaryCTAReferSent: "Refer",
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

    let userId = firebase.auth().currentUser.uid;
    const { navigate } = this.props.navigation;
    
    //query for logged in users information needed and set state with it.     
    firebase.database().ref('/users/' + userId).on('value', ((snapshot) => {
                
        //set state with user data. 
        this.setState({ 
          userId: userId,
          user_name: snapshot.val().first_name,
          status: snapshot.val().status,
          referStatus: snapshot.val().referStatus,
          //user_photo: snapshot.val().images[0].url,
        });  

        //if status becomes active, redirect to swipes.
        if(snapshot.val().status == 'active'){
          //navigate to swipes when off waitlist
          navigate("Swipes");
        }else{
          //if theyre not active yet, set them to waitlist, since they got to the waitlist module. 
          firebase.database().ref('/users/' + userId).update({
            status: 'waitlist'
          })
        }
      })
    ) 

    //run analytics
    RNfirebase.analytics().setAnalyticsCollectionEnabled(true);
    RNfirebase.analytics().setCurrentScreen('Waitlist', 'Waitlist');
    RNfirebase.analytics().setUserId(userId);
    
  }



  render() {
    const { navigate } = this.props.navigation;
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


          <View style={{ flex: 4, alignItems: 'flex-start', justifyContent: 'center', paddingBottom: 50, }}>
            
            <View style={{  flexGrow: 3, width: deviceWidth-50,  alignItems: 'flex-start', justifyContent: 'center', padding: 30, paddingTop: getStatusBarHeight()+15, }}>
              <Text style={{color: 'white', fontSize: 50,}}>{this.state.titleCopy}</Text>
            </View>
            
            <View style={{  flexGrow: 2, borderRadius: 30, width: deviceWidth-50, alignItems: 'flex-start', padding: 30, marginBottom: 40,}}>
              <Text style={{fontSize: 24, fontFamily:'Helvetica-Light', lineHeight: 45, color: 'white'}}>{ (this.state.referStatus == 'sentReferral') ? this.state.secondaryCopy1ReferSent : this.state.secondaryCopy1}</Text>
            </View>

            {/* <View style={{  flexGrow: 1, borderRadius: 30, backgroundColor: '#1C1C24', width: deviceWidth-50, alignItems: 'flex-start', padding: 30, marginBottom: 0,}}>
              <Text style={{fontSize: 35, color: 'white', marginBottom: 20}}>{this.state.primaryCopy2}</Text>
              <Text style={{fontSize: 17, lineHeight: 25, color: 'white'}}>{this.state.secondaryCopy2}</Text>
            </View> */}
          
          </View> 

    
        


            
          <LinearGradient style={{
            flex: 1,
            width: deviceWidth,
            alignItems: 'center',
            justifyContent: 'center',
            //backgroundColor: primaryColor, dimensions
            }}
            colors={[primaryColor, primaryColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1.5, y: 2.5 }}
            >
            
            
            <Button rounded 
              style={{ 
                backgroundColor: btnColor, 
                borderRadius: 20,
                shadowColor: "#000",
                width: 300, 
                //flex: 1,
                justifyContent: 'center',
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65, }} 
              onPress={() => navigate("Intersitial", {
                onCancel: 'waitlist', 
                flow: 'waitlist', 
                from: 'waitlist'
              })}
              >
              <Text style={{color: btnTextColor}}>{ (this.state.referStatus == 'sentReferral') ? this.state.primaryCTAReferSent : this.state.primaryCTA}</Text>
            </Button>
            <Button transparent 
              style={{ 
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65, }} 
              onPress={() => this.props.navigation.goBack()} 
             
              >
              <Text style={{color: btnColor}}>{this.state.secondaryCTA}</Text>

            </Button>
          </LinearGradient>

        
      </LinearGradient>
    );
  }
}

export default Waitlist;
