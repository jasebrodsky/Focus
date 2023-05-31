import React, { Component } from 'react';
import { Linking, StatusBar, Image, Alert, Dimensions, Modal, ScrollView, Platform, TouchableOpacity, Keyboard, KeyboardAvoidingView, StyleSheet} from 'react-native';
import RNfirebase from 'react-native-firebase';
import BlurOverlay,{closeOverlay,openOverlay} from 'react-native-blur-overlay';
import DatePicker from 'react-native-datepicker';
import ImagePicker from 'react-native-image-crop-picker';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Slider from '@react-native-community/slider';
import ImageViewer from 'react-native-image-zoom-viewer';
import LinearGradient from 'react-native-linear-gradient';
import Geocoder from 'react-native-geocoding';
import Geolocation from '@react-native-community/geolocation';
import RNFetchBlob from 'react-native-fetch-blob';
import * as firebase from "firebase";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCog, faUsers, faPlus, faArrowAltCircleLeft } from '@fortawesome/free-solid-svg-icons';
import SplashScreen from 'react-native-splash-screen';
import { renderNotification, handleNotification } from '../Utilities/utilities.js';
const geofire = require('geofire-common');


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
  Label,
  ListItem,
  Left,
  Thumbnail,
  Toast,
  Right,
  Switch,
  Body,
  View,
  List,
  H1,
  H3,
} from "native-base";

//shortcut to Analytics
// let Analytics = RNfirebase.analytics();

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
  'Nonbinary',
  'Cancel',
];

var GENDER_MATCH_OPTIONS = [
  'Male',
  'Female',
  'Everyone',
  'Cancel',
];
var DESTRUCTIVE_INDEX = 2;
var CANCEL_INDEX = 2;

Geocoder.init('AIzaSyCbt43Up1r0ywnqWX2xxMWGiwWJ3CSBrAI');

class Dashboard extends Component {

