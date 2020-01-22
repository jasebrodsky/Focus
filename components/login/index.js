import React, { Component } from "react";
import PropTypes from 'prop-types';
import { Alert, ImageBackground, Image, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import Geocoder from 'react-native-geocoding';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import {
  ActionSheet,
  Container,
  Content,
  Item,
  Label,
  Input,
  Button,
  Icon,
  View,
  Text
} from "native-base";

//import styles from "./styles";
import { AccessToken, LoginButton, LoginManager, GraphRequest, GraphRequestManager } from 'react-native-fbsdk';

const background = require("../../images/background_helm.jpg");
const logo = require("../../images/Focus_dating2.png");
const maleImage = "https://focusdating.co/images/man.jpeg";
const femaleImage = "https://focusdating.co/images/woman2.png";
const primaryColor = "#8A6077";

var GENDER_OPTIONS = [
  'Male',
  'Female',
  'Cancel',
];

var DESTRUCTIVE_INDEX = 2;
var CANCEL_INDEX = 2;

class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {
      name: '',
      email: '',
      password: '',
      gender: 'Gender indentity',
      createAccount: false,
      errorMessage: false,
    };
  }

  //hide nav bar on the login screen
  static navigationOptions = {
    header: null,
  };

  componentDidMount() {

    LoginManager.logOut();

    const { navigate } = this.props.navigation;

    //check if user is logged in when component mounts. If logged in navigate to Swipes
    //set flag to redirect only once
    var authFlag = true;
    
    const config = {
      apiKey: "AIzaSyA5RHfMVtj36x0f9KAMw_iLFYKfCxFjuuo",
      authDomain: "blurred-195721.firebaseapp.com",
      databaseURL: "https://blurred-195721.firebaseio.com",
      projectId: "blurred-195721",
      storageBucket: "blurred-195721.appspot.com",
      messagingSenderId: "479759716253",
      appId: "1:479759716253:web:01edde286058b5deff2974"
    };

    //only initalize if not already. 
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    
    //check if user is authenticated in, if so, redirect to the appropriate flow. 
    firebase.auth().onAuthStateChanged( user => {

      if (user) {
        // User is signed in.
        console.log('user logged in');
        this.redirectUser(user.uid)
        //if user 
      }else{
        console.log('user not logged in');
      }
    });
  }

