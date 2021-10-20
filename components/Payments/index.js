import React, { Component, useState, useEffect } from 'react';
import { StyleSheet, Alert, Dimensions, Platform } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faHistory } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import IAP, { purchaseUpdatedListener } from "react-native-iap";

import {
  Container,
  Text,
  Button,
  H1,
  View
} from "native-base";
import { validate } from '@babel/types';
import { SubscriptionExpirationIntent } from 'react-native-iap/src/types/apple';

const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";

const btnColor = 'white';
const btnTextColor = primaryColor;

//items to purchase
const items = ["fd_999_1m"];


class Payments extends Component {

  

//CONFIG 109

  constructor(props){

    
    super(props)

    //set state to convos var
    this.state = {
      loading: true,
      userId: '',
      products: [], //for payment tiers
    }

    
  }

  //hide nav bar on the login screen
  static navigationOptions = {
    header: null,
  };

  



  componentWillMount() {

    //UPDATE 911 CHAT TO UPDATE CHAT WITH COUNTOWND TIMER, AFTER DONE TESTING THIS

    // global variable for listening for new purchases or errors
    let purchaseUpdatedListener = '';
    let purchaseErrorListener = '';

    //initialize connetion to store for in app purchases
    IAP.initConnection().catch(() =>{
      console.log("error connecting to store...")
    }).then(() => {
      console.log("connected to store...")
      
      //after intialized, get subription products, to put in state
      IAP.getSubscriptions(items).catch((error) =>{
        console.log("error finding purchases: "+error)
      }).then((res)=>{
        console.log("got products")
        this.setState({products: res})
        console.log('res is: '+JSON.stringify(res))
      })

      //after intialized, also get purchase history and validate the receipt
      IAP.getPurchaseHistory().catch(() => {
        console.log('problem getPurchaseHistory')
      }).then((res) => {
        const receipt = res[res.length-1].transactionReceipt; 
        if (receipt){
          console.log('validating receipt');
          this._validateReceipt(receipt)
          
        }
      })

      //listen if new purchase is recorded
      purchaseUpdatedListener = IAP.purchaseUpdatedListener((purchase) =>{

        //if new purchase is found, validate the reciept
        try{
          const receipt = purchase.transactionReceipt;
          console.log('reciept is: '+receipt);
          this._validateReceipt(receipt)

        }catch (error) {
          console.log('there was an error in purchaseUpdatedListener: '+error)
        }

      })

    })
  
     
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
  
  //validate receipt
  _validateReceipt = async (receipt) => {

    let userid = firebase.auth().currentUser.uid;

    const receiptBody = {
      "receipt-data": receipt,
      "password": 'e03a9014589647b0ba532ec17d7ee42a',
    }

    const result = await IAP.validateReceiptIos(receiptBody, true).catch(() =>{
      console.log('this is an error validating the receipt')
    }).then((reciept) => {

      try{
        
        //console.log('receipt is: '+receipt)
        const renewalHistory = reciept.latest_receipt_info;
        console.log('renewalHistory is: '+JSON.stringify(renewalHistory));
        const expiration = renewalHistory[0].expires_date_ms;
        console.log('expiration is: '+expiration);
        let expired = Date.now() > expiration;

        //86000000 - 1 day in ms
        let extendTimeBy = 86000000; //in ms
        let newExpirationDate = (new Date().getTime() + extendTimeBy);

        //update firebase with subscription status, afterwards, goback in navigation stack.

        //delete unless doing someting when status
        if (!expired){
          console.log('Purchase history validated');
          //update firebase with subcription status, for logged in user
         firebase.database().ref('/users/' + userid).update({subscribed: true})
         .then(this.props.navigation.goBack())
         //.then(this.props.navigation.navigate("Chat", { expiration_date: newExpirationDate , match_state: 'active' }))
          

        }else{
          console.log('Purchase expired');
          //update firebase with subcription status, for logged in user
          firebase.database().ref('/users/' + userid).update({subscribed: false})
        }

      } catch (error) {
        console.log('error is: '+error)
      }

    })

  }

  //when user subscribes update database with users subscription
  _onSubscribe = (productId) => {

    //request subscrition of productId
    IAP.requestSubscription(productId);

    //record in analytics that user was subscribed  
    RNfirebase.analytics().setUserProperty('subscribed', 'true');
  }


  render() {
    const { navigate } = this.props.navigation;
    //determine width of device in order for custom margin between iphones
    let deviceWidth = Dimensions.get('window').width
    let blackColor = "#505050"
    //let BodyBackgroundColor = "#E8E8E8"
    let BodyBackgroundColor = blackColor
    //set loading state for pricing data
    let title = 'Get Focus Premium';
    let description = 'Get unlimited time to chat';
    let subscriptionPeriodNumber = '1';
    let subscriptionPeriod = 'MONTH';
    let price = '$9.99';
    let productId = '';



    // if products have loaded save them to use in render
    if (this.state.products.length > 0 ){
      console.log('products length over one');
      title = 'Get ' + this.state.products[0]['title']; //Focus Premium
      description = this.state.products[0]['description']; //Get unlimited time to chat.
      subscriptionPeriodNumber = this.state.products[0]['subscriptionPeriodNumberIOS']; //1,6,12,...
      subscriptionPeriod = this.state.products[0]['subscriptionPeriodUnitIOS']; //MONTHS
      price = this.state.products[0]['localizedPrice']; //$9.99
      productId = this.state.products[0]['productId']; //$9.99
    }

        
    return (
      <Container style={{ flex: 1, alignItems: 'center',  }}>


                {/* top section */}
                <LinearGradient 
                    colors={[primaryColor, secondaryColor]}
                    start={{ x: 0, y: 0.6 }}
                    end={{ x: 0, y: 1}}
                    style={{flex: 8, alignItems: 'center', justifyContent: 'center', width: deviceWidth, backgroundColor: primaryColor}}>
                    {/* static header */}
                    <View style={{flex: 1, marginTop:50}}>
                        <H1 style={{ textAlign: 'center', justifyContent:'center', color: 'white'}}>{title}</H1>
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
                        <Text style={{paddingTop: 15, textAlign: 'center', color: 'white'}}>{description}</Text>
                    </View>
    

                {/* body with descriptions of pricing */}
                <View style={{ flex: 2, justifyContent: 'center', width: deviceWidth}}>
                    <Text style={{ fontWeight: 'bold', fontSize: 50,textAlign: 'center', color: "white"}}>{subscriptionPeriodNumber} </Text>
                        <Text style={{ fontSize: 30, textAlign: 'center', color: "white"}}>{subscriptionPeriod.toLocaleLowerCase()} </Text>
                    <Text style={{ fontWeight: 'bold',fontSize: 30, textAlign: 'center', color: "white"}}>{price}/{subscriptionPeriod.toLocaleLowerCase()}  </Text>
                </View>

                </LinearGradient>



                {/* footer with buttons */}
                <View style={{ flex: 2, justifyContent: 'center', alignContent: 'center' }}>
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
                      onPress={() => {this._onSubscribe(productId);}}>
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
