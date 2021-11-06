import React, { Component } from 'react';
import { Dimensions, Animated, ActivityIndicator, Image, ImageBackground, TouchableOpacity, Modal,ScrollView,Share } from 'react-native'
import RNFirebase from "react-native-firebase";
import BlurOverlay,{closeOverlay,openOverlay} from 'react-native-blur-overlay';
import * as firebase from "firebase";
import ImageViewer from 'react-native-image-zoom-viewer';
import Swiper from 'react-native-deck-swiper';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import LinearGradient from 'react-native-linear-gradient';
import  SvgCssUri from 'react-native-svg-uri';
import { faCog, faArrowAltCircleLeft, faBriefcase, faBook, faSchool, faUniversity,  faUsers, faComments, faUserClock } from '@fortawesome/free-solid-svg-icons';
import {
  Badge,
  Card,
  CardItem,
  Container,
  Button,
  Text,
  Body,
  View,
  Thumbnail,
  ListItem,
  List,
  Left,
  Right,
  H1,
  H2,
  H3,
  Icon,
} from "native-base";

const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";
const btnColor = 'white';
const btnTextColor = primaryColor;
//let potential_match = true; //update this line for testing - 371


class Swipes extends Component {

  constructor (props) {
    super(props)
    this.state = {
      rotation: new Animated.Value(0),
      userId: '',
      user_name: null,
      user_images: '',
      user_about: '',
      user_birthday: '',
      user_gender: '',
      user_city_state: '',
      user_education: '',
      user_work: '',
      matchImages: [{url: 'https://image.nj.com/home/njo-media/width620/img/entertainment_impact/photo/lil-bub-catsbury-park-cat-convention-asbury-park-2018jpg-42ba0699ef9f22e0.jpg'}],
      imageIndex: 0,
      matchAbout: '',
      profiles: [],
      loading: true,
      unreadChatCount: 0,
      showChatCount: false,
      isEmpty: true,
      allSwiped: false,
      imageViewerVisible: false,
      profileViewerVisible: false,
      profileMaxHeight: "15%",
      swipeCountStart: 0,
      swipeCount: 0,
      query_start: null,
      query_end: null,
      cardIndex: 0
    }
  }

  //configure navigation
  static navigationOptions = ({ navigation }) => {
    return {
      headerLeft: () => (
        <Button transparent  onPress={() => navigation.navigate({routeName: 'Dashboard', transitionStyle: 'inverted'}) }>
                           
          <FontAwesomeIcon size={ 28 } style={{left: 16, color: primaryColor}} icon={ faCog } />
       </Button>
      ),
      headerTitle: () => (<FontAwesomeIcon size={ 40 } style={{fontSize: 32, color: 'lightgrey'}} icon={ faUsers } />
      ),
      headerRight: () => (
        <Button transparent onPress={() => navigation.navigate('Messages')} >
          <FontAwesomeIcon size={ 28 } style={{right: 16, color: primaryColor}} icon={ faComments } />
          { navigation.getParam('showChatCount') &&
            <Badge style={{ position: 'absolute', right: 4 }}>
              <Text>{navigation.getParam('unreadChatCount')}</Text>
            </Badge>
          }
       </Button>
      )
    };
  };

