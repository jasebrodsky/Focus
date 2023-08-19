import React, { Component } from 'react';
// import * as firebase from "firebase";
import firebase from '@react-native-firebase/app';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import database from '@react-native-firebase/database';




export const linkReview = (review, userId) => {


    console.log('review id: '+JSON.stringify(review));
    console.log('userId is: '+JSON.stringify(userId));


    //update code to expired at the specific code key and add created_for as well, to reference later. 
    database().ref('/codes/'+review.code_key).update({expired_date: new Date().getTime(), expired: true, created_for: userId });


    console.log('updating code to expired with date and by who ');

    //save db ref for profile 
    let firebaseProfileRef = database().ref('/users/' + userId);
    
    // save reference to where to save the new review object 
    let firebaseProfileRefReviews = database().ref('/users/'+userId+'/reviews/'+review.code_key);

    //update code_accepted to true and status to active
    firebaseProfileRef.update({
        code_accepted: true, 
        referStatus: 'receivedReferral',
        //status: 'active' //update profile to active if referred by someone? 
    });

    //build review object to update db with. 
    //let reviewObj = {name: review.name, photo: review.image_creator, reason: review.reason, code_key: review.key[0]}

    let reviewObj = {
        type: 'review',
        name: review.name, 
        user_id_creator: review.user_id_creator,
        photo: review.photo, 
        reason: review.reason, 
        code_key: review.code_key
    }

    //push new review into users profile object
    firebaseProfileRefReviews.set(reviewObj);
   
    console.log('finsiheLinkReviewd running ');
   
   return true;

}
