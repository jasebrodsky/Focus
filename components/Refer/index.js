import React, { Component } from 'react';
import { StyleSheet, Alert, Share, Keyboard } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import RNfirebase from 'react-native-firebase';
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

const primaryColor = "#8A6077";

class Refer extends Component {

  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      loading: true,
      gender: '',
      userId: '',
      reason: '',
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
      this.setState({ titleCopy: 'Invite Friend' }); 
      this.setState({ reasonCopy: 'Why should they be invited to to Focus?' }); 
      this.setState({ primaryCTA: 'Generate Invite Code'}); 
      this.setState({ secondaryCTA: 'Invite Later' });
      this.setState({ errorCopy: 'Invitation reason needs to be atleast 100 characters. ' });
    }else if (flow == 'refer'){
      //refer flow
      this.setState({ titleCopy: 'Refer Friend' }); 
      this.setState({ reasonCopy: 'Why should they be refered to to Focus?' }); 
      this.setState({ primaryCTA: 'Generate Referal Code' }); 
      this.setState({ secondaryCTA: 'Refer Later' }); 
      this.setState({ errorCopy: 'Referral reason needs to be atleast 100 characters. ' });

    }else if (flow == 'endorse'){
      //endorse flow
      this.setState({ titleCopy: 'Endorse Friend' }); 
      this.setState({ reasonCopy: 'What is special about them?' }); 
      this.setState({ primaryCTA: 'Generate Endorse Code' }); 
      this.setState({ secondaryCTA: 'Endorse Later' }); 
      this.setState({ errorCopy: 'Endorsement reason needs to be atleast 100 characters. ' });

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

    if(onCancel == 'Intro'){
      navigate("Settings");
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

    if(!name || reasonLength < 100){

      if(!name){
        alert('Please enter a valid name');
      }else {
        alert(this.state.errorCopy+(100-reasonLength)+' characters remaining.');
      }

      alert('please enter name or reason over 10 char');
    }else{
      //contiue and fetch from getCode cloud function
      fetch('https://us-central1-blurred-195721.cloudfunctions.net/getCode?name_creator='+this.state.user_name+'&photo_creator='+this.state.user_photo+'&reason='+this.state.reason+'&userid='+this.state.userId)
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
    let charRemainingCopy = (100 - this.state.reason.length)+' charaters remaining';
        
    return (
      <Container style={{ flex: 1, alignItems: 'center',  }} onStartShouldSetResponder={Keyboard.dismiss}>

        <View style={{ flex: 1, marginTop: 50 }}   >
          <View>
            <H1 style={{textAlign: 'center', color: primaryColor}}>{this.state.titleCopy}</H1>
            {/* <Text style={{textAlign: 'center', marginTop: 10, width: 300}}>If inviting a male, they will still need to be invited by a female to join.</Text> */}
          </View>
        </View>
        <View style={{ flex: 1, width: 300}}>


          
          <Item regular>
            <Input 
            placeholder='Name'
            value={this.props.navigation.getParam('name')}
            onChangeText={(name) => this.setState({name})}
            />
          </Item>
        </View>
        <View style={{ flex: 3, width: 300}}>
          <Form>
            <Textarea
            rowSpan={10} 
            bordered 
            rounded
            placeholder={this.state.reasonCopy}
            onChangeText={(reason) => this.setState({reason})}
            value={this.state.reason}           
            />
          </Form>
          <View style={{flex: 1}}>
            <Text style={{fontSize:13}} >{((this.state.reason.length < 100) && this.state.reason)? charRemainingCopy : null }</Text>
          </View>
        </View>
        <View style={{ flex: 1}}>
          <Button bordered style={{borderColor: primaryColor}} onPress={() => {this._onShare();}}>
            <Text style={{color: primaryColor}}>{this.state.primaryCTA}</Text>
          </Button>
          <Button transparent full onPress={() => {this._onCancel();}} >
            <Text style={{color: primaryColor}}>{this.state.secondaryCTA}</Text>
          </Button>
        </View>
      </Container>
    );
  }
}

export default Refer;
