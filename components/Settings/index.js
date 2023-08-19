import React, { Component } from 'react';
import {Share, Linking, AsyncStorage, Image, ImageBackground, Alert, Dimensions, Modal, StyleSheet, ScrollView, FlatList, Platform, TouchableOpacity } from 'react-native';

import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

import { DrawerNavigator, NavigationActions } from "react-navigation";
import BlurOverlay,{closeOverlay,openOverlay} from 'react-native-blur-overlay';
import DatePicker from 'react-native-datepicker';
import ImagePicker from 'react-native-image-crop-picker';
import Slider from '@react-native-community/slider';
import ImageViewer from 'react-native-image-zoom-viewer';
import Geocoder from 'react-native-geocoding';
import Geolocation from '@react-native-community/geolocation';
import RNFetchBlob from 'rn-fetch-blob';
import * as firebase from "firebase";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCog, faUsers, faComments, faPlus } from '@fortawesome/free-solid-svg-icons';

import {
  ActionSheet,
  Card,
  CardItem,
  Container,
  Content,
  DeckSwiper,
  Form,
  Header,
  Title,
  Text,
  Button,
  Icon,
  Item,
  Input,
  Label,
  Picker,
  ListItem,
  Radio,
  Left,
  Thumbnail,
  Toast,
  Right,
  Switch,
  Body,
  View,
  List,
  H1,
  H2,
  H3,
} from "native-base";

//shortcut to Analytics
// let Analytics = RNanalytics();

const primaryColor = "#8A6077";
const secondaryColor = "#EF8275";

var REVIEW_OPTIONS = [
  'Endorse Someone New',  
  'Endorse Back',
  'Remove Endorsement',
  'Cancel',
];

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

var GENDER_MATCH_OPTIONS = [
  'Male',
  'Female',
  'Both',
  'Cancel',
];
var DESTRUCTIVE_INDEX = 2;
var CANCEL_INDEX = 2;

Geocoder.init('AIzaSyCbt43Up1r0ywnqWX2xxMWGiwWJ3CSBrAI');

class Settings extends Component {

  constructor(props){
    super(props)
    //Analytics.setAnalyticsCollectionEnabled(true);

  this.state = {
      imageViewerVisible: false,
      selectedImage:[{url: ''}],
      imageIndex: 0,
      profileMaxHeight: "15%",
      profileViewerVisible: false,
      forceUpdate: false,
      profile: {
        showToast: false,
        images: [],
        first_name: null,
        last_name: null,
        latitude: null,
        longitude: null,
        gender: null,
        interested: 'Select',
        max_distance: 100,
        // birthday: 'Select a date',
        interested: null,
        min_age: 18,
        max_age: 50,
        error: null,
        notifications_message: true,
        notifications_match: true,
        error: null,
        work: '',
        status: 'active',
        reviews: {
        }
      }
    }
  }

