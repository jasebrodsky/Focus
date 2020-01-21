import * as React from 'react';
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
import Settings from "./components/Settings";
import Refer from "./components/Refer";


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
    Swipes: {
      screen: Swipes,
    },
    Messages: {
      screen: Messages,
    },
    Chat: {
      screen: Chat,
    },    
    Settings: {
      screen: Settings,
    }
  },
  {
    /* Same configuration as before */

    navigationOptions: {
      animationEnabled: true,
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
  },
  {
    mode: 'modal',
    headerMode: 'none',
  }
);


const AppContainer = createAppContainer(RootStack);

export default class App extends React.Component {
  render() {
    return <Root><AppContainer /></Root>;
  }
}