  componentDidMount() {

    //rotate logo 
    this.runAnimation()

    //force update match data so that updated settings and matches will be reflected fetched data, to get fetch fresh batch of matches. 
    const didFocus = this.props.navigation.addListener(
      'didFocus',
      payload => {

        //save params from nav if swipes needs to be force updated (since navigating backwards won't re-render component)
        let forceUpdate = this.props.navigation.getParam('forceUpdate');

        if (forceUpdate == true){
          //reset cardindex to 0
          this.setState({ loading: true, cardIndex: 0});
          //fetch new matches and put into state
          this.getMatches(userId);
        }

      }
    );

    //save userId of logged in user, to use for later db queries. 
    const userId = firebase.auth().currentUser.uid;
    this.setState({ userId: userId });

    //getMatches of current user initally. 
    this.getMatches(userId);

    //get unread chat count
    this.getUnreadChatCount(userId);

    //query for logged in users information needed and set state with it.     
    firebase.database().ref('/users/' + userId).on('value', ((snapshot) => {
                
      //if swipeCount becomes zero while component is loaded, getMore matches. 
      if (snapshot.val().swipe_count == 0) {
          //reset cardindex to 0
          this.setState({ loading: true, cardIndex: 0});
          //fetch new matches and put into state
          this.getMatches(userId);
      }

        //set state with user data. 
        this.setState({
            user_name: snapshot.val().first_name,
            user_images: snapshot.val().images,
            user_about: snapshot.val().about,
            user_birthday: snapshot.val().birthday,
            user_gender: snapshot.val().gender,
            user_city_state: snapshot.val().city_state,
            user_education: snapshot.val().education,
            user_work: snapshot.val().work,
            user_reviews: snapshot.val().reviews,
            swipeCountStart: snapshot.val().swipe_count,
            showInstructionsSwipes: snapshot.val().showInstructionsSwipes,
        }), this.showInstructions(snapshot.val().showInstructionsSwipes),
            RNFirebase.analytics().setAnalyticsCollectionEnabled(true);
            RNFirebase.analytics().setCurrentScreen('Swipes', 'Swipes');
            RNFirebase.analytics().setUserId(userId);

       })
      )
    }

    //function to run animated loading in a rotation running indefinetly
    runAnimation = () => {
      this.state.rotation.setValue(0);
      Animated.timing(this.state.rotation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => this.runAnimation());
    }

    getUnreadChatCount = (userId) => {

        firebase.database().ref('/matches/' + userId).orderByChild('unread_message').equalTo(true).on('value', ((chatSnapshot) => {

         //console.log('unread chats are: '+JSON.stringify(chatSnapshot.val())) ; 
          // if chat count is not empty, update state with count and set flag to true. Else, make sure to set flag to false. 
          if(chatSnapshot.val() !== null){
                   
            // chatArray = Object.entries(chatSnapshot).filter(function( obj ) {
            //     return obj.removed !== true;
            // });

            //set state with chat count. 
            this.setState({
              unreadChatCount: Object.keys(chatSnapshot.toJSON()).length,
              showChatCount: true
            }), this.props.navigation.setParams({ unreadChatCount: this.state.unreadChatCount, showChatCount: true });
          }else{
            this.setState({
              unreadChatCount: 0,
              showChatCount: false
            }), this.props.navigation.setParams({ unreadChatCount: this.state.unreadChatCount, showChatCount: false });

          }
        })
      )
    }


  componentWillUnmount() {
    //unmount listener for below ref
    firebase.database().ref('/matches/' + userId).off('value');
  }

  //function to show instructions, only show when showInstructions from state is true. 
  showInstructions = (showInstructionsSwipes) => {
    //alert(this.state.showInstructionsSwipes);
    if (showInstructionsSwipes) {
      openOverlay();
    };
  } 


  //async function to fetch matches from cloud function
  async getMatches(userId) {

    //turn loading flag to true, so that swiper doesn't render with null data and break.
    this.setState({ loading: true });

      //try block to fetch matches from cloud function
      try {
        //await response from could funciton
        let response = await fetch('https://us-central1-blurred-195721.cloudfunctions.net/getMatches?userid='+userId); 

        // turn returned response into json data
        let responseJson = await response.json();

        console.log('responseJson is: '+responseJson);
        // for each match userid inside responeJson
        let promises = responseJson.map((match) => {
          
          //save match userid per match into var, needed to select props of that obj.
          let matchUserId = Object.keys(match);
          // select matchType of per match
          let matchType = match[matchUserId].matchType;

          //call firebase to return profile data per match
          return firebase.database().ref('/users/' + matchUserId).once('value')
          .then((profileSnap) => {
       
            //save profileSnap to json var in order to add match type prop to it
            let profileObj = profileSnap.toJSON();

            //add new property match_type to object
            profileObj["match_type"] = matchType;

            //Return profile obj to promise. 
            return profileObj;
          })
        })

        // after all promises resolve, then set profileObj to state. 
        Promise.all(promises).then((profileObj) => {
          
          //if profile objs are empty or undefined show flag empty profiles else put profile into state
          if (profileObj === undefined || profileObj.length == 0) {
            //turn empty flag to true
            this.setState({ 
              isEmpty: true,
              allSwiped: true,
              loading: false
            });  

            // else put profilObjs into state
          }else{
            this.setState({ 
              profiles: profileObj,
              loading: false,
              isEmpty: false,
            }), this.updateWithPotentialMatches();
          }
        })

        //return 'good';
      } catch (error){
        console.log('error occured: '+error);
      }
  }



