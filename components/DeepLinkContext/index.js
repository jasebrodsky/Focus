import React, { Component } from 'react';
// import * as firebase from "firebase";
import dynamicLinks from '@react-native-firebase/dynamic-links';

// Create a context for the current theme (with "light" as the default).
const DeepLinkContext = React.createContext(null);

export default DeepLinkContext;