  //configure navigation
  static navigationOptions = ({ navigation, }) => {
    return {
      headerLeft: () => (
        <View></View>
      ),
      headerTitle: () => (
        <FontAwesomeIcon size={ 40 } style={{ color: 'lightgrey'}} icon={ faCog } />
        ),
      headerRight: () => (
        <Button transparent onPress={navigation.getParam('validate')}>
          <FontAwesomeIcon size={ 28 } style={{ right: 16, color: primaryColor}} icon={ faUsers } />
        </Button>
      ),

    };
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
      }), this.showInstructions(), //showInstruction after state loads.

    RNanalytics().setAnalyticsCollectionEnabled(true);
    RNanalytics().setCurrentScreen('Settings', 'Settings');
    RNanalytics().setUserId(userId);
    //trigger these user property functions when user updates each of their settings
    RNanalytics().setUserProperty('name', dataSnapshot.val().first_name+' '+dataSnapshot.val().last_name);
    RNanalytics().setUserProperty('about', dataSnapshot.val().about);
    RNanalytics().setUserProperty('birthday', (dataSnapshot.val().birthday ? dataSnapshot.val().birthday : 'empty' ));
    RNanalytics().setUserProperty('education', dataSnapshot.val().education);
    RNanalytics().setUserProperty('gender', dataSnapshot.val().gender);
    RNanalytics().setUserProperty('gender_pref', dataSnapshot.val().gender_pref);
    RNanalytics().setUserProperty('interested', dataSnapshot.val().interested);
    RNanalytics().setUserProperty('status', dataSnapshot.val().status);
    RNanalytics().setUserProperty('work', dataSnapshot.val().work);
   //convert the below numbers to strings
    RNanalytics().setUserProperty('last_conversation_count', dataSnapshot.val().last_conversation_count.toString());
    RNanalytics().setUserProperty('swipe_count', dataSnapshot.val().swipe_count.toString());
    RNanalytics().setUserProperty('max_age', dataSnapshot.val().max_age.toString());
    RNanalytics().setUserProperty('max_distance', dataSnapshot.val().max_distance.toString());
    RNanalytics().setUserProperty('min_age', dataSnapshot.val().min_age.toString());
    RNanalytics().setUserProperty('last_login', dataSnapshot.val().last_login.toString());
    RNanalytics().setUserProperty('notifications_match', dataSnapshot.val().notifications_match.toString());
    RNanalytics().setUserProperty('notifications_message', dataSnapshot.val().notifications_message.toString());
    })

    this.getLocation();

  }  

  //After component mounts prompt for permission to recieve notifications and save fcmToken to database
  componentDidMount() {
      
    //send vaidate function to nav as param, so that it can be referenced in the navigation. 
    this.props.navigation.setParams({ validate: this.validateSettings });
   
    //check permissions
    this.checkPermission();

  }  

  componentWillUnmount() {
    //navigator.geolocation.clearWatch(this.watchId);
    firebaseRef.off(); //detach listener to ref, so that extra fbdb calls arent' made and unmounted component isn't updated
  }

  showInstructions = () => {
    
    if (this.state.profile.showInstructionsSettings) {
      openOverlay();
    };
  } 



  // check if permission for notification has been granted previously, then getToken. 
  async checkPermission() {
    const enabled = await RNmessaging().hasPermission();
    if (enabled) {
        this.getToken();
    } else {
        this.requestPermission();
    }
  }



  // getToken if permission has been granted previously
  async getToken() {
    fcmToken = await RNmessaging().getToken();
    firebaseRef.update({fcmToken: fcmToken});
    // try {
    //   let fcmToken = await AsyncStorage.getItem('fcmToken');
    //   if (!fcmToken) {
    //       fcmToken = await RNmessaging().getToken();
    //       if (fcmToken) {
    //           // user has a device token

    //           // update fcmToken in firebase
    //           firebaseRef.update({fcmToken: 'fcmToken'});

    //           //set fcmToken to asyncStorage for use later
    //           await AsyncStorage.setItem('fcmToken', fcmToken);
    //       }
    //   }else{
    //     // update fcmToken in firebase
    //     firebaseRef.update({fcmToken: 'fcmToken'});
    //   }     
    // } catch (error) {
    //   console.log('error is: '+error);
    //   firebaseRef.update({fcmToken: fcmToken});

    // }

  }

  // if permission has not been granted, request for permission. 
  async requestPermission() {
    try {
        await RNmessaging().requestPermission();
        // User has authorised
        this.getToken();
    } catch (error) {
        // User has rejected permissions
        console.log('permission rejected');
    }
  }

  onPressHandle1 = () => {

    //take opposite of current value from state
    let bool = this.state.profile.notifications_message == true ? false : true;

    //record in analytics that user was doesn't want notifications 
    RNanalytics().setUserProperty('notifications_message', this.state.profile.notifications_message.toString());

    //update firebase with new value, then update state
    firebaseRef.update({notifications_message: bool})
    .then(this.setState({profile: { ...this.state.profile, notifications_message: bool}}))

  }

  onPressHandle2 = () => {

    //take opposite of current value from state
    let bool = this.state.profile.notifications_match == true ? false : true;

    //record in analytics that user was doesn't want notifications 
    RNanalytics().setUserProperty('notifications_match', this.state.profile.notifications_match.toString());

    //update firebase with new value, then update state
    firebaseRef.update({notifications_match: bool})
    .then(this.setState({profile: { ...this.state.profile, notifications_match: bool}}))

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
        Geocoder.from(position.coords.latitude, position.coords.longitude)
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

  //if all profile fields are complete AND user is initial user, then prompt to go to Swipes flow and update user to not intial user in db. 
  // promptSwipes = () => {
  //   //check that all required fields are present.
  //   let intialUser = (this.state.profile.intialUser == true);
  //   let profileComplete = this.profileComplete();
    
  //   //first check if user is first time user and their profile is completed.
  //   if (intialUser && profileComplete) {
    
  //     //update db to intialUser = false
  //     firebaseRef.update({intialUser: false});
  //     //prompt to see matches
  //     Alert.alert(
  //       'Profile Complete',
  //       'See your matches?',
  //       [
  //         {
  //           text: 'Keep Working',
  //           //onPress: () => console.log('Cancel Pressed'),
  //           style: 'cancel',
  //         },
  //         {
  //           //if clicked ok, send to swipes flow.
  //           text: 'See Matches',
  //           onPress: () => this.props.navigation.navigate('Swipes'),
  //         },
  //       ],
  //       'plain-text',
  //     );
  //   } 
  // }

  profileComplete = () => {
    
    //check that all required fields are present.
    let first_nameValidated = this.state.profile.first_name !== '';
    let genderValidated = this.state.profile.gender !== 'select' ;
    let birthdayValidated = this.state.profile.birthday !== 'select';
    let workValidated = this.state.profile.work !== '';
    let educationValidated = this.state.profile.education !== '';
    let aboutValidated = this.state.profile.about !== '';
    let interestedValidated = this.state.profile.interested !== 'select';

    //if all items are true, return true, else return false. 
    if (aboutValidated && educationValidated && first_nameValidated && workValidated && genderValidated && birthdayValidated && interestedValidated ){
      return true; 
    }else {
      return false
    } 
  }
  
  //update forceUpdate in state, so that swipes will be forced to updated when re-rendering. Needed for data 
  forceUpdate = () => {
    this.setState({ forceUpdate: true});
  }
  

  //function to validate settings
  validateSettings = () => {

    const { state, navigate } = this.props.navigation;
    let firebaseRef = database().ref('/users/' + userId);

    //check that all required fields are present.
    let profileComplete = this.profileComplete();

    //if one of gender,interested, birthday is false, ask to update. Else, go to swipes. 
    if (!profileComplete){
        Toast.show({
          text: "Please update your: Name, Gender, Birthday, Work, Education, About, or who you're interested in meeting.",
          buttonText: "OK",
          duration: 6000
        })
      }else{
        
        //update db to intialUser = false, if not already. This will move user to swipes on login and they will appear in matches
        firebaseRef.update({intialUser: false});

        //redirect to swipes and pass params if getMatches needs to be force updated. 
        this.props.navigation. navigate("Swipes", {forceUpdate: this.state.forceUpdate, swipeCount: this.state.profile.swipe_count});
      }
    }

  //function to sign out user
  signOutUser = async () => {
      const { state, navigate } = this.props.navigation;

      try {
          //record in analytics that user was logged out successfully 
          RNanalytics().logEvent('userLoggedOut', {
            testParam: 'testParamValue1'
          });
          navigate("Login");
          await auth().signOut();
      } catch (e) {
          console.log(e);
      }
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

_closeAndEndorse = () => {
  const { navigate } = this.props.navigation;

  this.setState({ profileViewerVisible: false});
  navigate("Refer", {flow: 'endorse' });  

}

  //function to handle linking out to browser
  linkOut = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
      }
    });
  };

  //function to pause user in db
  pauseUser = () => this.updateData('status', userId, 'paused');

  //function to resume user in db
  resumeUser = () => this.updateData('status', userId, 'active');

  //function to guide user through the delete flow
  deleteUser = async () => {
      const { navigate } = this.props.navigation;

      var user = auth().currentUser;

      //alert user for confirmation. On ok delete user's authentication

      Alert.alert(
        'Are you sure you want to delete your account?',
        'If you delete your account, you will loose touch with everyone within Focus. If you would like to take a break, tap the pause button below',
        [
          {text: 'Delete Account', onPress: () => userDelete(), style: 'destructive'},
          {text: 'Pause', onPress: () => this.pauseUser()},
          {text: 'Cancel', onPress: () => console.log('Canceled')},
        ],
        { cancelable: false }
      )

      //function to delete user
      var userDelete = () => 

        //set user to deleted status in db, then delete authentication, then go to login page. 
        firebaseRef.update({status: 'deleted'}).then(function() {
          user.delete().then(function() {

          //record in analytics that user was deleted successfully 
          RNanalytics().logEvent('userDeleted', {
            testParam: 'testParamValue1'
          });

          // User deleted.
          navigate("Login");

          }).catch(function(error) {
          // An error happened.
          console.log(error);
        });
      }) 


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
            var storageRef = storage().ref(); 

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
            RNanalytics().logEvent('photoUploaded', {
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


    //console.log('image is: '+JSON.stringify(image));
    return <TouchableOpacity onPress={()=> ActionSheet.show
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
                            RNanalytics().logEvent('newMainPhoto', {
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
                              var storageRef = storage().ref(); 

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
                              RNanalytics().logEvent('photoDeleted', {
                                testParam: 'testParamValue1'
                              });

                            }
                          }
                        }
                      )
                    } >
              <Image style={{width: 100, height: 100, marginLeft:10 }} source={image} />
          </TouchableOpacity>
  }

  //function to render image or video
  renderAsset(image, key) {
    if (image.mime && image.mime.toLowerCase().indexOf('video/') !== -1) {
      return this.renderVideo(image);
    }

    return this.renderImage(image, key);
  }

  //function to update name or images or reviews
  updateData = (type, userid, payload) => {

    //record in analytics the event that a profile was updated successfully 
    RNanalytics().logEvent('profileUpdated', {
      type: payload
    });

    // console.log('type: '+JSON.stringify(type) +'payload length is: '+JSON.stringify(payload.length.toString()));
    //THIS IS BREAKING SINCE WHEN PASSING TO DB OBJECT FOR CASE REVIEWS, IT CAN'T BE CONVERTED TO STRING. 
    // //record in analytics the updated user property 
    // RNanalytics().setUserProperty(type, payload.length.toString());
                                                  
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
          //return database().ref().update(updateObj);

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
    //this.promptSwipes(); //prompt to nav to swipes if profile becomes complete
  }

	//when user updates gender derive their gender_pref bases on who they're interested in. trigger in callback of updating state with dropdown, since will be using state data to derive gender_pref. 
	updateGenderOrInterested = (type) => {

		//update gender variable with selected gender
		let gender = this.state.profile.gender.toLowerCase(); //can be male or female
		let interested = this.state.profile.interested.toLowerCase() //can be either male,female, both, select. Will remain same. 
    let gender_pref = '';

    // console.log('type is: '+type);
    // console.log('gender is: '+gender);
    // console.log('interested is: '+interested);
    // console.log('gender_pref is: '+gender_pref);

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
          case 'both':
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
          case 'both':
            gender_pref = 'female_bi';
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
          case 'Select':
            gender_pref = '';
            break;
        }
      }else if (interested == 'both') {
        gender_pref = gender+'_bi'; //can be male_bi or female_bi
      }else if (interested == 'select') {
        gender_pref = '';   
      }      
      //prompt user to go to swipes, if they're first time user. 
      //this.promptSwipes();

    }

    //update db with gender_pref
    firebaseRef.update({gender_pref: gender_pref, interested: interested, gender: gender});
  
    //update state with gender_pref
    this.setState({
      profile: { ...this.state.profile, interested: interested, gender: gender, gender_pref: gender_pref}
    });

	}


  //check code is valid
  _checkCode = (userCode) => {

    //save analytics in let
    let Analytics = RNanalytics();
    //call firebase if code exists and is not expired
    database().ref("/codes").orderByChild("sharable_code").equalTo(userCode.toUpperCase()).once("value",codeSnap => {
        //check if code exists
        if (codeSnap.exists()){

          //get save code to obj
          let code = codeSnap.val();
          let key = Object.keys(code);
          let codeData = code[key];
          let expired = codeData.expired;
          let reason = codeData.reason;
          let name_creator = codeData.name_creator;
          let photo_creator = codeData.photo_creator;
                
          //check if code is also expired
          if(expired == true){

            //handle that code is expired. 
            console.log('sorry code is expired already. Ask your friend for another.');
            
            //record in analytics that code was expired 
            Analytics.logEvent('codeExpired', {
              codeData: 'codeData'
            });

            Alert.alert('Whoops!','Code: '+userCode+' has already been used. Please ask your friend for another.');

          }else{
            const { navigate } = this.props.navigation;
   
            //code must exist AND code not expired
            console.log('code exists and is valid!');
            
            //record in analytics that code was expired 
            Analytics.logEvent('codeValid', {
              codeData: 'codeData'
            });

            //update code to expired at the specific code key and add created_for as well, to reference later. 
            database().ref('/codes/'+key).update({expired_date: new Date().getTime(), expired: true, created_for: userId });
            
            // save reference to where to save the new review object 
            firebaseProfileRefReviews = database().ref('/users/'+userId+'/reviews/'+key);

            //build review object to update db with. 
            let reviewObj = {name: name_creator, photo: photo_creator, reason: reason, code_key: key[0]}

            //push review to user's profile with same key as code key. 
            firebaseProfileRefReviews.set(reviewObj);

          }
        //code doesnt exist
        }else{

          //handle that code doesnt exist. 
          console.log('sorry code doesnt exist. ask your friend for another');
           //record in analytics that code was expired 
          Analytics.logEvent('codeInvalid', {
            codeData: 'codeData'
          });         
          
          //alert user that code does not exist. 
          Alert.alert('Whoops!','Code: '+userCode+' does not exist. Please ask your friend for another.');
        }
    });
  }
  
  //handle button clicks for endorse/invite friend buttons. 
  _codePrompt = () => {
    Alert.prompt(
      'Enter code',
      'Enter your referral code you received from a friend',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: (code) => this._checkCode(code),
        },
      ],
      'plain-text',
    );
  }

  _onBlur() {
    this._timeoutID = setTimeout(() => {
      alert('blured');

    }, 0);
  }
  
  _onFocus() {
    clearTimeout(this._timeoutID);

    alert('focued');
  }

  _handleClick = (e) => {

    console.log('_handleClick called');
  }

  renderBlurChilds() {
    return (
      <View >
          <Text style={{textAlign: 'center', color: 'white', margin: 35}}> Use this screen to complete your profile. Tap anywhere to close. </Text>
      </View>
    );
}
_viewProfile = () => {
  alert('see profile now');

}

  //function to renderReviews into markup
  _renderReview = () => {
    const { navigate } = this.props.navigation;

    //alert(Object.entries(this.state.profile.reviews));
    //{this.state.profile.images ? Object.entries(this.state.profile.reviews).map((i, n) => <View key={i[0]}>{this.renderAsset(i[1], i[0])}</View>) : null}                
    
    //alert(Object.keys(this.state.profile.reviews).length);

    //check if reviews are empty, if so, show empty state. 
    if(!this.state.profile.reviews){
      
      //return empty state
      return (
        <ListItem noBorder style={{justifyContent: "center"}}>
          <Button bordered style={{borderColor: primaryColor}} onPress = {() => this._closeAndEndorse()}><Text style={{color: primaryColor}}>Endorse Friend</Text></Button>      
        </ListItem>
        );

    // else user must have reviews
    }else {

      //turn object of objects into array with Object.entries()
    
      // return jsx

      //inside the return statement, map over the array of Reviews, to produce all the content to be rendered. 

      //return markup for each review
      return ( 
      <View style={{padding: 10}}>
        {Object.values(this.state.profile.reviews).map((review, index) => (

        
      <Card  >
        <List>
          <ListItem key={index} avatar noBorder button onPress={()=> ActionSheet.show
        (
          {
            options: REVIEW_OPTIONS,
            cancelButtonIndex: 3,
            destructiveButtonIndex: 3,
            title: 'Endorse'
          },
          (buttonIndex) => {
            if ((buttonIndex) === 0) {
              //open refer module
              navigate("Refer", {flow: 'endorse' });
              }

            if ((buttonIndex) === 1) {
              //open refer module
              navigate("Refer", {name: review.name, flow: 'endorse' });
            }

            if ((buttonIndex) === 2) {

              //derive the key of the review from the passed index.
              let deleteReview = Object.keys(this.state.profile.reviews)[index];

              //copy of users reviews in order to not directly delete from state.
              let userReviewsObject = this.state.profile.reviews;
       
              //delete review from userReviewsObject above.
              delete userReviewsObject[deleteReview];

              //setState with userReviewsObject now that the removed review is gone. 
              this.setState({profile: { ...this.state.profile, reviews: userReviewsObject}});

              //send updated review object to updateData function as payload. 
              this.updateData('reviews', userId, userReviewsObject );

              //record in analytics that review was deleted successfully 
              RNanalytics().logEvent('reviewDeleted', {
                testParam: 'testParamValue1'
              });
            }
          }                       
        )}>
            <Left>
              <Thumbnail large source={{uri: review.photo}} />
            </Left>
            <Body>
              <Text style={{color: primaryColor}}>{review.name+' says:'}</Text>
              <Text note>{review.reason}</Text>
            </Body>
          </ListItem>
        </List>
      </Card>        

        ))}
        <ListItem noBorder style={{justifyContent: "center"}}>
          <Button bordered style={{borderColor: primaryColor}} 
            onPress = {() => this._closeAndEndorse()}>
            <Text style={{color: primaryColor}}>Endorse Friend</Text>
          </Button>        
        </ListItem>
      </View>
      );
    }
  }

      //handle scroll of profile by growing/shrinking container when user scrolls and expects that. 
      _handleScroll = (event: Object) => {

        var currentOffset = event.nativeEvent.contentOffset.y;
        var direction = currentOffset > this.offset ? 'down' : 'up';
        this.offset = currentOffset;
        if((direction == 'down') && (currentOffset > 0) && (this.state.profileMaxHeight == '15%')){
        
          //grow up to 15%
          this.setState({ profileMaxHeight: '40%'});
  
        }else if ((direction == 'up') && (currentOffset < 0) && ((this.state.profileMaxHeight == '40%')) ){
          
          //shrink down to 15%
          this.setState({ profileMaxHeight: '15%'});
             
        }
      }

  render() {
    const { navigate } = this.props.navigation;
    let status; 

    if (this.state.profile.status == 'paused') {
      status = <Button transparent onPress = {() => this.resumeUser()}>
                  <Text style={{color: 'red'}}>Resume Account</Text>
                </Button> ;

    } else if (this.state.profile.status == 'active') {
      status = <Button transparent onPress = {() => this.pauseUser()}>
                  <Text style={{color: 'red'}}>Pause Account</Text>
                </Button>;
    }

    //determine width of device in order for custom margin between iphones
    let deviceWidth = Dimensions.get('window').width

    //if device width is 414 (iphone+), then margins should be 58, else 40. 
    let genderMargin = deviceWidth == 414 ? 37 : 25;
    let birthdayMargin = deviceWidth == 414 ? 50 : 38;
    //calculate 18 year old birthday as the max date picker value. 
    var date = new Date();
    date.setFullYear(date.getFullYear() - 18, date.getMonth());

    
    //console.log('deviceWidth is: '+deviceWidth);
        
    return (
      <Container>

        <BlurOverlay
          radius={14}
          downsampling={2}
          brightness={-200}
          onPress={() => {
              //close overylay and set showInstructions to false, so they want show again. 
              closeOverlay();
              firebaseRef.update({showInstructionsSettings: false})
          }}
          customStyles={{alignItems: 'center', justifyContent: 'center'}}
          blurStyle="dark"
          children={this.renderBlurChilds()}
        />
        
        <Modal visible={this.state.imageViewerVisible} transparent={true}>
            <ImageViewer 
              imageUrls={this.state.selectedImage}
              onSwipeDown = {() => this.setState({ imageViewerVisible: false})}
              onClick = {() => this.setState({ imageViewerVisible: false})}
            />
        </Modal>


        <Modal 
            visible={this.state.profileViewerVisible} 
            transparent={true}
            animationType="slide">
          
              <ImageViewer 
                index = {this.state.imageIndex}
                imageUrls={this.state.profile.images}
                onChange = {(index) => this.setState({ imageIndex: index})}
                onSwipeDown = {() => this.setState({ profileViewerVisible: false, profileMaxHeight: '15%', imageIndex: this.state.imageIndex})}
                onClick = {() => this.setState({ profileViewerVisible: false, profileMaxHeight: '15%'})}
              />

                <View 
                  flex={1}
                  // alignItems="flex-start"
                  // justifyContent="center"
                  borderWidth={1}
                  borderColor="grey"
                  borderRadius={5}
                  backgroundColor="white"
                  maxHeight= {this.state.profileMaxHeight} //profileMaxHeight
                 
                >
                  <ScrollView 
                    ref='ScrollView_Reference'
                    onScroll={this._handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{
                      padding: 15,
                      backgroundColor:'white'
                    }}>
                      <TouchableOpacity>
                        <Card transparent>   
                          {/* <H3 numberOfLines={1} style={{textTransform: 'capitalize', color: primaryColor}} >{name}</H3> */}
                          <H3 numberOfLines={1} style={{textTransform: 'capitalize', color: primaryColor}} >{this.getAge(this.state.profile.birthday)}, {this.state.profile.gender}, {this.state.profile.city_state}</H3>
                          <Text numberOfLines={1} style={{}} >{this.state.profile.work} </Text>
                          <Text numberOfLines={1} style={{marginBottom: 10}} >{this.state.profile.education} </Text>
                          <Text note style={{marginTop: 10}}>{this.state.profile.about}</Text>
                        </Card>
                        {this._renderReview(this.state.profile.reviews)}
                      </TouchableOpacity>
                  </ScrollView>
                </View>          
          </Modal> 



   
        <Content>
          <DatePicker
            style={{width: 200}}
            date={(this.state.profile.birthday == 'select') ? false : this.state.profile.birthday }
            mode="date"
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
                marginLeft: 36,
                height: 0
              },
              dateTouchBody: {
                width: 0,
                height: 0
              },
              dateText: {
                width: 0
              }
            }}
            onDateChange={(date) => firebaseRef.update({birthday: date})
            .then(this.setState({profile: { ...this.state.profile, birthday: date}}))
            .then(this.updateData('birthday', userId, date))
          }
          />
          <View style={{  flex: 1, padding: 0 }}>
            <Form>
              <ListItem itemDivider style={{flexDirection: "row"}}>
                <Text>I am test...</Text>
                <Button style={{flex: 1, justifyContent: "flex-end"}} small transparent 
                  // check if profile is complete, if so, show profileViewer, else show toast to complete profile.
                  onPress = {() => (this.profileComplete()) ? this.setState({ profileViewerVisible: true}) : 
                  Toast.show({
                    text: "Please update your: Name, Gender, Birthday, Work, Education, About, or who you're interested in meeting.",
                    buttonText: "OK",
                    duration: 6000
                  })}>
                  <Text style={{color: primaryColor}}>View Profile</Text>
                </Button>

              </ListItem> 
              <Item fixedLabel>
                <Label>Name</Label>
                <Input 
                  placeholder='My name is ...'
                  value={this.state.profile.first_name}
                  onChangeText={(newname) => this.setState({
                                profile: { ...this.state.profile, first_name: newname}
                              })}                  
                  //onEndEditing={(e: any) => firebaseRef.update({first_name: e.nativeEvent.text})}
                  onEndEditing={(e: any) => this.updateData('name', userId, e.nativeEvent.text)}

                />
              </Item>
              <Item                
                onPress={
                  ()=> ActionSheet.show
                  (
                    {
                      options: GENDER_OPTIONS,
                      cancelButtonIndex: CANCEL_INDEX,
                      destructiveButtonIndex: DESTRUCTIVE_INDEX,
                      title: 'Gender Identity'
                    },
                    (buttonIndex) => {
                      if ((buttonIndex) === 2) {
                           console.log(GENDER_OPTIONS[buttonIndex])
                      } else {
                        this.setState({
                          profile: { ...this.state.profile, gender: GENDER_OPTIONS[buttonIndex]}
                      }, () => {
                          this.updateGenderOrInterested('gender');
                          this.updateData('gender', userId, GENDER_OPTIONS[buttonIndex]);
                          this.forceUpdate(); //make swipes force update
                      })
                    } 
                  }
                )
              }           
              >
                <Label>Identify as</Label>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', marginLeft: genderMargin}}>
                  <Button full disabled transparent >
                    <Text style={{color: 'black', textTransform: 'capitalize'}}>{this.state.profile.gender}</Text>
                  </Button>
                </View>
              </Item>
              
              <Item                 
                onPress = {() => this.datePicker.onPressDate()}
                >
                <Label>Birthday</Label>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', marginLeft: birthdayMargin}}>
                <Button full disabled transparent >
                    <Text style={{color: 'black'}}>{this.state.profile.birthday}</Text>
                  </Button>
                </View>
              </Item>
              <Item fixedLabel>
                <Label>Work</Label>
                <Input 
                  value={this.state.profile.work}
                  placeholder='I spend my time on ...'
                  onChangeText={(newwork) => this.setState({
                                profile: { ...this.state.profile, work: newwork}
                              })}                  
                 // onEndEditing={(e: any) => firebaseRef.update({'work': e.nativeEvent.text})}
                  onEndEditing={(e: any) => this.updateData('work', userId, e.nativeEvent.text)}

                />
              </Item>

              <Item fixedLabel>
                <Label>Education</Label>
                <Input 

                  placeholder='My education is ...'
                  value={this.state.profile.education}
                  onChangeText={(neweducation) => this.setState({
                                profile: { ...this.state.profile, education: neweducation}
                              })}                  
                  onEndEditing={(e: any) => this.updateData('education', userId, e.nativeEvent.text)}             

                />
              </Item>
              <Item fixedLabel>
                <Label>About</Label>
                <Input 
                  style={{minHeight: 50, height: '100%', maxHeight: 150}}
                  multiline={true}
                  placeholder='I am unique because ...'
                  onContentSizeChange={(e) => console.log('updated size')}
                  value={this.state.profile.about}
                  onChangeText={(about) => this.setState({
                                profile: { ...this.state.profile, about: about}
                              })}                  
                  onEndEditing={(e: any) => this.updateData('about', userId, e.nativeEvent.text)}             
                />
              </Item>
              <Item fixedLabel>
                <Text>My photos ...</Text>
                <Input disabled />
              </Item>
              <CardItem>
                <Body>
                    <ScrollView horizontal>
                      <Button onPress={this.pickImage.bind(this)} light style={{ borderRadius: 100, borderWidth: 0.6, borderColor: '#d6d7da',width: 100, height: 100, marginLeft:10, justifyContent: 'center', alignItems: 'center' }}>
                        <FontAwesomeIcon size={ 28 } style={{ color: primaryColor}} icon={ faPlus } />
                      </Button>
                      {this.state.profile.images ? Object.entries(this.state.profile.images).map((i, n) => <View key={i[0]}>{this.renderAsset(i[1], i[0])}</View>) : null}                
                    </ScrollView>
                </Body>
              </CardItem>
              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text>I like ... </Text>
              </ListItem>

              <Item 
                fixedLabel
                    onPress={()=> ActionSheet.show
                      (
                        {
                          options: GENDER_MATCH_OPTIONS,
                          cancelButtonIndex: 3,
                          destructiveButtonIndex: 3,
                          title: 'Gender'
                        },
                        (buttonIndex) => {

                          console.log('buttonIndex is: '+buttonIndex)
                          
                          if ((buttonIndex) === 3) {
                      
                               console.log('GENDER_MATCH_OPTIONS[buttonIndex] is: '+GENDER_MATCH_OPTIONS[buttonIndex])
                            } else {

                              // this.setState({
                              //   profile: { ...this.state.profile, interested: GENDER_MATCH_OPTIONS[buttonIndex]}
                              // }), firebaseRef.update({interested: GENDER_MATCH_OPTIONS[buttonIndex], gender_pref: this.updateGenderPref()})
                            
                              this.setState({
                                profile: { ...this.state.profile, interested: GENDER_MATCH_OPTIONS[buttonIndex]}
                                }, () => {
                                  this.updateGenderOrInterested('interested');
                                  this.forceUpdate(); //make swipes force update
                                })                         
                            }
                        }
                      )
                    } 
                  >
                <Label>Gender</Label>
                <View style={{}}>
                  <Button full disabled transparent >
                    <Text style={{color: 'black', textTransform: 'capitalize'}}>{this.state.profile.interested}</Text>
                  </Button>                  
                </View>
              </Item>
            
              {/* <Item fixedLabel>
                <Label>Age Range</Label>
                  <MultiSlider 
                    min={21}
                    max={50}
                    values={[30,45]} 
                    unselectedStyle = {{backgroundColor: 'lightgrey'}} 
                    sliderLength={160} 
                    markerStyle={{ height:30, width: 30, borderRadius: 15, backgroundColor:'white', borderWidth: 0.5, borderColor: 'grey'}} 
                    trackStyle={{ borderRadius: 7, height: 2 }} 
                    containerStyle={{ width: 170, top: 12, right:40}}
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
                <Text style={{ right:20}}>
                    {this.state.profile.min_age} - {this.state.profile.max_age == 50 ? '50+' : this.state.profile.max_age+' '}
                </Text>
              </Item> */}

              <Item fixedLabel>
                <Label>Min Age</Label>
                <Slider
                  style={{ width: 168, right:40 }}
                  step={1}
                  minimumValue={18}
                  maximumValue={this.state.profile.max_age}
                  minimumTrackTintColor={primaryColor}
                  maximumTrackTintColor={primaryColor}
                  value={this.state.profile.min_age}
                  onSlidingComplete={(val) => 
                    firebaseRef.update({min_age: (val)},
                    this.forceUpdate() //make swipes force update
                  )}
                  onValueChange={(val) => 
                   this.setState({profile: { ...this.state.profile, min_age: (val)}})
                 }
                />
                <Text style={{ right:20}}>
                    {this.state.profile.min_age}
                </Text>
              </Item>

              <Item fixedLabel>
                <Label>Max Age</Label>
                <Slider
                  style={{ width: 168, right:40 }}
                  step={1}
                  minimumValue={this.state.profile.min_age}
                  maximumValue={60}
                  minimumTrackTintColor={primaryColor}
                  maximumTrackTintColor={primaryColor}
                  value={this.state.profile.max_age}
                  onSlidingComplete={(val) => 
                    firebaseRef.update({max_age: (val)},
                    this.forceUpdate() //make swipes force update
                  )}
                  onValueChange={(val) => 
                   this.setState({profile: { ...this.state.profile, max_age: (val)}})
                 }
                />
                <Text style={{ right:20}}>
                    {this.state.profile.max_age}
                </Text>
              </Item>


              <Item fixedLabel>
                <Label>Max Dist</Label>
                <Slider
                  style={{ width: 168, right:40 }}
                  step={10}
                  minimumValue={10}
                  maximumValue={200}
                  minimumTrackTintColor={primaryColor}
                  maximumTrackTintColor={primaryColor}
                  value={this.getMiles(this.state.profile.max_distance)}
                  onSlidingComplete={(val) => firebaseRef.update({max_distance: this.getMeters(val)})}
                  onValueChange={(val) => 
                   this.setState({profile: { ...this.state.profile, max_distance: this.getMeters(val)}})
                 }
                />
                <Text style={{ right:20}}>
                    {this.getMiles(this.state.profile.max_distance)} Miles
                </Text>
              </Item>



              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "space-between"}}>
                <Text>My friends think...</Text>
                <Button small transparent onPress = {() => this._codePrompt()}>
                  <Text style={{color: primaryColor}}>Enter Refer Code</Text>
                </Button>
              </ListItem>

              {this._renderReview()}

              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text>Notify me when...</Text>
              </ListItem>
              
          <ListItem>
            <Left>
              <Label style={{color: "dimgrey"}}>New Message</Label>
            </Left>
            
            <Body>              
            </Body>
            
            <Right>
              <Switch 
                value={this.state.profile.notifications_message}
                onValueChange={this.onPressHandle1}
               />
            </Right>
          </ListItem>

          <ListItem>
            <Left>
              <Label style={{color: "dimgrey"}}>New Match</Label>
            </Left>
            
            <Body>              
            </Body>
            
            <Right>
              <Switch 
                value={this.state.profile.notifications_match}
                onValueChange={this.onPressHandle2}
               />
            </Right>
          </ListItem>

       
              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text>Other...</Text>
              </ListItem>

               <Item fixedLabel onPress = {() => navigate("Refer", {flow: 'refer' })}>
                <Label>Refer Friend</Label>
                <Input disabled />
              </Item> 

              <Item fixedLabel onPress = {() => this.linkOut('https://focusdating.co/contact.html')} >
                <Label>Help/Support</Label>
                <Input disabled />
              </Item>
              <Item fixedLabel >
                <Label>Rate Us</Label>
                <Input disabled />
              </Item>
              <Item fixedLabel onPress = {() => this.linkOut('https://focusdating.co/privacy.html')}  >
                <Label>Privacy Policy</Label>
                <Input disabled />
              </Item>
              <Item fixedLabel onPress = {() => this.linkOut('https://focusdating.co/terms.html')} >
                <Label>Terms</Label>
                <Input disabled />
              </Item>
              {/* <ListItem style={{flexDirection: "row", justifyContent: "flex-start"}} itemDivider>
                <Text>Other stuff...</Text>
              </ListItem> */}
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                <Button transparent onPress = {() => this.signOutUser()}  >
                  <Text style = {{color: 'red'}}>Log out</Text>
                </Button>
              </View>
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                <Button transparent onPress = {() => this.deleteUser()}>
                  <Text style = {{color: 'red'}}>Delete Account</Text>
                </Button>
              </View>
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                {status}
              </View>
            </Form>
          </View>
        </Content>
      </Container>
    );
  }
}


export default Settings;