  //function to update eligible match to potential match in real time, since getMatches cloudfunction returns static matches on fetch, not reflecteive of real-time swipes. 
  updateWithPotentialMatches = () => {

    //filter out all potential matches, since those don't need to be updated.
    let eligibleMatches = this.state.profiles.filter(match => match.match_type == 'eligible_match');
   
    //save only the id's the matches that are eligible. Will be used later to check if these matches swiped right in real time. 
    let eligibleMatchesIds = eligibleMatches.map(match => match.userid);

    //define ref to users' swipe object
    let swipesReceivedRef = firebase.database().ref('swipesReceived/'+this.state.userId+'/');
       
    swipesReceivedRef.limitToFirst(1).on('child_added', function(swipesRecievedSnapshot) {

      let LatestSwipesRecievedId = Object.keys(swipesRecievedSnapshot.val());
      //let LatestSwipesRecievedId = swipesRecievedSnapshot.key();
   
      console.log('eligibleMatchesIds: '+JSON.stringify(eligibleMatchesIds));
      console.log('LatestSwipesRecievedId: '+LatestSwipesRecievedId);

      //is LatestSwipesRecievedId one of the eligibleMatchesIds? if so, update that match to potential within state. 
      if (eligibleMatchesIds.includes(String(LatestSwipesRecievedId))){
        //alert('dolphins'); 
        //console.log('exists true');  
        // save exisiting match from state into var
        // matchToUpdate = this.state.profiles[LatestSwipesRecievedId];

        // update proptery to potential
        // matchToUpdate.match_status = 'potential_match';

        // update that match to potential within user's state.
        // this.setState({...this.state.profiles, matchToUpdate})
      }else{
       // console.log('doesnt exists false');  
      }
    })  
  } 


