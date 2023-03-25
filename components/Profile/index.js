import React, { Component } from 'react';
import {
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ImageBackground,
  StatusBar,
  Alert,
  Dimensions } from 'react-native';

import {
  ActionSheet,
  Card,
  CardItem,
  Container,
  Text,
  Button,
  Left,
  List,
  ListItem,
  Thumbnail,
  Body,
  View,
  H3
} from "native-base";

import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import ImageViewer from 'react-native-image-zoom-viewer';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faQuoteLeft, faUserEdit, faEdit, faRemoveFormat, faTrash, faTrashAlt, faCameraRetro, faSolarPanel, faArrowAltCircleUp, faArrowCircleUp } from '@fortawesome/free-solid-svg-icons';
import { faArrowAltCircleLeft } from '@fortawesome/free-solid-svg-icons';
import { withNavigation, NavigationActions } from "react-navigation";
import ReactNativeZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';
import { renderNotification, handleNotification } from '../Utilities/utilities.js';


//colors consts
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

class Profile extends Component {
  constructor(props){
    super(props)

    this.state = {
      loggedInUserId: firebase.auth().currentUser.uid,
      profile: '',
      sortedContentArray: [],
      imagesArray: [],
      images: [],
      imageViewerVisible: false,
      imageIndex: 0,
      blur: this.props.navigation.getParam('blur') ? this.props.navigation.getParam('blur') : 0 ,
      zoomEnabled: true,
      initialZoom: 2
    }
  }

  //after component mounts, set up listener to keep profile updated in real time. 
  componentDidMount(){
        
      //save intial user as the userid passed in state - check if either userid or match_userid is passed
      let userId = this.props.navigation.state.params.profile.userid ? this.props.navigation.state.params.profile.userid : this.props.navigation.state.params.profile.match_userid;
      

      let Analytics = RNfirebase.analytics();
      Analytics.setAnalyticsCollectionEnabled(true);
      Analytics.setCurrentScreen('Profle', 'Profile');
      Analytics.setUserId(userId);

      console.log('userId is: '+userId);
      let firebaseRefUser = firebase.database().ref('/users/' + userId);
      let conversationId = this.props.navigation.getParam('conversationId');
      let firebaseConversationMatch = firebase.database().ref('/conversations/'  +conversationId);
      let from = this.props.navigation.getParam('from');
        

      //listen for notifications when module Focus
      const didFocus = this.props.navigation.addListener(
        'didFocus',
        payload => {
          
          //get notifications when arriving
          this.handleNotification(this.state.loggedInUserId, 'Profile', null);
          //this.handleNotification2();
        }
      );


      //stop listening for notifications, since each module has different logic so lis
      const didBlur = this.props.navigation.addListener(
          'didBlur',
          payload => {
                    
            let query = firebase.database().ref('/matches/' + this.state.loggedInUserId).orderByChild('showNotification');
    
            //remove listener when leaving. 
            query.off('child_changed', this.state.listener);
          }
        );
    

        
        //if coming from flow chat or blindDate, get real-time blur value, from conversation object. 
        if(from == 'BlindDate' || from == 'Chat'){

          firebaseConversationMatch.on('value', (matchDataSnapshot) => {
            //alert('setting state with blur from db: '+ matchDataSnapshot.val().blur);
            this.setState({ blur: matchDataSnapshot.val().blur});
          })
  
        }

      
        //   //save data snapshot from firebaseRef, so that profile can be updated in realtime. 
        // firebaseRefMatch.on('value', (matchDataSnapshot) => {
        //   let blur = matchDataSnapshot.blur; 
        //  )}


        //save data snapshot from firebaseRef, so that profile can be updated in realtime. 
        firebaseRefUser.on('value', (dataSnapshot) => {

          //REFACTOR TO NOT ATTACH LISTENER WHEN USING NAV PARAMS. 
          let profile = dataSnapshot.val(); 

          console.log('COMPONENT DID MOUNTS - profile.prompts is: '+profile.prompts);


          //create empty array
          let imagesArray = [];
      
          //convert images to an array. 
          let imageArray = Object.values(profile.images);
      
          //loop through array and create an object now including it's blur radious. Push that object to imagesarray arrary.
          imageArray.map(image => {
            let imageObj = {'url':image.url, cache: 'force-cache', 'props':{'blurRadius': this.state.blur, source: {uri: image.url, cache: 'force-cache'}}};
            imagesArray.push(imageObj);
          })

          
      
          //create array of all content items, if empty include empty array. 
          let content = [ ...(Object.values(profile.images || [])).slice(1), ...(Object.values(profile.prompts || [])), ...(Object.values(profile.reviews || []))  ];
      
          console.log('LOOK HERE now: '+imagesArray.length);

          //custom sort content into a pattern,
          let sortedContentArray = this._sortContent(content);
      
          console.log('sortedContentArray is:'+JSON.stringify(sortedContentArray));
          
          //update state with data from params
          this.setState({ profile: profile, imagesArray: imagesArray, sortedContentArray: sortedContentArray  });
        })


        
    }


