import React, { Component, useState, useEffect } from 'react';
import { StyleSheet, Alert, Dimensions, Platform, TouchableOpacity } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faHistory, faUtensils, faPeopleCarry,  } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import IAP, { purchaseUpdatedListener } from "react-native-iap";
import Carousel, { Pagination } from 'react-native-snap-carousel';

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
const items = ['fd_2999_1m', 'fd_5999_3m', 'fd_8999_6m'];

class Payments extends Component {
  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      loading: true,
      userId: '',
      products: [], //for payment tiers
      activeTier: 1,
      selectedProductId: 'fd_5999_3m',
      activeIndex:0,
      carouselItems: [
        {
            icon:faUtensils,
            title:"Unlimited Blind Dates",
            text: "More blind date expirences.",
        },
        {
            icon:faHistory,
            title:"Unlimited Chat Extends",
            text: "More time to make connections.",
        },
        {
            icon:faPeopleCarry,
            title:"Unlimited Matches",
            text: "More people to connect with.",
        },
      ],
      initalProducts: [      
        {
          title: 'Focus Unlimited',
          description: 'Get Focus Unlimited.',
          subscriptionPeriodNumberIOS: '1', 
          subscriptionPeriodUnitIOS: 'MONTHS', 
          localizedPrice: '$29.99',
          price: 29.99,  
          productId: 'fd_2999_1m' 
        },
        {
          title: 'Focus Unlimited',
          description: 'Get Focus Unlimited.',
          subscriptionPeriodNumberIOS: '3', 
          subscriptionPeriodUnitIOS: 'MONTHS', 
          localizedPrice: '$59.99', 
          price: 59.99, 
          productId: 'fd_5999_3m' 
        },        
        {
          title: 'Focus Unlimited',
          description: 'Get Focus Unlimited.',
          subscriptionPeriodNumberIOS: '6', 
          subscriptionPeriodUnitIOS: 'MONTHS', 
          localizedPrice: '$89.99',
          price: 89.99,  
          productId: 'fd_8999_6m' 
        }
      ]
    }
  }

  //hide nav bar on the login screen
  static navigationOptions = {
    header: null,
  };

  
  componentWillMount() {

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


  //when user clicks subscription tier button. update UX and state to handle purchase button when subscribing
  _onPress = (productId, tier) => {

    console.log('pushed tier: '+ tier + 'of productId: '+productId);

    //save actived tier to state
    this.setState({activeTier: tier, selectedProductId: productId })

  }


  //render slider items
  _renderItem({item,index}){
    return (
      <View style={{
        flex: 3,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 0,
        marginLeft: 0,
        marginRight: 0, }}>
          
          <View style={{flex:1, color: 'white', margin: 70}}>           
           <FontAwesomeIcon 
              size={ 90 } 
              icon={item.icon}
              style={{
                color: 'white', 
                backgroundColor: 'transparent', 
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65,}} 
            />
            </View>
          <Text style={{flex:1, fontFamily: 'Helvetica-Light',  fontSize: 27, textAlign: 'center', color: 'white', marginTop: 7, marginBottom: 7 }}>{item.title}</Text>
          <Text style={{flex:1, fontFamily: 'Helvetica-Light',  fontSize: 17, textAlign: 'center', color: 'white',}}>{item.text}</Text>
      </View>

    )
}

    get pagination () {
        const { carouselItems, activeIndex } = this.state;
        return (
            <Pagination
              carouselRef={this.carousel}
              dotsLength={carouselItems.length}
              activeDotIndex={activeIndex}
              containerStyle={{padding: 0, height: 10, width: 20,   }}
              dotStyle={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  marginHorizontal: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.92)'
              }}
              inactiveDotStyle={{
                  // Define styles for inactive dots here
              }}
              inactiveDotOpacity={0.4}
              inactiveDotScale={0.6}
            />
        );
    }


  render() {
    const { navigate } = this.props.navigation;
    //determine width of device in order for custom margin between iphones
    let deviceWidth = Dimensions.get('window').width
    let blackColor = "#505050"
    let productArray = [];



    // if products have loaded save them to use in render
    if (this.state.products.length > 0 ){

      console.log('products length over one');
      //save productArray as products now in state. 
      productArray = this.state.products ; 
      
    }else{

      console.log('products length under one, use initial state');
      //save productArray as products now in state. 
      productArray = this.state.initalProducts ; 

    }

        
    return (
      <Container style={{ flex: 1, alignItems: 'center', backgroundColor: '#1C1C24'  }}>


                {/* top section */}
                <LinearGradient 
                    colors={[ primaryColor, secondaryColor,   ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 2, y: 2 }}
                    style={{flex: 11, alignItems: 'center', justifyContent: 'center', width: deviceWidth, backgroundColor: primaryColor}}>
                    {/* static header */}
                    <View style={{
                      flex: 1, 
                      width: deviceWidth-80,
                      backgroundColor: '#1C1C24',
                      borderRadius: 30,
                      padding: 40,
                      justifyContent: 'center', 
                      marginLeft: 40,
                      marginRight: 40,
                      marginTop: 40, }}>

                        <Text style={{ fontFamily:'Helvetica', textAlign: 'left', fontSize: 45, color: 'white'}}>Get Focus</Text>
                        <Text style={{ fontFamily:'Helvetica-Light', textAlign: 'left', fontSize: 30, color: 'white'}}>Unlimited</Text>

                    </View>
                    


                        {/* slider of features */}
                        <View style={{
                          flex: 5, 
                          width: deviceWidth-80,
                          backgroundColor: '#1C1C24',
                          borderRadius: 30,
                          paddingTop: 0,
                          alignItems: 'center',
                          justifyContent: 'center', 
                          margin: 25
                          }}>

                        <View style={{ flex: 6, flexDirection:'column', justifyContent: 'center', alignItems: 'center'  }}>
                          <Carousel
                            layout={"default"}
                            loop={true}
                            autoplay={true}
                            autoplayInterval={4000}
                            removeClippedSubviews ={false}
                            enableMomentum={false}
                            ref={ref => this.carousel = ref}
                            data={this.state.carouselItems}
                            sliderWidth={deviceWidth-80}
                            itemWidth={deviceWidth-80}
                            //itemHeight={20}
                            renderItem={this._renderItem}
                            onSnapToItem = { index => this.setState({activeIndex:index}) } 
                        />
                        { this.pagination }
                    </View>

                            {/* body with descriptions of pricing */}
                            
                            <View style={{
                              flex: 2,
                              alignItems: 'center',
                              width: deviceWidth-80,
                            }}>

                              <View style={{
                                  flex: 2,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: primaryColor,
                                   width: (deviceWidth - 80)/3,

                                }}>
                                  <Text style={{
                                    fontSize: 12,
                                    padding: 3,
                                    color: 'white',
                                    fontFamily: 'Helvetica-Bold'
                                  }}>Recommended</Text>
                                </View>

                                <View style={{
                                    flex: 6,
                                    flexDirection: 'row'                                
                                }}>

                                    <TouchableOpacity 
                                    onPress={() => {this._onPress(items[0], 0)}}
                                    style={{ 
                                        flex: 1, 
                                        justifyContent: 'center', 
                                        backgroundColor: this.state.activeTier == 0 ? '#BDDDEE' : 'white',
                                        borderBottomLeftRadius: 30,
                                        borderWidth: 0.5,
                                        borderColor: 'black',
                                        }}>
                                          <Text style={{ fontFamily: 'Helvetica-Bold', padding: 2, fontSize: 12, textAlign: 'center', color: "black"}}>{productArray[0]['subscriptionPeriodNumberIOS']+' '+productArray[0]['subscriptionPeriodUnitIOS'].toLowerCase()} </Text>
                                          <Text style={{ fontFamily: 'Helvetica-Light', padding: 2, fontSize: 12, textAlign: 'center', color: "black"}}>{productArray[0]['localizedPrice']} </Text>
                                      </TouchableOpacity>
                                      
                                      <TouchableOpacity 
                                      onPress={() => {this._onPress(items[1], 1)}}
                                      style={{ 
                                        flex: 1, 
                                        justifyContent: 'center', 
                                        backgroundColor: this.state.activeTier == 1 ? '#BDDDEE' : 'white',
                                        borderWidth: 0.5,
                                        borderColor: 'black',
                                        }}>
                                          <Text style={{ fontFamily: 'Helvetica-Bold', padding: 2, fontSize: 12, textAlign: 'center', color: "black"}}>{productArray[1]['subscriptionPeriodNumberIOS']+' '+productArray[1]['subscriptionPeriodUnitIOS'].toLowerCase()} </Text>
                                          <Text style={{ fontFamily: 'Helvetica-Light', padding: 2, fontSize: 12, textAlign: 'center', color: "black"}}>{productArray[1]['localizedPrice']} </Text>
                                          <Text style={{ fontFamily: 'Helvetica-Light', padding: 2, fontSize: 12, textAlign: 'center', color: "black"}}>{'$'+Math.round(100*productArray[1]['price'])/100 +'/'+ productArray[1]['subscriptionPeriodUnitIOS'].toLowerCase()}</Text>
                                      </TouchableOpacity>
                                     
                                      <TouchableOpacity 
                                      onPress={() => {this._onPress(items[2], 2)}}
                                      style={{ 
                                        flex: 1, 
                                        justifyContent: 'center', 
                                        backgroundColor: this.state.activeTier == 2 ? '#BDDDEE' : 'white',
                                        borderBottomRightRadius: 30,
                                        borderWidth: 0.5,
                                        borderColor: 'black',
                                        }}>
                                          <Text style={{ fontFamily: 'Helvetica-Bold', padding: 2, fontSize: 12, textAlign: 'center', color: "black"}}>{productArray[2]['subscriptionPeriodNumberIOS']+' '+productArray[2]['subscriptionPeriodUnitIOS'].toLowerCase()} </Text>
                                          <Text style={{ fontFamily: 'Helvetica-Light', padding: 2, fontSize: 12, textAlign: 'center', color: "black"}}>{productArray[2]['localizedPrice']} </Text>
                                          <Text style={{ fontFamily: 'Helvetica-Light', padding: 2, fontSize: 12, textAlign: 'center', color: "black"}}>{'$'+Math.round(100*productArray[2]['price'])/100 +'/'+ productArray[2]['subscriptionPeriodUnitIOS'].toLowerCase()}</Text>
                                      </TouchableOpacity>

                                </View>



                          </View>

                        </View>


    



                </LinearGradient>



                {/* footer with buttons and compliance text */}

                <View style={{ flex: 3, justifyContent: 'center', alignItems: 'center', }}>
                    <Button 
                      style={{
                        marginTop: 20, 
                        width: 200,
                        backgroundColor: 'white', 
                        borderRadius: 20,
                         }} 
                      onPress={() => {this._onSubscribe(this.state.selectedProductId)}}>
                        <Text style={{color: primaryColor, width: 200, textAlign:'center'}}>Continue</Text>
                    </Button>  

                    <Button transparent full onPress={() => {this.props.navigation.goBack()}} >
                        <Text style={{color: primaryColor}}>Cancel</Text>
                    </Button>

                    {/* compliance text */}
                    <View style={{ flex: 2, justifyContent: 'center', padding: 10 }}>                   
                        <Text style={{fontWeight: 'bold', fontSize: 11, color: 'white', textAlign:'center'}}>Recurring Billing. Cancel anytime. </Text>
                        <Text style={{padding: 5, fontSize: 9, color: 'white', textAlign:'center'}}>If you choose to purhcase a subscription, payment will be charged to your iTunes account, and your account will be charged within 24-hours prior to the end of the current period. Auto-renewal may be turned off at any time by going to your iTunes & App Store Account Settings after purchase. </Text>  
                    </View>

                </View>



      </Container>
    );
  }
}

export default Payments;