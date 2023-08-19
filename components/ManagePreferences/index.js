import React, { Component } from 'react';
import {TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Image, Alert, Dimensions, Linking, ScrollView, Platform, TextInput, StatusBar, TouchableOpacity } from 'react-native';
// import RNfirebase from 'react-native-firebase';
// import * as firebase from "firebase";
import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

import DatePicker from 'react-native-datepicker';
import ImagePicker from 'react-native-image-crop-picker';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Geocoder from 'react-native-geocoding';
import * as Progress from 'react-native-progress';
import Geolocation from '@react-native-community/geolocation';
// import RNFetchBlob from 'react-native-fetch-blob';
import ReactNativeBlobUtil from 'react-native-blob-util'


import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faCamera } from '@fortawesome/free-solid-svg-icons';
const geofire = require('geofire-common');

import {
  ActionSheet,
  Form,
  Text,
  Button,
  Input,
  InputGroup,
  Textarea,
  View,
} from "native-base";

//styling consts
const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";
const btnColor = 'white';
const btnTextColor = primaryColor;
    
var PHOTO_OPTIONS = [
  'View Photo',  
  'Make Main Photo',
  'Remove Photo',
  'Cancel',
];

var GENDER_OPTIONS = [
  'Male',
  'Female',
  'Cancel',
];

var DESTRUCTIVE_INDEX = 2;
var CANCEL_INDEX = 2;

Geocoder.init('AIzaSyCbt43Up1r0ywnqWX2xxMWGiwWJ3CSBrAI');

class ManageAboutMe extends Component {

  constructor(props, contexts){
    super(props, contexts)

  this.state = {
      imageViewerVisible: false,
      selectedImage:[{url: ''}],
      imageIndex: 0,
      aboutMeRows: 16,
      forceUpdate: false,
      progress: 0.1,
      stepIndex: 0,
      currentStepValidated: false,
      profile: {
        about: '',
        images: [{0:{url:'https://focusdating.co/images/user.jpg'}}],
        first_name: null,
        last_name: null,
        latitude: null,
        longitude: null,
        locationDeclined: null,
        gender: 'Select',
        birthday: '',
        notifications_message: true,
        notifications_match: true,
        work: '',
        interested: 'Select',
        max_distance: 100,
        interested: null,
        min_age: 18,
        max_age: 50,
      },
      steps: [     
        {
          progress: 0.3,
          title: "I'm interested in",
          subtitle: 'what is your type?',
          back: false,
          input: 'lookingFor',
          required: true
        },
        {
          progress: 0.6,
          title: "My preferred age",
          subtitle: 'Spring chicken or silver fox?',
          back: true,
          input: 'preferredAge',
          required: true
        },
        {
          progress: 1,
          title: 'My preferred distance',
          subtitle: 'How far is too far?',
          back: true,
          input: 'preferredMaxDistance',
          required: true
        },
      ]
      
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
      }), this.validateCurrentStep('name'), //validate the first after state loads.

