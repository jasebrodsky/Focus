import React, { Component } from 'react';
import {TouchableWithoutFeedback, Keyboard, StatusBar, KeyboardAvoidingView, Image, Alert, Dimensions, Modal, ScrollView, Platform, TextInput, TouchableOpacity, Switch } from 'react-native';
import { utils } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import analytics from '@react-native-firebase/analytics';
import auth from '@react-native-firebase/auth';
import DatePicker from 'react-native-datepicker';
import ImageViewer from 'react-native-image-zoom-viewer';
import ImagePicker from 'react-native-image-crop-picker';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Geocoder from 'react-native-geocoding';
import * as Progress from 'react-native-progress';
import Geolocation from '@react-native-community/geolocation';
import ActionSheet from 'react-native-actionsheet';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faCamera } from '@fortawesome/free-solid-svg-icons';

import {
  // ActionSheet,
  Container,
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
  'Nonbinary',
  'Cancel',
];

var DESTRUCTIVE_INDEX = 3;
var CANCEL_INDEX = 3;

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
      stepIndex: this.props.navigation.getParam("step"),
      currentStepValidated: false,
      profile: {
        about: '',
        images: [{0:{url:'https://focusdating.co/images/user.jpg'}}],
        first_name: null,
        last_name: null,
        latitude: null,
        longitude: null,
        gender: 'Select',
        genderOnProfile: true,
        birthday: '',
        notifications_message: true,
        notifications_match: true,
        work: '',
      },
      steps: [
        {
          progress: 0.08,
          title: 'My first name is',
          subtitle: 'Hello?',
          back: false,
          input: 'name',
          required: true,
        },
        // {
        //   progress: 0.16,
        //   title: 'My last name is',
        //   subtitle: 'Hello?',
        //   back: true,
        //   input: 'last_name',
        //   required: true,
        // },
        {
          progress: 0.25,
          title: 'I identify as',
          subtitle: 'Seat up or seat down?',
          back: true,
          input: 'gender',
          required: true
        },
        {
          progress: 0.49,
          title: 'My birthday is',
          subtitle: 'When did you make your debut into this world?',
          back: true,
          input: 'birthday',
          required: true
        },
        {
          progress: 0.65,
          title: 'My job is',
          subtitle: 'How are the bills paid?',
          back: true,
          input: 'work',
          required: true
        },
        {
          progress: 0.81,
          title: 'My school is',
          subtitle: 'Street smarts or book smarts?',
          back: true,
          input: 'school',
          required: false
        },
        // {
        //   progress: 0.84,
        //   title: 'Something about me',
        //   subtitle: 'I am unique because?',
        //   back: true,
        //   input: 'about',
        //   required: false
        // },
        {
          progress: 100,
          title: 'My photos are',
          subtitle: 'Love the smile?',
          back: true,
          input: 'photos',
          required: true
        }
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
    
    //run analytics
    analytics().logScreenView({
      screen_name: 'ManageAboutMe',
      screen_class: 'ManageAboutMe'
    });
    analytics().setUserId(userId)


    //update stepIndex to value passed from nav. 
    this.setState({
      stepIndex: this.props.navigation.getParam("step")
    })

   console.log('userId is: '+userId);
   console.log('firebaseRef is: '+firebaseRef);

    //save data snapshot from firebaseRef
    firebaseRef.on('value', (dataSnapshot) => {

      console.log('dataSnapshot is: '+JSON.stringify(dataSnapshot));
      
      //update sate with value from dataSnapShot. 
      this.setState({
        profile: dataSnapshot.val()
      }), 
      
      this.validateCurrentStep('name'); //validate the first after state loads.
      console.log('this.state is: '+JSON.stringify(this.state));

    })
  }  

  //After component mounts prompt for permission to recieve notifications and save fcmToken to database
  componentDidMount() {
    //check permissions
    this.checkPermission();

    // Assign references to the ActionSheet components
    this.genderIdentityActionSheetRef = this.refs.genderIdentityActionSheet;
    this.imageManagementActionSheetRef = this.refs.imageManagementActionSheet;
  }  

  // check if permission for notification has been granted previously, then getToken. 
  async checkPermission() {
    const enabled = await messaging().requestPermission();
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
        await messaging().requestPermission();
        // User has authorised
        this.getToken();
    } catch (error) {
        // User has rejected permissions
        console.log('permission rejected');
    }
  }

  //function to get update users current location. 
  getLocation = () => {

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
  
                //update firebase
                firebaseRefCurrentUser.update({city_state: city_state, latitude: position.coords.latitude, longitude: position.coords.longitude});
              })
        .catch(error => console.warn(error));
      },
      error => console.log(error.message),
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