  //function to call when a new match is intiated.
  pushNewMatch = (images, name_match, userid, userid_match, about_match, birthday_match, gender_match, city_state_match, education_match, work_match, reviews_match) => {

    user_name = this.state.user_name;
    user_images = this.state.user_images;
    user_about = this.state.user_about;
    user_birthday = this.state.user_birthday;
    user_gender = this.state.user_gender;
    user_city_state = this.state.user_city_state;
    user_education = this.state.user_education;
    user_work = this.state.user_work;
    user_reviews = this.state.user_reviews;

    //create ref to conversations obj
    conversationRef = firebase.database().ref('conversations/');

    //push new conversation obj for new match
    //make sure that users who already matched, don't show up in match queue. Otherwise duplicate conversations will occur.  
    var newConversationRef = conversationRef.push({
        blur: "40", //start blur at this amount
        messages: null,
        participants: {
          [userid_match]: {
            name: name_match,
            images: images
          },
          [userid]: {
            name: this.state.user_name,
            images: this.state.user_images
          }
        },
        active: 'true',
        match_date: new Date().getTime(),
        expiration_date: ( new Date().getTime() + 100000)  //  604800000 is 1 week in ms                                          
      }, function (error) {
        if (error) {
          //if push fails
          alert("Data could not be saved." + error);
        } else {
          //if push is successful, set new match object as well. 
          console.log("Data saved successfully.");
        
          // Get the unique key generated by push(), for the match_id value. 
          let match_id = newConversationRef.key;

          //create ref to set new match object with match_id associated with conversation_id generated above. 
          let matchesRef1 = firebase.database().ref('matches/'+userid+'/'+userid_match+'/');

          //create ref to set new match object with match_id associated with conversation_id generated above. 
          let matchesRef2 = firebase.database().ref('matches/'+userid_match+'/'+userid+'/');

          //create ref to set new conversations key/value pair witin users object.
          let conversationsMatchesRef1 = firebase.database().ref('/users/'+userid+'/').child("conversations");

          //create ref to set new conversations key/value pair witin users object.
          let conversationsMatchesRef2 = firebase.database().ref('/users/'+userid_match+'/').child("conversations");

          //console.log("reviews_match is: "+JSON.stringify(reviews_match));
          //console.log("user_reviews is: "+JSON.stringify(user_reviews));

          //set new match object
          matchesRef1.set({
            blur: "40", //start blur at this amount
            images: images, //pass images in here
            last_message: "You got a new match!", 
            last_message_date: (new Date().getTime()*-1), 
            name: name_match,
            birthday: birthday_match ,
            gender: gender_match,
            city_state: city_state_match,
            education: education_match,
            work: work_match,
            reviews: reviews_match ? reviews_match : {},
            active: 'true',
            match_date: new Date().getTime(),
            expiration_date: ( new Date().getTime() + 604800000),  //  604800000 is 1 week in ms                                          
            match_id: match_id,
            match_userid: userid_match,
            about: about_match,
            unread_message: false
          });

          //set new match object
          matchesRef2.set({
            blur: "40", //start blur at this amount
            images: user_images, //pass images in here
            last_message: "You got a new match!",
            last_message_date: (new Date().getTime()*-1), 
            name: user_name,
            birthday: user_birthday,
            gender: user_gender,
            city_state: user_city_state,
            education: user_education,
            work: user_work,
            reviews: user_reviews ? user_reviews : {},
            active: 'true',
            match_date: new Date().getTime(),
            expiration_date: ( new Date().getTime() + 604800000),  //  604800000 is 1 week in ms                                          
            match_id: match_id,
            match_userid: userid,
            about: user_about,
            unread_message: false
          });
        
          //USE MULTIPLE PATH UPDATING FOR BELOW TWO UPDATES

          //push new conversation to profile object.
          conversationsMatchesRef1.update({
            [match_id] : 'true'
        });

          //push new conversation to others' profile object.
          conversationsMatchesRef2.update({
            [match_id] : 'true'
        });

        // let Analytics = RNFirebase.analytics();
        RNFirebase.analytics().logEvent('matchEvent', {
          match: userid_match.toString()
        });


      }
    });
  }

  //Function to save new swipe object
  pushNewSwipe = (like, userid, userid_match, match_status, name_match, about_match, imagesObj, birthday_match, gender_match, city_state_match, education_match, work_match, reviews_match) => {

    //save potential_match into bool var. 
    let potential_match = (match_status == 'potential_match') ? true : false;
    //let potential_match = true; //comment out for testing

    //define ref to users' swipe object
    let swipesRef = firebase.database().ref('swipes/'+userid+'/'+userid_match+'/');
    let swipesRef2 = firebase.database().ref('swipesReceived/'+userid_match+'/'+userid+'/');

    //set or replace users swipe with latest swipe
    swipesRef.set({
      like: like,
      swipe_date: new Date().getTime(),
      //images: imagesObj
    });

    swipesRef2.set({
      like: like,
      swipe_date: new Date().getTime(),
      //images: imagesObj
    });

    //if user is potential match, then 
      // create new match object
      if ((potential_match == true) && (like == true)) { 
         //alert("save new match!");
         this.pushNewMatch(imagesObj, name_match, userid, userid_match, about_match, birthday_match, gender_match, city_state_match, education_match, work_match, reviews_match);
      }

        // let Analytics = RNFirebase.analytics();
        RNFirebase.analytics().logEvent('swipeEvent', {
          like: like.toString()
        });

  }

    //function to get 10 more matches, used when user successfully invites friend. 
    getMoreMatches = (userid) => {

      //reset cardindex to 0
      this.setState({ loading: true, cardIndex: 0});

      //update swipeCount in firebase, so that cloud function will return fresh batch of matches. 
      let userRef = firebase.database().ref('users/'+userid+'/');
      
      //update swipe count in db to 0 and in callback call getMatches for fresh batch. 
      userRef.update({  
        swipe_count: 0,
        last_swipe_sesh_date: new Date().getTime() 
      }).then(()=>{
        this.getMatches(userid);
        console.log("successfully updated swipecount, getting more matches.");

      }).catch(error => {
        console.log("couldnt update swipdconnt with error: " + error);
      });

      //set state with data. 
      this.setState({
        swipeCountStart: 0
      })
    }