    //run analytics
    analytics().logScreenView({
      screen_name: 'ManagePreferences',
      screen_class: 'ManagePreferences'
    });
    analytics().setUserId(userId)
    })
  }  

  //After component mounts prompt for permission to recieve notifications and save fcmToken to database
  componentDidMount() {
    //check permissions
    this.checkPermission();
  }  

  // check if permission for notification has been granted previously, then getToken. 
  async checkPermission() {
    const enabled = await messaging().requestPermission();;
    if (enabled) {
        this.getToken();
    } else {
        this.requestPermission();
    }
  }

  // getToken if permission has been granted previously
  async getToken() {
    fcmToken = await messaging().getToken();
    firebaseRef.update({fcmToken: fcmToken});
  }

  // if permission has not been granted, request for permission. 
  async requestPermission() {
    try {
        await messaging().requestPermission();;
        // User has authorised
        this.getToken();

        analytics().logEvent('permissionMessageAccepted', {
          accepted: true
        });

    } catch (error) {
        // User has rejected permissions
        console.log('permission rejected');
        //record in analytics that photo was successfully swapped 
        analytics().logEvent('permissionMessageAccepted', {
          accepted: false
        });
    }
  }

  //function to get update users current location. 
  getLocation = () => {

    let date = new Date();
    let offsetInMin = date.getTimezoneOffset();
  
    //save ref to current user in db. 
    firebaseRefCurrentUser = database().ref('/users/' + userId);
    //request authorization to location services
    Geolocation.requestAuthorization();
    //convert location geo data into location data
    Geolocation.watchPosition(
      position => {
        Geocoder.from(position.coords.latitude, position.coords.longitude,1)
        .then(json => {
                //define placeholders for city state texts. 
                let cityText = '';
                let stateText = '';
                //find long_name where arraddress has type of locality and administrative_area_level_1
                json.results[0].address_components.forEach((place) => {    
                  if (place.types.includes("locality")) {
                    console.log('locality is: '+JSON.stringify(place.long_name));
                    cityText = place.short_name;
                  }
                  if (place.types.includes('sublocality_level_1')) {
                    console.log('sublocality_level_1 is: '+JSON.stringify(place.long_name));
                    cityText = place.short_name;
                  }
                  if (place.types.includes('administrative_area_level_1')) {
                    //console.log('state is: '+JSON.stringify(place.short_name));
                    console.log('place is: ');
                    stateText = place.short_name;
                  }                            
                })

                //contenate strings
                let city_state = cityText+', '+stateText;
  
                // save hash of geo codes. 
                const hash = geofire.geohashForLocation([position.coords.latitude, position.coords.longitude]);
                //update firebase
                firebaseRefCurrentUser.update({ utc_offset_min: offsetInMin, city_state: city_state, locationDeclined: false, locationError: null, latitude: position.coords.latitude, longitude: position.coords.longitude, geohash: hash });
      
              
              })
        .catch(error => console.warn(error));
      },
      error => 
      
      //update firebase
      firebaseRefCurrentUser.update({locationDeclined: true, locationError: error.message}),
    
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  }
    
  //functions to convert miles to/from meters to use for writing/reading from db. 
  getMiles = (i) => Math.round(parseFloat(i*0.000621371192));
  
  getMeters = (i) => i*1609.344;
  
  getAge = (dateString)  => {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  }




  //generate the preferred age range of user based off users age
  preferredAgeRange = (birthday) => {
  
    let firebaseRef = database().ref('/users/' + userId);
    let age = this.getAge(birthday);
    let gender = this.state.profile.gender;
    let maxAgePreferred = 70;
    let minAgePreferred = 18;

    //based off gender, let's calculate suggeted ages
      if (gender == 'male'){
        
        //compute ages
        maxAgePreferred = age+3;
        minAgePreferred = age-7
        
        //floor if below 18 years of age at 18 years.
        minAgePreferred = minAgePreferred < 18 ? 18 : minAgePreferred; 

        //update state and db with updated max and min age preferences
        this.setState({
          profile: { ...this.state.profile, max_age: maxAgePreferred, min_age: minAgePreferred, }
        }, ()=>{        
          firebaseRef.update({min_age: minAgePreferred, max_age: maxAgePreferred});
        });
  
      
      }else{
        
        //compute ages
        maxAgePreferred = age+7;
        minAgePreferred = age-3
        
        //floor if below 18 years of age at 18 years.
        minAgePreferred = minAgePreferred < 18 ? 18 : minAgePreferred; 

        //update state and db with updated max and min age preferences
        this.setState({
          profile: { ...this.state.profile, max_age: maxAgePreferred, min_age: minAgePreferred, }
        }, ()=>{        
          firebaseRef.update({min_age: minAgePreferred, max_age: maxAgePreferred});
        });

      }
  
  }


	//when user updates gender derive their gender_pref bases on who they're interested in. trigger in callback of updating state with dropdown, since will be using state data to derive gender_pref. 
	updateGenderOrInterested = (type) => {

    console.log('this.state.profile.gender is: '+this.state.profile.gender)
		//update gender variable with selected gender
		let gender = this.state.profile.gender.toLowerCase(); //can be male or female
		let interested = this.state.profile.interested.toLowerCase() //can be either male,female, everyone, select. Will remain same. 
    let gender_pref = '';

    //run below if input used is gender
    if (type == 'gender'){
      //console.log('running for case type = gender');
      if (gender == 'male') {
        //console.log('running for case gender = male');
        //switch cases for what gender_pref will be when user is male
        switch(interested) {
          case 'male':
            gender_pref = 'male_gay';
            break;
          case 'female':
            gender_pref = 'male_straight';
            break;
          case 'everyone':
            gender_pref = 'male_bi';
            break;
          case 'Select':
            gender_pref = 'select';
            break;
        }
      }else if (gender == 'female') {
        //switch cases for what gender_pref  will be when user is female
        switch(interested) {
          case 'female':
            gender_pref = 'female_gay';
            break;
          case 'male':
            gender_pref = 'female_straight';
            break;
          case 'everyone':
            gender_pref = 'female_bi';
            break;
          case 'Select':
            gender_pref = 'select';
            break;
        }
      }
      //console.log('running for case type = gender');
      if (gender == 'nonbinary') {
        //console.log('running for case gender = male');
        //switch cases for what gender_pref will be when user is male
        switch(interested) {
          case 'male':
            gender_pref = 'nonbinary_into_male';
            break;
          case 'female':
            gender_pref = 'nonbinary_into_female';
            break;
          case 'everyone':
            gender_pref = 'nonbinary_bi';
            break;
          case 'Select':
            gender_pref = 'select';
            break;
        }
      }

    }else if (type == 'interested') {

      // else run below when input used is interested in
      if (interested == 'male') {
        //switch cases for what gender_pref will be when user is interested in males
        switch(gender) {
          case 'male':
            gender_pref = 'male_gay';
            break;
          case 'female':
            gender_pref = 'female_straight';
            break;
          case 'nonbinary':
            gender_pref = 'nonbinary_into_male';
            break;
          case 'Select':
            gender_pref = '';
            break;
        }
      }else if (interested == 'female') {
        //switch cases for what gender_pref  will be when user is interested in females
        switch(gender) {
          case 'female':
            gender_pref = 'female_gay';
            break;
          case 'male':
            gender_pref = 'male_straight';
            break;
          case 'nonbinary':
            gender_pref = 'nonbinary_into_female';
            break;
          case 'Select':
            gender_pref = '';
            break;
        }
      }else if (interested == 'everyone') {
        gender_pref = gender+'_bi'; //can be male_bi or female_bi
      }else if (interested == 'select') {
        gender_pref = '';   
      }      

    }

    //update db with gender_pref
    firebaseRef.update({gender_pref: gender_pref, interested: interested, gender: gender});
  
    //update state with gender_pref
    this.setState({
      profile: { ...this.state.profile, interested: interested, gender: gender, gender_pref: gender_pref}
    });
	}





  validateCurrentStep = () => {

    //save current steps name into variable
    let step = this.state.steps[this.state.stepIndex].input;
    

    if(step == 'preferredMaxDistance'){

      // //request location permission
      // this.getLocation(), () => {
        
      //   //alert('location got');
      //   if (this.state.profile.locationDeclined) {
      //     //check if name location has been granated, -> update currentStepValidated to true
      //     this.setState({ currentStepValidated: false })
      //   }
      //   else{
      //     this.setState({ currentStepValidated: true })
      //   }
      // };
      
    }else{
      //make continue button enabled for all other steps. 
      this.setState({ currentStepValidated: true })
    }


  }

      //functions to manage/navigate step data in state
      manageStep = (action) => {

        //alert(this.state.currentStepValidated);
        console.log('action is: '+action);

       

        //save current step index into var from our state.
        let currentStepIndex = this.state.stepIndex;

        //check if currentStepIndex is at the end. end is length of steps - 1
        if(currentStepIndex == (this.state.steps.length - 1)){
          
          //console the end and do nothing
          console.log('at the end');

          //only if a back button and at the end, go back a step. 
          if (action == 'back'){
            this.setState({ stepIndex: currentStepIndex-1, aboutMeRows: 16}, () => { 
              this.validateCurrentStep(); //validate if step is complete
            });
          }
          
        }else{ //must not be at the end

          //check to +1 or -1 stepIndex
          if(action == 'back' ){ //back button clicked
            //check if at the beginning
            if(currentStepIndex == 0){
            console.log('at the beginning at back clicked');
          }else
            //update stepIndex to the previous one.
            this.setState({ stepIndex: currentStepIndex-1, aboutMeRows: 16}, () => { 
              this.validateCurrentStep(); //validate if step is complete
            });
            //this.validateCurrentStep(this.state.steps[this.state.stepIndex].name); //validate if step is complete
            console.log('go back');

          }else{ //continue or skip clicked
            if (action == 'continue'){ //if continue was clicked, update data from step and go to next step then validate it. 
              console.log('go next');
              let step = this.state.steps[this.state.stepIndex].input;

              analytics().logEvent(step+'Saved', {
                data: this.state.profile.step
              });
  
              //update with db with new data from current step
                switch (step) {  
                 case 'lookingFor': //when lookingFor step is selected
                    analytics().setUserProperty('genderPref', this.state.profile.gender_pref);                       
                     break;
                 case 'preferredAge': //when preferredAge step is selected // CAN'T SEEM TO RESOLVE THE MIN/MAX AGE FROM STATE???
                     analytics().setUserProperty('preferredMaxAge', this.state.profile.min_age.toString());                       
                     analytics().setUserProperty('preferredMinAge', this.state.profile.min_age.toString());                       
                     break;
                 case 'preferredMaxDistance'://when preferredMaxDistance step is selected
                      analytics().setUserProperty('preferredMaxDistance', this.state.profile.max_distance);  
                      
                      this.setState({profile: { ...this.state.profile, max_distance: this.getMeters(this.state.profile.max_distance)}})
                      
                      this.getLocation();
                      //alert('ask for location');
                      
                      break;
                 } 
              
                // update stepIndex to the next one.
                this.setState({stepIndex: currentStepIndex+1, aboutMeRows: 16}, () => {
                  this.validateCurrentStep();
                  
                  
                });
  
              }else{ //skip must have been clicked, just go to next step and validate the step
                this.setState({stepIndex: currentStepIndex+1, aboutMeRows: 16}, () => {
                  this.validateCurrentStep();
                });
              }
            }
        }
      }


  render() {

    //btnColor is purple if first_name is completed, else it's grey. 
    let btnColorState = this.state.currentStepValidated  ? 'white' : 'grey'; 
    let placeHolderColor = this.state.currentStepValidated ? 1 : 0.25;
    let continueOpacity = (this.state.profile.locationDeclined == false) ? 1 : 0.25; 
    let textColor = '#404040';

    
    //determine width of device in order for custom margin between iphones
    let deviceWidth = Dimensions.get('window').width
    let deviceHeight = Dimensions.get('window').height

    //calculate 18 year old birthday as the max date picker value. 
    var date = new Date();
    date.setFullYear(date.getFullYear() - 18, date.getMonth());

    //char remaining value for the about me step
    let charRemainingCopy = (30 - this.state.profile.about.length);

    //format images for imageViewer .. not sure why images obj in state didnt' work direclty... 
    let profileImages = this.state.profile.images.map(image => ({ url: image.url }));
    console.log('profileImages? :'+JSON.stringify(profileImages));

    return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} >

      <LinearGradient style={{
        flex: 3,
        alignItems: 'center',
        justifyContent: 'center',
        //backgroundColor: primaryColor, dimensions
        }}
        colors={[primaryColor, primaryColor]}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 0.1, y: 1 }}
        >

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

          <StatusBar 
            hidden={'hidden'} 
            barStyle={'dark-content'} 
            animated={true}
          />

          <View style={{
            flex: 2,
            paddingTop: 0,
            flexDirection: "column"
          }}>
            <View style={{backgroundColor: 'white', height: 50}}>
            </View>
            <View style={{}}>
              <Progress.Bar borderWidth={0} borderRadius={0} unfilledColor={'black'} color={primaryColor} progress={this.state.steps[this.state.stepIndex].progress} height={15} width={deviceWidth} />
            </View>
          

            <View style={{ flexDirection: "row", marginBottom: 15, }}>
              
              <View style={{ 
                display: this.state.steps[this.state.stepIndex].back == true ? 'flex' : 'none' , // if back is true, show back button
                flex: 1, 
                alignItems: "flex-start",
                
                }}>
                <Button onPress = {() => this.manageStep('back')} transparent >
                  <FontAwesomeIcon size={ 28 } style={{ color: 'white', marginLeft: 5}} icon={ faChevronLeft } />
                </Button>
              </View>

              <View style={{
                display: this.state.steps[this.state.stepIndex].required == false ? 'flex' : 'none', //if required is false, show skip button
                flex: 1, 
                alignItems: "flex-end",
                }}>
                <Button onPress = {() => this.manageStep('skip')} transparent >
                  <Text style={{color: 'white'}} >Skip</Text>
                </Button>
              </View>

            
            </View>
          </View>




        <View style={{ flex: 9, alignItems: 'center', justifyContent: 'space-between'   }} >

          <View style={{
            marginBottom: 40,
            padding: 30,
            //backgroundColor: '#1C1C24',
            borderRadius: 30,
          }}>
              <Text style={{ 
                color: 'white', 
                fontSize: 32, 
                fontWeight: '900',
                fontFamily:'HelveticaNeue',
                textAlign: 'left',
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65,}} >{this.state.steps[this.state.stepIndex].title}
              </Text>
          
              {/* <Text style={{ 
                color: 'white', 
                fontSize: 30, 
                fontFamily:'HelveticaNeue',
                textAlign: 'left',
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65,}} >{this.state.steps[this.state.stepIndex].title}
              </Text> */}
          </View>

          <View style={{  flex: 5, justifyContent: "center", alignItems: "center", backgroundColor: '#13131A', width: deviceWidth}}>


            { (this.state.steps[this.state.stepIndex].input == 'lookingFor' ) && //show lookingFor step
              

                  <View style={{flex: 1, flexDirection: "column", justifyContent: 'space-around', alignItems: 'space-between',}}> 
                    <View style={{
                      flex: 1,
                      padding: 10,
                      marginTop: 20,
                      //backgroundColor: '#1C1C24',
                      justifyContent: 'center',
                      //alignItems: 'space-between',
                      borderRadius: 30,
                      }}>
                      <Button // Male button
                      style={{ 
                        justifyContent: 'center',
                        width: 300,
                        backgroundColor: btnColor,
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOffset: {
                          width: 0,
                          height: 3,
                        },
                        shadowOpacity: 0.29,
                        shadowRadius: 4.65,
                        marginBottom: 20 }}                       
                        rounded  
                        onPress = {() => this.setState({profile: { ...this.state.profile, interested: "male"}}, () => {
                          this.updateGenderOrInterested('interested');
                          this.manageStep('continue');
                          }) 
                        }>                         
                          <Text style={{color: btnTextColor, fontFamily:'HelveticaNeue'}}>Men</Text>
                      </Button>  
                      <Button // Female button
                      style={{ 
                        justifyContent: 'center',
                        width: 300,
                        backgroundColor: btnColor,
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOffset: {
                          width: 0,
                          height: 3,
                        },
                        shadowOpacity: 0.29,
                        shadowRadius: 4.65,
                        marginBottom: 20 }}                       
                        rounded  
                        onPress = {() => this.setState({profile: { ...this.state.profile, interested: "female"}}, () => {
                          this.updateGenderOrInterested('interested');
                          this.manageStep('continue');
                          }) 
                        }>                         
                          <Text style={{color: btnTextColor, fontFamily:'HelveticaNeue'}}>Women</Text>
                      </Button>  
                      <Button // Everyone button
                      style={{ 
                        justifyContent: 'center',
                        width: 300,
                        backgroundColor: btnColor,
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOffset: {
                          width: 0,
                          height: 3,
                        },
                        shadowOpacity: 0.29,
                        shadowRadius: 4.65,
                        marginBottom: 0 }}                       
                        rounded  
                        onPress = {() => this.setState({profile: { ...this.state.profile, interested: "everyone"}}, () => {
                          this.updateGenderOrInterested('interested');
                          this.manageStep('continue');
                          }) 
                        }>                         
                          <Text style={{color: btnTextColor, fontFamily:'HelveticaNeue'}}>Everyone</Text>
                      </Button>  
                    </View>



                  </View>
        
              }

              { (this.state.steps[this.state.stepIndex].input == 'preferredAge' ) && //show preferredAge step
              
                <View 
                  style={{
                    flex: 1,
                    flexDirection: 'column',
                    //backgroundColor: '#1C1C24',
                    borderRadius: 30,
                    width: 300,
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: 40
                    }}>
          
                      <Text style={{color: 'white', textAlign: 'center',  fontSize: 30, fontFamily:'HelveticaNeue'}} >
                        {this.state.profile.min_age} - {this.state.profile.max_age == 70 ? '70+' : this.state.profile.max_age+' '}
                      </Text>
                        <MultiSlider 
                          min={18}
                          max={70}
                          values={[this.state.profile.min_age,this.state.profile.max_age]} 
                          unselectedStyle = {{backgroundColor: 'white'}} 
                          selectedStyle = {{backgroundColor: 'white'}} 
                          sliderLength={deviceWidth-150} 
                          markerStyle={{ height:30, width: 30, borderRadius: 15, backgroundColor:'white', borderColor: 'white', borderWidth: 1}} 
                          trackStyle={{ borderRadius: 7, height: 2 }} 
                          containerStyle={{ width: deviceWidth-150,}}
                          onValuesChange={(val) => 
                              this.setState(prevState => ({
                                  profile: {
                                      ...prevState.profile,
                                      min_age: val[0], max_age: val[1]
                                  }
                              }))              
                          }
                          onValuesChangeFinish={(val) => firebaseRef.update({min_age: val[0], max_age: val[1]})}
                          />

                        </View> 

                }



              { (this.state.steps[this.state.stepIndex].input == 'preferredMaxDistance' ) && //show preferredMaxDistance step
              <View 
              style={{
                flex: 1,
                flexDirection: 'column',
                //backgroundColor: '#1C1C24',
                borderRadius: 30,
                width: deviceWidth,
                justifyContent: 'center',
                alignItems: 'center',
                margin: 0,
                }}>
                  
                <View  style={{ marginBottom: 15, flex: 1, justifyContent: 'center', alignItems: 'center' }} >
                  
                  { (this.state.profile.locationDeclined == true) &&
                    
                  <View style={{flex: 2, justifyContent: 'flex-end', alignItems: 'center'}}>
                    <Text style={{
                      marginBottom: 20,
                      textAlign: 'center', 
                      color: 'grey', 
                      fontSize: 18,
                      paddingTop: 5,
                      fontFamily:'HelveticaNeue',
                      }}>Location is required for{"\n"}making blind date reservations.</Text>
                    <Button 
                        rounded
                        opacity = {placeHolderColor}
                        style={{
                          marginBottom: 25, 
                          justifyContent: 'center', 
                          width: 300,  
                          backgroundColor: primaryColor,
                          shadowColor: "#000",
                          shadowOffset: {
                            width: 0,
                            height: 3,
                          },
                          shadowOpacity: 0.29,
                          shadowRadius: 4.65,}}
                        onPress = {() => {
                          //go to settings or ask for permission, if user hasn't declined location in the past. 
                          //this.state.profile.locationDeclined == null ? this.getLocation() : Linking.openURL('app-settings:') ;
                          
                          if (this.state.profile.locationDeclined == 'null') {
                            //alert('true');
                            this.getLocation();
                          }else if(this.state.profile.locationDeclined == true) {
                            //alert('false');
                            Linking.openURL('app-settings:')
                          }else if(this.state.profile.locationDeclined == false) {
                            alert('allowed');
                          }
                        }
                        }
                 
                        > 
                          <Text style={{color: 'white', fontFamily:'HelveticaNeue'}}>Ask for permission</Text>
                      </Button> 

                  </View>

                  }


                  <View style={{ flex: 1, flexDirection:'column', justifyContent: 'center',}}>
                      
                      <Text style={{ color: 'white', textAlign: 'center', fontSize: 25, fontFamily:'HelveticaNeue'}} >
                      Within { this.getMiles(this.state.profile.max_distance) } miles
                      </Text>
                      {/* <Text style={{ color: 'white', textAlign: 'center', fontSize: 35}}>or less.</Text> */}

                      <MultiSlider 
                        enabledTwo={false}
                        min={10}
                        max={200}
                        values={[this.getMiles(this.state.profile.max_distance)]}
                        unselectedStyle = {{backgroundColor: 'white'}} 
                        selectedStyle = {{backgroundColor: 'white'}} 
                        sliderLength={deviceWidth-150} 
                        markerStyle={{ height:30, width: 30, borderRadius: 15, backgroundColor:'white', borderColor: 'white', borderWidth: 1}} 
                        trackStyle={{ borderRadius: 7, height: 2 }} 
                        containerStyle={{ width: deviceWidth-150}}
                        onValuesChange={(val) => 
                          this.setState({profile: { ...this.state.profile, max_distance: this.getMeters(val)}}, () => {
                            this.getLocation();
                          })
                        }
                        onValuesChangeFinish={(val) => firebaseRef.update({max_distance: this.getMeters(val)})}
                      />

                  </View>



 

                    </View> 
                  </View>          
                }

          </View>

        </View>

          <View style={{ flex: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#13131A', width: deviceWidth}}>
          
          { (this.state.steps[this.state.stepIndex].input == 'preferredMaxDistance' ) && //show footer buttons 
              <View>

                <TouchableOpacity
                
                    disabled = {this.state.profile.locationDeclined == true}    
                    //check if location has been declined, before moving to next step. 
                    onPress = {() => this.getLocation(), () => {
      
                      if(this.state.profile.locationDeclined == false){
                        
                        //location is allowed
                        this.props.navigation.navigate("ManageConversationPrompts", {from: 'ManagePreferences'})

                      }else{
                        //location is declined or never prompted yet
                        this.getLocation();
                        //disable button until location is allowed
                      }
                      
                    }}>
                    {/* Apply opacity logic to the wrapper View */} 
                    <View
                    
                      style={{ 
                        justifyContent: 'center',
                        alignItems: 'center', 
                        marginBottom: 10,
                        opacity: (this.state.profile.locationDeclined == true) ? 0.25 : 1,
                        width: 300,
                        borderRadius: 40,
                        padding: 15, 
                        backgroundColor: btnColorState,
                        shadowColor: "#000",
                        shadowOffset: {
                          width: 0,
                          height: 3,
                        },
                        shadowOpacity: 0.29,
                        shadowRadius: 4.65,}}> 
                      

                        <Text style={{ color: btnTextColor, fontFamily:'HelveticaNeue'}}>Continue</Text>

                    </View>
                  </TouchableOpacity>


                {/* <Button 
                    rounded  
                    //disabled = {this.state.profile.locationDeclined}
                    //onPress = {() => this.props.navigation.navigate("ManageConversationPrompts")}
                    
                    //check if location has been declined, before moving to next step. 
                    onPress = {() => this.getLocation(), () => {
                     
                      if(this.state.profile.locationDeclined == false){
                        
                        //location is allowed
                        this.props.navigation.navigate("ManageConversationPrompts", {from: 'ManagePreferences'})

                      }else{
                        //location is declined or never prompted yet
                        this.getLocation();
                        //disable button until location is allowed
                      }
                      
                    }}
                    
                    
                    //opacity = {!this.state.profile.locationDeclined ? .1 : 0.25}
                    style={{ 
                      justifyContent: 'center', 
                      marginBottom: 10,
                      opacity: continueOpacity,
                      width: 300, 
                      backgroundColor: btnColorState,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 3,
                      },
                      shadowOpacity: 0.29,
                      shadowRadius: 4.65,}}> 
                      <Text style={{color: btnTextColor, fontFamily:'HelveticaNeue'}}>Continue</Text>
                    </Button>  */}

                    {/* <Button                      
                    transparent
                    //disabled = {!this.state.currentStepValidated}
                    onPress = {() => this.state.currentStepValidated ? alert('go to profile now') : Alert.alert("Sorry", "You'll need atleast one photo first.")}
                    //opacity = {placeHolderColor}
                    style={{                     
                      justifyContent: 'center', 
                      width: 200, }}> 
                      <Text style={{ color: 'white'}}>See Profile</Text>
                    </Button>  */}

        </View>

          }

          { (this.state.steps[this.state.stepIndex].input != 'lookingFor' && this.state.steps[this.state.stepIndex].input != 'preferredMaxDistance') && //show continue button if not on photos or lookingfor step
              
            <View  style={{
              // justifyContent: 'center',
                alignContent: 'center',
                alignItems: 'center',
              
               }}>
              <Button 
                rounded  
                disabled = {!this.state.currentStepValidated}
                onPress = {() => this.manageStep('continue')}
                opacity = {placeHolderColor}
                style={{
                  justifyContent: 'center',
                  alignItems: 'center', 
                  marginBottom: 10,
                  width: 300,
                  borderRadius: 40,
                  padding: 15, 
                  backgroundColor: btnColorState,
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 3,
                  },
                  shadowOpacity: 0.29,
                  shadowRadius: 4.65,}}> 
                  <Text style={{color: btnTextColor}}>Continue</Text>
              </Button> 

            </View>

          }


          </View>

        
      </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
        

    );
  }
}


export default ManageAboutMe;



