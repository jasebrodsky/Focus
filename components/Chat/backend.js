import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

class Backend {
  uid = '';
  messagesRef = null;

  //initialize firebase backend
  constructor() {
    firebase.initializeApp({
      apiKey: "",
      authDomain: "",
      databaseURL: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: ""
    });
    auth().onAuthStateChanged((user) => {
      if (user) {
        this.setUid(user.uid);
      } else {
        auth().signInAnonymously().catch((error) => {
          alert(error.message);
        });
      }
    });
  }

  setUid(value) {
    this.uid = value;
  }

  getUid() {
    return this.uid;
  }

  //retrive msg from backend
  loadMessages(callback) {
    this.messageRef = database().ref('/conversations/1/messages/');
    this.messageRef.off();
    const onReceive = (data) => {
      const message = data.val();
      callback({
        _id: data.key,
        text: message.text,
        createdAt: new Date(message.createdAt),
        user: {
          id: message.user._id,
          name: message.user.name
        }
      });
    };
    this.messageRef.limitToLast(50).on('child_added', onReceive);
  }

  //send msg to db
  SendMessage(message) {
    for (let i = 0; i < message.length; i++) {
      this.messageRef.push({text: message[i].text, user: message[i].user, createdAt: database.ServerValue.TIMESTAMP});
    }
  }

  CloseChat() {
    if (this.messageRef) {
      this.messageRef.off();
    }
  }

}

export default new Backend();
