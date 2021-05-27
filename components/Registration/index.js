import React, { Component } from 'react';
import { Linking, StyleSheet, KeyboardAvoidingView, Image, Alert, Dimensions, Modal, ScrollView, Platform, TextInput, TouchableOpacity } from 'react-native';
import RNfirebase from 'react-native-firebase';
import BlurOverlay,{closeOverlay,openOverlay} from 'react-native-blur-overlay';
import DatePicker from 'react-native-datepicker';
import ImagePicker from 'react-native-image-crop-picker';
import Slider from '@react-native-community/slider';
import ImageViewer from 'react-native-image-zoom-viewer';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Geocoder from 'react-native-geocoding';
import * as Progress from 'react-native-progress';
import Geolocation from '@react-native-community/geolocation';
import RNFetchBlob from 'rn-fetch-blob';
import * as firebase from "firebase";
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCog, faUsers, faPlus, faChevronLeft, faImage, faCamera } from '@fortawesome/free-solid-svg-icons';

import {
  ActionSheet,
  Card,
  CardItem,
  Container,
  Content,
  Form,
  Text,
  Button,
  Item,
  Input,
  InputGroup,
  Icon,
  Label,
  ListItem,
  Left,
  Thumbnail,
  Toast,
  Textarea,
  Right,
  Switch,
  Body,
  View,
  List,
  ProgressBar,
  H3,
  H2,
  H1
} from "native-base";

//shortcut to Analytics
// let Analytics = RNfirebase.analytics();

// const primaryColor = "#8A6077";
// const secondaryColor = "#EF8275";
// const primaryColor = "#914cd5";
// const secondaryColor = "#ee9e45";

const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";
const btnColor = 'white';
const btnTextColor = primaryColor;
    

var REVIEW_OPTIONS = [
  'Endorse Someone New',  
  'Endorse Back',
  'Remove Endorsement',
  'Cancel',
];

