import * as React from 'react';
import 'react-native-gesture-handler';
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import { Button, View, Text, useEffect, Linking } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { Root } from "native-base";
import DeepLinkContext from "./components/DeepLinkContext"
import Login from "./components/login/";
import Intro from "./components/Intro";
import Messages from "./components/Messages";
import Chat from "./components/Chat";
import Swipes from "./components/Swipes";
import Dashboard from "./components/Dashboard";
import Registration from "./components/Registration";
import Payments from "./components/Payments";
import Refer from "./components/Refer";
import codePush from "react-native-code-push";
import SplashScreen from  "react-native-splash-screen";
import dynamicLinks from '@react-native-firebase/dynamic-links';



// const RootStack = createStackNavigator(
//   {
//     Login: Login,
//     Intro: Intro,
//     Settings: Settings,
//     Swipes: Swipes,
//     Messages: Messages,
//     Chat: Chat,
//     Refer: Refer,
//   },
//   {
//     initialRouteName: 'Login',
//   }
// );



// use below to implement modal for settings. looks wiered bc there's no place for a save button. 
const MainStack = createStackNavigator(
  {
    Login: {
      screen: Login,
    },
    Intro: {
      screen: Intro,
    },
    Dashboard: {
      screen: Dashboard,
    },
    Swipes: {
      screen: Swipes,
    },
    Messages: {
      screen: Messages,
    },
    Chat: {
      screen: Chat,
    }   
  },
  {
    /* Same configuration as before */

    defaultNavigationOptions: {
      animationEnabled: true,
      headerStyle: {
        backgroundColor: '#fff',
      },      
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      },
      headerTransitionPreset: 'fade-in-place',
      transitionConfig: () => {
          return {
              transitionSpec: {
                  duration: 300, //Easier to see the navigation animation
              }
      }
    }


  }
);


const RootStack = createStackNavigator(
  {
    Main: {
      screen: MainStack,
    },
    Refer: {
      screen: Refer,
    },
    Payments: {
      screen: Payments,
    },
    Registration: {
      screen: Registration,
    }    
  },
  {
    mode: 'modal',
    headerMode: 'none',
  }
);


const AppContainer = codePush(createAppContainer(RootStack));

  //Hide Splash screen on app load.
    setTimeout(() => {
      SplashScreen.hide()
    }, 2000)
  

    
export default class App extends React.Component {

  constructor(props){
    super(props)

    this.state = {
      deepLinkParams: {},
      reviewObj: {},
    }
  }


  componentDidMount() {

    //save analytics in let
    let Analytics = RNfirebase.analytics();

    // get intial deeplink if present and send to handleDynamicLink
    dynamicLinks().getInitialLink(this.handleDynamicLink);

    // get deeplink while app is running
     dynamicLinks().onLink(this.handleDynamicLink);

  }


  //handle when a dynamic link is used in app
  handleDynamicLink = link => {

    // get query string of deeplink 
    let paramsString = decodeURI(link.url).substring((link.url).indexOf('?') + 1);
    // convert to URLSearchParams obj
    let searchParams = new URLSearchParams(paramsString)
    //save name and photo of friend who referred user, into state
    let firebaseRef = firebase.database().ref('/users/' + searchParams.get('user_id_creator'));
    //save data snapshot from firebaseRef
    firebaseRef.on('value', (dataSnapshot) => {
      //put search Params into obj
      this.setState({
        image_creator: dataSnapshot.val().images[0].url, //get from firebase query
        name_creator: dataSnapshot.val().first_name, //get from firebase query
      })
    })

    //Check if code in deeplink is exists or not
    firebase.database().ref("/codes").orderByChild("sharable_code").equalTo(searchParams.get('code').toUpperCase()).once("value",codeSnap => {
      //check if code exists first
      if (codeSnap.exists()){
        // save link params 
        let code = codeSnap.val();
        let key = Object.keys(code);
        let codeData = code[key];

        //build review object to update db with. 
        let reviewObj = {
          name: this.state.name_creator, 
          photo: this.state.image_creator, 
          reason: searchParams.get('reason'), 
          code_key: key[0],
        }

        //put search Params into obj
        let searchParamsObj = {
          type: searchParams.get('type'), //get from link
          user_id_creator: searchParams.get('user_id_creator'), //get from link
          gender_creator: searchParams.get('gender_creator'), //get from link
          image_creator: this.state.image_creator, //get from firebase query
          name_creator: this.state.name_creator, //get from firebase query
          name_created: searchParams.get('name_created'), //get from link
          reason: searchParams.get('reason'), //get from link
          expired: codeData.expired // get this from checkCode function
        }
        
        //save searchParams to state, so that redirectUser() can reference, when sending params to next screens 
        this.setState({ deepLinkParams: searchParamsObj, reviewObj: reviewObj });
      
      } else{
        console.log('code does not exist');
      }
    })
  
    //if link is type navigation and user is authenticated:
    //save nextScreen into state as Chat, Messages, Swipes, ...
    //Redirect if user is logged in, else login user then redirect afterwards
        
  };


  render() {

    return <DeepLinkContext.Provider value={this.state}>
              <Root><AppContainer /></Root>
            </DeepLinkContext.Provider>;

  }
}