  constructor(props){
    super(props)
    //Analytics.setAnalyticsCollectionEnabled(true);

  this.state = {
      imageViewerVisible: false,
      selectedImage:[{url: ''}],
      imageIndex: 0,
      profileMaxHeight: "15%",
      profileViewerVisible: false,
      editProfileVisible: false,
      forceUpdate: false,
      profile: {
        showToast: false,
        images: [{0:{url:'https://focusdating.co/images/user.jpg'}}],
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
        <FontAwesomeIcon size={ 32 } style={{ color: 'lightgrey'}} icon={ faCog } />
        ),
      headerRight: () => (
        <Button transparent style={{width: 100, flex: 1, justifyContent: 'flex-end', }} onPress={navigation.getParam('validate')}>
          <FontAwesomeIcon size={ 32 } style={{ right: 16, color: primaryColor}} icon={ faUsers } />
        </Button>
      ),

    };
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
      }),

    RNfirebase.analytics().setAnalyticsCollectionEnabled(true);
    RNfirebase.analytics().setCurrentScreen('Dashboard', 'Dashboard');
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
    RNfirebase.analytics().setUserProperty('notifications_match', dataSnapshot.val().notifications_match.toString());
    RNfirebase.analytics().setUserProperty('notifications_message', dataSnapshot.val().notifications_message.toString());
    })

    this.getLocation();

  }  

  //After component mounts prompt for permission to recieve notifications and save fcmToken to database
  componentDidMount() {

    //hide splash screen after app loads
    SplashScreen.hide();
      
    //send vaidate function to nav as param, so that it can be referenced in the navigation. 
    this.props.navigation.setParams({ validate: this.validateSettings });
   
    //check permissions
    this.checkPermission();
      //listen for notifications when module Focus
      const didFocus = this.props.navigation.addListener(
        'didFocus',
        payload => {
            
          //get notifications when arriving
          this.handleNotification(userId, 'Dashbaord', null);
  
        }
      );


      //stop listening for notifications, since each module has different logic so lis
      const didBlur = this.props.navigation.addListener(
          'didBlur',
          payload => {
                    
            let query = firebase.database().ref('/matches/' + userId).orderByChild('showNotification');
    
            //remove listener when leaving. 
            query.off('child_changed', this.state.listener);
          }
        );

  }  

  componentWillUnmount() {
    //navigator.geolocation.clearWatch(this.watchId);
    firebaseRef.off(); //detach listener to ref, so that extra fbdb calls arent' made and unmounted component isn't updated
  }

  showInstructions = () => {
    
    if (this.state.profile.showInstructionsSettings) {
      //openOverlay();
    };
  } 
  //handle notifications
  handleNotification = (userId, screen, matchUseridExclude ) => {

    let query = firebase.database().ref('/matches/' + userId).orderByChild('showNotification');

    let listener = query.on('child_changed', (notifySnapshot) => {
 
      //first check if there's a notification to render by checking if showNotification is true on the child_changed event on the match, also check that notificaiton has happened since module mounted, so old notificaitons aren't served.  
      if((notifySnapshot.val().showNotification == true) && (notifySnapshot.val().last_message_date*-1 < new Date().getTime())){
        //render notification based off the notification type
        switch (notifySnapshot.val().notificationType) {
          case 'newMatch':
            //don't notify of new match while on Swipes screen.
            if(screen !== 'Swipes'){
              renderNotification('New Match with '+notifySnapshot.val().name);
            }
            break;
          case 'newChat':
            //alert('matchUseridExclude is: '+matchUseridExclude); //WHY IS matchUserId being set to null here? 
            //don't notify of new chat while on chat screen and chatting with that user. Match to exclude is only sent on chat page.
             if (matchUseridExclude == notifySnapshot.val().match_userid){ //then check if person to exclude is not who you're talking to
                //don't notify when chat is open with user
                //alert('dont notify since need to exclude this user from sending you a notificaiton');
                break;
              }else{
                //must not be on chat page, since match_user_exclude is not set
                renderNotification('New Chat from '+notifySnapshot.val().name);
                break;
              }
            
          case 'newBlindDate':
            renderNotification('New Blind Date requested.');
            break;
          case 'planned': //blind date accepted
            renderNotification('Blind Date ready!');
            break;
          case 'accepted': //blind date accepted
            renderNotification('Blind Date accepted!');
            break;
          case 'declined': //blind date declined
            renderNotification('Blind Date declined.');
            break;                   
          case 'pendingUpdate': //blind date updated
            renderNotification('Blind Date updated.');
            break;
          case 'pending': //blind date updated
            renderNotification('Blind Date updated.');
            break;                 
          case 'conversationExtended':
            renderNotification(notifySnapshot.val().name+' has extended the conversation!');
            break;
          default:
            console.log(`Sorry, no matching notification type`);
        }

        //turn off notificationShow bool so it doesn't show again. 
        firebase.database().ref('/matches/' + userId +'/'+ notifySnapshot.key).update({
          'showNotification': false
        });  
        
        //save to state listner, so that it specific listener can be turned off when leaving 
        this.setState({ listener: listener });

      }
    })

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

  onPressHandle3 = () => {

    //take opposite of current value from state
    let bool = this.state.profile.notifications_daily_match == true ? false : true;

    //record in analytics that user was doesn't want notifications 
    RNfirebase.analytics().setUserProperty('notifications_daily_match', this.state.profile.notifications_daily_match.toString());

    //update firebase with new value, then update state
    firebaseRef.update({notifications_daily_match: bool})
    .then(this.setState({profile: { ...this.state.profile, notifications_daily_match: bool}}))

  }


  //function to get update users current location. 
  getLocation = () => {
    
    //save ref to current user in db. 
    firebaseRefCurrentUser = firebase.database().ref('/users/' + userId);

    let date = new Date();
    let offsetInMin = date.getTimezoneOffset();
  

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
                let city_state = cityText+', '+stateText.toUpperCase();
  
                //save hash of location.
                const hash = geofire.geohashForLocation([position.coords.latitude, position.coords.longitude]);
                //update firebase
                firebaseRefCurrentUser.update({ utc_offset_min: offsetInMin, city_state: city_state, latitude: position.coords.latitude, longitude: position.coords.longitude, geohash: hash });
      


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
    let birthdayValidated = this.state.profile.birthday !== 'select';
    let workValidated = this.state.profile.work !== '';
    let educationValidated = this.state.profile.education !== '';
    let aboutValidated = this.state.profile.about !== '';
    let interestedValidated = this.state.profile.interested !== 'select';

    //if all items are true, return true, else return false. 
    if ( educationValidated && first_nameValidated && workValidated && genderValidated && birthdayValidated && interestedValidated ){
      return true; 
    }else {
      return false
    } 
  }
  
  //update forceUpdate in state, so that swipes will be forced to updated when re-rendering. Needed for data 
  forceUpdate = () => {
    this.setState({ forceUpdate: true});
    
    RNfirebase.analytics().setUserProperty('min_age', this.state.profile.min_age.toString())
    RNfirebase.analytics().setUserProperty('max_age', this.state.profile.max_age.toString())
    RNfirebase.analytics().setUserProperty('max_distance', this.state.profile.max_distance.toString())

  }
  

  //function to validate settings
  validateSettings = () => {

    const { state, navigate } = this.props.navigation;
    let firebaseRef = firebase.database().ref('/users/' + userId);

    //check that all required fields are present.
    //let profileComplete = this.profileComplete();
    let profileComplete = true;


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
    this.setState({ editProfileVisible: false});

    navigate("Refer", {flow: 'invite' });  

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

		//update gender variable with selected gender
		let gender = this.state.profile.gender.toLowerCase(); //can be male or female
		let interested = this.state.profile.interested.toLowerCase() //can be either male,female, everyone, select. Will remain same. 
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
          <Text style={{textAlign: 'center', color: 'white', margin: 35}}> Use this screen to manage your profile, preferences, and settings. Tap anywhere to close. </Text>
      </View>
    );
}


  //function to renderReviews into markup
  _renderReview = () => {
    const { navigate } = this.props.navigation;

    //check if reviews are empty, if so, show empty state. 
    if(!this.state.profile.reviews){
      
      //return empty state
      return (

        <ListItem noBorder style={{justifyContent: "center", marginLeft: 0, paddingRight: 0, paddingTop: 0 }}>   
          <LinearGradient 
            style={{
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              padding: 10,
              }}
              colors={[primaryColor, secondaryColor]}
              start={{ x: 0, y: 0.1 }}
              end={{ x: 0.1, y: 1 }}
            >
              <Text style={{color: 'white', textAlign: 'center'}}>If a friend invited you, you'll see why here.</Text>          
              <Button 
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
            </LinearGradient>
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
              this.setState({ editProfileVisible: false, profileViewerVisible: false});
              //open refer module
              navigate("Refer", {flow: 'endorse' });
              }

            if ((buttonIndex) === 1) {
              //close editProfile modal
              this.setState({ editProfileVisible: false, profileViewerVisible: false});
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
    const { navigate } = this.props.navigation;
    let status; 

    if (this.state.profile.status == 'paused') {
      status = <Button transparent onPress = {() => this.resumeUser()}>
                  <Text style={{color: 'red', fontFamily:'HelveticaNeue' }}>Resume Account</Text>
                </Button> ;

    } else if (this.state.profile.status == 'active') {
      status = <Button transparent onPress = {() => this.pauseUser()}>
                  <Text style={{color: 'red', fontFamily:'HelveticaNeue'}}>Pause Account</Text>
                </Button>;
    }



    //determine width of device in order for custom margin between iphones
    let deviceWidth = Dimensions.get('window').width
    let deviceHeight = Dimensions.get('window').height


    //if device width is 414 (iphone+), then margins should be 58, else 40. 
    let genderMargin = deviceWidth == 414 ? 37 : 25;
    let birthdayMargin = deviceWidth == 414 ? 50 : 38;
    //calculate 18 year old birthday as the max date picker value. 
    var date = new Date();
    date.setFullYear(date.getFullYear() - 18, date.getMonth());

    
    
    //console.log('deviceWidth is: '+deviceWidth);
        
    return (
      <Container>
          <StatusBar 
            hidden={'hidden'} 
            barStyle={'dark-content'} 
            animated={true}
          />
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
            visible={this.state.editProfileVisible} 
            transparent={false}
            animationType="slide">
              <KeyboardAvoidingView 
                style={{ flex: 1,  }} 
                onStartShouldSetResponder={Keyboard.dismiss}             
                behavior={"position"}
                enabled>

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
            
            <ScrollView 
              ref='ScrollView_Reference'
              style={{height: '100%',}}
              
              contentContainerStyle={{
                flexGrow: 1,
                backgroundColor:'white',
                
                //justifyContent: 'center'
              }}>

                <View 
                  style ={{flexDirection: 'row', height: 70, justifyContent: 'center', }}>
                  
                  
                  <View 
                    style ={{flex: 1, alignItems: 'center', }}>
                  </View>   

                  <TouchableOpacity 
                    onPress = {() => this.setState({editProfileVisible: false})}
                    style ={{flex: 1, textAlign: 'center', justifyContent: 'flex-end'}}
                    >
                    <H1 style={{color: primaryColor}}>Edit Profile</H1>
                  </TouchableOpacity>   

                  <TouchableOpacity
                    transparent 
                    style ={{flex: 1, alignItems: 'center', justifyContent: 'flex-end'}}
                    onPress = {() => this.setState({editProfileVisible: false})}>
                    <Text style={{color: primaryColor, textAlign: 'center'}}>Done</Text>
                  </TouchableOpacity>  

                </View>

                <Form>
                
                <ListItem itemDivider style={{flexDirection: "row", justifyContent: "space-between"}}>
                  <Text>My photos</Text>
                  
                </ListItem>
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

  
                  <ListItem itemDivider style={{flexDirection: "row"}}>
                    <Text>About me</Text>

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

                <ListItem itemDivider style={{flexDirection: "row", justifyContent: "space-between"}}>
                  <Text>My friends think</Text>
                  <Button small transparent onPress = {() => this._codePrompt()}>
                    {/* <Text style={{color: primaryColor}}>Enter Refer Code</Text> */}
                  </Button>
                </ListItem>

                  {this._renderReview(this.state.profile.reviews)}

                </Form>
              </ScrollView>
            </KeyboardAvoidingView>
          </Modal> 

          <Modal 
            visible={this.state.profileViewerVisible} 
            animationType="slide">
            
            {(this.state.profileViewerVisible && !this.state.imageViewerVisible) && 
              <ScrollView 
                style={{
                  flex: 1,
                  backgroundColor: 'lightgrey'
                }} 
                
                contentContainerStyle={{
                  backgroundColor: 'white',
                  flexGrow: 1,
                  paddingTop: 40,
                  alignItems: 'center',
                  
                }}>
                  <View style={{ 
                    position: 'absolute',
                    zIndex: 2,
                    left: 5,
                    top: 40,}}>                  
                    <Button  
                      transparent 
                      style={{  
                        width: 90, 
                        height: 90, 
                        justifyContent: 'center',
                        shadowColor: "#000",
                        shadowOffset: {
                          width: 0,
                          height: 3,
                        },
                        shadowOpacity: 0.29,
                        shadowRadius: 4.65, }}
                      onPress = {() => this.setState({ profileViewerVisible: false})}>
                        <FontAwesomeIcon size={ 50 }     
                          style={{color: primaryColor}} 
                          icon={ faArrowAltCircleLeft } />
                    </Button>                  
                  </View>

                  <TouchableOpacity activeOpacity={1.0} onPress = {() => this.setState({ imageViewerVisible: true})}>
                    <Image style={{}} 
                      source={{
                        uri: this.state.profile.images[0].url,
                        width: deviceWidth,
                        height: deviceHeight-200
                      }} 
                    />

                  </TouchableOpacity>
                  <View style={{flex: 1, alignSelf: 'flex-start'}}>
                    <View>
                      <Card transparent style={{padding: 10}}>   
                        <H3 numberOfLines={1} style={{textTransform: 'capitalize', color: primaryColor}} >{this.state.profile.first_name}</H3>
                        <H3 numberOfLines={1} style={{textTransform: 'capitalize', color: primaryColor}} >{this.getAge(this.state.profile.birthday)}, {this.state.profile.gender}, {this.state.profile.city_state}</H3>
                        <Text numberOfLines={1} style={{}} >{this.state.profile.work} </Text>
                        <Text numberOfLines={1} style={{marginBottom: 10}} >{this.state.profile.education} </Text>
                        <Text note style={{marginTop: 10}}>{this.state.profile.about}</Text>
                      </Card>
                      <View style={{width: deviceWidth}}>
                        {this._renderReview(this.state.profile.reviews)}
                      </View>
                    </View>
                  </View>
                </ScrollView>
              }

              {this.state.imageViewerVisible && 
                <ImageViewer 
                  index = {this.state.imageIndex}
                  imageUrls={this.state.profile.images}
                  onChange = {(index) => this.setState({ imageIndex: index})}
                  onSwipeDown = {() => this.setState({ imageViewerVisible: false, imageIndex: this.state.imageIndex})}
                  onClick = {() => this.setState({ imageViewerVisible: false})}
                />  


               }   
            </Modal> 



   
        <Content>      
          
          <View style={{  flex: 1, padding: 0 }}>
                     
           <LinearGradient style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            //backgroundColor: primaryColor, dimensions
            }}
            colors={['#13131A', '#13131A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1.5, y: 1.5 }}
            >


            <TouchableOpacity 
              style={{marginTop: 20}}                        
              onPress={() => {
                //close overylay and set showInstructions to false, so they want show again. 
                  ActionSheet.show(
                    {
                      options: PROFILE_OPTIONS,
                      cancelButtonIndex: 2,
                      destructiveButtonIndex: 2,
                      title: 'Profile'
                    },
                    (buttonIndex) => {
                      if ((buttonIndex) === 0) {
                        //open view profile modall
                        this.props.navigation.navigate("Profile", {profile: this.state.profile, from: 'Dashboard', flow: 'view'}); 
                        }
          
                      if ((buttonIndex) === 1) {
                        //open edit profile modal
                        this.props.navigation.navigate("Profile", {profile: this.state.profile, from: 'Dashboard', flow: 'edit'}); 
                      }              
                    }                       
                  )
                }}
              >
                <Thumbnail 
                  style={{
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 3,
                    },
                    shadowOpacity: 0.8,
                    shadowRadius: 4.65,
                    width: 200, 
                    height: 200, 
                    marginBottom: 10, 
                    overflow: "hidden", 
                    borderRadius: 150, 
                    borderWidth: 1, 
                    borderColor: 'white' }} 
                  source={{uri: this.state.profile.images["0"].url, cache: 'force-cache'}} 
                />
            </TouchableOpacity>


              <Text numberOfLines={1} 
                  style={{
                    textTransform: 'capitalize', 
                    fontFamily:'HelveticaNeue-Bold', 
                    fontSize: 35,
                    color: primaryColor,
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 3,
                    },
                    shadowOpacity: 0.8,
                    shadowRadius: 4.65,}} >
                  {this.state.profile.first_name} | {this.getAge(this.state.profile.birthday)}
              </Text>
              <Text numberOfLines={1} style={{fontFamily:'Helvetica', fontSize: 20, color: 'white', marginBottom: 10}} >{this.state.profile.city_state}</Text>
              {/* <Text numberOfLines={1} style={{marginBottom: 10}} >{this.state.profile.work} </Text> */}
              {/* <Text numberOfLines={1} style={{marginBottom: 10}} >{this.state.profile.education} </Text> */}

           </LinearGradient>


            <Form>
 
              {/* <ListItem itemDivider style={{flexDirection: "row"}}>
                <Text>I am Dashboard ...</Text>
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
                <Label>Name Dashbaord</Label>
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
              </CardItem> */}


              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text style={styles.title}>My Preferences </Text>
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
                <Label style={styles.subtitle}>Gender</Label>
                <View style={styles.subtitle}>
                  <Button full disabled transparent >
                    <Text style={styles.subtitle}>{this.state.profile.interested}</Text>
                  </Button>                  
                </View>
              </Item>
            
              <Item fixedLabel>
                <Label style={styles.subtitle}>Age Range</Label>
                <MultiSlider 
                    min={18}
                    max={70}
                    values={[this.state.profile.min_age,this.state.profile.max_age]} 
                    unselectedStyle = {{backgroundColor: primaryColor}} 
                    selectedStyle = {{backgroundColor: primaryColor}} 
                    sliderLength={160} 
                    markerStyle={{ height:30, width: 30, borderRadius: 15, backgroundColor:'white', borderColor: 'white', borderWidth: 1}} 
                    trackStyle={{ borderRadius: 7, height: 4 }} 
                    containerStyle={{ width: 200, justifyContent: 'center', alignItems: 'flex-start'}}                                                         
                    onValuesChange={(val) => 
                        this.setState(prevState => ({
                            profile: {
                                ...prevState.profile,
                                min_age: val[0], max_age: val[1]
                            }
                        }))              
                    }
                                  
                    onValuesChangeFinish={(val) =>
                      firebaseRef.update({min_age: val[0], max_age: val[1]}).then(()=>{
                        this.forceUpdate();
                      })}                                                     
                  />
                  <Text style={{fontSize: 15, fontFamily:'Helvetica-Light', right:20}}>
                    {this.state.profile.min_age} - {this.state.profile.max_age == 70 ? '70+' : this.state.profile.max_age+' '}
                  </Text>

              </Item>

              {/* <Item fixedLabel>
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
                    this.forceUpdate(), //make swipes force update
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
              </Item> */}


              <Item fixedLabel>
                <Label style={styles.subtitle}>Max Dist</Label>
                <Slider
                  style={{ width: 168, right:40 }}
                  step={1}
                  minimumValue={10}
                  maximumValue={200}
                  minimumTrackTintColor={primaryColor}
                  maximumTrackTintColor={primaryColor}
                  value={this.getMiles(this.state.profile.max_distance)}
                  
                  onSlidingComplete={(val) => 
                    firebaseRef.update({max_distance: this.getMeters(val)},
                    this.forceUpdate() //make swipes force update
                  )}
                  
                  onValueChange={(val) => 
                   this.setState({profile: { ...this.state.profile, max_distance: this.getMeters(val)}})
                 }
                />
                <Text style={{ fontSize: 15, fontFamily:'Helvetica-Light', right:20}}>
                    {this.getMiles(this.state.profile.max_distance)} miles
                </Text>
              </Item>



              {/* <ListItem itemDivider style={{flexDirection: "row", justifyContent: "space-between"}}>
                <Text>My friends think...</Text>
                <Button small transparent onPress = {() => this._codePrompt()}>
                  <Text style={{color: primaryColor}}>Enter Refer Code</Text>
                </Button>
              </ListItem>

              {this._renderReview()} */}

              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text style={styles.title}>My notifications</Text>
              </ListItem>
              
          <ListItem>
            <Left>
              <Label style={styles.subtitle}>New Message</Label>
            </Left>
            
            <Body>              
            </Body>
            
            <Right>
              <Switch 
                value={this.state.profile.notifications_message}
                onValueChange={this.onPressHandle1}
                trackColor={{true: primaryColor,}}
               />
            </Right>
          </ListItem>

          <ListItem>
            <Left>
              <Label style={styles.subtitle}>New Match</Label>
            </Left>
            
            <Body>              
            </Body>
            
            <Right>
              <Switch 
                value={this.state.profile.notifications_match}
                onValueChange={this.onPressHandle2}
                trackColor={{true: primaryColor,}}
               />
            </Right>
          </ListItem>
          <ListItem>
            <Left>
              <Label style={styles.subtitle}>Daily Matches</Label>
            </Left>
            
            <Body>              
            </Body>
            
            <Right>
              <Switch 
                value={this.state.profile.notifications_daily_match}
                onValueChange={this.onPressHandle3}
                trackColor={{true: primaryColor,}}
               />
            </Right>
          </ListItem>

       
              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text style={styles.title}>Other...</Text>
              </ListItem>

               <Item fixedLabel onPress = {() => navigate("Intersitial", { flow: 'refer'})}>

                <Label style={styles.subtitle}>Refer Friend</Label>
                <Input disabled />
              </Item> 

              <Item fixedLabel onPress = {() => this.linkOut('https://focusdating.co')} >
                <Label style={styles.subtitle}>Help/Support</Label>
                <Input disabled />
              </Item>


              <Item fixedLabel onPress = {() => 
                 Linking.openURL('https://apps.apple.com/us/app/focus-blind-dating/1492965606') //use native review module here.
                }>
                <Label style={styles.subtitle}>Rate Us</Label>
                <Input disabled />
              </Item>
              <Item fixedLabel onPress = {() => this.linkOut('https://focusdating.co/privacy.html')}  >
                <Label style={styles.subtitle}>Privacy Policy</Label>
                <Input disabled />
              </Item>
              <Item fixedLabel onPress = {() => this.linkOut('https://focusdating.co/terms.html')} >
                <Label style={styles.subtitle}>Terms</Label>
                <Input disabled />
              </Item>
              {/* <ListItem style={{flexDirection: "row", justifyContent: "flex-start"}} itemDivider>
                <Text>Other stuff...</Text>
              </ListItem> */}
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                <Button transparent onPress = {() => this.signOutUser()}  >
                  <Text style = {{color: 'red', fontFamily:'HelveticaNeue',}}>Log out</Text>
                </Button>
              </View>
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                <Button transparent onPress = {() => this.deleteUser()}>
                  <Text style = {{color: 'red', fontFamily:'HelveticaNeue',}}>Delete Account</Text>
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

const styles = StyleSheet.create({
  title: {
    fontSize: 20, 
    fontFamily:'Helvetica-Light', 
    lineHeight: 25, 
    color: 'black',
    textTransform: 'capitalize'
  },
  subtitle: {
    fontSize: 15, 
    fontFamily:'Helvetica-Light', 
    lineHeight: 25, 
    color: 'black',
    textTransform: 'capitalize'
  }
});



export default Dashboard;