var PROFILE_OPTIONS = [
  'View Profile',  
  'Edit Profile',
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

class Registration extends Component {

  constructor(props){
    super(props)
    //Analytics.setAnalyticsCollectionEnabled(true);

  this.state = {
      imageViewerVisible: false,
      selectedImage:[{url: ''}],
      imageIndex: 0,
      aboutMeRows: 16,
      profileMaxHeight: "15%",
      profileViewerVisible: false,
      editProfileVisible: false,
      forceUpdate: false,
      progress: 0.1,
      stepIndex: 0,
      currentStepValidated: false,
      profile: {
        about: '',
        showToast: false,
        images: [{0:{url:'https://focusdating.co/images/user.jpg'}}],
        first_name: null,
        last_name: null,
        latitude: null,
        longitude: null,
        gender: 'Select',
        interested: 'Select',
        max_distance: 100,
        birthday: '',
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
      },
      steps: [
        {
          progress: 0.09,
          title: 'My name is',
          subtitle: 'Hello?',
          back: false,
          input: 'name',
          required: true,
        },
        // {
        //   progress: 0.2,
        //   title: 'I identify as',
        //   subtitle: 'Seat up or seat down?',
        //   back: true,
        //   input: 'gender',
        //   required: true
        // },
        {
          progress: 0.19,
          title: 'My birthday is',
          subtitle: 'When did you make your debut into this world?',
          back: true,
          input: 'birthday',
          required: true
        },
        {
          progress: 0.31,
          title: 'I work at',
          subtitle: 'How are the bills paid?',
          back: true,
          input: 'work',
          required: true
        },
        {
          progress: 0.42,
          title: 'My school is',
          subtitle: 'Street smarts or book smarts?',
          back: true,
          input: 'school',
          required: false
        },
        {
          progress: 0.62,
          title: 'About me',
          subtitle: 'I am unique because?',
          back: true,
          input: 'about',
          required: false
        },
        {
          progress: 0.72,
          title: 'Interested in',
          subtitle: 'what is your type?',
          back: true,
          input: 'lookingFor',
          required: true
        },
        {
          progress: 0.82,
          title: "Preferred age",
          subtitle: 'Spring chicken or silver fox?',
          back: true,
          input: 'preferredAge',
          required: true
        },
        {
          progress: 0.92,
          title: 'Preferred max distance',
          subtitle: 'How far is too far?',
          back: true,
          input: 'preferredMaxDistance',
          required: true
        },
        {
          progress: 100,
          title: 'My photos',
          subtitle: 'Love the smile?',
          back: true,
          input: 'photos',
          required: true
        }
      ]
    }
  }




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
    RNfirebase.analytics().setCurrentScreen('Registration', 'Registration');
    RNfirebase.analytics().setUserId(userId);
    //trigger these user property functions when user updates each of their settings
    RNfirebase.analytics().setUserProperty('name', dataSnapshot.val().first_name+' '+dataSnapshot.val().last_name);
    RNfirebase.analytics().setUserProperty('about', dataSnapshot.val().about);
    RNfirebase.analytics().setUserProperty('birthday', (dataSnapshot.val().birthday ? dataSnapshot.val().birthday : 'empty' ));
    RNfirebase.analytics().setUserProperty('education', dataSnapshot.val().education);
    RNfirebase.analytics().setUserProperty('gender', dataSnapshot.val().gender);
    RNfirebase.analytics().setUserProperty('gender_pref', dataSnapshot.val().gender_pref);
    RNfirebase.analytics().setUserProperty('interested', dataSnapshot.val().interested);
    RNfirebase.analytics().setUserProperty('status', dataSnapshot.val().status);
    RNfirebase.analytics().setUserProperty('work', dataSnapshot.val().work);
   //convert the below numbers to strings
    RNfirebase.analytics().setUserProperty('last_conversation_count', dataSnapshot.val().last_conversation_count.toString());
    RNfirebase.analytics().setUserProperty('swipe_count', dataSnapshot.val().swipe_count.toString());
    RNfirebase.analytics().setUserProperty('max_age', dataSnapshot.val().max_age.toString());
    RNfirebase.analytics().setUserProperty('max_distance', dataSnapshot.val().max_distance.toString());
    RNfirebase.analytics().setUserProperty('min_age', dataSnapshot.val().min_age.toString());
    RNfirebase.analytics().setUserProperty('last_login', dataSnapshot.val().last_login.toString());
    RNfirebase.analytics().setUserProperty('last_swipe_sesh_date', dataSnapshot.val().last_swipe_sesh_date.toString());
    RNfirebase.analytics().setUserProperty('notifications_match', dataSnapshot.val().notifications_match.toString());
    RNfirebase.analytics().setUserProperty('notifications_message', dataSnapshot.val().notifications_message.toString());
    })

    

  }  

  //After component mounts prompt for permission to recieve notifications and save fcmToken to database
  componentDidMount() {
      
    //send vaidate function to nav as param, so that it can be referenced in the navigation. 
    this.props.navigation.setParams({ validate: this.validateSettings });

    //send finishRegistration function to nav as param, so that it can be referenced in the navigation. 
    this.props.navigation.setParams({ validate: this.finishRegistration });
   
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
    // try {
    //   let fcmToken = await AsyncStorage.getItem('fcmToken');
    //   if (!fcmToken) {
    //       fcmToken = await RNfirebase.messaging().getToken();
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
        await RNfirebase.messaging().requestPermission();
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
    RNfirebase.analytics().setUserProperty('notifications_message', this.state.profile.notifications_message.toString());

    //update firebase with new value, then update state
    firebaseRef.update({notifications_message: bool})
    .then(this.setState({profile: { ...this.state.profile, notifications_message: bool}}))

  }

  onPressHandle2 = () => {

    //take opposite of current value from state
    let bool = this.state.profile.notifications_match == true ? false : true;

    //record in analytics that user was doesn't want notifications 
    RNfirebase.analytics().setUserProperty('notifications_match', this.state.profile.notifications_match.toString());

    //update firebase with new value, then update state
    firebaseRef.update({notifications_match: bool})
    .then(this.setState({profile: { ...this.state.profile, notifications_match: bool}}))

  }


  //function to get update users current location. 
  getLocation = () => {

    //save ref to current user in db. 
    firebaseRefCurrentUser = firebase.database().ref('/users/' + userId);

    //request authorization to location services
    Geolocation.requestAuthorization();

    //convert location geo data into location data
    Geolocation.watchPosition(
      position => {
        Geocoder.from(position.coords.latitude, position.coords.longitude)
        .then(json => {
                let city_address_component = json.results[0].address_components[2];
                let state_address_component = json.results[0].address_components[4];
                let city_state = city_address_component.long_name+', '+state_address_component.short_name;
                firebaseRefCurrentUser.update({city_state: city_state, latitude: position.coords.latitude, longitude: position.coords.longitude});
        })
        .catch(error => console.warn(error));
      },
      error => console.log(error.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  }



  profileComplete = () => {
    
    //check that all required fields are present.
    let first_nameValidated = this.state.profile.first_name !== '';
    let genderValidated = this.state.profile.gender !== 'select' ;
    let birthdayValidated = this.state.profile.birthday !== '';
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
    let firebaseRef = firebase.database().ref('/users/' + userId);

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

  //function to validate settings
  finishRegistration = () => {

    const { state, navigate } = this.props.navigation;
    let firebaseRef = firebase.database().ref('/users/' + userId);

    //update db to intialUser = false, if not already. This will move user to swipes on login and they will appear in matches
    firebaseRef.update({intialUser: false});

    //redirect to swipes and pass params if getMatches needs to be force updated. 
    this.props.navigation. navigate("Swipes", {forceUpdate: this.state.forceUpdate, swipeCount: this.state.profile.swipe_count});


    }


  //function to sign out user
  signOutUser = async () => {
      const { state, navigate } = this.props.navigation;

      try {
          //record in analytics that user was logged out successfully 
          RNfirebase.analytics().logEvent('userLoggedOut', {
            testParam: 'testParamValue1'
          });
          navigate("Login");
          await firebase.auth().signOut();
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

      var user = firebase.auth().currentUser;

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
          RNfirebase.analytics().logEvent('userDeleted', {
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

  //function to update name or images or reviews
  updateData = (type, userid, payload) => {

    //record in analytics the event that a profile was updated successfully 
    RNfirebase.analytics().logEvent('profileUpdated', {
      type: payload
    });

    // console.log('type: '+JSON.stringify(type) +'payload length is: '+JSON.stringify(payload.length.toString()));
    //THIS IS BREAKING SINCE WHEN PASSING TO DB OBJECT FOR CASE REVIEWS, IT CAN'T BE CONVERTED TO STRING. 
    // //record in analytics the updated user property 
    // RNfirebase.analytics().setUserProperty(type, payload.length.toString());
                                                  
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

	//when user updates gender derive their gender_pref bases on who they're interested in. trigger in callback of updating state with dropdown, since will be using state data to derive gender_pref. 
	updateGenderOrInterested = (type) => {

    console.log('this.state.profile.gender is: '+this.state.profile.gender)
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
    let Analytics = RNfirebase.analytics();
    //call firebase if code exists and is not expired
    firebase.database().ref("/codes").orderByChild("sharable_code").equalTo(userCode.toUpperCase()).once("value",codeSnap => {
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
            firebase.database().ref('/codes/'+key).update({expired_date: new Date().getTime(), expired: true, created_for: userId });
            
            // save reference to where to save the new review object 
            firebaseProfileRefReviews = firebase.database().ref('/users/'+userId+'/reviews/'+key);

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

  //function to renderReviews into markup
  _renderReview = () => {
    const { navigate } = this.props.navigation;

    //check if reviews are empty, if so, show empty state. 
    if(!this.state.profile.reviews){
      
      //return empty state
      return (
        
        
        
        <ListItem noBorder style={{flexDirection: "column", justifyContent: "center", backgroundColor: secondaryColor, marginLeft: 0, height: 120}}>
          <Text style={{color: 'white', textAlign: 'center'}}>If a friend invited you, you'll see why here.</Text>          
          <Button 
            disabled = {!this.state.currentStepValidated}
            rounded 
            style={{
              justifyContent: 'center',
              marginTop: 10, 
              width: 200,
              backgroundColor: btnColor, 
              borderRadius: 20,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 3,
              },
              shadowOpacity: 0.29,
              shadowRadius: 4.65, }} 
              onPress = {() => this._closeAndEndorse()}
              >
            <Text style={{color: btnTextColor}}>Invite Friend</Text>
          </Button>
        
        
        
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
          <ListItem key={index} avatar noBorder button 
          onPress={()=> ActionSheet.show(
          {
            options: REVIEW_OPTIONS,
            cancelButtonIndex: 3,
            destructiveButtonIndex: 3,
            title: 'Endorse'
          },
          (buttonIndex) => {
            if ((buttonIndex) === 0) {
              //close editProfile modal
              this.setState({ editProfileVisible: false});
              //open refer module
              navigate("Refer", {flow: 'endorse' });
              }

            if ((buttonIndex) === 1) {
              //close editProfile modal
              this.setState({ editProfileVisible: false});
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
              RNfirebase.analytics().logEvent('reviewDeleted', {
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

      </View>
      );
    }
  }

      //function to validate current step and update state with result
      validateCurrentStep = () => {

        //save current steps name into variable
        let step = this.state.steps[this.state.stepIndex].input;
        //save state of fields that needs to be validated.
        let first_nameValidated = this.state.profile.first_name !== '';
        let genderValidated = this.state.profile.gender !== 'select' ;
        let birthdayValidated = this.state.profile.birthday !== '';
        let workValidated = this.state.profile.work !== '';
        let educationValidated = this.state.profile.education !== '';
        let aboutValidated = this.state.profile.about !== '';
        let interestedValidated = this.state.profile.interested !== 'select';
        //valide if photo step is validated by checking if first imaage is the default image, if not images must be validated. 
        let photosValidated = this.state.profile.images['0'].url !== "https://focusdating.co/images/user.jpg";

        // //update photosValidated by checking if images exist
        // if (this.state.profile.images){
          
        //   //then if first photo is default, return that photo step is not validated in let
        //   let photosValidated = this.state.profile.images['0'].url !== "https://focusdating.co/images/user.jpg";

        // }else{
        //  //else photos validated true
        //   let photosValidated = true;
        // }
        

        //save styling button to be disabled or not. 
        let btnColorState = this.state.currentStepValidated  ? btnColor : btnColor; 

        switch(step) {
          case 'name':
            //check if name has a value in it, if so, update currentStepValidated to true
            this.setState({ currentStepValidated: first_nameValidated })
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
  
              //update with db with new data from current step
                switch (step) {
                           
                 case 'name': //when name step is selected
                     this.updateData('name', userId, this.state.profile.first_name);            
                     break;
                 case 'work': //when work step is selected
                     this.updateData('work', userId, this.state.profile.work);
                     break;
                
                 case 'school'://when school step is selected
                      this.updateData('education', userId, this.state.profile.education);
                      break;
                
                 case 'about'://when about step is selected
                     this.updateData('about', userId, this.state.profile.about);
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




      //handle scroll of profile by growing/shrinking container when user scrolls and expects that. 
      _handleScroll = (event: Object) => {

        var currentOffset = event.nativeEvent.contentOffset.y;
        var direction = currentOffset > this.offset ? 'down' : 'up';
        this.offset = currentOffset;
        if((direction == 'down') && (currentOffset > 0) && (this.state.profileMaxHeight == '15%')){
        
          //grow up to 15%
          this.setState({ profileMaxHeight: '33%'});
  
        }else if ((direction == 'up') && (currentOffset < 0) && ((this.state.profileMaxHeight == '33%')) ){
          
          //shrink down to 15%
          this.setState({ profileMaxHeight: '15%'});
             
        }
      }

  render() {

    //btnColor is purple if first_name is completed, else it's grey. 
    let btnColorState = this.state.currentStepValidated  ? 'white' : 'grey'; 
    let placeHolderColor = this.state.currentStepValidated ? 1 : 0.25;
    let textColor = '#404040';

    
    //resume/pause button toggle
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

    //char remaining value for the about me step
    let charRemainingCopy = (30 - this.state.profile.about.length);

    //format images for imageViewer .. not sure why images obj in state didnt' work direclty... 
    let profileImages = this.state.profile.images.map(image => ({ url: image.url }));
    console.log('profileImages? :'+JSON.stringify(profileImages));
 
    return (
      <LinearGradient style={{
        flex: 3,
        alignItems: 'center',
        justifyContent: 'center',
        //backgroundColor: primaryColor, dimensions
        }}
        colors={[primaryColor, secondaryColor]}
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

          <Modal 
            visible={this.state.profileViewerVisible} 
            transparent={false}
            animationType="slide">
          
            
            <ImageViewer 
              index = {this.state.imageIndex}
              imageUrls={profileImages}
              //imageUrls={this.state.profile.images}
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
                      backgroundColor:'white'
                    }}>
                      <TouchableOpacity>
                        <Card transparent style={{padding : 10}}>   
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



        <Modal 
          visible={this.state.imageViewerVisible} 
          transparent={true}
          animationType="slide">
            <ImageViewer 
              imageUrls={this.state.selectedImage}
              onSwipeDown = {() => this.setState({ imageViewerVisible: false})}
              onClick = {() => this.setState({ imageViewerVisible: false})}
            />
        </Modal>
       



          <View style={{
            flex: 2,
            paddingTop: 0,
            flexDirection: "column"
          }}>
            <View style={{backgroundColor: 'white', height: 50}}>
            </View>
            <View style={{}}>
              <Progress.Bar borderWidth={0} borderRadius={0} unfilledColor={primaryColor} color={secondaryColor} progress={this.state.steps[this.state.stepIndex].progress} height={15} width={deviceWidth} />
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
                height: 0
              },
              dateTouchBody: {
                width: 0,
                height: 0
              },
              dateText: {
                width: 0
              }, 
              datePicker: {
                backgroundColor: '#d1d3d8',
                justifyContent:'center'
              }
            }}
            onDateChange={(date) => firebaseRef.update({birthday: date})
            .then(this.setState({profile: { ...this.state.profile, birthday: date }}, () => {
                this.validateCurrentStep(), this.preferredAgeRange(date)
                }
              )
            )
            .then(this.updateData('birthday', userId, date))
          
            
          }

          />

    
        <View style={{ flex: 6, justifyContent: 'flex-start', width: deviceWidth-100,   }} >

          <View style={{   }}>
              <Text style={{ 
                color: 'white', 
                fontSize: 35, 
                textAlign: 'left',
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.29,
                shadowRadius: 4.65,}} >{this.state.steps[this.state.stepIndex].title}
              </Text>
          </View>

          <View style={{ flex: 5, justifyContent: "center"}}>


          { (this.state.steps[this.state.stepIndex].input == 'name' ) && //show name step


            <InputGroup  borderType="underline" style={{ paddingLeft: 0, marginBottom: 15}} >
              <Input 
                  style={{ paddingLeft: 0, fontSize: 25, minHeight: 40, maxHeight: 250, color: 'white',}}
                  placeholder='First name ...'
                  placeholderTextColor = "white"
                  opacity = {placeHolderColor}
                  multiline={true}
                  value={this.state.profile.first_name}
                  onChangeText={(newname) => this.setState({ profile: { ...this.state.profile, first_name: newname} }, () => {
                    this.validateCurrentStep();
                  })}  
                  onEndEditing={(e: any) => this.updateData('name', userId, e.nativeEvent.text)}                         
                />
            </InputGroup> 


          }


          {  //show gender step

          <InputGroup  
          disabled 
          borderType="underline" 
          style={{ 
            display: this.state.steps[this.state.stepIndex].input == 'gender' ? 'flex':'none', 
            marginBottom: 15, 
            paddingLeft: 0,
            width: deviceWidth-100,
            justifyContent: "center"
            }} >
              
            {/* <View style={{flexDirection: "column"}}> //2 button design here
              <Button 
                rounded 
                bordered 
                onPress = {() => this.manageStep('continue')}
                style={{ width: deviceWidth/2, backgroundColor: 'white', borderColor: btnColor, justifyContent: "center", marginBottom: 15}}> 
                  <Text style={{color: 'black'}}>Male</Text>
              </Button>    

              <Button 
                rounded 
                bordered 
                onPress = {() => this.manageStep('continue')}
                style={{ width: deviceWidth/2, backgroundColor: 'white', borderColor: btnColor, justifyContent: "center"}}> 
                  <Text style={{color: 'black'}}>Female</Text>
              </Button>   
            </View> */}
 
            <TextInput 
                  style = {{fontSize: 25, textTransform: "capitalize", color: textColor}} 
                  autoCapitalize = "characters"
                  autoCorrect = {true}
                  value = {this.state.profile.gender} 
                  onFocus={
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
              </TextInput>
          </InputGroup> 
          }

          { (this.state.steps[this.state.stepIndex].input == 'birthday' ) && //show birthday step
            <InputGroup disabled borderType="underline" style={{ paddingLeft: 0, marginBottom: 15}} >
              <Input 
                style={{ paddingLeft: 0, fontSize: 25, minHeight: 40, maxHeight: 250, color: 'white',}}
                placeholder='Select a date'
                placeholderTextColor = "white"
                opacity = {placeHolderColor}
                multiline={true}
                value={this.state.profile.birthday}
                onFocus={() => this.datePicker.onPressDate()}                         
              />
            </InputGroup> 
          }
          
          { (this.state.steps[this.state.stepIndex].input == 'work' ) && //show work step
            <InputGroup disabled borderType="underline" style={{ paddingLeft: 0, marginBottom: 15}} >
              <Input 
                style={{ paddingLeft: 0, fontSize: 25, minHeight: 40, maxHeight: 250, color: 'white',}}
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
              style={{ paddingLeft: 0, fontSize: 25, minHeight: 40, maxHeight: 250, color: 'white',}}
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

          { (this.state.steps[this.state.stepIndex].input == 'about' ) && //show about me step
              
              
              <View style={{ 
                flex: 3, 
                width: 300, }}>

              <Form>
                <Textarea
                  rowSpan={this.state.aboutMeRows}
                  opacity = {placeHolderColor} 
                  bordered                
                  placeholder='I am unique because ...'
                  onContentSizeChange={(e) => console.log('updated size')}
                  onChangeText={(newabout) => this.setState({profile: { ...this.state.profile, about: newabout}}, () => {
                    this.validateCurrentStep();
                  })}
                  value={this.state.profile.about}
                  onEndEditing={(e: any) => this.updateData('about', userId, e.nativeEvent.text)}             
                  placeholderTextColor = "white"
                  onFocus={()=>{this.setState({aboutMeRows: 9})}}
                  style={{ 
                    fontSize: 25,
                    color: 'white',              
                    backgroundColor : "#0000",
                    borderRadius: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                }}            
                />
              </Form>
              { ((this.state.profile.about.length > 0) && (this.state.profile.about.length < 30)) &&
                  <Text style={{fontSize:13, color: 'white'}} >{((this.state.profile.about.length < 30) && this.state.profile.about)? charRemainingCopy : null } characters sugggested remains</Text>
                }
            </View>  

                        
              
              
              
              
            //   <View style={{       }} >

            //     <InputGroup  
            //       style={{ paddingLeft: 0, marginTop: 70,                
            //          }} >                      
            //       <Input 
            //           style={{
            //             color: 'white', 
            //             paddingLeft: 0, 
            //             fontSize: 25, 
            //             //backgroundColor: 'rgba(52, 52, 52, 0.2)',
                        
            //             borderColor: 'lightgrey', 
            //             borderWidth: 0.25, 
            //             height:190, 
            //             minHeight: 20, 
            //             maxHeight: 400,

            //           }}
            //           multiline={true}
            //           placeholder='I am unique because ...'
            //           onContentSizeChange={(e) => console.log('updated size')}
            //           value={this.state.profile.about}
            //           onChangeText={(newabout) => this.setState({profile: { ...this.state.profile, about: newabout}}, () => {
            //             this.validateCurrentStep();
            //           })}
            //           onEndEditing={(e: any) => this.updateData('about', userId, e.nativeEvent.text)}             
            //         />
            //     </InputGroup> 
                // { ((this.state.profile.about.length > 0) && (this.state.profile.about.length < 30)) &&
                //   <Text style={{fontSize:13, color: 'white'}} >{((this.state.profile.about.length < 30) && this.state.profile.about)? charRemainingCopy : null } characters sugggested remains</Text>
                // }
            //   </View>
             }



            { (this.state.steps[this.state.stepIndex].input == 'lookingFor' ) && //show lookingFor step
              

                  <View style={{flex: 1, flexDirection: "column", justifyContent: 'center'}}> 
                    
                    <Button // Male button
                    style={{ 
                      justifyContent: 'center',
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
                        <Text style={{color: btnTextColor,}}>Men</Text>
                    </Button>  




                    <Button // Female button
                    style={{ 
                      justifyContent: 'center',
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
                        <Text style={{color: btnTextColor,}}>Women</Text>
                    </Button>  



                    <Button // Both button
                    style={{ 
                      justifyContent: 'center',
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
                      onPress = {() => this.setState({profile: { ...this.state.profile, interested: "Both"}}, () => {
                        this.updateGenderOrInterested('interested');
                        this.manageStep('continue');
                        }) 
                      }>                         
                        <Text style={{color: btnTextColor,}}>Both</Text>
                    </Button>  

                  </View>
        
              }

              { (this.state.steps[this.state.stepIndex].input == 'preferredAge' ) && //show preferredAge step
              
                <View>
                  <View  style={{ marginBottom: 15}} >
                    
                      <Text style={{color: 'white', textAlign: 'center',  fontSize: 35}} >
                        {this.state.profile.min_age} - {this.state.profile.max_age == 70 ? '70+' : this.state.profile.max_age+' '}
                      </Text>
                    
                    <MultiSlider 
                      min={18}
                      max={70}
                      values={[this.state.profile.min_age,this.state.profile.max_age]} 
                      unselectedStyle = {{backgroundColor: 'white'}} 
                      selectedStyle = {{backgroundColor: 'white'}} 
                      sliderLength={deviceWidth-100} 
                      markerStyle={{ height:30, width: 30, borderRadius: 15, backgroundColor:'white', borderColor: primaryColor, borderWidth: 1}} 
                      trackStyle={{ borderRadius: 7, height: 2 }} 
                      containerStyle={{ width: 170}}
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
                </View>
              }

              { (this.state.steps[this.state.stepIndex].input == 'preferredMaxDistance' ) && //show preferredMaxDistance step
              <View>
                <View  style={{ marginBottom: 15 }} >

                    <Text style={{color: 'white', textAlign: 'center', fontSize: 35}} >
                      { this.getMiles(this.state.profile.max_distance) == 200 ? this.getMiles(this.state.profile.max_distance)+'+ Miles' : this.getMiles(this.state.profile.max_distance)+' Miles'  }
                    </Text>


                    <MultiSlider 
                      enabledTwo={false}
                      min={10}
                      max={200}
                      values={[this.getMiles(this.state.profile.max_distance)]}
                      unselectedStyle = {{backgroundColor: 'white'}} 
                      selectedStyle = {{backgroundColor: 'white'}} 
                      sliderLength={deviceWidth-100} 
                      markerStyle={{ height:30, width: 30, borderRadius: 15, backgroundColor:'white', borderColor: primaryColor, borderWidth: 1}} 
                      trackStyle={{ borderRadius: 7, height: 2 }} 
                      containerStyle={{ width: 170}}
                      onValuesChange={(val) => 
                        this.setState({profile: { ...this.state.profile, max_distance: this.getMeters(val)}}, () => {
                          this.getLocation();
                        })
                      }
                      onValuesChangeFinish={(val) => firebaseRef.update({max_distance: this.getMeters(val)})}
                      />

                    </View> 
                  </View>          
                }

                { (this.state.steps[this.state.stepIndex].input == 'photos' ) && //show photos step
                                                           
                      <ScrollView contentContainerStyle={{   flexGrow: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-around' }}>

                        {this.state.profile.images['0'].url !== 'https://focusdating.co/images/user.jpg' ? Object.entries(this.state.profile.images).map((i, n) => <View key={i[0]}>{this.renderAsset(i[1], i[0])}</View>) : null}                
                       
                        {this._renderPlacedholderImages()}
                       
                      </ScrollView>
                    
                }


            <Text style={{display: 'none' ,color: 'grey', fontSize: 12}}>{this.state.steps[this.state.stepIndex].subtitle}</Text>              
          </View>

        </View>

          <View style={{ flex: 3, justifyContent: 'center'}}>
          
          
          { (this.state.steps[this.state.stepIndex].input == 'photos' ) && //show footer buttons on photos step
              <View>

                <Button 
                    rounded  
                    //disabled = {!this.state.currentStepValidated}
                    onPress = {() => this.state.currentStepValidated ? this.finishRegistration() : Alert.alert("Sorry", "You'll need atleast one photo first.")}
                    opacity = {placeHolderColor}
                    style={{ 
                      justifyContent: 'center', 
                      marginBottom: 10,
                      width: 200, 
                      backgroundColor: btnColorState,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 3,
                      },
                      shadowOpacity: 0.29,
                      shadowRadius: 4.65,}}> 
                      <Text style={{color: btnTextColor}}>See Matches</Text>
                    </Button> 

          
                    <Button                      
                    transparent
                    //disabled = {!this.state.currentStepValidated}
                    onPress = {() => this.state.currentStepValidated ? this.setState({ profileViewerVisible: true}) : Alert.alert("Sorry", "You'll need atleast one photo first.")}
                    //opacity = {placeHolderColor}
                    style={{                     
                      justifyContent: 'center', 
                      width: 200, }}> 
                      <Text style={{ color: 'white'}}>See Profile</Text>
                    </Button> 

        </View>

          }

          { (this.state.steps[this.state.stepIndex].input != 'lookingFor' && this.state.steps[this.state.stepIndex].input != 'photos') && //show continue button if not on photos or lookingfor step
              
            
              <Button 
                rounded  
                disabled = {!this.state.currentStepValidated}
                onPress = {() => this.manageStep('continue')}
                opacity = {placeHolderColor}
                style={{
                  marginBottom: 40, 
                  justifyContent: 'center', 
                  width: 200, 
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
        
     
      
 
    );
  }
}


export default Registration;