//function to get update users current location. 
getLocation = () => {

  //save ref to current user in db. 
  firebaseRefCurrentUser = firebase.database().ref('/users/' + userId);

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

validateAccount = () => {

  let email = this.state.email;
  let password = this.state.password;
  let gender = this.state.gender; 
  let errorMessage = '';

  if (email === '') {
    errorMessage = "Email is required.";
  }

  if (!email.includes("@") && email !== "") {
    errorMessage = "@ not included with email.";
  }

  if (!email.includes(".") && email !== "") {
    errorMessage = "period not included with email.";
  }
  
  if (password === '') {
    errorMessage = "Password is required.";
  }

  if (!email.includes("@") && email !== "") {
    errorMessage = "@ not included with email.";
  }
    
  if (gender === 'Gender indentity') {
    errorMessage = "Gender indentity is required.";
  }

  //return true if there's no more errors. Else, alert the error message.
  if (errorMessage == '') {
    this.handleSignUp();
  }else{
    this.alertError(errorMessage);
  }
}

alertError = (errorMessage) => {
  Alert.alert(
    'Problem Found',
    errorMessage,
    [
      {text: 'OK', onPress: () => console.log('OK Pressed')},
    ],
    {cancelable: false},
  );
}

forgotPassword = (email) => {

  Alert.prompt(
    'Enter email',
    'We will you an email to reset your password',
    [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {
        text: 'Submit',
        onPress: (email) => firebase.auth().sendPasswordResetEmail(email)
        .then((email) => {
          Alert.alert(
            'Email Sent',
            'Please check your email',
            [
              {text: 'OK', onPress: () => console.log('OK Pressed')},
            ],
            {cancelable: false},
          );
        })
        .catch(error => alert(error)),
      },
    ],
    'plain-text',
  );

}

redirectUser = (userId) => {
  firebase.database().ref('/users/' + userId).once('value')
  .then((snapshot) => {
      
      //update last login of user
      firebase.database().ref('/users/' + snapshot.val().userid).update({last_login: Date.now()})

      //save user date in variables check that all required fields are present.
      let first_nameValidated = snapshot.val().first_name !== '';
      let genderValidated = genderValidated = snapshot.val().gender !== 'select';
      let interestedValidated = snapshot.val().gender_pref !== 'select';
      let birthdayValidated = snapshot.val().birthday !== 'select';
      let code_accepted = snapshot.val().code_accepted;
      let workValidated = snapshot.val().work !== '';
      let educationValidated = snapshot.val().education !== '';
      let aboutValidated = snapshot.val().about !== '';
      let gender = (snapshot.val().gender == 'female') ? 'female' : 'male' ;
      let intialUser = snapshot.val().intialUser;

      //compute if profile is complete
      let profileComplete = (aboutValidated && educationValidated && first_nameValidated && workValidated && genderValidated && birthdayValidated && interestedValidated);
  
      //case 1 -- men who havent' entered valid code yet - show intro slides. 
      if((gender == 'male') && (code_accepted == false)){

        //show intro slides for men
        this.props.navigation.navigate("Intro", {user_id: userId, gender: gender});
      }

      //men who have used a valid code previously -- either settings or swipes. 
      else if ((gender == 'male') && (code_accepted == true)){
                
        // if settings are valid - send to swipes. if not send to settings. 
        (profileComplete) ? this.props.navigation.navigate('Swipes') : this.props.navigation.navigate('Settings');
      }
      
    //case 2 -females who are first time users - show intro slides. 
     if((gender == 'female') && (intialUser == true)){

      //show intro slides for females
      this.props.navigation.navigate("Intro", {user_id: userId, gender: gender});
    }
    
    //females who are not first time users - show either swipes or settings. 
    else if ((gender == 'female') && (intialUser == false)){
      
      // if settings are valid - send to swipes. if not send to settings. 
      (profileComplete) ? this.props.navigation.navigate('Swipes') : this.props.navigation.navigate('Settings')
    }
  })
}

handleLogin = () => {
  const { email, password } = this.state
  var that = this;

  firebase.auth()
      //signin with email to firebase
      .signInWithEmailAndPassword(email, password)
      
      //query exisitng user in order to check where to redirect them to - intro, swipes, or setings. 
      .then((data) => this.redirectUser(data.user.uid)
      )
      //alert any errors from firebase
      .catch(error => alert(error))
}

handleSignUp = () => {
  const { navigate } = this.props.navigation;
  const { email, password } = this.state
  gender = this.state.gender.toLocaleLowerCase();
  var that = this;

  firebase.auth()
      .createUserWithEmailAndPassword(email, password)
      //.then((data) => console.log('user id is: '+data.user.uid))
      .then((data) => firebase.database().ref('/users/' + data.user.uid).set({
        userid: data.user.uid,
        first_name: '',
        fb_id: '',
        last_name: '',
        email: email,
        images: [{file: 0, url: "https://focusdating.co/images/user.jpg", cache: 'force-cache'}],
        last_login: Date.now(),
        intialUser: true,
        showInstructionsSettings: true,
        showInstructionsSwipes: true,
        swipe_count: 0,
        last_swipe_sesh_date: Date.now(),
        latitude: 40.71797067746141, //default to NYC
        longitude: -73.98527588801655, //default to NYC
        city_state: 'New York, NY', //default to NYC
        gender: gender,
        gender_pref: (gender == 'male') ? 'male_straight' : 'female_straight', //default gender_pref to straight to have less required field to validate.
        interested: (gender == 'male') ? 'female' : 'male', //default interested in to straight to have less required field to validate.         
        birthday: 'select',
        about: '',
        work: '',
        education: '',
        status: 'active',
        code_accepted: (gender == 'female') ? true : false, //if new user is female set code accepted to true, check this before letting user (men) in next time. 
        interested: (gender == 'male') ? 'female' : 'male', //default interested in to straight to have less required field to validate. 
        min_age: 18,
        max_age: 60,
        max_distance: 160934.4,
        error: null,
        last_conversation_count: 0,
        notifications_message: true,
        notifications_match: true,
        error: null,
        }, function(error) {
          if (error) {
            console.log("Data could not be saved." + error);
          } else {
            console.log("Data saved successfully.");
            //redirect to Intro flow. Send gender and user id via navigation prop.                           
            that.props.navigation.navigate("Intro", {user_id: data.user.uid, gender: gender});
          }
        })
      ) 
      .catch(error => that.alertError(error.message))
}

onLoginOrRegister = () => {
  
  LoginManager.logInWithPermissions(['public_profile', 'email', 'user_birthday', 'user_gender'])
    .then((result) => {
      if (result.isCancelled) {
        console.log("Login cancelled");
      }
        console.log( "Login success with permissions: " + result.grantedPermissions.toString());
      
        // Return the access token
      return AccessToken.getCurrentAccessToken();
      
    }) 
    .then((data) => {
      // Create a new Firebase credential with the token
      const credential = firebase.auth.FacebookAuthProvider.credential(data.accessToken);
      //console.log('credential is: '+credential);
      // Login with the credential
      return firebase.auth().signInWithCredential(credential);

    })
    .then((data) => {
      let userId = data.user.uid;
      console.log('user id is: '+userId);

      firebase.database().ref('/users/' + userId).once('value').then((snapshot) => {
        //check if user exists
        let existing_user = snapshot.exists();

        if (existing_user){
          //user already exists
          console.log('user already exists!');
          
          //redirect user to appropriate flow. 
          this.redirectUser(userId);
          
        }else{
        
        var that = this;

        console.log('user doesnt exist start making profile form fb data');
          
        //user does not exist yet
         AccessToken.getCurrentAccessToken().then(
            (data) => {
              
              let accessToken = data.accessToken;

              console.log('accessToken is: '+accessToken);
              
              const responseInfoCallback = (error, result) => {
                if (error) {
                  console.log(error)
                  alert('Error fetching data: ' + error.toString());
                } else {
                  fb_result = result;
                  let gender = (fb_result.gender == null) ? 'select' : fb_result.gender;
                  let birthday = (fb_result.birthday == null) ? 'select' : fb_result.birthday; 
                  largePhotoURL = "https://graph.facebook.com/"+fb_result.id+"/picture?width=600&height=800";
                  let location = (fb_result.location == null) ? 'select' : fb_result.location; ////gets the location object you get from your response now
                  let latitude = 40.759211;
                  let longitude = -73.984638;
                  let city_state = 'New York City';
                  let database = firebase.database();
                  // FB.api('/' + location.id, {
                  //     fields: 'location'
                  // }, function(locationResponse) {
                  //     console.log('locationResponse is: '+JSON.stringify(locationResponse)); //will print your desired location object               
                  //     let latitude =  locationResponse.latitude;             
                  //     let longitude = locationResponse.latitude;             
                  // });

                  console.log('userId is: '+userId);
                  
                  database.ref('users/' + userId).set({
                    userid: userId,
                    first_name: fb_result.first_name,
                    fb_id: fb_result.id,
                    last_name: fb_result.last_name,
                    email: fb_result.email,
                    images: [{file: '0', url: largePhotoURL, cache: 'force-cache'}],
                    last_login: Date.now(),
                    intialUser: true,
                    showInstructionsSettings: true,
                    showInstructionsSwipes: true,
                    swipe_count: 0,
                    last_swipe_sesh_date: Date.now(),
                    latitude: latitude,
                    longitude: longitude,
                    city_state: city_state,
                    gender: gender,
                    gender_pref: (gender == 'male') ? 'male_straight' : (gender == 'female') ? 'female_straight' : 'select', //default to straight
                    interested: (gender == 'male') ? 'female' : (gender == 'female') ? 'male' : 'select', //default to straight
                    birthday: birthday,
                    about: '',
                    work: '',
                    education: '',
                    status: 'active',
                    code_accepted: (fb_result.gender == 'female') ? true : false, //if new user is female set code accepted to true, check this before letting user (men) in next time. 
                    min_age: 18,
                    max_age: 60,
                    max_distance: 160934.4,
                    error: null,
                    last_conversation_count: 0,
                    notifications_message: true,
                    notifications_match: true,
                    error: null,
                    //religion: fb_result.religion,
                    //political: fb_result.political,
                    //hometown: fb_resutl.hometown
                  }, function(error) {
                    if (error) {
                      console.log("Data could not be saved." + error);
                    } else {
                      console.log("Data saved successfully.");
                      //redirect to Intro flow. Send gender and user id via navigation prop.                           
                      that.props.navigation.navigate("Intro", {user_id: userId, gender: gender});
                    }
                  });
                }
              }

              const infoRequest = new GraphRequest(
                '/me',
                {
                  accessToken: accessToken,
                  parameters: {
                    fields: {
                      string: 'email,gender,name,first_name,last_name,birthday'
                    }
                  }
                },
                responseInfoCallback
              );

              // Start the graph request.
              new GraphRequestManager().addRequest(infoRequest).start()

            }
            
          )
        }
      })
    })
}

  render() {
    const { navigate } = this.props.navigation;
    // return (
    //   <ImageBackground source={background} style={{width: '100%', height: '100%'}}>
    //     <View style={{
    //       flex: 1,
    //       flexDirection: 'column',
    //       justifyContent: 'space-between',
    //       alignItems: 'center',
    //     }}>
    //       <View />
    //       <Image source={logo} style ={{height: 100}} />
    //       <Button  style={{alignSelf: 'center', marginBottom: 100}} onPress = {() => this.onLoginOrRegister() }>
    //         <Text>Login with Facebook</Text>
    //       </Button>
    //     </View>
    //   </ImageBackground>
    // );
 
    return (
      <View style={styles.container}>
        <View style={{flex: 1, justifyContent: 'center', padding: 50,}}>
          <Image source={logo} style ={{}} />
        </View>
        <View style={{flex: 1, width: '85%'}}>
          <TextInput
                style={styles.inputBox}
                value={this.state.email}
                onChangeText={email => this.setState({ email })}
                placeholder='Email'
                autoCapitalize='none'
            />
            <TextInput
                style={styles.inputBox}
                value={this.state.password}
                onChangeText={password => this.setState({ password })}
                placeholder='Password'
                secureTextEntry={true}
            />
            {/* if create account is clicked, show gender dropdown in form */}
            {(this.state.createAccount) &&
            
            <Item style={{width: '95%', marginLeft: 10, marginTop: 10}}              
              onPress={
                ()=> ActionSheet.show
                (
                  {
                    options: GENDER_OPTIONS,
                    cancelButtonIndex: CANCEL_INDEX,
                    destructiveButtonIndex: DESTRUCTIVE_INDEX,
                    title: 'Gender identity'
                  },
                  (buttonIndex) => {
                    if ((buttonIndex) === 2) {
                        console.log(GENDER_OPTIONS[buttonIndex])
                    } else {
                      this.setState({ gender: GENDER_OPTIONS[buttonIndex]})    
                    } 
                  }
                )
              }           
            >

            
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start'}}>
              <Button  disabled transparent >
                <Text style={{color: (this.state.gender == 'Gender indentity') ? 'lightgrey' : 'black', textTransform: 'capitalize'}}>{this.state.gender}</Text>
              </Button>
            </View>

          </Item>
                      
          }

        </View>
        
        {/* Show login with facebook, with email, create account, forgot password elements */}
        {(!this.state.createAccount) &&
        <View style={{flex: 1, width: '85%'}}>
          <Button onPress = {() => this.handleLogin()} block bordered style={{justifyContent: 'center', margin: 10, borderColor: primaryColor}}>
              <Text style={{color: primaryColor}}>Login with Email</Text>
          </Button>
          <Button block onPress = {() => this.onLoginOrRegister()} style={{justifyContent: 'center', margin: 10, backgroundColor: '#4267B2'}}>
              <Text>Login with Facebook</Text>
          </Button>         
          <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', margin: 10}}>
            <TouchableOpacity onPress = {() => this.setState({createAccount: true, email: '', password: ''})} style={{flex: 1, alignItems: 'center'}}>
                <Text style={{color: primaryColor}}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress = {() => this.forgotPassword()} style={{flex: 1, alignItems: 'center'  }}>
                <Text style={{color: primaryColor}}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>
        }

        {/* if create account is clicked, show create account button */}
        {(this.state.createAccount) &&
        <View style={{flex: 1, width: '85%', marginTop: 60}}>
          <Button onPress = {() => this.validateAccount()} bordered style={{justifyContent: 'center', margin: 10, borderColor: primaryColor}}>
              <Text style={{color: primaryColor}}>Create Account</Text>
          </Button>     
          <Button onPress = {() => this.setState({createAccount: false, email: '', password: '', gender: 'Gender indentity'})} transparent style={{justifyContent: 'center', margin: 10}}>
              <Text style={{color: primaryColor}}>Go back</Text>
          </Button>      
        </View>
        }
      </View>
  )


  }
}


const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      
  },
  inputBox: {
      //width: '85%',
      margin: 10,
      padding: 15,
      fontSize: 16,
      borderColor: '#d3d3d3',
      borderBottomWidth: 1,
      textAlign: 'left'
  },
  buttonEmail: {
      marginTop: 30,
      marginBottom: 20,
      paddingVertical: 5,
      alignItems: 'center',
      backgroundColor: '#F6820D',
      borderColor: '#F6820D',
      borderWidth: 1,
      borderRadius: 5,
      //width: 200
  },
  buttonFacebook: {
    marginTop: 30,
    marginBottom: 20,
    paddingVertical: 5,
    alignItems: 'center',
    backgroundColor: '#4267B2',
    borderColor: '#4267B2',
    borderWidth: 1,
    borderRadius: 5,
    //width: 200
},
  buttonText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff'
  }
})

export default Login;