  //Function to save new swipe object
  calculateAge (dateString) {// birthday is a date
      var today = new Date();
      var birthDate = new Date(dateString);
      var age = today.getFullYear() - birthDate.getFullYear();
      var m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  }

  //function to toggle profile show/hide
  toggleProfile = () => {

    //if profileMaxHeight is 50%, then change to 15%, else change to 50%
    if (this.state.profileMaxHeight == '15%'){
      this.setState({
        profileMaxHeight: "50%"
      });
    }else{
      this.setState({
        profileMaxHeight: "15%"
      });
    }

    // let Analytics = RNFirebase.analytics();
    RNFirebase.analytics().logEvent('profileViewSwipes', {
      testParam: 'testParamValue1'
    });

}
  //handle swipe events
  onSwiped = (cardIndex, direction) => {

    //ref to user object to update their swipeCount
    let userRef = firebase.database().ref('users/'+this.state.userId+'/');

    //set new swipeCount
    userRef.update({
      swipe_count: this.state.swipeCountStart + 1,
    });

    // save variable for direction of swipe
    let like = (direction == 'right') ? true : false;

    // save to firebase db swipe event and possible match
    this.pushNewSwipe(
          like, //like
          this.state.userId, //userid
          this.state.profiles[cardIndex].userid, //userid match
          this.state.profiles[cardIndex].match_type, // potential match // this.state.profiles[cardIndex].potential_match
          this.state.profiles[cardIndex].first_name, //match name
          this.state.profiles[cardIndex].about, //match about
          this.state.profiles[cardIndex].images, //match images
          //add 
          this.state.profiles[cardIndex].birthday, //match age
          this.state.profiles[cardIndex].gender, //match gender
          this.state.profiles[cardIndex].city_state, //match city
          this.state.profiles[cardIndex].education,  // match job
          this.state.profiles[cardIndex].work, // match work
          this.state.profiles[cardIndex].reviews  // match reviews


        ),this.setState({ cardIndex: cardIndex+1});//update card index in state, so that image modal has correct images 
  };
  

  renderBlurChilds() {
    return (
      <View >
          <Text style={{textAlign: 'center', color: 'white', margin: 35}}> You'll see up to 10 people per day. If it's a match, you'll be able to message each other while photos are out of focus. With each message sent photos begin to focus. </Text>          
      </View>
    );
}

