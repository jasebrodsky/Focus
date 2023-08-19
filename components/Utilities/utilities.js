    
    // import RNFirebase from "react-native-firebase";
    // import * as firebase from "firebase";
    import firebase from '@react-native-firebase/app';
    import {Toast} from "native-base";
    import {Dimensions, Vibration} from "react-native";

    const primaryColor = "#a83a59";
    const secondaryColor = "#c60dd9";

    
    //import Toast from 'react-native-toast-message';

    //use onMessage handler when message is recieved - can use on each module instead of in utilities, to simplify? could also put logic in fcm message in functions to only trigger to correct user, elimintating firebase querying. 
    // conditionally render logic if on appropriate module (not on swipes and not on chat while talking to same user)
    // only then render the foreground notifications (use native handler for this if possible)


    // //fcm recieved chat use case
    // //only tirgger fcm for chat reciept, user won't get notified after sending own chat. 
    // firebase.messages().onMessage(msg => {
    //   // confirm not currenlty chatting with user in notification
    //    if (msg.chatSender !== this.state.chat.profle.userid) {
    //     renderNotification(msg.text)
    //   }

    // });

    // //message recieved on swipes use case (and all other modules.)
    // //dont trigger match notification for user doing the swiping. only swipe reciepient.
    // firebase.messages().onMessage(msg => {
    //     renderNotification(msg.text)
      
    // });

    
    //Render notification markup
    export function renderNotification (text) {
      
        Toast.show({
          supportedOrientations: ['portrait'],
          text: text,
          position: 'top',
          buttonText: 'X',
          duration: 1500,
          textStyle: {color: 'white', fontFamily:'Helvetica'},
          style: {
            backgroundColor: '#1C1C24',
            borderBottomWidth: 3,
            borderColor: primaryColor,
            top: 10,
            borderRadius: 0,
            position: 'absolute',
            right: 0,
            left: 0,
            height: 60,
            width: Dimensions.get('window').width,
          },
        }),
       
        Vibration.vibrate(500);

      }

    // export function renderNotification (text) {
    //   Toast.show({
    //     type: 'info',
    //     text1: 'This is an info message'
    //   });
    // }
  
      //function to show toasts for notification
    // export function handleNotification(userId, screen, matchUseridExclude) {

      
    //     firebase.database().ref('/matches/' + userId).orderByChild('showNotification').on('child_changed', (notifySnapshot) => {
      
    //       alert('matchUseridExclude is: '+matchUseridExclude);
    //       // alert('notifySnapshot.val().match_userid is: '+notifySnapshot.val().match_userid);
          
    //       //first check if there's a notification to render by checking if showNotification is true on the child_changed event on the match, also check that notificaiton has happened since module mounted, so old notificaitons aren't served.  
    //       if((notifySnapshot.val().showNotification == true) && (notifySnapshot.val().last_message_date*-1 < new Date().getTime())){
    //         //render notification based off the notification type
    //         switch (notifySnapshot.val().notificationType) {
    //           case 'newMatch':
    //             //don't notify of new match while on Swipes screen.
    //             if(screen !== 'Swipes'){
    //               renderNotification('New Match with '+notifySnapshot.val().name);
    //             }
    //             break;
    //           case 'newChat':
    //             //alert('matchUseridExclude is: '+matchUseridExclude); //WHY IS matchUserId being set to null here? 
    //             //don't notify of new chat while on chat screen and chatting with that user. Match to exclude is only sent on chat page.
    //              if (matchUseridExclude == notifySnapshot.val().match_userid){ //then check if person to exclude is not who you're talking to
    //                 //don't notify when chat is open with user
    //                 alert('dont notify since need to exclude this user from sending you a notificaiton');
    //                 break;
    //               }else{
    //                 //must not be on chat page, since match_user_exclude is not set
    //                 renderNotification('New Chat from '+notifySnapshot.val().name);
    //                 break;
    //               }
                
    //           case 'newBlindDate':
    //             renderNotification('New Blind Date requested.');
    //             break;
    //           case 'planned': //blind date accepted
    //             renderNotification('Blind Date ready!');
    //             break;
    //           case 'accepted': //blind date accepted
    //               renderNotification('Blind Date accepted!');
    //               break;
    //           case 'declined': //blind date declined
    //               renderNotification('Blind Date declined.');
    //               break;                   
    //           case 'pendingUpdate': //blind date updated
    //               renderNotification('Blind Date updated.');
    //               break;
    //           case 'pending': //blind date updated
    //               renderNotification('Blind Date updated.');
    //               break;                 
    //           case 'conversationExtended':
    //             renderNotification(notifySnapshot.val().name+' has extended the conversation!');
    //             break;
    //           default:
    //             console.log(`Sorry, no matching notification type`);
    //         }
  
    //         //turn off notificationShow bool so it doesn't show again. 
    //         firebase.database().ref('/matches/' + userId +'/'+ notifySnapshot.key).update({
    //           'showNotification': false
    //         });        
    //       }
    //     })
    // }