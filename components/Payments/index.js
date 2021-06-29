import React, { Component } from 'react';
import { StyleSheet, Alert, Dimensions } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faHistory } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';


import {
  Container,
  Text,
  Button,
  H1,
  View
} from "native-base";

const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";
const btnColor = 'white';
const btnTextColor = primaryColor;

class Payments extends Component {


//CONFIG 109

  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      loading: true,
      userId: '',
    }
  }

  //hide nav bar on the login screen
  static navigationOptions = {
    header: null,
  };


  componentWillMount() {
     
    let userId = firebase.auth().currentUser.uid;
    let flow = this.props.navigation.getParam('flow');
    //can be any one of the entry points. will eventually tie to the default image in slider, to make this module initial state relavent. 

    if (flow == 'peek'){
      //sneek peek flow
      //this.setState({ titleCopy: 'TEST PAYMENTS' }); 
    }else {
      //other flows here

    }

    //query for logged in users information needed and set state with it.     
    firebase.database().ref('/users/' + userId).once('value', ((snapshot) => {
                
        //set state with user data. 
        this.setState({ 
          userId: userId,
        });  
    }))
      
    
    // RNfirebase.analytics().setAnalyticsCollectionEnabled(true);
    // RNfirebase.analytics().setUserId(userId);
    // RNfirebase.analytics().setCurrentScreen('Intro', 'Intro');
  
  }
  

  //when user subscribes update database with users subscription
  _onSubscribe = () => {

    let firebaseRef = firebase.database().ref('/users/' + userId);

    //record in analytics that user was subscribed  
    RNfirebase.analytics().setUserProperty('subscribed', 'true');

    //update firebase with new value, then update state
    firebaseRef.update({subscribed: true})
    .then(this.setState({ subscribed: true }))
    .then(this.props.navigation.goBack())
  }


  render() {
    const { navigate } = this.props.navigation;
    //determine width of device in order for custom margin between iphones
    let deviceWidth = Dimensions.get('window').width
    let blackColor = "#505050"
    //let BodyBackgroundColor = "#E8E8E8"
    let BodyBackgroundColor = blackColor

        
    return (
      <Container style={{ flex: 1, alignItems: 'center',  }}>


                {/* top section */}
                <LinearGradient 
                    colors={[primaryColor, 'black']}
                    start={{ x: 0, y: 0.6 }}
                    end={{ x: 0, y: 1}}
                    style={{flex: 6, alignItems: 'center', justifyContent: 'center', width: deviceWidth, backgroundColor: primaryColor}}>
                    {/* static header */}
                    <View style={{flex: 1, marginTop:50}}>
                        <H1 style={{ textAlign: 'center', justifyContent:'center', color: 'white'}}>Get Focus Premium</H1>
                    </View>
                    
                    {/* slider of features */}
                    <View style={{flex: 2, alignItems: 'center', justifyContent: 'center'}}>
                        <FontAwesomeIcon size={ 130 } style={{
                          color: 'white', 
                          backgroundColor: 'transparent', 
                          shadowColor: "#000",
                          shadowOffset: {
                            width: 0,
                            height: 3,
                          },
                          shadowOpacity: 0.29,
                          shadowRadius: 4.65,}} icon={faHistory}/>
                        <H1 style={{
                          paddingTop: 15, 
                          textAlign: 'center', 
                          color: 'white', 
                          shadowColor: "#000",
                          shadowOffset: {
                            width: 0,
                            height: 3,
                          },
                          shadowOpacity: 0.29,
                          shadowRadius: 4.65,}}>Extend Chat</H1>
                        <Text style={{paddingTop: 15, textAlign: 'center', color: 'white'}}>Get unlimited time to chat</Text>
                    </View>
    
                </LinearGradient>

                {/* body with descriptions of pricing */}
                <View style={{ flex: 3, justifyContent: 'center', backgroundColor: "black", width: deviceWidth}}>
                    <Text style={{ fontWeight: 'bold', fontSize: 50,textAlign: 'center', color: "white"}}>12 </Text>
                    <Text style={{ fontSize: 30, textAlign: 'center', color: "white"}}>months </Text>
                    <Text style={{ fontWeight: 'bold',fontSize: 30, textAlign: 'center', color: "white"}}>$9.99/mo  </Text>
                </View>

                {/* footer with buttons */}
                <View style={{ flex: 3, justifyContent: 'center', alignContent: 'center' }}>
                    <Button 
                      bordered 
                      style={{
                        marginTop: 20, 
                        borderColor: primaryColor, 
                        backgroundColor: primaryColor, 
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOffset: {
                          width: 0,
                          height: 3,
                         },
                        shadowOpacity: 0.29,
                        shadowRadius: 4.65, }} 
                      onPress={() => {this._onSubscribe();}}>
                        <Text style={{color: 'white', width: 200, textAlign:'center'}}>Continue</Text>
                    </Button>  
                    <Button transparent full onPress={() => {this.props.navigation.goBack()}} >
                        <Text style={{color: primaryColor}}>Cancel</Text>
                    </Button>
                </View>

                {/* compliance text */}
                <View style={{ flex: 2, justifyContent: 'center', backgroundColor: 'white', width: deviceWidth }}>                   
                    <Text style={{fontWeight: 'bold', fontSize: 15, color: blackColor, textAlign:'center'}}>Recurring Billing. Cancel anytime. </Text>
                    <Text style={{padding: 10, fontSize: 12, color: blackColor, textAlign:'center'}}>If you choose to purhcase a subscription, payment will be charged to your iTunes account, and your account will be charged within 24-hours prior to the end of the current period. Auto-renewal may be turned off at any time by going to your iTunes & App Store Account Settings after purchase. </Text>  
                </View>

      </Container>
    );
  }
}

export default Payments;
