import React, { Component } from 'react';
import { StyleSheet, Alert, Share, Keyboard, KeyboardAvoidingView } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import RNfirebase from 'react-native-firebase';
import LinearGradient from 'react-native-linear-gradient';
import * as firebase from "firebase";

import {
  Container,
  Icon,
  Text,
  Item,
  Input,
  Form,
  Textarea,
  Button,
  H1,
  H2,
  List,
  ListItem,
  Body,
  View
} from "native-base";

//const primaryColor = "#8A6077";

// const primaryColor = "#914cd5";
// const secondaryColor = "#ee9e45";

const primaryColor = "#a83a59";
const secondaryColor = "#c60dd9";
const btnColor = 'white';
const btnTextColor = primaryColor;


class Refer extends Component {


//CONFIG 109

  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      loading: true,
      gender: '',
      userId: '',
      reason: '',
      reasonRows: 8
    }

  }

  //hide nav bar on the login screen
  static navigationOptions = {
    header: null,
  };


  componentWillMount() {
     
    let userId = firebase.auth().currentUser.uid;

    let onCancel = this.props.navigation.getParam('onCancel');
    let name = this.props.navigation.getParam('name');
    let flow = this.props.navigation.getParam('flow');

    if (flow == 'invite'){
      //invite flow
      this.setState({ titleCopy: 'Invite a Friend' }); 
      this.setState({ reasonCopy: 'Why should they be invited to Focus?' }); 
      this.setState({ primaryCTA: 'Generate Invite Code'}); 
      this.setState({ secondaryCTA: 'Invite Later' });
      this.setState({ errorCopy: 'Invitation reason needs to be at least 100 characters. ' });
    }else if (flow == 'refer'){
      //refer flow
      this.setState({ titleCopy: 'Refer a Friend' }); 
      this.setState({ reasonCopy: 'Why should they be refered to Focus?' }); 
      this.setState({ primaryCTA: 'Generate Referal Code' }); 
      this.setState({ secondaryCTA: 'Refer Later' }); 
      this.setState({ errorCopy: 'Referral reason needs to be at least 100 characters. ' });

    }else if (flow == 'endorse'){
      //endorse flow
      this.setState({ titleCopy: 'Endorse a Friend' }); 
      this.setState({ reasonCopy: 'What is special about them?' }); 
      this.setState({ primaryCTA: 'Generate Endorse Code' }); 
      this.setState({ secondaryCTA: 'Endorse Later' }); 
      this.setState({ errorCopy: 'Endorsement reason needs to be at least 100 characters. ' });

    }

    this.setState({ name: name });  

    //query for logged in users information needed and set state with it.     
    firebase.database().ref('/users/' + userId).once('value', ((snapshot) => {
                
        //set state with user data. 
        this.setState({ 
          userId: userId,
          gender: snapshot.val().gender,
          user_name: snapshot.val().first_name,
          user_photo: snapshot.val().images[0].url,
        });  
    }))
      
    
    // RNfirebase.analytics().setAnalyticsCollectionEnabled(true);
    // RNfirebase.analytics().setUserId(userId);
    // RNfirebase.analytics().setCurrentScreen('Intro', 'Intro');
  
  }


  _onCancel = () => {

    let onCancel = this.props.navigation.getParam('onCancel');
    const { navigate } = this.props.navigation;

    if((onCancel == 'Intro') && (this.state.gender)){
    //if((onCancel == 'Intro') && (this.state.gender == 'female')){
      navigate("Registration");
    }else{
      this.props.navigation.goBack();

    }  
  }


  //Share function when sharing referral code native share functionality. 
  _onShare = () => {

    //record in analytics that share was dismissed 
    // Analytics.logEvent('friendReferred', {
    //   testParam: 'testParamValue1'
    // });


    //first validate that both name and reasons are complete, if not prompt error. 
    let name = this.state.name;
    let reason = this.state.reason;
    let reasonLength = reason.length;

    if(!name || reasonLength < 30){

      if(!name){
        Alert.alert("Sorry", "Please enter a name first.")
      }else {
        Alert.alert("Sorry", this.state.errorCopy+(30-reasonLength)+' characters remaining.')
      }

      alert('please enter name or reason over 10 char');
    }else{
      //contiue and fetch from getCode cloud function
      fetch('https://us-central1-blurred-195721.cloudfunctions.net/getCode?name_creator='+this.state.user_name+'&gender_creator='+this.state.gender+'&photo_creator='+this.state.user_photo+'&reason='+this.state.reason+'&userid='+this.state.userId)
      .then((response) => response.json())
      .then((responseJson) => {
                
          //save code var.
          let code = responseJson.sharable_code;
          let codeDelete = responseJson.code_id;

          //prompt native share functionality 
          Share.share({
            //message: 'You gotta check out Focus. It\'s a dating app where only men invited by women can join. You\'ll need this code to enter: '+code,
            message: 'Hi '+this.state.name+'! I just referred you to Focus and shared the following: "'+this.state.reason.substring(0, 50)+'..." read the rest on the app and using referral code of '+code,  
            url: 'https://focusdating.co', //make landing page with query param of reason. 
            title: 'Wow, have you seen this yet?' //what does this do?
          }).then(({action, activityType}) => {

            let Analytics = RNfirebase.analytics();
            if(action === Share.dismissedAction) {
              //delete unsent code from db
              firebase.database().ref('codes/' + codeDelete).remove();

              //record in analytics that share was dismissed 
              // Analytics.logEvent('shareDialogDismissed', {
              //   testParam: 'testParamValue1'
              // });

              //redirect to settings component
              //const { navigate } = this.props.navigation;
              //navigate("Settings"); 
              //this._onCancel();           

            } 
            else {
              console.log('Share successful');
            
              //record in analytics that share was dismissed 
              // Analytics.logEvent('shareDialogSent', {
              //   testParam: 'testParamValue1'
              // });

              //redirect to settings component
              //const { navigate } = this.props.navigation;
              //navigate("Settings");
              this._onCancel(); 

            }
          })
      })
      .catch(function(error) {
          alert("Data could not be saved." + error);
      });

    }

 
  };

  render() {
    const { navigate } = this.props.navigation;

    //count character remaining
    let charRemainingCopy = (30 - this.state.reason.length)+' charaters remaining';
        
    return (


      <LinearGradient style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        //backgroundColor: primaryColor, dimensions
        }}
        colors={[primaryColor, secondaryColor]}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 0.1, y: 1 }}
        >

        <KeyboardAvoidingView 
          style={{ flex: 1, alignItems: 'center', }} 
          onStartShouldSetResponder={Keyboard.dismiss}
          behavior="padding"
          enabled>

        <View style={{ flex: 1, marginTop: 50 }}>
          <View style>
            <H1 style={{
              textAlign: 'center', 
              color: 'white',
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 3,
              },
              shadowOpacity: 0.29,
              shadowRadius: 4.65, }}>{this.state.titleCopy}</H1>
            {/* <Text style={{textAlign: 'center', marginTop: 10, width: 300}}>If inviting a male, they will still need to be invited by a female to join.</Text> */}
          </View>
        </View>
        <View style={{ flex: 1, width: 300}}>
          <Item regular 
            style={{
              backgroundColor: 'white',            
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 3,
              },
              shadowOpacity: 0.29,
              shadowRadius: 4.65,  }}>
            <Input 
            placeholder='Name'
            value={this.props.navigation.getParam('name')}
            onChangeText={(name) => this.setState({name})}
            style={{fontSize: 18}}
            />
          </Item>
        </View>
        <View style={{ 
            flex: 3, 
            width: 300,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowOpacity: 0.29,
            shadowRadius: 4.65, }}>
          <View style={{}}>
            <Text style={{fontSize:13, color: 'white'}} >{((this.state.reason.length < 30) && this.state.reason)? charRemainingCopy : null }</Text>
          </View>
          <Form>
            <Textarea
            rowSpan={this.state.reasonRows} 
            style={{backgroundColor: 'white', fontSize: 18}}
            bordered 
            rounded
            placeholder={this.state.reasonCopy}
            onFocus={ () => this.setState({reasonRows:6})}
            onBlur={ () => this.setState({reasonRows:9})}

            onChangeText={(reason) => this.setState({reason})}
            value={this.state.reason}           
            />
          </Form>
        </View>   
        <View style={{ flex: 1}}>
          <Button rounded 
            style={{ 
              backgroundColor: btnColor, 
              borderRadius: 20,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 3,
              },
              shadowOpacity: 0.29,
              shadowRadius: 4.65, }} 
            onPress={() => {this._onShare();}}>
            <Text style={{color: btnTextColor}}>{this.state.primaryCTA}</Text>
          </Button>
          <Button transparent full onPress={() => {this._onCancel();}} >
            <Text style={{color: 'white'}}>{this.state.secondaryCTA}</Text>
          </Button>
        </View>

       
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }
}

export default Refer;