  //before component mounts, setup state with passed data from nav params so that profile loads immediately. 
  componentWillMount() {


    let profile = this.props.navigation.state.params.profile;
    //let blur = this.props.navigation.state.params.profile.blur;

    
    console.log('COMPONENT WILL MOUNTS - profile.prompts is: '+profile.prompts);

    //create empty array
    let imagesArray = [];

    //convert images to an array. 
    let imageArray = Object.values(profile.images);

    console.log('images array is: '+JSON.stringify(imageArray))


    //loop through array and create an object now including it's blur radious. Push that object to imagesarray arrary.
    imageArray.map(image => {
      let imageObj = {'url':image.url, cache: 'force-cache', 'props':{'blurRadius': this.state.blur, source: {uri: image.url, cache: 'force-cache'}}};
      imagesArray.push(imageObj);
    })

    //create array of all content items, if empty include empty array. 
    let content = [ ...(Object.values(profile.images || [])).slice(1), ...(Object.values(profile.prompts || [])), ...(Object.values(profile.reviews || []))  ];

    //custom sort content into a pattern,
    let sortedContentArray = this._sortContent(content);

    console.log('sortedContentArray is:'+JSON.stringify(sortedContentArray));
    
    //update state with data from params
    this.setState({ profile: profile, imagesArray: imagesArray, sortedContentArray: sortedContentArray  });
  }



