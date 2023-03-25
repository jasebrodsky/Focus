import React, { Component } from 'react';
import {TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Image, Alert, Dimensions, Linking, ScrollView, Platform, TextInput, StatusBar, TouchableOpacity } from 'react-native';
import RNfirebase from 'react-native-firebase';
import DatePicker from 'react-native-datepicker';
import ImagePicker from 'react-native-image-crop-picker';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Geocoder from 'react-native-geocoding';
import * as Progress from 'react-native-progress';
import Geolocation from '@react-native-community/geolocation';
import RNFetchBlob from 'react-native-fetch-blob';
import * as firebase from "firebase";
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
    //Analytics.setAnalyticsCollectionEnabled(true);

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
   userId = firebase.auth().currentUser.uid;
   firebaseRef = firebase.database().ref('/users/' + userId);

    //save data snapshot from firebaseRef
    firebaseRef.on('value', (dataSnapshot) => {
      //update sate with value from dataSnapShot. 
      this.setState({
        profile: dataSnapshot.val()
      }), this.validateCurrentStep('name'), //validate the first after state loads.

    RNfirebase.analytics().setAnalyticsCollectionEnabled(true);
    RNfirebase.analytics().setCurrentScreen('ManagePreferences', 'ManagePreferences');
    RNfirebase.analytics().setUserId(userId);
    })
  }  

  //After component mounts prompt for permission to recieve notifications and save fcmToken to database
  componentDidMount() {
    //check permissions
    this.checkPermission();
  }  

  // check if permission for notification has been granted previously, then getToken. 
  async checkPermission() {
    const enabled = await RNfirebase.messaging().hasPermission();
    if (enabled) {
        this.getToken();
    } else {
        this.requestPermission();
    }
  }

  // getToken if permission has been granted previously
  async getToken() {
    fcmToken = await RNfirebase.messaging().getToken();
    firebaseRef.update({fcmToken: fcmToken});
  }

  // if permission has not been granted, request for permission. 
  async requestPermission() {
    try {
        await RNfirebase.messaging().requestPermission();
        // User has authorised
        this.getToken();

        RNfirebase.analytics().logEvent('permissionMessageAccepted', {
          accepted: true
        });

    } catch (error) {
        // User has rejected permissions
        console.log('permission rejected');
            //record in analytics that photo was successfully swapped 
        RNfirebase.analytics().logEvent('permissionMessageAccepted', {
          accepted: false
        });
    }
  }

  //function to get update users current location. 
  getLocation = () => {

    let date = new Date();
    let offsetInMin = date.getTimezoneOffset();
  
    //save ref to current user in db. 
    firebaseRefCurrentUser = firebase.database().ref('/users/' + userId);
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

//update this function to put selected images in storage bucket, then realtime database with URI of images, then connect state to realtime db on change. 
// 1. STORE: put selected images (imagesPhone) in storage bucket
// 2. UPDATE DB: update users/images obj's URI of stored images in realtime db
// 3. REFLECT: when images in db changes, update component state

  pickImage() {
    let imagesLength = Object.keys(this.state.profile.images).length;
    console.log('images length is: '+imagesLength);

    if(imagesLength < 10){
      ImagePicker.openPicker({
        compressImageQuality: 0.6,
        multiple: false,
        forceJpg: true,
        cropping: true,
        width: 600,
        height: 800,
        showCropGuidelines: true,
        mediaType: 'photo',
        includeBase64: true,
        waitAnimationEnd: false,
        includeExif: true,
      }).then(image => {
          
            // Create a root reference to our storage bucket       
            var storageRef = firebase.storage().ref(); 

            // Create a unique key based off current timestamp
            var uniqueKey = new Date().getTime();

            // Create a reference to 'images/userid/uniqueKey.jpg' - where to save new image in storage bucket
            var imagesRef = storageRef.child('images/'+userId+'/'+uniqueKey+'.jpg');
    
            // Save copy of exisiting images into imagesObj - to manipulate, then eventually push back to database and state. 
            var imagesObj = this.state.profile.images;

            // Set up properties for image
            let imagePath = image.path;
            let Blob = RNFetchBlob.polyfill.Blob
            let fs = RNFetchBlob.fs
            const originalXMLHttpRequest = window.XMLHttpRequest;
            const originalBlob = window.Blob;
            window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest
            window.Blob = Blob
            let mime = 'image/jpg'
            let uploadUri = Platform.OS === 'ios' ? imagePath.replace('file://', '') : imagePath
                        
            // Create file metadata specific to caching.
            let newMetadata = {
              cacheControl: 'public,max-age=31536000',
              contentType: 'image/jpeg'
            }

            // Read selected image          
            fs.readFile(imagePath, 'base64')
              
            // then build blob
            .then((data) => {
                //console.log(data);
                return Blob.build(data, { type: `${mime};BASE64` })
            })
            // Then upload blob to firebase storage
            .then((blob) => {
                uploadBlob = blob;
                return imagesRef.put(blob, { contentType: mime })
              })
            
            // Then close blob and set blob back to original values (for bug with fetching later)
            .then(() => {
              uploadBlob.close();
              window.XMLHttpRequest = originalXMLHttpRequest
              window.Blob = originalBlob;

              // Update metadata properties to image reference
              imagesRef.updateMetadata(newMetadata)
            
            .catch(function(error) {
              // Uh-oh, an error occurred!
              console.log(error);
            })  

            // Record in analytics that photo was successfully uploaded and count of images user has thus far
            RNfirebase.analytics().logEvent('photoUploaded', {
              imageCount: Object.keys(this.state.profile.images).length
            });

            // Finally return the URL of saved image - to use in database and state. 
              return imagesRef.getDownloadURL()
            })               
            
            // Then update all image references for user in multi-path update
            .then((url) => {

              //if first image in state is the default image, then delete that default image from the images object. then continue and add the new image to the object. 
              if (imagesObj[0].url ==  "https://focusdating.co/images/user.jpg" ){
                imagesObj.splice(0,1);
              }
              
              // push new image object into imagesObj 
              imagesObj.push({url: url, file: uniqueKey, cache: 'force-cache'});

              //call updateData function with new URI's to pass in multi-path update
              this.updateData('images', userId, imagesObj );
            
            })
            .catch(console.error);                  
        } 
      ).catch(e => console.log(e));
    }else{

      Alert.alert('Sorry','Please delete a photo first');
    }

  }

  //funtion to scale height of image
  scaledHeight(oldW, oldH, newW) {
    return (oldH / oldW) * newW;
  }

  //function to renderImage into markup
  renderImage(image, key) {

    //hide default image if user only has the default image Otherise breaks UI. Should fix in data flow to have accurate images in state/db. 
    let displayImages =  this.state.profile.images['0'].url == 'https://focusdating.co/images/user.jpg' ? 'none' : 'flex'

    // console.log('image is: '+JSON.stringify(image));
    return <TouchableOpacity style = {{display: displayImages}} onPress={()=> ActionSheet.show
                      (
                        {
                          options: PHOTO_OPTIONS,
                          cancelButtonIndex: 3,
                          destructiveButtonIndex: 3,
                          title: 'Photo'
                        },
                        (buttonIndex) => {
                          if ((buttonIndex) === 0) {
                              //view image 
                              this.setState({
                                //set image viewer visibility on
                                imageViewerVisible: true,
                                // save to state the selected image to view 
                                selectedImage: [{url: image.url, cache: 'force-cache'}]  
                              })
                            }

                          if ((buttonIndex) === 1) { //make main image 

                            //save original state of images array
                            var arrayImages = [...this.state.profile.images];
                            
                            // save selected image to new variable to re-insert into images later
                            let main_image = arrayImages[key];
                            //console.log('profile images are first: '+JSON.stringify(arrayImages));

                            //save the index of image to remove
                            var index = arrayImages.indexOf(key)
                            
                            //remove image at index
                            arrayImages.splice(key, 1);

                            //insert new main image into first position of profile images
                            arrayImages.unshift(main_image);

                            //set state to new image array
                            this.setState({profile: { ...this.state.profile, images: arrayImages}},
                              
                              //in callback (after state is set), use multi-path update with new array of images from state. 
                              () => this.updateData('images', userId, this.state.profile.images )
                              
                            ); 
                            
                            //record in analytics that photo was successfully swapped 
                            RNfirebase.analytics().logEvent('newMainPhoto', {
                              testParam: 'testParam'
                            });
                          }

                          if ((buttonIndex) === 2) { //delete image

                            //if only one photo exists, disable deleting, else allow user to delete image. 
                            if(this.state.profile.images.length == 1){
                              Alert.alert('Sorry','Can not delete only photo');

                            }else{ //remove image

                              //save copy of profile images from state
                              var profile_images = this.state.profile.images;                                                   
 
                              // Create a root reference to our storage bucket
                              var storageRef = firebase.storage().ref(); 

                              //derive which image to delete via the key property on the image object
                              var image_delete = profile_images[key];

                              // Create a reference to 'images/userid/i.jpg'
                              var imagesRef = storageRef.child('images/'+userId+'/'+image_delete.file+'.jpg');

                              // Delete the file
                              imagesRef.delete().then(function() {
                                // File deleted successfully
                                console.log('deleted successfully');
                              }).catch(function(error) {
                                // Uh-oh, an error occurred!
                                console.log('deleted NOT successfully, error is: '+JSON.stringify(error));
                              });
                                 
                              //save original state of images array
                              var arrayImages = [...this.state.profile.images];
                              
                              //save the index of image to remove
                              var index = arrayImages.indexOf(key)
                              
                              //remove image at index
                              arrayImages.splice(key, 1);
                              
                              //set state to new image array
                              this.setState({profile: { ...this.state.profile, images: arrayImages}},
                              
                                //in callback (after state is set), use multi-path update with new array of images from state. 
                                () => this.updateData('images', userId, this.state.profile.images )
                                
                              ); 

                              //record in analytics that photo was deleted successfully 
                              RNfirebase.analytics().logEvent('photoDeleted', {
                                testParam: 'testParamValue1'
                              });

                            }
                          }
                        }
                      )
                    } >
              <Image 
                style={{
                  width: 90, 
                  height: 90,
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 3,
                  },
                  shadowOpacity: 0.29,
                  shadowRadius: 4.65,
                  
                  }} 
                source={image} />
          </TouchableOpacity>
  }

  //function to render image or video
  renderAsset(image, key) {
    if (image.mime && image.mime.toLowerCase().indexOf('video/') !== -1) {
      return this.renderVideo(image);
    }

    return this.renderImage(image, key);
  }

  //generate the preferred age range of user based off users age
  preferredAgeRange = (birthday) => {
  
    let firebaseRef = firebase.database().ref('/users/' + userId);
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

  //function to update name or images or reviews
  updateData = (type, userid, payload) => {

    //record in analytics the event that a profile was updated successfully 
    RNfirebase.analytics().logEvent('profileUpdated', {
      type: payload
    });
                              
    //create ref to list of coversations for userid
    const userConversations = firebase.database().ref('users/'+userid+'/conversations/');

    //create ref to list of matches for userid
    const userMatches = firebase.database().ref('matches/'+userid+'/');

    //save ref for reviews current user created
    const userReviews = firebase.database().ref('codes').orderByChild("created_by").equalTo(userId);

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
          firebase.database().ref('matches/'+friend.created_for+'/').once('value').then(friendMatchesSnap => {
          
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
             firebase.database().ref().update(updateObj2, function(error) {
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
                updateObj[`matches/3nQajya619ZEVl55TVTAduw2hNv2/6CSGJ2ak39hVkzQYRuPEuO00B932/reviews/-LypRQkDfCOb7jntXIrX/name`] = payload;
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
          case 'status':
            updateObj[`users/${userid}/status`] = payload;
            break;
        }
      }).then(function(){
          //console.log('updateObj outside .then function: '+JSON.stringify(updateObj));
          
          //return statement with updating all the paths that need to be updated

          console.log(updateObj);
          //return firebase.database().ref().update(updateObj);

          firebase.database().ref().update(updateObj, function(error) {
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


  _renderPlacedholderImages = () => {

    //let placeholderImagesNeeded = this.state.profile.images['0'].url == "https://focusdating.co/images/user.jpg" ? 6 : 5
      
    
    if (true) {

        //calculate if first iamge is default image, if so we'll need 6 additional placeholder iamges, if not we'll need 5. 
        let placeholderImagesNeeded = this.state.profile.images['0'].url == "https://focusdating.co/images/user.jpg" ? 10 : 9

        //calculate images to render based off how many real images are uploaded to state. 
        let placeholderImagesToRender = placeholderImagesNeeded - this.state.profile.images.length;
        
        //array to keep markup for placeholder iamges
        let placeholderImages = [];

        //iterate all placeholder images and add to array. 
        for (let i = 0; i < placeholderImagesToRender; i++) {
          placeholderImages[i] = (
            <Button 
              key={placeholderImages[i]}
              onPress={this.pickImage.bind(this, () => {
                this.validateCurrentStep()
                })  
              }                    
              style={{  
                borderWidth: 0.6, 
                backgroundColor: 'white', 
                borderColor: '#d6d7da', 
                width: 90, 
                height: 90, 
                justifyContent: 'center',
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65, }}>
              <FontAwesomeIcon size={ 40 } style={{ color: 'lightgrey'}} icon={ faCamera } />
            </Button>);
        }

        //retrun array of placeholder imgages to embed into markup. 
        return placeholderImages; 
    }
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

              RNfirebase.analytics().logEvent(step+'Saved', {
                data: this.state.profile.step
              });
  
              //update with db with new data from current step
                switch (step) {  
                 case 'lookingFor': //when lookingFor step is selected
                     RNfirebase.analytics().setUserProperty('genderPref', this.state.profile.gender_pref);                       
                     break;
                 case 'preferredAge': //when preferredAge step is selected // CAN'T SEEM TO RESOLVE THE MIN/MAX AGE FROM STATE???
                     //RNfirebase.analytics().setUserProperty('preferredMaxAge', this.state.profile.min_age);                       
                     //RNfirebase.analytics().setUserProperty('preferredMinAge', this.state.profile.min_age);                       
                     

                     break;
                 case 'preferredMaxDistance'://when preferredMaxDistance step is selected
                      // RNfirebase.analytics().setUserProperty('preferredMaxDistance', this.state.profile.max_distance);  
                      
                      // this.setState({profile: { ...this.state.profile, max_distance: this.getMeters(this.state.profile.max_distance)}})
                      
                      // this.getLocation();
                      alert('ask for location');
                      
                      break;
                 } 
              
                // update stepIndex to the next one.
                this.setState({stepIndex: currentStepIndex+1, aboutMeRows: 16}, () => {
                  this.validateCurrentStep();
                  
                  // Record in analytics that photo was successfully uploaded and count of images user has thus far
                  // RNfirebase.analytics().logEvent('photoUploaded', {
                  //   imageCount: Object.keys(this.state.profile.images).length
                  // });
                  
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
                  <FontAwesomeIcon size={ 28 } style={{ color: 'white'}} icon={ faChevronLeft } />
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
              
            
              <Button 
                rounded  
                disabled = {!this.state.currentStepValidated}
                onPress = {() => this.manageStep('continue')}
                opacity = {placeHolderColor}
                style={{
                  marginBottom: 40, 
                  justifyContent: 'center', 
                  width: 300,  
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
          }


          </View>

        
      </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
        

    );
  }
}


export default ManageAboutMe;