pickImage = () => {
  const imagesLength = this.state.profile.images.length;
  console.log('user picked images');
  console.log('images length is: ' + imagesLength);

  if (imagesLength < 7) {
    console.log('under 7 images');
    ImagePicker.openPicker({
      compressImageQuality: 0.5,
      // cropperChooseColor: primaryColor,
      // cropperCancelColor: primaryColor,
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
    })
      .then((image) => {
        // Create a unique key based on the current timestamp
        const uniqueKey = new Date().getTime();
        const path = 'images/' + userId + '/' + uniqueKey + '.jpg';
        const imagesRef = storage().ref(path);

        // Save a copy of existing images into imagesObj to manipulate and eventually update in the database and state
        const imagesObj = [...this.state.profile.images];

        // Set up properties for the image
        const imagePath = image.path;
        const uploadUri = Platform.OS === 'ios' ? imagePath.replace('file://', '') : imagePath;

        // Upload the file
        imagesRef
          .putFile(uploadUri)
          .then(() => {
            // Get the download URL of the uploaded image
            imagesRef
              .getDownloadURL()
              .then((url) => {
                // If the first image in state is the default image, remove it from the imagesObj
                if (imagesObj[0].url === 'https://focusdating.co/images/user.jpg') {
                  imagesObj.splice(0, 1);
                }
                // Push the new image object into imagesObj
                imagesObj.push({ url: url, file: uniqueKey, cache: 'force-cache', type: 'image' });

                // Call the updateData function with the new URIs to perform a multi-path update
                this.updateData('images', userId, imagesObj);

                // Record in analytics that the photo was successfully uploaded and the count of images the user has so far
                analytics().logEvent('photoUploaded', {
                  imageCount: imagesObj.length,
                });
              })
              .catch((error) => {
                console.log('Error getting download URL of the image:', error);
              });
          })
          .catch((error) => {
            console.error('Error uploading file:', error);
            // Handle the error
          });

      })
      .catch((error) => {
        console.log('Error picking image:', error);
      });
  } else {
    Alert.alert('Sorry', 'Please delete a photo first');
  }
};


  //funtion to scale height of image
  scaledHeight(oldW, oldH, newW) {
    return (oldH / oldW) * newW;
  }

  //function to renderImage into markup
  renderImage(image, key) {

    //hide default image if user only has the default image Otherise breaks UI. Should fix in data flow to have accurate images in state/db. 
    let displayImages =  this.state.profile.images['0'].url == 'https://focusdating.co/images/user.jpg' ? 'none' : 'flex'


    return <TouchableOpacity style = {{display: displayImages}} 
      
    //showManageImagesActionSheet
    //save selected image into state
    //new methods to handle each button in actionSheet accessing the selected image in state. 
    
    onPress={() => {
      this.setState({
          // save to state the selected image for use by user later 
          selectedImage: [{ key: key, url: image.url, cache: 'force-cache' }],
        }, //then open the image action sheet
        () => {
          this.showImageManagementActionSheet();
        }
      );
    }}

    //     //show showManageImagesActionSheet
    //     this.showImageManagementActionSheet;
            
    // }}  
    // onPress={
    //   //this.showImageManagementActionSheet(image)
    //   // this.setState({
    //   //   // save to state the selected image for use by user later 
    //   //     selectedImage: [{url: image.url, cache: 'force-cache'}]  
    //   //  })
    // }
    
    
    
    // onPress={(image)=> ActionSheet.show
    //                   (
    //                     {
    //                       options: PHOTO_OPTIONS,
    //                       cancelButtonIndex: 3,
    //                       destructiveButtonIndex: 3,
    //                       title: 'Photo'
    //                     },
    //                     (buttonIndex) => {
    //                       if ((buttonIndex) === 0) {
    //                           //view image 
    //                           this.setState({
    //                             //set image viewer visibility on
    //                             imageViewerVisible: true,
    //                             // save to state the selected image to view 
    //                             selectedImage: [{url: image.url, cache: 'force-cache'}]  
    //                           })
    //                         }

    //                       if ((buttonIndex) === 1) { //make main image 

    //                         //save original state of images array
    //                         var arrayImages = [...this.state.profile.images];
                            
    //                         // save selected image to new variable to re-insert into images later
    //                         let main_image = arrayImages[key];
    //                         //console.log('profile images are first: '+JSON.stringify(arrayImages));

    //                         //save the index of image to remove
    //                         var index = arrayImages.indexOf(key)
                            
    //                         //remove image at index
    //                         arrayImages.splice(key, 1);

    //                         //insert new main image into first position of profile images
    //                         arrayImages.unshift(main_image);

    //                         //set state to new image array
    //                         this.setState({profile: { ...this.state.profile, images: arrayImages}},
                              
    //                           //in callback (after state is set), use multi-path update with new array of images from state. 
    //                           () => this.updateData('images', userId, this.state.profile.images )
                              
    //                         ); 
                            
    //                         //record in analytics that photo was successfully swapped 
    //                         // analytics().logEvent('newMainPhoto', {
    //                         //   testParam: 'testParam'
    //                         // });
    //                       }

    //                       if ((buttonIndex) === 2) { //delete image

    //                         //if only one photo exists, disable deleting, else allow user to delete image. 
    //                         if(this.state.profile.images.length == 1){
    //                           Alert.alert('Sorry','Can not delete only photo');

    //                         }else{ //remove image

    //                           //save copy of profile images from state
    //                           var profile_images = this.state.profile.images;                                                   
 
    //                           // Create a root reference to our storage bucket
    //                           var storageRef = storage().ref(); 

    //                           //derive which image to delete via the key property on the image object
    //                           var image_delete = profile_images[key];

    //                           // Create a reference to 'images/userid/i.jpg'
    //                           var imagesRef = storageRef.child('images/'+userId+'/'+image_delete.file+'.jpg');

    //                           // Delete the file
    //                           imagesRef.delete().then(function() {
    //                             // File deleted successfully
    //                             console.log('deleted successfully');
    //                           }).catch(function(error) {
    //                             // Uh-oh, an error occurred!
    //                             console.log('deleted NOT successfully, error is: '+JSON.stringify(error));
    //                           });
                                 
    //                           //save original state of images array
    //                           var arrayImages = [...this.state.profile.images];
                              
    //                           //save the index of image to remove
    //                           var index = arrayImages.indexOf(key)
                              
    //                           //remove image at index
    //                           arrayImages.splice(key, 1);
                              
    //                           //set state to new image array
    //                           this.setState({profile: { ...this.state.profile, images: arrayImages}},
                              
    //                             //in callback (after state is set), use multi-path update with new array of images from state. 
    //                             () => this.updateData('images', userId, this.state.profile.images )
                                
    //                           ); 

    //                           //record in analytics that photo was deleted successfully 
    //                           // analytics().logEvent('photoDeleted', {
    //                           //   testParam: 'testParamValue1'
    //                           // });

    //                         }
    //                       }
    //                     }
    //                   )
    //                 } 
    >
              <Image 
               style={{  
                //borderWidth: 0.6, 
                //backgroundColor: 'white', 
                //borderColor: '#d6d7da', 
                //margin: 5,
                marginBottom: 3,
                borderRadius: 4,
                width: 90, 
                height: 130, 
                justifyContent: 'center',
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65, }}
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

          //update associated reviews, only if the review has been linked with a friend first. . 
          if (friend.created_for){

            //save path to update the reviews object of each friend the current user reviewed. 
            switch (type) {
              case 'images':
                // updateObj[`users/${friend.created_for}/reviews/${friendKey}/photo`] = payload[0].url; 
                // updateObj[`codes/${friendKey}/photo_creator`] = payload[0].url;         
                updateObj2['users/'+friend.created_for+'/reviews/'+friendKey+'/photo'] = payload[0].url;
                updateObj2[`codes/${friendKey}/photo_creator`] = payload[0].url;
                break;
              case 'name':
                console.log('name is changed now update appropriate reviews');
                console.log('put this friend.created_for into updateObj1 now: '+JSON.stringify(friend.created_for));
                //updateObj[`users/${friend.created_for}/reviews/${friendKey}/name`] = payload;
                //updateObj[`codes/${friendKey}/name_creator`] = payload;
                updateObj2['users/'+friend.created_for+'/reviews/'+friendKey+'/name'] = payload;
                updateObj2[`codes/${friendKey}/name_creator`] = payload;
                console.log('LOOK updateObj2 is now: '+JSON.stringify(updateObj2));
                break;
              }               

            //query firebase for each users matches. 'friend.userid'
            database().ref('matches/'+friend.created_for+'/').once('value').then(friendMatchesSnap => {
            
              //convert friend objects into array of friend id's, so that can loop over them. . 
              let friendsMatches = Object.keys(friendMatchesSnap.val());

              //for each of my friends matches, update their match object with my updated name or images
              friendsMatches.forEach((my_friends_match, i) => {

                console.log('payload is: '+JSON.stringify(payload));
                
                console.log('friend @'+i+': '+JSON.stringify(friend));
                

                //save path to update
                switch (type) {
                  case 'images':
                    updateObj2[`matches/${my_friends_match}/`+friend.created_for+`/reviews/`+friendKey+`/photo`] = payload[0].url;
                    break;
                  case 'name':
                    updateObj2[`matches/${my_friends_match}/`+friend.created_for+`/reviews/`+friendKey+`/name`] = payload;
                    break;
                  }             
              });

              //update all paths in multi-path update on udateObj2 array.
              database().ref().update(updateObj2, function(error) {

                console.log('LOOK HERE updateObj2 is: '+JSON.stringify(updateObj2));
                if (error) {
                  // The write failed...
                  console.log('write failed updateObj2')
                } else {
                  // Data saved successfully!
                  console.log('Data saved successfully updateObj2')
                }
            })
          })
        }
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
                //updateObj[`matches/3nQajya619ZEVl55TVTAduw2hNv2/6CSGJ2ak39hVkzQYRuPEuO00B932/reviews/-LypRQkDfCOb7jntXIrX/name`] = payload;
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
          case 'last_name':
            updateObj[`users/${userid}/last_name`] = payload;
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

          //console.log(updateObj);
          //return firebase.database().ref().update(updateObj);

          console.log('LOOK HERE updateObj1 is: '+JSON.stringify(updateObj));

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
  
  //handle updating gender on profile question
  _toggleSwitch = (value) => {
    
    //update firebease with genderOnProfile: value
    firebaseRef.update({genderOnProfile: value});

    // Record in analytics that photo was successfully uploaded and count of images user has thus far
    analytics().logEvent('genderShowProfile', {
      value: value
    });

  }


  _renderPlacedholderImages = () => {

    //let placeholderImagesNeeded = this.state.profile.images['0'].url == "https://focusdating.co/images/user.jpg" ? 6 : 5
      
    
    if (true) {

        //calculate if first iamge is default image, if so we'll need 6 additional placeholder iamges, if not we'll need 5. 
        //let placeholderImagesNeeded = this.state.profile.images['0'].url == "https://focusdating.co/images/user.jpg" ? 10 : 9
        let placeholderImagesNeeded = this.state.profile.images['0'].url == "https://focusdating.co/images/user.jpg" ? 7 : 6


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
                //borderWidth: 0.6, 
                backgroundColor: 'black', 
                //borderColor: 'black', 
                margin: 5,
                borderStyle: 'dashed',
                borderRadius: 10,
                borderWidth: 2,
                borderColor: 'lightgrey',
                width: 90, 
                height: 130, 
                justifyContent: 'center',
                // shadowColor: "#000",
                // shadowOffset: {
                //   width: 0,
                //   height: 3,
                // },
                // shadowOpacity: 0.29,
                // shadowRadius: 4.65, 
              }}>
              <FontAwesomeIcon size={ 40 } style={{ color: 'lightgrey'}} icon={ faCamera } />
            </Button>);
        }

        //retrun array of placeholder imgages to embed into markup. 
        return placeholderImages; 
    }
  }


      //function to validate current step and update state with result
      validateCurrentStep = () => {

        //save current steps name into variable
        let step = this.state.steps[this.state.stepIndex].input;
        //save state of fields that needs to be validated.
        let first_nameValidated = this.state.profile.first_name !== '';
        let last_nameValidated = this.state.profile.last_name !== '';
        let genderValidated = this.state.profile.gender !== 'Select' ;
        let birthdayValidated = this.state.profile.birthday !== '';
        let workValidated = this.state.profile.work !== '';
        let educationValidated = this.state.profile.education !== '';
        let aboutValidated = this.state.profile.about !== '';
        let interestedValidated = this.state.profile.interested !== 'Select';
        //valide if photo step is validated by checking if first imaage is the default image, if not images must be validated. 
        let photosValidated = this.state.profile.images['0'].url !== "https://focusdating.co/images/user.jpg";
        
        //save styling button to be disabled or not. 
        let btnColorState = this.state.currentStepValidated  ? btnColor : btnColor; 

        switch(step) {
          case 'name':
            //check if name has a value in it, if so, update currentStepValidated to true
            this.setState({ currentStepValidated: first_nameValidated })
          break;
          case 'last_name':
            //check if name has a value in it, if so, update currentStepValidated to true
            this.setState({ currentStepValidated: last_nameValidated })
          break;
          case 'gender':
            //check if gender has a value in it, if so, update currentStepValidated to true
            this.setState({ currentStepValidated: genderValidated })
            break;
          case 'birthday':
            //check if birthday has a value in it, if so, update currentStepValidated to true            
              this.setState({ currentStepValidated: birthdayValidated })
              break;
          case 'work':
             //check if work has a value in it, if so, update currentStepValidated to true
             this.setState({ currentStepValidated: workValidated })
              break;          
          case 'school':
             //check if school has a value in it, if so, update currentStepValidated to true
             this.setState({ currentStepValidated: educationValidated })
              break;
          case 'about':
             //check if about has a value in it, if so, update currentStepValidated to true
             this.setState({ currentStepValidated: aboutValidated })
              break;
          case 'lookingFor':
            //check if lookingFor has a value in it, if so, update currentStepValidated to true
            this.setState({ currentStepValidated: interestedValidated })
              break;
          case 'preferredAge':
            // always true since they're defaulted when profile is created
            this.setState({ currentStepValidated: true }) 
              break;   
          case 'preferredMaxDistance': 
            // always true since they're defaulted when profile is created. 
             this.setState({ currentStepValidated: true }); 
            break;   
          case 'photos':
              // code block
              this.setState({ currentStepValidated: photosValidated }); 
            break;   
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
              //let valueStep = this.state.profile.step; 

              analytics().logEvent(step+'Saved', {
                data: this.state.profile.step
              });

              //update with db with new data from current step
                switch (step) {         
                 case 'name': //when name step is selected
                     this.updateData('name', userId, this.state.profile.first_name); 
                      analytics().setUserProperty('name', this.state.profile.first_name);           
                     break;
                 case 'last_name': //when name step is selected
                     this.updateData('last_name', userId, this.state.profile.last_name); 
                      analytics().setUserProperty('name', this.state.profile.first_name);           
                     break;
                 case 'work': //when work step is selected
                     this.updateData('work', userId, this.state.profile.work);
                      analytics().setUserProperty('work', this.state.profile.work);           
                     break;
                 case 'school'://when school step is selected
                      this.updateData('education', userId, this.state.profile.education);
                      analytics().setUserProperty('education', this.state.profile.education);           
                      break;
                 case 'gender'://when gender step is selected
                     this.updateData('gender', userId, this.state.profile.gender);
                      analytics().setUserProperty('gender', this.state.profile.gender);           
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

      //show gender action sheet
      showGenderIdentityActionSheet = () => {
        this.genderIdentityActionSheetRef.show();
      };
    
      //show imageManagement action sheet
      showImageManagementActionSheet = () => {
        this.imageManagementActionSheetRef.show();
      };

      //delete specific image
      deleteImage = () => {

          //if only one photo exists, disable deleting, else allow user to delete image. 
          if(this.state.profile.images.length == 1){
            Alert.alert('Sorry','Can not delete only photo');

          }else{ //remove image

            //save copy of profile images from state
            var profileImagesCopy = [...this.state.profile.images];

            // get the selected image key
            var selectedImageKey = this.state.selectedImage[0].key;
            
            // Create reference to image to delete in storage bucket
            var path = 'images/' + userId + '/' + profileImagesCopy[selectedImageKey].file + '.jpg';
            var imagesRef = storage().ref(path);

            // remove the image from the profile images array
            profileImagesCopy.splice(selectedImageKey, 1);

            // Delete the file
            imagesRef
              .delete()
              .then(() => {
                // File deleted successfully
                console.log('Deleted successfully');

                  // if delete successful, set state to new image array
                  this.setState(
                    {
                      profile: { ...this.state.profile, images: profileImagesCopy },
                    },
                    () => {
                      // in callback (after state is set), use multi-path update with new array of images from state.
                      this.updateData('images', userId, profileImagesCopy);
                    }
                  );

                //record in analytics that photo was deleted successfully 
                analytics().logEvent('photoDeleted', {
                  testParam: 'testParamValue1'
                });

              })
              .catch((error) => {
                // Uh-oh, an error occurred!
                console.log('Deletion failed, error is:', error);
              });

          }
      };


      // Make specific image the main image
      makeMainImage = () => {
        // Save the selected image key
        const selectedImageKey = this.state.selectedImage[0].key;

        // Save a copy of the profile images from state
        const profileImagesCopy = [...this.state.profile.images];

        // Retrieve the selected image object
        const selectedImage = profileImagesCopy[selectedImageKey];

        // Remove the selected image from the array
        profileImagesCopy.splice(selectedImageKey, 1);

        // Insert the selected image at the beginning of the array
        profileImagesCopy.unshift(selectedImage);

        // Set the state with the updated image array
        this.setState(
          {
            profile: {
              ...this.state.profile,
              images: profileImagesCopy,
            },
          },
          () => {
            // After the state is set, perform a multi-path update with the new array of images
            this.updateData('images', userId, profileImagesCopy);

            //record in analytics that photo was successfully swapped 
            analytics().logEvent('newMainPhoto', {
              testParam: 'testParam'
            });
          }
        );
      };


  render() {

    //btnColor is purple if first_name is completed, else it's grey. 
    let btnColorState = this.state.currentStepValidated  ? 'white' : 'grey'; 
    let placeHolderColor = this.state.currentStepValidated ? 1 : 0.25;
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
    // let profileImages = this.state.profile.images.map(image => ({ url: image.url }));

    return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} >
      
      <LinearGradient 
      style={{
          flex: 3,
          alignItems: 'center',
          justifyContent: 'center',
          //backgroundColor: primaryColor,
      }}
      colors={[primaryColor, primaryColor]}
      start={{ x: 0, y: 0.1 }}
      end={{ x: 0.1, y: 1 }}
        >
        <StatusBar 
          hidden={'hidden'} 
          barStyle={'dark-content'} 
          animated={true}
        />


      <Modal 
          visible={this.state.imageViewerVisible} 
          transparent={true}
          animationType="slide">
            <ImageViewer 
              backgroundColor={'#13131A'}
              renderHeader={() => null}
              renderIndicator = {() => null}
              imageUrls={this.state.selectedImage}
              onSwipeDown = {() => this.setState({ imageViewerVisible: false})}
              onClick = {() => this.setState({ imageViewerVisible: false})}
            />
        </Modal>


        

          <View style={{
            flex: 1,
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
                }}>
                <Button 
                  onPress = {() => this.manageStep('skip')} 
                  transparent
                  style={{
                    // justifyContent: 'center', 
                    // flex: 1, 
                    marginRight: 5,
                    }} >
                  <Text style={{color: 'white'}} >Skip</Text>
                </Button>
              </View>

            
            </View>
          </View>

          <DatePicker
            style={{width: 200}}
            date={(this.state.profile.birthday == '') ? false : this.state.profile.birthday }
            mode="date"
            display="spinner"
            placeholder="Select a date"
            format="MM/DD/YYYY"
            minDate="01-01-1940"
            maxDate={date}
            confirmBtnText="Confirm"
            cancelBtnText="Cancel"
            ref={(picker) => { this.datePicker = picker; }}
            customStyles={{
              dateIcon: {
                position: 'absolute',
                left: 0,
                top: 4,
                marginLeft: 0,
                width: 0
              },
              dateInput: {
                marginLeft: 0,
                height: 0,
                display: 'none',
              },
              dateTouchBody: {
                width: 0,
                height: 0,
              },
              dateText: {
                width: 0
              }, 
              datePicker: {
                backgroundColor: '#d1d3d8',
                justifyContent:'center'
              }
            }}
            onDateChange={(date) => firebaseRef.update({birthday: date, birthdayTimeStamp: new Date(date).getTime() })
            .then(this.setState({profile: { ...this.state.profile, birthday: date }}, () => {
                this.validateCurrentStep(), this.preferredAgeRange(date)
                }
              )
            )
            .then(this.updateData('birthday', userId, date))
          
            
          }

          />

    
        <View 
          style={{ 
            flex: 1, 
            //width: 400,
            justifyContent: 'center',
            marginBottom: 50,
            minHeight: 10,
            //backgroundColor: primaryColor,
               }} >

          <View style={{
                flex: 2, 
                flexDirection: 'column',
                justifyContent: 'center',
                alignSelf: 'flex-start',  
                //backgroundColor: '#1C1C24',
                borderRadius: 30,
                paddingTop: 20,
                marginBottom: 0
             }} >
              {/* <Text style={{ 
                color: 'white', 
                fontSize: 40,
                fontWeight: '700', 
                fontFamily:'HelveticaNeue',
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65,}} >My name is
              </Text> */}
          
              <Text style={{ 
                color: 'white',
                textAlign: 'left', 
                fontSize: 32,
                fontWeight: '900', 
                fontFamily:'HelveticaNeue',
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65
              }}>
                {this.state.steps[this.state.stepIndex].title}
              </Text>
              <View>
              
              <ActionSheet
                ref="genderIdentityActionSheet"
                title={'Gender Identity'}
                options={['Male', 'Female', 'Nonbinary', 'Cancel']}
                cancelButtonIndex={3}
                destructiveButtonIndex={3}
                onPress={buttonIndex => {
                  // Handle gender identity selection
                  // based on the index
                    Keyboard.dismiss();
                    if ((buttonIndex) === 3) {
                          console.log(GENDER_OPTIONS[buttonIndex]);
                    } else {
                      this.setState({
                        profile: { ...this.state.profile, gender: GENDER_OPTIONS[buttonIndex]}
                    }, () => {
                        this.updateGenderOrInterested('gender');
                        this.updateData('gender', userId, GENDER_OPTIONS[buttonIndex]);
                        this.setState({ forceUpdate: true}); //force update set to true, so that swipes will update if settings are changes and new matches need to be reflected. 
                    })                   
                }
                }}
              />

              <ActionSheet
                ref="imageManagementActionSheet"
                title={'Photo'}
                options={['View Photo', 'Make Main Photo', 'Remove Photo', 'Cancel']}
                cancelButtonIndex={3}
                destructiveButtonIndex={3}
                onPress={buttonIndex => {
                  // Handle image management actions
                  // based on the index
                  if ((buttonIndex) === 0) {
                    
                      //view image 
                      this.setState({
                        //set image viewer visibility on
                        imageViewerVisible: true,
                      })
                    }

                  if ((buttonIndex) === 1) { //make main image 
                    this.makeMainImage();
                  }

                  if ((buttonIndex) === 2) { //delete image
                    this.deleteImage();

                    }
                  }

                }
              />
            </View>
          </View>
        </View>
        
         <KeyboardAvoidingView 
           behavior="padding"
           enabled
           style={{
             flex: 5,
             //paddingTop: 30,
             flexDirection: "column", 
             //justifyContent: "center",
             alignItems: "center"
           }}>

          <View style={{ flex: 4, backgroundColor: '#13131A', width: deviceWidth, alignItems: 'center', padding: 50 }}>
          
          { (this.state.steps[this.state.stepIndex].input == 'photos' ) && //show photos step and continue buttons
           
           <View>
            <View style ={{
                flex: 5, 
                justifyContent: 'center',
                width: 330,
                //backgroundColor: '#1C1C24',
                borderRadius: 30,
                padding: 10,
              }}>

                  <ScrollView contentContainerStyle={{   flexGrow: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'flex-start', padding: 0 }}>
                    {this.state.profile.images['0'].url !== 'https://focusdating.co/images/user.jpg' ? Object.entries(this.state.profile.images).map((i, n) => <View style={{padding: 5}} key={i[0]}>{this.renderAsset(i[1], i[0])}</View>) : null}                
                    {this._renderPlacedholderImages()}
                  </ScrollView>
  
                </View>

            <View style={{ 
              flex: 2,
              alignItems: 'center',
              justifyContent: 'center',
              //marginBottom: 10,
            }}>

            <Button 
              rounded  
              disabled = {!this.state.currentStepValidated}
              onPress = {() => this.props.navigation.getParam("goback") ? this.props.navigation.navigate("Profile", {profile: this.state.profile}) : this.props.navigation.navigate("ManagePreferences")}
              opacity = {placeHolderColor}
              style={{ 
                justifyContent: 'center', 
                alignSelf: 'center',
                // bottom: 50,
                width: 300, 
                backgroundColor: btnColorState,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65,}}> 
                <Text style={{color: btnTextColor, fontFamily:'HelveticaNeue'}}>Save</Text>
              </Button> 

              {(this.props.navigation.getParam("from") !== 'Intro') &&
              <Button 
              rounded  
              transparent
              onPress = {() => this.props.navigation.getParam("goback") ? this.props.navigation.navigate("Profile", {profile: this.state.profile}) : this.props.navigation.navigate("ManagePreferences")}
              style={{ alignSelf: 'center', justifyContent: 'center', width: 300, 
               }}> 
                <Text style={{color: btnTextColor, fontFamily:'HelveticaNeue'}}>Close</Text>
              </Button> 
              }

            </View>
          </View>
          }
          

          { (this.state.steps[this.state.stepIndex].input != 'lookingFor' && this.state.steps[this.state.stepIndex].input != 'photos') && //show continue button if not on photos or lookingfor step
              

              
              <View style={{
                flex: 1,
                width: deviceWidth,
                justifyContent: 'space-around',
                alignItems: 'center',
                backgroundColor: '#13131A'
                }}
                >

              <View 
                style={{ 
                  flex: 2, 
                  margin: 50,                 
                  borderRadius: 30,
                  padding: 20,
                  justifyContent: "center", 
                  width: 300,
                  minHeight: 80, 
                  maxHeight: 200,
                  //backgroundColor: '#1C1C24'
                  }}>

              { (this.state.steps[this.state.stepIndex].input == 'name' ) && //show name step

                <InputGroup  borderType="underline" style={{ paddingLeft: 0, marginBottom: 15}} >
                  <Input 
                      style={{ paddingLeft: 0, fontSize: 25, minHeight: 40, maxHeight: 250, color: 'white', fontFamily:'HelveticaNeue',}}
                      placeholder='First name ...'
                      placeholderTextColor = "white"
                      opacity = {placeHolderColor}
                      multiline={true}
                      value={this.state.profile.first_name}
                      onChangeText={(newname) => this.setState({ profile: { ...this.state.profile, first_name: newname} }, () => {
                        this.validateCurrentStep();
                      })}  
                      onEndEditing={(e) => this.updateData('name', userId, e.nativeEvent.text)}                         
                    />
                </InputGroup> 


              }

              { (this.state.steps[this.state.stepIndex].input == 'last_name' ) && //show last name step


              <View>

              <InputGroup  borderType="underline" style={{ paddingLeft: 0, marginBottom: 15}} >
                <Input 
                    style={{ paddingLeft: 0, fontSize: 25, minHeight: 40, maxHeight: 250, color: 'white', fontFamily:'HelveticaNeue',}}
                    placeholder='Last name ...'
                    placeholderTextColor = "white"
                    opacity = {placeHolderColor}
                    multiline={true}
                    value={this.state.profile.last_name}
                    onChangeText={(newlastname) => this.setState({ profile: { ...this.state.profile, last_name: newlastname} }, () => {
                      this.validateCurrentStep();
                    })}  
                    onEndEditing={(e: any) => this.updateData('last_name', userId, e.nativeEvent.text)}                         
                  />
              </InputGroup> 
              <Text style={{
                 color: 'grey',
                 fontSize: 18,
                 paddingTop: 5,
                 fontFamily:'HelveticaNeue',
                 justifyContent: 'flex-end'
                }}>Will only be used for booking restaurant reservations.
              </Text>

              </View>



              }


              { (this.state.steps[this.state.stepIndex].input == 'gender' ) && //show gender step



              <View>
              <InputGroup  
              disabled 
              borderType="underline" 
              style={{ 
                display: this.state.steps[this.state.stepIndex].input == 'gender' ? 'flex':'none', 
                paddingLeft: 0, 
                marginBottom: 15,
                flexDirection: "column",
                alignItems: "flex-start"
                }} >
                  
                  { this.state.profile.gender !== 'Select' && //only show gender toggle after gender is selected. 
                <View style={{flexDirection: "row"}}> 
                  <Switch 
                    // active
                    value={this.state.profile.genderOnProfile}
                    onValueChange={this._toggleSwitch}
                    //ios_backgroundColor = {primaryColor}
                    //trackColor = 'red'
                    trackColor={{true: primaryColor,}}
                    //thumbColor = 'red'
                    //onPress = {() => this.manageStep('continue')}
                    style={{  marginBottom: 15, marginRight: 20}}> 
                      
                  </Switch> 
                  <Text style={{
                    color: 'grey',
                    fontSize: 18,
                    paddingTop: 5,
                    fontFamily:'HelveticaNeue',
                    justifyContent: 'flex-end'
                  }}>{ this.state.profile.genderOnProfile ?  'Shown on profile.' : 'Hidden from profile.'}</Text>   
                </View>
                  }


                <Button 
                  transparent
                  onPress={this.showGenderIdentityActionSheet}
                  style={{
                    width: deviceWidth-130
                  }}>
                <TextInput 
                      disabled
                      editable={true}
                      caretHidden={true}
                      style={{  textTransform: 'capitalize', paddingLeft: 0, fontSize: 25, minHeight: 40, maxHeight: 250, color: 'white',}}
                      autoCorrect = {false}
                      value = {this.state.profile.gender[0].toUpperCase() + this.state.profile.gender.substring(1)} //capitlize gender in only input                     
                      onFocus={this.showGenderIdentityActionSheet}                      
                    >
                  </TextInput>
                </Button>


              </InputGroup> 
              <Text style={{
                color: 'grey',
                fontSize: 18,
                paddingTop: 5,
                fontFamily:'HelveticaNeue',
                justifyContent: 'flex-end'
                }}>Can be hidden from your profile.
              </Text>
              </View>
              
              }

              { (this.state.steps[this.state.stepIndex].input == 'birthday' ) && //show birthday step
              <View>
                <InputGroup disabled borderType="underline" style={{ paddingLeft: 0, marginBottom: 15}} >
                  <Input 
                    style={{ paddingLeft: 0, fontSize: 25, minHeight: 40,fontFamily:'HelveticaNeue', maxHeight: 250, color: 'white',}}
                    placeholder='Select a date'
                    placeholderTextColor = "white"
                    opacity = {placeHolderColor}
                    multiline={true}
                    value={this.state.profile.birthday}
                    onFocus={() => this.datePicker.onPressDate()}                         
                  />
                </InputGroup> 

                <Text style={{
                  color: 'grey',
                  fontSize: 18,
                  paddingTop: 5,
                  fontFamily:'HelveticaNeue',
                  justifyContent: 'flex-end'
                }}>Must be 18 years or older.</Text>
                </View>
              }

              { (this.state.steps[this.state.stepIndex].input == 'work' ) && //show work step
                <InputGroup disabled borderType="underline" style={{ paddingLeft: 0, marginBottom: 15}} >
                  <Input 
                    style={{ paddingLeft: 0, fontSize: 25, minHeight: 40, maxHeight: 250, color: 'white', fontFamily:'HelveticaNeue',}}
                    placeholder='My job here ... '
                    placeholderTextColor = "white"
                    opacity = {placeHolderColor}
                    blurOnSubmit
                    multiline={true}
                    value={this.state.profile.work}
                    onChangeText = {(newwork) => this.setState({profile: { ...this.state.profile, work: newwork}}, () => {
                      this.validateCurrentStep();
                      }) 
                    }            
                    onEndEditing={(e: any) => this.updateData('work', userId, e.nativeEvent.text)}  
                              
                  />
                </InputGroup> 
              }


              { (this.state.steps[this.state.stepIndex].input == 'school' ) && //show school step

              <InputGroup disabled borderType="underline" style={{ paddingLeft: 0, marginBottom: 15}} >
                <Input 
                  style={{ paddingLeft: 0, fontSize: 25, minHeight: 40, maxHeight: 250, color: 'white', fontFamily:'HelveticaNeue',}}
                  placeholder='My school here ... '
                  placeholderTextColor = "white"
                  opacity = {placeHolderColor}
                  blurOnSubmit
                  multiline={true}
                  value={this.state.profile.education}                                             
                  onChangeText={(neweducation) => this.setState({ profile: { ...this.state.profile, education: neweducation} }, () => {
                    this.validateCurrentStep();
                  })}  
                  onEndEditing={(e: any) => this.updateData('education', userId, e.nativeEvent.text)}                                              
                />
              </InputGroup> 

              }

              {/* { (this.state.steps[this.state.stepIndex].input == 'about' ) && //show about me step
                  
                <InputGroup disabled borderType="underline" style={{ paddingLeft: 0, marginBottom: 15}} >
                  <Input 
                    style={{ paddingLeft: 0, fontSize: 25, minHeight: 40, maxHeight: 250, color: 'white',}}
                    placeholder='I am unique because ... '
                    placeholderTextColor = "white"
                    opacity = {placeHolderColor}
                    blurOnSubmit
                    multiline={true}
                    value={this.state.profile.about}                                             
                    onChangeText={(newabout) => this.setState({ profile: { ...this.state.profile, about: newabout} }, () => {
                      this.validateCurrentStep();
                    })}  
                    onEndEditing={(e: any) => this.updateData('about', userId, e.nativeEvent.text)}                                              
                  />
                </InputGroup> 
                } */}

                    { (this.state.steps[this.state.stepIndex].input == 'photos' ) && //show photos step
                                                              
                          <ScrollView contentContainerStyle={{   flexGrow: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-around' }}>

                            {this.state.profile.images['0'].url !== 'https://focusdating.co/images/user.jpg' ? Object.entries(this.state.profile.images).map((i, n) => <View key={i[0]}>{this.renderAsset(i[1], i[0])}</View>) : null}                
                          
                            {this._renderPlacedholderImages()}
                          
                          </ScrollView>
                        
                    }

              </View>

              <View>
                <Button 
                    rounded  
                    disabled = {!this.state.currentStepValidated}
                    onPress = {() => this.manageStep('continue')}
                    opacity = {placeHolderColor}
                    style={{
                      alignSelf: 'center',
                      justifyContent: 'center', 
                      fontFamily:'HelveticaNeue',
                      width: 300, 
                      backgroundColor: btnColorState,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 3,
                      },
                      shadowOpacity: 0.29,
                      shadowRadius: 4.65,}}> 
                      <Text style={{color: btnTextColor, fontFamily:'HelveticaNeue',}}>Save</Text>
                  </Button> 


                  {(this.props.navigation.getParam("from") !== 'Intro') &&
                  <Button 
                  rounded  
                  transparent
                  onPress = {() => this.props.navigation.getParam("goback") ? this.props.navigation.navigate("Profile", {profile: this.state.profile}) : this.props.navigation.navigate("ManagePreferences")}
                  style={{  justifyContent: 'center', width: 300, 
                  }}> 
                    <Text style={{color: btnTextColor, fontFamily:'HelveticaNeue'}}>Close</Text>
                  </Button> 
                }
                
              </View>


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