  //sort content into pattern
  _sortContent = (content) =>{

    //sort content by pattern of image, review, prompt
     console.log('content is'+ JSON.stringify(content));

    let sortedContentArray = []; //create new array to return eventually
    let nextContent = 'image'; //initalize which content to start with
  
    let photosLength = content.filter(item => item.type == 'image').length;
    let reviewsLength = content.filter(item => item.type == 'review').length;
    let promptsLength = content.filter(item => item.type == 'prompt').length;
    let photoIndex = 0; //intitalize first photo to start with
    let reviewIndex = 0; //intitalize first review,prompt to start with
    let promptIndex = 0; //intitalize first prompt,prompt to start with
    let contentPushed = 0;

    //content.shift();
    //content = [];

    //alert('photosLength: '+photosLength);

    if ( nextContent == 'image'){
      //cut out first element in profile.images, since it's already rendered above
      //content = content.slice(1); //remove first element from content array
    }
    
    console.log('photosLength is: '+photosLength);
    console.log('reviewsLength is: '+reviewsLength);
    console.log('promptsLength is: '+promptsLength);
    console.log('reviewIndex is: '+reviewIndex);
    console.log('promptIndex is: '+promptIndex);
    console.log('photoIndex is: '+photoIndex);
    console.log('nextContent is: '+nextContent);
    console.log('content.length is: '+content.length);

    //for each content, render appropriate content
    for(let i = 0; i < content.length; i++){

      console.log('--- starting iteration: '+i);

      //break loop if contentPushed > content.length
      if (contentPushed == content.length){
        break;
      }
      
      //render next content
      if (nextContent == 'image'){
        console.log('LOOKING FOR IMAGE AT ITERATION: '+i);

        console.log('photosLength: '+photosLength+'photoIndex: '+photoIndex);

        //if photo at index exist, render photo at index
        if(photosLength >= photoIndex+1 ){

          //2 >= 1
          //2 >= 2
          console.log('IMAGE FOUND at photoIndex: '+photoIndex);

          //save only images from content
          let photoArray = content.filter(item => item.type == 'image');

          //push the image at image index into sortedContentArray
          sortedContentArray.push(photoArray[photoIndex]); 

          //iterate photoIndex
          photoIndex++; 

          //itereate contentPushed
          contentPushed++;

          console.log('total contentPushed: '+contentPushed );
        }else{
          // re-run iteration now
          i--;
        }

        //update for next content 
        nextContent = 'prompt';

        //contineu to next iteration
        continue;
        
      }

      else if (nextContent == 'prompt'){
        console.log('LOOKING FOR PROMPT AT INDEX: '+i);

        console.log('promptsLength: '+promptsLength+'promptIndex: '+promptIndex);

        //if prompt at index exist, render prompt at index
        if(promptsLength >= promptIndex+1 ){
          
          console.log('PROMPT FOUND at promptIndex: '+promptIndex);

          //save only prompts from content
          let promptsArray = content.filter(item => item.type == 'prompt');

          //push the image at image index into sortedContentArray
          sortedContentArray.push(promptsArray[promptIndex]); 

          //iterate promptIndex
          promptIndex++;

          //itereate contentPushed
          contentPushed++;

          console.log('total contentPushed: '+contentPushed );

        }else{
          // re-run iteration now
          i--;
        }

        //update for next content 
        nextContent = 'review';

        //continue to next loop iteration
        continue; 

      }

      else if (nextContent == 'review'){
        console.log('LOOKING FOR REVIEW AT INDEX: '+i);

        console.log('reviewsLength: '+reviewsLength+'reviewIndex: '+reviewIndex);

        //if review at index exist, render review at index
        if(reviewsLength >= reviewIndex+1 ){

          console.log('REVIEW FOUND at reviewIndex: '+reviewIndex);

          //save only prompts from content
          let reviewsArray = content.filter(item => item.type == 'review');

          //push the image at image index into sortedContentArray
          sortedContentArray.push(reviewsArray[reviewIndex]); 
          
          //iterate photoIndex
          reviewIndex++;
                   
          //itereate contentPushed
          contentPushed++;
          
          console.log('total contentPushed: '+contentPushed );

        }else{
          // re-run iteration now
          i--;
        }

        //update for next content 
        nextContent = 'image';

        //continue to next loop iteration
        continue; 
      }

    }
    
    console.log('sortedContentArray.length is: '+sortedContentArray.length);
    return sortedContentArray;
  }


