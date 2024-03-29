import * as React from 'react';
import 'react-native-gesture-handler';
import firebase from 'react-native-firebase';
import { Button, View, Text } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { Root } from "native-base";
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


  render() {
    return <Root><AppContainer /></Root>;
  }
}