  //function to renderReviews into markup
  _renderReview = (reviews) => {
    const { navigate } = this.props.navigation;

      //return markup for each review
      return ( 

      reviews ? (
      <View style={{marginTop: 10}} >
        {Object.values(reviews).map((review, index) => (
          <Card>
          <List>
            <ListItem avatar noBorder>
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
      </View>) : null
      );
    }

  //handle scroll of profile by growing/shrinking container when user scrolls and expects that. 
  _handleScroll = (event: Object) => {

    var currentOffset = event.nativeEvent.contentOffset.y;
    var direction = currentOffset > this.offset ? 'down' : 'up';
    this.offset = currentOffset;

    if((direction == 'down') && (currentOffset > 0)){
      this.setState({ profileMaxHeight: 400});

    }else if ((direction == 'up') && (currentOffset < 0)){
      this.setState({ profileMaxHeight: '15%'}),
          //scroll to top
          this.refs.ScrollView_Reference.scrollTo({x: 0, y: 0, animated: false});
    }
  }

  render () {
    //logo config
    const logo = require("../../images/focus-logo-old.svg");
    const rotation = this.state.rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });

    //other config
    const { navigate } = this.props.navigation;
    const dimensions = Dimensions.get('window');
    const height = dimensions.height;
    let userRef = firebase.database().ref('users/'+this.state.userId+'/');

    //determine width of device in order for custom margin between iphones
    let deviceWidth = Dimensions.get('window').width
    let deviceHeight = Dimensions.get('window').height
    let cardIndex = this.state.cardIndex;
 
    return (
      <Container style={{}} >

        <BlurOverlay
          radius={14}
          downsampling={2}
          brightness={-200}
          onPress={() => {
              closeOverlay();
              userRef.update({showInstructionsSwipes: false})
          }}
          customStyles={{alignItems: 'center', justifyContent: 'center'}}
          blurStyle="dark"
          children={this.renderBlurChilds()}
        />
          
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between'}}>
            { (this.state.isEmpty  && !this.state.loading ) && 
              
              <LinearGradient style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                //backgroundColor: primaryColor, dimensions
                }}
                colors={['white', 'white']}
                start={{ x: 0, y: 0.1 }}
                end={{ x: 0.1, y: 1 }}
                >
                  <FontAwesomeIcon size={ 70 } style={{
                  color: primaryColor, 
                  backgroundColor: 'transparent', 
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 3,
                  },
                  shadowOpacity: 0.29,
                  shadowRadius: 4.65,}} icon={ faUserClock }/>
                  <Text style={{textAlign: 'center', color: 'black', marginTop: 10}}> No more matches today. </Text>
                  <View style ={{marginTop: 20}}>
                    <Button rounded 
                      style={{ 
                        backgroundColor: primaryColor, 
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOffset: {
                          width: 0,
                          height: 3,
                        },
                        shadowOpacity: 0.29,
                        shadowRadius: 4.65, }} 

                        //onPress={() => this.getMoreMatches(this.state.userId)} 
                        
                        onPress = {() => navigate("Refer", {flow: 'swipes', from: 'swipes' })}
                        >
                      <Text style={{color: 'white'}}>Get More</Text>
                    </Button>
                  </View>
                </LinearGradient>}
            { (this.state.loading) &&
            <LinearGradient style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              }}
              colors={['white', 'white']}
              //colors={[primaryColor, secondaryColor]}
              start={{ x: 0, y: 0.1 }}
              end={{ x: 0.1, y: 1 }}
              >  
                <Animated.View  style={{
                    flex: 1, 
                    flexDirection: 'column',
                    justifyContent: 'center',
                    transform: [{rotate: rotation}]
                  }}>
                      <SvgCssUri 
                        width="60" 
                        height="60"   
                        fill= {primaryColor}
                        fillOpacity="0"
                        strokeWidth="0"
                        source={logo}
                        style={{          
                          shadowColor: "#000",
                          shadowOffset: {
                          width: 0,
                            height: 3,
                          },
                        shadowOpacity: 0.8,
                        shadowRadius: 8.65,}}
                      />
                  </Animated.View>
                </LinearGradient>       
            }
            
            {/* only show swiper if loading is false - loading finished  */}
            { ((!this.state.isEmpty || !this.state.allSwiped ) && !this.state.loading ) && 
            
            <LinearGradient style={{
              flex: 1,
              alignItems: 'flex-start',
              justifyContent: 'center',
              //backgroundColor: primaryColor, dimensions
              }}
              colors={['white', 'white']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 1 }}
              >
            
            <View style={{ position: 'relative', bottom: 40, flex: 1, justifyContent: 'flex-start'}}>
              <Swiper
                cards={this.state.profiles}
                ref = {swiper => {this.swiper = swiper}}
                verticalSwipe = {false}
                onTapCard={() => this.setState({ profileViewerVisible: true, matchAbout: this.state.profiles[cardIndex].about, matchReviews: this.state.profiles[cardIndex].reviews, matchEducation: this.state.profiles[cardIndex].education, matchBirthday: this.state.profiles[cardIndex].birthday, matchWork: this.state.profiles[cardIndex].work, matchGender: this.state.profiles[cardIndex].gender, matchCityState: this.state.profiles[cardIndex].city_state, matchEducation: this.state.profiles[cardIndex].education,  matchImages: Object.values(this.state.profiles[cardIndex].images) })} 
                cardIndex={this.state.cardIndex}
                backgroundColor={'white'}
                stackSeparation={11}
                stackSize={6}
                animateCardOpacity = {true}
                //shake to go back. 
                onSwiped={(index) => console.log('onSwiped at index: '+index)}
                onSwipedAll={(index) => this.setState({ allSwiped: true, isEmpty: true })}
                onSwipedRight={(index) => this.onSwiped(index,'right',true)}//this.state.profile[]cardIndex.potential_match 
                onSwipedLeft={(index) => this.onSwiped(index,'left',false)} 
                overlayLabels={{
                  bottom: {
                    title: 'swip up',
                    style: {
                      label: {
                        backgroundColor: 'black',
                        borderColor: 'black',
                        color: 'white',
                        borderWidth: 1
                      },
                      wrapper: {
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }
                    }
                  },
                  left: {
                    title: 'NOPE',
                    style: {
                      label: {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        color: 'white',
                        borderWidth: 1
                      },
                      wrapper: {
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-start',
                        marginTop: 30,
                        marginLeft: -30
                      }
                    }
                  },
                  right: {
                    title: 'LIKE',
                    style: {
                      label: {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        color: 'white',
                        borderWidth: 1
                      },
                      wrapper: {
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginTop: 30,
                        marginLeft: 30
                      }
                    }
                  },
                  top: {
                    title: 'SUPER LIKE',
                    style: {
                      label: {
                        backgroundColor: 'black',
                        borderColor: 'black',
                        color: 'white',
                        borderWidth: 1
                      },
                      wrapper: {
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }
                    }
                  }
                }}                
                renderCard={(card) => {
                  
                  return (
                  <Card style={{ elevation: 3 }}>
                    <CardItem cardBody>
                      <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',                        
                      }}>
                        <ImageBackground
                          resizeMode="cover"
                          style={{ width: '100%', height: height-245 }}
                          source={{uri: Object.values(card.images)[0].url}}
                        /> 
                      </View>
                    </CardItem>                  
                    <CardItem>
                        <Body>
                          <H3 style={{ textTransform: 'capitalize', color: primaryColor}} numberOfLines={1} >{this.calculateAge(card.birthday)}, {card.gender}, {card.city_state}</H3>
                          <Text style={{}} numberOfLines={1}>{card.education} </Text>
                          <Text style={{}} numberOfLines={1}>{card.work} </Text>
                          <Text style={{marginTop: 10}} numberOfLines={1} note>{card.about} </Text>                           
                        </Body>
                    </CardItem>            
                  </Card>)
                }}