  //get age function
  getAge(dateString) {
      var today = new Date();
      var birthDate = new Date(dateString);
      var age = today.getFullYear() - birthDate.getFullYear();
      var m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
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
              
              //don't notify of new chat while on chat screen and chatting with that user. Match to exclude is only sent on chat page.
               if (screen == 'Chat' && matchUseridExclude == notifySnapshot.val().match_userid){ //then check if person to exclude is not who you're talking to
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



  //trigger actionsheets and alerts for blocking and reporting and hiding flow. 
  blockReportFlow = (from) => {
    
    //from = Swipes, Dashboard, ChatOrBlindDate

    ActionSheet.show(
      {
        options: [
          from == 'Swipes' ? 'Just hide':'Just unmatch',
          from == 'Swipes' ? 'Hide and report':'Unmatch and report', 
           "Cancel"
        ],
        title: 'Confirm',
        cancelButtonIndex: 2,
        destructiveButtonIndex: 2
        
      },
      buttonIndex => {

        //handle blocking profile
        if ((buttonIndex) == 0){

          //block user
          this.profileAction('unmatch');
          console.log('this is block report flow: UNMATCHING');

        
          //handle block and report a user
        }else if ((buttonIndex) == 1){

          Alert.alert(
            'Report',
            "We take reports seriously. We'll investigate this person and block them from interacting with you in the future.",
            [

              {text: from == 'Swipes' ? 'Just hide':'Just unmatch', 
                onPress: () =>  
                 //if from swipes and not a match -> hide. If not coming from swipes and is a match -> unmatch.
                from == 'Swipes' ? this.profileAction('hide') : this.profileAction('unmatch')
              },    
             
              {text: from == 'Swipes' ? 'Report and hide':'Report and unmatch', 
               onPress: () => 
               //if from swipes and not a match -> report and hide. If not coming from swipes and is a match -> report and unmatch.
               from == 'Swipes' ? this.profileAction('hideAndReport') : this.profileAction('unmatchAndReport')
              },   
              {text: 'Cancel', 
              onPress: () => console.log('Cancel Pressed'), style: 'destructive'
            },  
            
            ],
            { cancelable: false }
          )         
        }
      }
    )
  }



  excludeUsers = (useridExcluded, useridExcluder) => {

    //save ref to users to exclude from eachother
    let firebaseRefUseridExcluded = firebase.database().ref('/users/' + useridExcluded +'/excludedUsers');
    let firebaseRefUseridExcluder = firebase.database().ref('/users/' + useridExcluder +'/excludedUsers');

    //add excluded data to profile of the excluded user
    firebaseRefUseridExcluded.push({
        useridExcluder: useridExcluder, 
        useridExcluded: useridExcluded, 
        time: Date.now()
    });

    //add excluded data to profile of the excluder user
    firebaseRefUseridExcluder.push({
        useridExcluder: useridExcluder, 
        useridExcluded: useridExcluded, 
        time: Date.now()
    });

  }

  //handle hiding, unmatching, reporting users. 
  profileAction = (action) => {
    //actions: hide, unmatch, hideAndReport, unmatchAndReport

    //hide (unmatched user)
    if (action == 'hide' || action == 'hideAndReport') {
      this.excludeUsers(this.state.profile.userid, this.state.loggedInUserId);
    }

    //unmatch user
    if (action == 'unmatch' || action == 'unmatchAndReport') {
      this.excludeUsers(this.state.profile.userid, this.state.loggedInUserId);
      
      // disable matches anddisable conversation
      //create ref to set new match object with match_id associated with conversation_id generated above. 
      let matchesRef1 = firebase.database().ref('matches/'+this.state.loggedInUserId+'/'+this.state.profile.userid+'/');

      //create ref to set new match object with match_id associated with conversation_id generated above. 
      let matchesRef2 = firebase.database().ref('matches/'+this.state.profile.userid+'/'+this.state.loggedInUserId+'/');

      //save fb ref for quering conversation data
      let convoRef = firebase.database().ref('/conversations/'+conversationId+'/');

      //add removed property to match
      matchesRef1.update({removed: true});

      //add removed property to match
      matchesRef2.update({removed: true});

      //add removed property to conversation as well. 
      convoRef.update({removed: true});
    
    }

    //report user
    if (action == 'hideAndReport' || action == 'unmatchAndReport') {
      //first exclude users from eachother
      this.excludeUsers(this.state.profile.userid, this.state.loggedInUserId);

      //save ref to users to involved in report
      let firebaseRefUseridReported = firebase.database().ref('/users/' + this.state.profile.userid +'/report');
      let firebaseRefUseridReportedBol = firebase.database().ref('/users/' + this.state.profile.userid);
      let firebaseRefUseridReporter = firebase.database().ref('/users/' + this.state.loggedInUserId +'/report');

      //push data report to profile of user who is being reported
      firebaseRefUseridReported.push({
          useridReporter: this.state.loggedInUserId, 
          useridReported: this.state.profile.userid, 
          //reason: '',
          time: Date.now()
      });
      
      //push data report to profile of user who is reporting
      firebaseRefUseridReporter.push({
        useridReporter: this.state.loggedInUserId, 
        useridReported: this.state.profile.userid,
        //reason: '', 
        time: Date.now()
    });

      //update profile of reported to reported: true
      firebaseRefUseridReportedBol.update({
        reported: true, 
    });
    }

    //go to swipes now and forceUpdate
    this.props.navigation.navigate('Swipes', {forceUpdate: true});             

  }

  goToTop = () => {
    this.scroll.scrollTo({x: 0, y: 0, animated: true});
 }
  

  render() {
  
    let deviceWidth = Dimensions.get('window').width
    let deviceHeight = Dimensions.get('window').height
    let colorScheme = 'light';

    let genderOnProfile = this.state.profile.genderOnProfile ? ' | '+this.state.profile.gender : null ;

    //explore why this isn't working, need this for routing back to 'from' component. 
    let from = this.props.navigation.getParam('from');
    
    //const zoomableViewRef = createRef<ReactNativeZoomableView>();
    zoomableViewRef = React.createRef();
    // //reset forceUpdate to empty, so that swipes won't update
    // let setParamsAction = NavigationActions.setParams({
    //   params: { forceUpdate: false },
    //   key: 'Swipes',
    // });

    // //dispatch new params
    // this.props.navigation.dispatch(setParamsAction);
    
    return (
      <Container>
        <StatusBar hidden={true} />


        <View style={{ 
                  position:'absolute',
                  top:5,
                  alignSelf:'flex-start',
                  justifyContent: 'center',                  
                  zIndex: 2,
                  left: 5,
                  }}>                  
                  <Button  
                    transparent 
                    style={{  
                      width: 90, 
                      height: 90, 
                      justifyContent: 'center',
                      shadowColor: "black",
                      shadowOffset: {
                        width: 4,
                        height: 4,
                      },
                      shadowOpacity: 0.70,
                      shadowRadius: 4.65, }}                   
                    //onPress = {() => this.props.navigation.goBack({forceUpdate: false})}
                    //MAKE SURE that force refresh is off when coming from swipes. debug why from isn't working when on registration flow
                    onPress = {() => this.props.navigation.navigate(from, {forceUpdate: false})}              
                   //onPress = {() =>  this.props.navigation.state.params.flow =='edit' ? this.props.navigation.navigate("ManageConversationPromptsModal", {profile: this.state.profile, from: 'editProfile', goback: true}) : this.props.navigation.goBack() }
                    
                    >
                      <FontAwesomeIcon size={ 50 }     
                        style={{color: primaryColor}} 
                        icon={ faArrowAltCircleLeft } />
                  </Button>                  
                </View>


          <ScrollView 
              ref={(c) => {this.scroll = c}}

              style={{
                flex: 1,
                backgroundColor: 'lightgrey'
              }} 
              contentContainerStyle={{
                backgroundColor: 'white',
                flexGrow: 1,
                //paddingTop: 40,
                alignItems: 'center',
                paddingBottom: 50
              }}>


                <ReactNativeZoomableView
                  maxZoom={1}
                  minZoom={1}
                  zoomStep={1.1}
                  initialZoom={1}
                  onZoomEnd={this.logOutZoomState}
                  //onZoomAfter={this.logOutZoomState}
                  ref={zoomableViewRef}
                  bindToBorders={true}
                  //onZoomEnd={zoomableViewRef.zoomTo(1)}
                  style={{
                      padding: 0,
                      backgroundColor: '#13131A',
                  }}
                >
                  <Image
                    resizeMode="cover"
                    blurRadius={Number(this.state.blur)}
                    style={{ borderRadius: 0, margin:0}}
                    source={{
                      uri: this.state.profile.images[0].url,
                      width: deviceWidth,
                      height: deviceHeight-240
                    }} 
                  />

                  {this.props.navigation.state.params.flow == 'edit' &&
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Button transparent 
                        onPress = {() => this.props.navigation.navigate("ManageAboutMeModal", {profile: this.state.profile, step: 5, from: 'editProfile', goback: true})}
                        style={{                     
                          position: 'absolute',
                          bottom: (deviceHeight-240)/2,
                        }}>                     
                         <FontAwesomeIcon 
                        size={ 40 }  
                        icon={ faCameraRetro }    
                        style={{
                          color: 'white', 
                          shadowColor: "#000",
                          shadowOffset: {
                            width: 0,
                            height: 3,
                          },
                          shadowOpacity: 0.29,
                          shadowRadius: 4.65, }} 
                        />
                      </Button>
                    </View>  
                    }

                </ReactNativeZoomableView>


                <View style={{flex: 1, flexDirection: 'row' }}>
                  <View style={{flex: 1 }}>
                  <LinearGradient  
                    style={{
                      padding: 20,
                      flex: 1,
                      alignItems: 'flex-start',
                      //justifyContent: 'flex-center',
                      }}
                      colors={['#13131A', '#13131A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1.5, y: 10.5 }}
                      >
                        
                        { (this.props.navigation.state.params.flow == 'view' || this.props.navigation.state.params.flow == 'edit')  &&

                        <View style={{flex: 1, flexDirection: 'row', marginBottom: -10 }}>
                          <Text style={{ fontFamily:'HelveticaNeue-Bold', fontSize: 35,textTransform: 'capitalize', color: primaryColor}} >{this.state.profile.first_name}</Text>                         
                          <Button transparent 
                            onPress = {() => this.props.navigation.navigate("ManageAboutMeModal", {profile: this.state.profile, step: 0, from: 'editProfile', goback: true})}
                            style={{flex:1, justifyContent: 'flex-end'}}>                     
                            <FontAwesomeIcon 
                            size={ 40 }  
                            icon={ faEdit }    
                            style={{
                              color: 'white', 
                              shadowColor: "#000",
                              shadowOffset: {
                                width: 0,
                                height: 3,
                              },
                              shadowOpacity: 0.29,
                              shadowRadius: 4.65, }} 
                            />
                          </Button>
                        </View>
                        }

                        <View style={{flex: 1, }}>
                          <Text numberOfLines={1} style={{flex: 1, fontFamily:'HelveticaNeue-Bold', fontSize: 35,textTransform: 'capitalize', color: primaryColor}} >{this.getAge(this.state.profile.birthday) + genderOnProfile} </Text>                         
                        </View>
                        <Text numberOfLines={1} style={{fontFamily:'Helvetica', fontSize: 20, color: 'white'}} >{this.state.profile.city_state} </Text>
                        <Text numberOfLines={1} style={{fontFamily:'Helvetica', fontSize: 20, color: 'white'}} >{this.state.profile.work} </Text>
                        <Text numberOfLines={1} style={{fontFamily:'Helvetica', fontSize: 20, color: 'white'}} >{this.state.profile.education} </Text>       
                    </LinearGradient>
                      {/* <Text note style={{marginTop: 10}}>{this.state.profile.about}</Text> */}
                    
                    <View style={{flex: 1}}>
                      
                      { this.state.sortedContentArray.map((content, index) => {

                        //define default colors
                        let colors = [];
                        
                        //if colorScheme is dark change to light
                         if (colorScheme == 'dark') {
                           colors = ['#1C1C24', '#1C1C24'];
                         }else{
                          colors = [primaryColor, primaryColor];
                         }

                        if(content.type == 'image'){
                          console.log('image here');
                          
                  return <ReactNativeZoomableView
                        key={index}
                        maxZoom={1}
                        minZoom={1}
                        zoomStep={1.1}
                        initialZoom={1}
                        bindToBorders={true}
                        onZoomEnd={this.logOutZoomState}
                        style={{
                            padding: 0,
                            backgroundColor: 'black',
                        }}
                      >
                        <Image 
                        style={{ borderRadius: 0, margin:0 }}
                            blurRadius={Number(this.state.blur)}
                            source={{
                              uri: content.url,
                              //width: deviceWidth,
                              height: deviceHeight-240
                            }} 
                            resizeMode="cover" />
                        {this.props.navigation.state.params.flow == 'edit' &&
                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <Button transparent 
                            onPress = {() => this.props.navigation.navigate("ManageAboutMeModal", {profile: this.state.profile, step: 6, from: 'editProfile', goback: true})}
                            style={{                     
                              position: 'absolute',
                              bottom: (deviceHeight-240)/2,
                            }}>                     
                            <FontAwesomeIcon 
                            size={ 40 }  
                            icon={ faCameraRetro }    
                            style={{
                              color: 'white', 
                              shadowColor: "#000",
                              shadowOffset: {
                                width: 0,
                                height: 3,
                              },
                              shadowOpacity: 0.29,
                              shadowRadius: 4.65, }} 
                            />
                          </Button>
                        </View> 
                      } 
                      </ReactNativeZoomableView>
                        
                        

                        }
                        else if(content.type == 'prompt'){
                          console.log('prompt here');
                          //update color scheme
                          colorScheme = (colorScheme == 'dark') ? 'light': 'dark';
                          
                           
                          
                      return    <LinearGradient key={index} style={{
                                  flex: 1,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  //backgroundColor: primaryColor, dimensions
                                  }}
                                  colors={colors}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1.5, y: 1.5 }}
                                  >
                                                  
                                      <View style={{flex: 1, alignContent: 'center', padding: 50 }}>
                                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }} >

                                          <Text style={{fontFamily: 'HelveticaNeue-Bold', textAlign: 'center', color: 'white', fontSize: 30, fontStyle: 'normal', marginBottom: 10, paddingLeft: 10}}>{content.promptTitle}</Text>
                                        </View>
                                        <Text style={{fontFamily: 'Helvetica', textAlign: 'center', color: 'white', fontSize: 20, padding: 20}}>"{content.promptAnswer}"</Text>                                 
                                        {this.props.navigation.state.params.flow == 'edit' &&
                                        <Button transparent 
                                          onPress = {() => this.props.navigation.navigate("ManageConversationPromptsModal", {profile: this.state.profile, from: 'editProfile', goback: true})}
                                          style={{                     
                                            flex: 1, justifyContent: 'center'
                                          }}>                     
                                          <FontAwesomeIcon 
                                          size={ 40 }  
                                          icon={ faEdit }    
                                          style={{
                                            color: 'white', 
                                            shadowColor: "#000",
                                            shadowOffset: {
                                              width: 0,
                                              height: 3,
                                            },
                                            shadowOpacity: 0.29,
                                            shadowRadius: 4.65, }} 
                                          />
                                        </Button> 
                                        }                                   
                                    </View>  
                                </LinearGradient>
                          
                          

                        }
                        else if(content.type == 'review'){
                          //update color scheme
                          colorScheme = (colorScheme == 'dark') ? 'light': 'dark';

                          return    <LinearGradient key={index} style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            //backgroundColor: primaryColor, dimensions
                            }}
                            colors={colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1.5, y: 9.5 }}
                            >
                                            


                              <View style={{flex: 1, padding: 50, justifyContent: 'center' }}>

                                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }} >                                  
                                  <Thumbnail
                                    medium
                                    onPress = {() =>   this.props.navigation.navigate("Profile", {profile: this.state.profile, from: 'Profile', goback: true}) }
                                    
                                    
                                    borderRadius={200}
                                    source={{uri: content.photo}}
                                    style={{
                                      overflow: "hidden",
                                      borderWidth: 0.5,
                                      borderColor: "white"
                                    }}
                                  />                               
                                  <Text style={{fontFamily: 'HelveticaNeue-Bold', color: 'white', fontSize: 30, fontStyle: 'normal', paddingLeft: 20, paddingTop: 10}}>{content.name+' says ...'}</Text>
                                </View>
                                <Text style={{fontFamily: 'Helvetica', color: 'white', fontSize: 20, textAlign: 'center', padding: 20}}>"{content.reason}"</Text>                                            
                                
                                {this.props.navigation.state.params.flow == 'edit' &&
                                <Button transparent 
                                  onPress = {()=> 
                                    
                                    
                                    ActionSheet.show(
                                    {
                                      options: REVIEW_OPTIONS,
                                      cancelButtonIndex: 3,
                                      destructiveButtonIndex: 3,
                                      title: 'Endorse'
                                    },
                                    (buttonIndex) => {
                                      if ((buttonIndex) === 0) {
                                        //open refer module
                                        this.props.navigation.navigate("Refer", {flow: 'endorse' });
                                        }
                          
                                      if ((buttonIndex) === 1) {
                                        //open refer module
                                        this.props.navigation.navigate("Refer", {name: content.name, flow: 'endorse' });
                                      }
                          
                                      if ((buttonIndex) === 2) {
                          
                                        //copy of users reviews in order to not directly delete from state.
                                        let userReviewsObject = this.state.profile.reviews;
                                 
                                        //delete review selected from userReviewsObject above.
                                        delete userReviewsObject[content.code_key];
                          
                                        //setState with userReviewsObject now that the removed review is gone. 
                                        this.setState({profile: { ...this.state.profile, reviews: userReviewsObject}});
                          
                                        // query for current users' matches
                                        const userMatches = firebase.database().ref('matches/'+userId+'/');

                                        //create empty placeholder object for all paths to update
                                        let updateObj = {};
                                       
                                        //USERS: add path to update inside updateObj for userid record
                                        updateObj[`users/${userId}/reviews`] = userReviewsObject;
                                        
                                        //return list of all users' matches
                                        userMatches.once('value').then(snap => {

                                          //if user has matches start to prepare updating all matches with new review data. 
                                          if (snap.exists()){

                                            //turn list of objects into array on it's keys
                                            let matchesKeys = Object.keys(snap.val());

                                            //MATCHES: add path to update inside updateObj for each appropriate match record
                                            matchesKeys.forEach( key => {

                                              updateObj[`matches/${key}/${userId}/reviews`] = userReviewsObject;
                                                
                                            });
                                          }
                                        }).then(function(){

                                          console.log('updateObj1 is '+JSON.stringify(updateObj));

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

                                        //record in analytics that review was deleted successfully 
                                        RNfirebase.analytics().logEvent('reviewDeleted', {
                                          testParam: 'testParamValue1'
                                        });

                                      }
                                    }                       
                                  )}
                                  style={{                     
                                    flex: 1, justifyContent: 'center'
                                  }}>                     
                                  <FontAwesomeIcon 
                                  size={ 40 }  
                                  icon={ faEdit }    
                                  style={{
                                    color: 'white', 
                                    shadowColor: "#000",
                                    shadowOffset: {
                                      width: 0,
                                      height: 3,
                                    },
                                    shadowOpacity: 0.29,
                                    shadowRadius: 4.65, }} 
                                  />
                                </Button>
                                }    
                              </View>                       
                            </LinearGradient>
                                 

                        }
                      })
                      
                      }
                    </View>
                  </View>
                </View>

                  <Button  
                    rounded
                    onPress={this.goToTop}  
        
                    transparent 
                    style={{ 
                      width: 90, 
                      height: 90, 
                      marginTop: 30,
                      marginBottom: 0,
                      justifyContent: 'center',
                      shadowColor: "black",
                      //backgroundColor: 'black',
                      shadowOffset: {
                        width: 4,
                        height: 4,
                      },
                      shadowOpacity: 0.29,
                      shadowRadius: 4.65, 
                    }
                    }
                    >
                        <FontAwesomeIcon 
                          size={ 50 } 
                          style={{
                           color: primaryColor,
                           }} 
                          icon={ faArrowAltCircleUp} 
                          //icon={ faArrowCircleUp } 
                        
                        />   

                        
                                 
                  </Button>  





                  { this.props.navigation.state.params.flow =='edit' && //editing profile, show Add Prompt
                    <Button  
                      rounded
                      transparent
                      onPress = {() =>  this.props.navigation.navigate("ManageConversationPromptsModal", {profile: this.state.profile, from: 'editProfile', goback: true})  }
                      style={{  
                        //marginTop: 30,
                        justifyContent: 'center',
                        // shadowColor: "#000",
                        // //backgroundColor: primaryColor,
                        // shadowOffset: {
                        //   width: 0,
                        //   height: 3,
                        // },
                        // shadowOpacity: 0.29,
                        // shadowRadius: 4.65, 
                      }}
                      >
                          <Text style={{color: primaryColor}}>Talk to me about</Text>            
                    </Button>  
                  }

                  { this.props.navigation.state.params.from =='Swipes' &&
                    <View>

                      <Button  
                        rounded
                        transparent
                        onPress = {() =>  this.blockReportFlow('Swipes') }
                        style={{  
                          justifyContent: 'center',
                          backgroundColor: 'white',
                         }}
                        >         
                            <Text style={{color: primaryColor}}>Hide</Text>
                      </Button> 

                      <Button  
                        onPress = {() =>  this.blockReportFlow('Swipes') }
                        style={{  
                          justifyContent: 'center',
                          backgroundColor: 'white',
                         }}
                        >         
                          <Text style={{color: primaryColor}}>Report</Text>
                      </Button> 
                    </View>

                  }

                  { (this.props.navigation.state.params.from =='Chat' || this.props.navigation.state.params.from =='BlindDate') &&
                   
                   <View>

                    <Button  
                      onPress = {() =>  this.blockReportFlow('ChatOrBlindDate') }
                      style={{  
                        justifyContent: 'center',
                        backgroundColor: 'white',
                      }}
                      >
                          <Text style={{color: primaryColor}}>Unmatch</Text>
                    </Button>  
                    <Button  
                    rounded
                    onPress = {() =>  this.blockReportFlow('ChatOrBlindDate') }
                    style={{  
                      justifyContent: 'center',
                      backgroundColor: 'white',
                    }}
                    >
                        <Text style={{color: primaryColor}}>Report</Text>
                  </Button> 

                   </View>

                  }               
            









              </ScrollView>
      </Container> 
    );
  }
}


export default withNavigation(Profile);