>
            </Swiper>
            </View> 
            </LinearGradient>        
            }

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
                        uri: this.state.matchImages[0].url,
                        width: deviceWidth,
                        height: deviceHeight-200
                      }} 
                    />

                  </TouchableOpacity>
                  <View style={{flex: 1, alignSelf: 'flex-start'}}>
                    <TouchableOpacity>
                      <Card transparent style={{padding: 10}}>   
                        <H3 numberOfLines={1} style={{textTransform: 'capitalize', color: primaryColor}} >{this.calculateAge(this.state.matchBirthday)}, {this.state.matchGender}, {this.state.matchCityState}</H3>
                        <Text numberOfLines={1} style={{}} >{this.state.matchWork} </Text>
                        <Text numberOfLines={1} style={{marginBottom: 10}} >{this.state.matchEducation} </Text>
                        <Text note style={{marginTop: 10}}>{this.state.matchAbout}</Text>
                      </Card>
                      <View style={{width: deviceWidth}}>
                        {this._renderReview(this.state.matchReviews)}

                      </View>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              }

              {this.state.imageViewerVisible && 
                <ImageViewer 
                  index = {this.state.imageIndex}
                  imageUrls={this.state.matchImages}
                  onChange = {(index) => this.setState({ imageIndex: index})}
                  onSwipeDown = {() => this.setState({ imageViewerVisible: false, imageIndex: this.state.imageIndex})}
                  onClick = {() => this.setState({ imageViewerVisible: false, imageIndex: 0})}
                />  


               }   
            </Modal> 
        </View>

      </Container>
    )
  }
}

export default Swipes;
