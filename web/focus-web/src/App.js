import React from 'react';
import logo from './focus-logo.png';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Image, Table, Button, Container, Row, Modal, Form, Pagination, PageItem } from 'react-bootstrap';
import axios from 'axios';
import * as firebase from 'firebase';
import jwt_decode from 'jwt-decode';


//Firebase project configuration
const config = {
    apiKey: "AIzaSyA5RHfMVtj36x0f9KAMw_iLFYKfCxFjuuo",
    authDomain: "blurred-195721.firebaseapp.com",
    databaseURL: "https://blurred-195721.firebaseio.com",
    projectId: "blurred-195721",
    storageBucket: "blurred-195721.appspot.com",
    messagingSenderId: "479759716253",
    appId: "1:479759716253:web:01edde286058b5deff2974"
};

//initialize app
firebase.initializeApp(config);

// Get a reference to the Firestore database
const db = firebase.firestore();
const firebasedb = firebase.database();


//calculate age
function getAge(dateString) {
  var today = new Date();
  var birthDate = new Date(dateString);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
  }
  return age;
}

//reported modal
function ReportModal(props) {

  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {props.user && <p>{props.user.name.toUpperCase()+' / '+props.user.gender.toUpperCase()+' / '+getAge(props.user.birthday)}</p> }
        </Modal.Title>
      </Modal.Header>
      <Modal.Body >
          { props.user && 
        
          <div>

              <Table size='sm'  bordered responsive variant="light">
                <thead>
                  <tr>
                    <th>Refer?</th>
                    <th>Work</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Education</th>
                    <th>Preference</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                    <tr>
                      <td>{props.user.referStatus}</td>   
                      <td>{props.user.work}</td>  
                      <td>{props.user.email}</td> 
                      <td>{props.user.location}</td>              
                      <td>{props.user.education}</td>
                      <td>{props.user.gender_pref}</td>
                      <td>{new Date(props.user.last_login).toLocaleDateString("en-US")}</td>
                    </tr>
                </tbody>
              </Table>
              <p>{(props.user.referReason) ? 'Referred Reason: '+props.user.referReason: null}</p>

              {props.user.images.map(image => 
                <Image thumbnail
                  style={{width: 240, margin: 5}}
                  src={image.url}  />    
                  )
               }
            </div>           
            }
      </Modal.Body>
      <Modal.Footer>
        <Button style={{textAlign: 'left'}}onClick={props.onHide} variant="outline" >Close</Button>
        <Button onClick={props.handleRemoveUser} variant="outline-danger">Remove</Button>
        <Button onClick={props.handleDismissReport} variant="outline-primary">Dismiss</Button>
      </Modal.Footer>
    </Modal>
  );
}

//waitlist modal
function WaitlistModal(props) {

  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {props.user && <p>{props.user.name.toUpperCase()+' / '+props.user.gender.toUpperCase()+' / '+getAge(props.user.birthday)}</p> }
        </Modal.Title>
      </Modal.Header>
      <Modal.Body >
          { props.user && 
        
          <div>

              <Table size='sm'  bordered responsive variant="light">
                <thead>
                  <tr>
                    <th>Refer?</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Work</th>
                    <th>Education</th>
                    <th>Preference</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                    <tr>
                      <td>{props.user.referStatus}</td>  
                      <td>{props.user.email}</td>                                  
                      <td>{props.user.city_state}</td>
                      <td>{props.user.work}</td> 
                      <td>{props.user.education}</td>
                      <td>{props.user.gender_pref}</td>
                      <td>{new Date(props.user.last_login).toLocaleDateString("en-US")}</td>
                    </tr>
                </tbody>
              </Table>
              <p>{(props.user.referReason) ? 'Referred Reason: '+props.user.referReason: null}</p>

              {props.user.images.map(image => 
                <Image thumbnail
                  style={{width: 240, margin: 5}}
                  src={image.url}  />    
                  )
               }
            </div>           
            }
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide} variant="outline-danger" >Close</Button>
        <Button onClick={props.handleAccept} variant="outline-primary">Accept</Button>
      </Modal.Footer>
    </Modal>
  );
}


//active modal
function ActiveModal(props) {

  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {props.user && <p>{props.user.name.toUpperCase()+' / '+props.user.gender.toUpperCase()+' / '+getAge(props.user.birthday)}</p> }
        </Modal.Title>
      </Modal.Header>
      <Modal.Body >
          { props.user && 
        
          <div>

              <Table size='sm'  bordered responsive variant="light">
                <thead>
                  <tr>
                    <th>Refer?</th>
                    <th>Work</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Education</th>
                    <th>Preference</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                    <tr>
                      <td>{props.user.referStatus}</td>   
                      <td>{props.user.work}</td>  
                      <td>{props.user.email}</td>               
                      <td>{props.user.city_state}</td>
                      <td>{props.user.education}</td>
                      <td>{props.user.gender_pref}</td>
                      <td>{new Date(props.user.last_login).toLocaleDateString("en-US")}</td>
                    </tr>
                </tbody>
              </Table>
              <p>{(props.user.referReason) ? 'Referred Reason: '+props.user.referReason: null}</p>

              {props.user.images.map(image => 
                <Image thumbnail
                  style={{width: 240, margin: 5}}
                  src={image.url}  />    
                  )
               }
            </div>           
            }
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide} variant="outline-danger" >Close</Button>
        {/* <Button onClick={props.handleAccept} variant="outline-primary">Accept</Button> */}
      </Modal.Footer>
    </Modal>
  );
}



class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      mode: 'manageWaitlist',
      waitlistModalShow: false,
      activeModalShow: false,
      userCurrentPage: 1,
      usersPerPage: 10,
      userData: [],
      loggedIn: false,
      email: '',
      password: '',
      credentials: [
        { email: 'jasebrodsky@gmail.com', password: '12345'},
        { email: 'test@aol.com', password: '123'},
        { email: 'test@aol.com', password: '123'},
      ], 
      images: [{ url: 'https://cdn.pixabay.com/photo/2020/05/20/08/27/cat-5195431_1280.jpg'}],
      dateModalShow: false,
      dateCurrentPage: 1,
      datesPerPage: 25,
      datesData: [],
      test: 'test',
      date: {
        placeName: 'placeName',
        type: 'type',
        placeAddress: 'placeAddress',
        confirmedTime: '2017-06-01T08:30',
        userInvited: 'userInvited',
        userInvited: 'userInvited',
        confirmedLat: '',
        confirmedLong: '',
        proposedLat: '',
        proposedLong: '',
      },

      
    }

  }

  
  //function to handle pagination clicks
  handleClick = (event) => {

    //scroll to top
    window.scrollTo(0, 0);
    //update waitlistCurrentPage currentPage in state
    this.setState({
      userCurrentPage: Number(event.target.id)
    });
  }


  handleLogin = async () => {

    try {

      // Sign in the user with the specified email and password
      const userCredential = await firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password);

      // Get the user's ID token
      const idToken = await userCredential.user.getIdToken();
  
      // Decode the user's ID token to get the custom claims
      const decodedToken = jwt_decode(idToken);
  
      // Check if the user has the admin role
      if (decodedToken.role === 'admin') {
        // The user has the admin role
        console.log('User is an admin');
        alert('user is admin');
        
        this.setState({
          loggedIn: true
        });

      } else {
        // The user does not have the admin role
        console.log('User is not an admin');
        alert('user not admin');
      }
    } catch (error) {
      // Handle errors
      console.error(error);
      alert(error);

    }
  }
  
  //function to handle acceptance off waitlist
  handleAccept = (userid) => {
    //update status field of user to active


      // Get a reference to the user collection you want to query - firestore
      const usersRef = db.collection('users');
      // -- realtime database
      const usersRefFbDb = firebasedb.ref('users');

      // // Build a query for user at specific userid
      // const usersQuery = usersRef.where('userid', '==', userid);

      // // Update user document with properties {status: 'active', initialUser: false}
      // usersQuery.get().then((querySnapshot) => {
      //   querySnapshot.forEach((doc) => {
      //     doc.ref.update({
      //       status: 'active',
      //       initialUser: 'false'
      //     }).then(() => {
      //       console.log('Document successfully updated!');
      //     }).catch((error) => {
      //       console.error('Error updating document: ', error);
      //     });
      //   });
      // });


    //update status field of user to active
    usersRefFbDb.child(userid).update({
      status: 'active',
      intialUser: 'false'
    });

    
    //close modal if it's opened
    this.setState({
      waitlistModalShow: false
    });
  }


    //function to handle dismiss from reported status
    handleDismissReport = (userid) => {

      // Get a reference to the user collection you want to query
      const usersRef = db.collection('users');

      // Build a query for user at specific userid
      const usersQuery = usersRef.where('userid', '==', userid);

      // Update user document with properties {status: 'active', initialUser: false}
      usersQuery.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          doc.ref.update({
            reported: false,
          }).then(() => {
            console.log('Document successfully updated!');
          }).catch((error) => {
            console.error('Error updating document: ', error);
          });
        });
      });
      
      //close modal if it's opened
      this.setState({
        reportModalShow: false
      });
    }

    //function to handle removal of user
    handleRemoveUser = (userid) => {

      // Get a reference to the user collection you want to query
      const usersRef = db.collection('users');

      // Build a query for user at specific userid
      const usersQuery = usersRef.where('userid', '==', userid);

      // Update user document with properties {status: 'active', initialUser: false}
      usersQuery.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          doc.ref.update({
            status: 'deleted',
          }).then(() => {
            console.log('Document successfully updated!');
          }).catch((error) => {
            console.error('Error updating document: ', error);
          });
        });
      });


      

      //close modal if it's opened
      this.setState({
        reportModalShow: false
      });
    }

  //function to handle updating date
  handleUpdate = () => {

    // reference to dates node in firebase database
    const recentDatesRef = firebasedb.ref('dates');

    // reference to dates node in firebase database
    const recentDatesConversationsRef = firebasedb.ref('conversations/');

    // reference to matches node in firebase database
    const recentDatesMatchesRef = firebasedb.ref('matches/');

    // update the node with the specified dateId -- update date with new data
    recentDatesRef.child(this.state.date.dateId).update({
      status: 'accepted',
      placeName: this.state.date.placeName,
      type: this.state.date.type,
      placeAddress: this.state.date.placeAddress,
      confirmedTime: this.state.date.confirmedTime,
      confirmedLat: this.state.date.confirmedLat,
      confirmedLong: this.state.date.confirmedLong
    });
  
    // update the node with the specified dateId -- update date with new data
    recentDatesConversationsRef.child(this.state.date.dateId+'/date').update({
      status: 'accepted',
      placeName: this.state.date.placeName,
      type: this.state.date.type,
      placeAddress: this.state.date.placeAddress,
      confirmedTime: this.state.date.confirmedTime,
      confirmedLat: this.state.date.confirmedLat,
      confirmedLong: this.state.date.confirmedLong,
    });

    //update match's date with new data        
    // update the node with the specified dateId -- update date with new data -- DO WE NEED THIS?
    // recentDatesMatchesRef.child(this.state.date.userCreator+'/'+this.state.date.userInvited).update({
    //   status: 'accepted',
    //   placeName: this.state.date.placeName,
    //   placeAddress: this.state.date.placeAddress,
    //   confirmedTime: this.state.date.confirmedTime,
    //   showNotification: true,
    //   notificationType: 'planned'
    // });

    // //update other match's date with new data
    // recentDatesMatchesRef.child(this.state.date.userInvited+'/'+this.state.date.userCreator).update({
    //   status: 'accepted',
    //   placeName: this.state.date.placeName,
    //   placeAddress: this.state.date.placeAddress,
    //   confirmedTime: this.state.date.confirmedTime,
    //   showNotification: true,
    //   notificationType: 'planned'
    // });
    
    //close date modal if it's opened
    this.setState({
      dateModalShow: false
    });
  }

  //function to handle showing waitlist modal 
  waitlistModalShow = ( user) => {
 
    //put selected user to state and show waitlistModalShow modal
    this.setState({
        user: user,
        waitlistModalShow: true
    });
  }


  //function to handle showing active modal 
  activeModalShow = ( user) => {

    //put selected user to state and show activeModalShow modal
    this.setState({
        user: user,
        activeModalShow: true
    });
  }

  //function to handle showing report modal 
  reportModalShow = ( user) => {

    //put selected user to state and show reportModalShow modal
    this.setState({
        user: user,
        reportModalShow: true
    });
  }

    //function to handle showing date modal
    dateModalShow = ( date) => {
       //put selected user to state and show waitlistModalShow modal
      this.setState({
          date: date,
          dateModalShow: true
      });
    }

    //render either waitlist or blind date data
    renderData = (mode) => {

      //create empty array to hold users
      let arr = [];

      console.log('arr is: '+arr); 

      if (mode == 'manageWaitlist'){

        console.log('mode  is: '+mode); 
        const recentUsersRef = db.collection('users');      // Build a query for user at specific userid
        const recentUsersQuery = recentUsersRef.where('status', '==', 'waitlist'); //order by status here
        recentUsersQuery.onSnapshot((querySnapshot) => {
          
          querySnapshot.forEach((doc) => {
            //console.log(`${doc.id} => ${doc.data()}`);

            //create user obj
            const user = {
              userid: doc.id ? doc.id : null ,
              images: doc.data().images ? doc.data().images : null ,
              photoURL: doc.data().images[0].url ? doc.data().images[0].url : null ,
              referStatus:  doc.data().referStatus,
              referReason: doc.data().referReason,
              name: doc.data().first_name+' '+doc.data().last_name,
              work: doc.data().work,
              key: doc.id,
              // about: childSnapShot.val().about,
              birthday: doc.data().birthday,
              email: doc.data().email, 
              city_state: doc.data().city_state,
              education: doc.data().education,
              gender: doc.data().gender,
              gender_pref: doc.data().gender_pref,
              last_login:  doc.data().last_login,           
              fcmToken:  doc.data().fcmToken,
              email: doc.data().email,
              
            }
            //push user to array
            arr.push(user);

          });

          //sort array by referStatus
          //arr.sort((a, b) => a.referStatus - b.referStatus)

          //sort array by login_date
          arr.sort((a, b) => b.last_login - a.last_login)

          //set sorted array to state
          this.setState({
            userData: arr,
          });
          //clear array 
          arr = [];
          })

        }


        else if (mode == 'manageActive'){

          console.log('mode  is: '+mode); 
          const recentUsersRef = db.collection('users');      // Build a query for user at specific userid
          const recentUsersQuery = recentUsersRef.where('status', '==', 'active'); //order by status here
          recentUsersQuery.onSnapshot((querySnapshot) => {

            
            querySnapshot.forEach((doc) => {
              console.log(`${doc.id} => ${doc.data()}`);
  
              //create user obj
              const user = {
                userid: doc.id ? doc.id : null ,
                images: doc.data().images ? doc.data().images : null ,
                photoURL: doc.data().images[0].url ? doc.data().images[0].url : null ,
                referStatus:  doc.data().referStatus,
                referReason: doc.data().referReason,
                name: doc.data().first_name+' '+doc.data().last_name,
                work: doc.data().work,
                key: doc.id,
                // about: childSnapShot.val().about,
                birthday: doc.data().birthday,
                email: doc.data().email, 
                city_state: doc.data().city_state,
                education: doc.data().education,
                gender: doc.data().gender,
                gender_pref: doc.data().gender_pref,
                last_login:  doc.data().last_login,           
                fcmToken:  doc.data().fcmToken,
                email: doc.data().email,
                
              }
              //push user to array
              arr.push(user);
  
            });
  
            //sort array by referStatus
            //arr.sort((a, b) => a.referStatus - b.referStatus)
  
            //sort array by login_date
            arr.sort((a, b) => b.last_login - a.last_login)
  
            //set sorted array to state
            this.setState({
              userData: arr,
            });
            //clear array 
            arr = [];
            })
  
          }

          else if (mode == 'manageReports'){

            console.log('mode  is: '+mode); 
            const recentUsersRef = db.collection('users');      // Build a query for user at specific userid
            const recentUsersQuery = recentUsersRef.where('reported', '==', true); //order by status here
            recentUsersQuery.onSnapshot((querySnapshot) => {
              
              querySnapshot.forEach((doc) => {
                console.log(`${doc.id} => ${doc.data()}`);
    
                //create user obj
                const user = {
                  userid: doc.id ? doc.id : null ,
                  images: doc.data().images ? doc.data().images : null ,
                  photoURL: doc.data().images[0].url ? doc.data().images[0].url : null ,
                  referStatus:  doc.data().referStatus,
                  referReason: doc.data().referReason,
                  name: doc.data().first_name+' '+doc.data().last_name,
                  work: doc.data().work,
                  key: doc.id,
                  // about: childSnapShot.val().about,
                  birthday: doc.data().birthday,
                  email: doc.data().email, 
                  city_state: doc.data().city_state,
                  education: doc.data().education,
                  gender: doc.data().gender,
                  gender_pref: doc.data().gender_pref,
                  last_login:  doc.data().last_login,           
                  fcmToken:  doc.data().fcmToken,
                  email: doc.data().email,
                  
                }
                //push user to array
                arr.push(user);
    
              });
    
              //sort array by referStatus
              //arr.sort((a, b) => a.referStatus - b.referStatus)
    
              //sort array by login_date
              arr.sort((a, b) => b.last_login - a.last_login)
    
              //set sorted array to state
              this.setState({
                userData: arr,
              });
              //clear array 
              arr = [];
              })
    
            }

        else if (mode == 'manageDates'){

          // reference to dates node in firebase database
          const recentDatesRef = firebasedb.ref('dates');

          // Build a query with for dates with status of fulfill
          const recentDatesQuery = recentDatesRef.orderByChild('status').equalTo('fulfill');        
          
          // Read query once to return all dates in fulfill status
          recentDatesQuery.on('value', (recentDatesSnapshot) => {
            // Handle the snapshot data
            console.log('recentDatesSnapshot: '+recentDatesSnapshot.val());

            //with each date, create obj date
            recentDatesSnapshot.forEach(childSnapShot => {
              //create date obj
              const date = {
                status: childSnapShot.val().status,
                userCreator: childSnapShot.val().userCreator,
                userInvited: childSnapShot.val().userInvited,
                proposedTime: childSnapShot.val().proposedTime,
                proposedLat: childSnapShot.val().proposedLat,
                proposedLong: childSnapShot.val().proposedLong,   
                priceMax: childSnapShot.val().priceMax,
                placeName: childSnapShot.val().placeName,
                type: childSnapShot.val().type,
                placeAddress: childSnapShot.val().placeAddress,
                confirmedLat: childSnapShot.val().confirmedLat,
                confirmedLong: childSnapShot.val().confirmedLong,   
                confirmedTime: childSnapShot.val().confirmedTime,
                created: childSnapShot.val().created,
                dateId: childSnapShot.key,
              }
              //push user to array
              arr.push(date);
            });
  
            //sort array by login_date
            arr.sort((a, b) => b.proposedTime - a.proposedTime)
  
            //set sorted array to state
            this.setState({
              datesData: arr,
            });
    
            //clear array 
            arr = [];

          }, (error) => {
            // Handle errors
            console.error(error);
          });
  
        }

    }


    //function to handle clicking nav
    navClick = (mode) => {

      //set state with appropriate mode
      this.setState({
          mode: mode,
      });
      
      //render real-time data into page
      this.renderData(mode);
    }




    // getYelp = async() => {
    //   try {
    //     const res = await fetch(`https://us-central1-blurred-195721.cloudfunctions.net/yelpAutoSuggest`);

    //     console.log('res', res)


    //     // const json = await res.json();
    //     // console.log('json', json)
    //   } catch (err) {
    //     console.error('err', err);
    //   }
    
    // }



    // getYelp = async() => {
    //   //const params = {lat: this.state.date.proposedLat, lng: this.state.date.proposedLong};
      
    //       fetch('https://us-central1-blurred-195721.cloudfunctions.net/getMatches')
    //       .then(response => {
    //         if (!response.ok) {
    //           throw new Error(response.statusText)
    //         }
    //         return response.json()
    //       }).catch(err=>{
    //       console.log(err)
    //   })

    // }



      // Promise.props({
      //   local: axios({
      //     url: 'https://us-central1-blurred-195721.cloudfunctions.net/yelpAutoSuggest',
      //     params: params,
      //     json: true,
      //     method: 'GET',
      //     withCredentials: true,
      //     headers: {
      //                 'user-key': 'CKia7Mz51NpAHxvG-thuvuZk0RGPeGmyVyYVsYJEfAOI_nO2acc3NRZROLq-VgkXVD2RvqzVzKiMz3tdoVKc8NPhc8-5prI7VFZMWTtXpSKmp0J_HVsEyCS_1IrLYXYx',
      //                 'Accept': 'application/json',
      //                 'Content-Type': 'application/json',
      //                 'Origin': 'http://localhost:3000',
      //                 'Access-Control-Allow-Headers': '*',
      //                 'Access-Control-Allow-Origin': '*',
      //             },
      //   }).then(res => console.log(res))
      //     .catch(err => console.log('error is: '+err))
      //  })
      //   .then(data => {
      //     // this.setState({
      //     //   yelpData: data
      //     // });
      //     console.log('set state with yelp data now.');
      //   });
      //  }
      




  componentDidMount() {

    this.renderData(this.state.mode);  //render with initial data into page

  }

  render() {

    // Logic for displaying data
    const { userData, datesData, userCurrentPage, dateCurrentPage, usersPerPage, datesPerPage } = this.state;
    const indexOfLastUser = userCurrentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const indexOfLastDate = dateCurrentPage * datesPerPage;
    const indexOfFirstDate = indexOfLastDate - datesPerPage;
    const currentUsers = userData.slice(indexOfFirstUser, indexOfLastUser);
    const currentDates = datesData.slice(indexOfFirstDate, indexOfLastDate);

    //this.getYelp();

    const waitlistHeader = 
      <tr>
        <th></th>
        <th>Photo</th>
        <th>Name</th>
        <th>ID</th>
        <th>Refer?</th>
        <th>Work</th>
        {/* <th>About</th> */}
        <th>Age</th>
        <th>Email</th>
        <th>Location</th>
        <th>Education</th>
        <th>Gender</th>
        <th>Preference</th>
        <th>Created</th>
      </tr>;

    const activeHeader = 
      <tr>
        <th></th>
        <th>Photo</th>
        <th>Name</th>
        <th>ID</th>
        <th>Refer?</th>
        <th>Work</th>
        {/* <th>About</th> */}
        <th>Age</th>
        <th>Email</th>
        <th>Location</th>
        <th>Education</th>
        <th>Gender</th>
        <th>Preference</th>
        <th>Created</th>
      </tr>;

      const reportsHeader = 
      <tr>
        <th></th>
        <th>Photo</th>
        <th>Name</th>
        <th>ID</th>
        <th>Refer?</th>
        <th>Work</th>
        {/* <th>About</th> */}
        <th>Age</th>
        <th>Email</th>
        <th>Location</th>
        <th>Education</th>
        <th>Gender</th>
        <th>Preference</th>
        <th>Created</th>
      </tr>;

      const datesHeader = 
      <tr>
        <th></th>
        <th>Status</th>
        <th>User Created</th>
        <th>Proposed Time</th>
        <th>Price Max</th>
        <th>Created</th>
      </tr>;




    // Logic for managing pages needed
    const pageNumbers = [];

    //logic ot handle waitlist vs dates pagination
    if (this.state.mode == 'manageWaitlist' || this.state.mode == 'manageActive' || this.state.mode == 'manageReports'){
      for (let i = 1; i <= Math.ceil(userData.length / usersPerPage); i++) {
        pageNumbers.push(i);
      }
    }
    else if (this.state.mode == 'manageDate'){
      for (let i = 1; i <= Math.ceil(datesData.length / datesPerPage); i++) {
        pageNumbers.push(i);
      } 
    }



    // function to render page numbers to page
    const renderPageNumbers = pageNumbers.map(number => {
      return (
        <PageItem id={number} onClick={this.handleClick} active={number == userCurrentPage ? true : false} key={number} >
          {number}
        </PageItem>
      );
    });

    //function to render dates
    const renderDates = currentDates.map((date, index) => {
      return (
        <tr key={index}  >
          <td>
            <Button onClick={() => this.dateModalShow(date)} variant="outline-primary">Manage</Button>
          </td>
          <td onClick={() => this.dateModalShow(date)}>{date.status}</td>
          <td onClick={() => this.dateModalShow(date)}>{date.userCreator}</td>
          <td onClick={() => this.dateModalShow(date)}>{date.proposedTime}</td>
          <td onClick={() => this.dateModalShow(date)}>{date.priceMax}</td>
          <td onClick={() => this.dateModalShow(date)}>{new Date(date.created).toLocaleDateString("en-US")}</td>
        </tr>
      )
    });
       

    // function to render active users to page. 
    const renderActiveUsers = currentUsers.map((user, index) => {
      return (
        <tr key={index}  >
          <td>
          {/* <Button onClick={() => this.handleDismissReport(user.userid)} style={{marginBottom: 3}} variant="outline-primary">Dismiss</Button>
          <Button onClick={() => this.handleRemoveUser(user.userid)}  style={{marginBottom: 3}} variant="outline-danger">Remove</Button> */}
          </td>
          <td>
            <div >
              <Image 
                thumbnail
                onClick={() => this.activeModalShow(user)}
                style={{width: 50}}
                src={user.photoURL} />
            </div>
          </td>
          <td onClick={() => this.activeModalShow(user)} >{user.name}</td>
          <td onClick={() => this.activeModalShow(user)} >{user.userid}</td>
          <td onClick={() => this.activeModalShow(user)} >{user.referStatus}</td>
          <td onClick={() => this.activeModalShow(user)} >{user.work}</td>
          {/* <td onClick={() => this.waitlistModalShow(user)}>{user.about}</td> */}
          <td onClick={() => this.activeModalShow(user)}>{getAge(user.birthday)}</td>
          <td onClick={() => this.activeModalShow(user)}>{user.email}</td>
          <td onClick={() => this.activeModalShow(user)}>{user.city_state}</td>
          <td onClick={() => this.activeModalShow(user)}>{user.education}</td>
          <td onClick={() => this.activeModalShow(user)}>{user.gender}</td>
          <td onClick={() => this.activeModalShow(user)}>{user.gender_pref}</td>
          <td onClick={() => this.activeModalShow(user)}>{new Date(user.last_login).toLocaleDateString("en-US")}</td>
        </tr>
      )
    });


    // function to render reported users to page. 
    const renderReportedUsers = currentUsers.map((user, index) => {
      return (
        <tr key={index}  >
          <td>
          <Button onClick={() => this.handleDismissReport(user.userid)} style={{marginBottom: 3}} variant="outline-primary">Dismiss</Button>
          <Button onClick={() => this.handleRemoveUser(user.userid)}  style={{marginBottom: 3}} variant="outline-danger">Remove</Button>
          </td>
          <td>
            <div >
              <Image 
                thumbnail
                onClick={() => this.reportModalShow(user)}
                style={{width: 50}}
                src={user.photoURL} />
            </div>
          </td>
          <td onClick={() => this.reportModalShow(user)} >{user.name}</td>
          <td onClick={() => this.reportModalShow(user)} >{user.userid}</td>
          <td onClick={() => this.reportModalShow(user)} >{user.referStatus}</td>
          <td onClick={() => this.reportModalShow(user)} >{user.work}</td>
          {/* <td onClick={() => this.waitlistModalShow(user)}>{user.about}</td> */}
          <td onClick={() => this.reportModalShow(user)}>{getAge(user.birthday)}</td>
          <td onClick={() => this.reportModalShow(user)}>{user.email}</td>
          <td onClick={() => this.reportModalShow(user)}>{user.city_state}</td>
          <td onClick={() => this.reportModalShow(user)}>{user.education}</td>
          <td onClick={() => this.reportModalShow(user)}>{user.gender}</td>
          <td onClick={() => this.reportModalShow(user)}>{user.gender_pref}</td>
          <td onClick={() => this.reportModalShow(user)}>{new Date(user.last_login).toLocaleDateString("en-US")}</td>
        </tr>
      )
    });


    // function to render waitlisted users to page. 
    const renderWaitlistedUsers = currentUsers.map((user, index) => {
      return (
        <tr key={index}  >
          <td>
          <Button onClick={() => this.handleAccept(user.userid)}  variant="outline-primary">Accept</Button>
          </td>
          <td>
            <div >
              <Image 
                thumbnail
                onClick={() => this.waitlistModalShow(user)}
                style={{width: 50}}
                src={user.photoURL} />
            </div>
          </td>
          <td onClick={() => this.waitlistModalShow(user)} >{user.name}</td>
          <td onClick={() => this.waitlistModalShow(user)} >{user.userid}</td>
          <td onClick={() => this.waitlistModalShow(user)} >{user.referStatus}</td>
          <td onClick={() => this.waitlistModalShow(user)} >{user.work}</td>
          {/* <td onClick={() => this.waitlistModalShow(user)}>{user.about}</td> */}
          <td onClick={() => this.waitlistModalShow(user)}>{getAge(user.birthday)}</td>
          <td onClick={() => this.waitlistModalShow(user)}>{user.email}</td>
          <td onClick={() => this.waitlistModalShow(user)}>{user.city_state}</td>
          <td onClick={() => this.waitlistModalShow(user)}>{user.education}</td>
          <td onClick={() => this.waitlistModalShow(user)}>{user.gender}</td>
          <td onClick={() => this.waitlistModalShow(user)}>{user.gender_pref}</td>
          <td onClick={() => this.waitlistModalShow(user)}>{new Date(user.last_login).toLocaleDateString("en-US")}</td>
        </tr>
      )
    });

    return (
    <div>
      <div className="App">


        {!this.state.loggedIn &&
            
            
            <Container className="logInContainer">
                
                <img src={logo} className="App-logo3" alt="logo" />

                <Form>
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Control 
                      type="email" 
                      placeholder="Enter email" 
                      value={this.state.email}
                      onChange={e => this.setState({ email: e.target.value })}
                      type="text"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Control 
                      type="password" 
                      placeholder="Password" 
                      value={this.state.password}
                      onChange={e => this.setState({ password: e.target.value })}
                    />
                  </Form.Group>


                  <Button variant="primary"  onClick={() => this.handleLogin() }>
                    Log in
                  </Button>
                </Form>
              
            </Container>
        }

    {this.state.loggedIn &&

      <div>
        <header className="App-header">
          <div className="logo-text-header">
            <img src={logo} className="App-logo2" alt="logo" />
            <h2 className="logo-text">Focus</h2>
          </div>

          <div className="App-links">
            <h2 className="logo-text">
              <a href='#' onClick={() => this.navClick('manageWaitlist') }>Waitlist</a>
            </h2>
            <h2 className="logo-text">
              <a href='#' onClick={() => this.navClick('manageDates') }>Blind Dates</a>
            </h2>
            <h2 className="logo-text">
              <a href='#' onClick={() => this.navClick('manageReports') }>Reports</a>
            </h2>    
            <h2 className="logo-text">
              <a href='#' onClick={() => this.navClick('manageActive') }>Active</a>
            </h2>   
          </div>
        </header> 
  

        
        <Container fluid>
          <Row>
            <Table size='sm' striped bordered responsive hover variant="light">
              <thead>
                {this.state.mode == 'manageWaitlist' ? waitlistHeader : null}
                {this.state.mode == 'manageActive' ? activeHeader : null}
                {this.state.mode == 'manageDates' ? datesHeader : null}
                {this.state.mode == 'manageReports' ? reportsHeader : null}
              </thead>
              <tbody>
                {this.state.mode == 'manageWaitlist' ? renderWaitlistedUsers : null}
                {this.state.mode == 'manageActive' ? renderActiveUsers : null}
                {this.state.mode == 'manageDates' ? renderDates : null}
                {this.state.mode == 'manageReports' ? renderReportedUsers : null}
            </tbody>
          </Table>
          <Pagination id="page-numbers" style={{justifyContent: 'center', marginBottom: 15}} >
            {renderPageNumbers}
          </Pagination> 
        </Row>

        <WaitlistModal
          images={this.state.images}
          user={this.state.user}
          handleAccept={() => this.handleAccept(this.state.user.userid)}
          show={this.state.waitlistModalShow}
          onHide={() => this.setState({waitlistModalShow: false})}
        />

        <ActiveModal
          images={this.state.images}
          user={this.state.user}
          //handleAccept={() => this.handleAccept(this.state.user.userid)}
          show={this.state.activeModalShow}
          onHide={() => this.setState({activeModalShow: false})}
        />

        <ReportModal
          images={this.state.images}
          user={this.state.user}        
          handleRemoveUser={() => this.handleRemoveUser(this.state.user.userid)}
          handleDismissReport={() => this.handleDismissReport(this.state.user.userid)}
          show={this.state.reportModalShow}
          onHide={() => this.setState({reportModalShow: false})}
        />

        {/* DateModal */}
        <Modal
          date={this.state.date}
          handleUpdate={() => this.handleUpdate()}
          show={this.state.dateModalShow}
          onHide={() => this.setState({dateModalShow: false})}
          size="lg"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              {this.state.date && <p>Manage Blind Date</p> }
            </Modal.Title>
          </Modal.Header>
          <Modal.Body >
              { this.state.date && 

            
              <div>
                <div style={{flex: 1, flexDirection: 'row', marginBottom: '20px'}}>
                  <p>Links to reservations sites:
                  </p>
                  <Table size='lg' bordered responsive variant="dark">
                    <td><a target="_blank" href={'https://www.yelp.com/search?find_desc=reservations&l=a%3A'+this.state.date.proposedLat+'%2C'+this.state.date.proposedLong+'%2C13.656&attrs=RestaurantsPriceRange2.'+this.state.date.priceMax+'&sortby=rating&rez_date=' + new Date(this.state.date.proposedTime).toLocaleDateString("en-US") + '&rez_covers=2&rez_time=1900'}> Yelp </a></td>
                    <td><a target="_blank" href={'https://www.exploretock.com/'}> Tock </a></td>
                    <td><a target="_blank" href={'https://www.opentable.com/s?dateTime='+new Date(this.state.date.proposedTime).toLocaleDateString("en-US")+'&covers=2&latitude='+this.state.date.proposedLat+'&longitude='+this.state.date.proposedLong+'&priceBandIds%5B%5D='+this.state.date.priceMax+'&sortBy=distance&metroId=8'}> OpenTable </a></td>
                  </Table>
              </div>


                  <Table size='sm'  bordered responsive variant="light">
                    <thead>
                      <tr>
                        <th>Status</th>
                        {/* <th>User Created</th> */}
                        <th>Created</th>
                        <th>Proposed Time</th>
                        <th>Price Max</th>
                        <th>Proposed Location</th>
                        
                      </tr>
                    </thead>
                    <tbody>
                        <tr>
    
                          <td>{this.state.date.status}</td>                 
                          {/* <td>{props.date.userCreator}</td> */}
                          <td>{new Date(this.state.date.created).toLocaleDateString("en-US")}</td>
                          <td>{new Date(this.state.date.proposedTime).toLocaleDateString("en-US")}</td>
                          <td>{this.state.date.priceMax}</td>
                          <td>{this.state.date.proposedLat+','+ this.state.date.proposedLong}</td>
                        </tr>
                    </tbody>
                  </Table>

                  <Form>
                    <Form.Group className="mb-3" controlId="">

                    <Form.Label>Place Type</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Place Name" 
                        value={this.state.date.type} 
                        onChange={(e) => this.setState({date: {...this.state.date, type: e.target.value}})}  
                      />


                      <Form.Label>Place Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Place Name" 
                        value={this.state.date.placeName} 
                        onChange={(e) => this.setState({date: {...this.state.date, placeName: e.target.value}})}  
                      />
                    
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="">
                      <Form.Label>Place Address</Form.Label>
                      <Form.Control 
                        type="address" 
                        placeholder="Place Address"                       
                        value={this.state.date.placeAddress} 
                        onChange={(e) => this.setState({date: {...this.state.date, placeAddress: e.target.value}})}  
                      />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="">
                      <Form.Label>Latitude</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Latitude"                       
                        value={this.state.date.confirmedLat} 
                        onChange={(e) => this.setState({date: {...this.state.date, confirmedLat: e.target.value}})}  
                      />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="">
                      <Form.Label>Longitude</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Longitude"                       
                        value={this.state.date.confirmedLong} 
                        onChange={(e) => this.setState({date: {...this.state.date, confirmedLong: e.target.value}})}  
                      />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="">
                      <Form.Label>Confirmed Time</Form.Label>
                      <Form.Control 
                        type="datetime-local" 
                        placeholder="Confirmed Time" 
                        defaultValue={this.state.date.confirmedTime} 
                        onChange={(e) => this.setState({date: {...this.state.date, confirmedTime: new Date(e.target.value).getTime()}})}  //CONVERT YYYY-MM-DDThh:mm TO timestamp. create date object, set date, set time
                        
                    />
                    </Form.Group>
                  </Form>
                </div>           
                }
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={ () => this.setState({dateModalShow: false})} variant="outline-danger" >Close</Button>
            <Button onClick={this.handleUpdate} variant="outline-primary">Update</Button>
          </Modal.Footer>
        </Modal>

        </Container>
          <footer className="App-header">
          <h2 className="logo-text">Focus</h2>
          </footer>

        </div>
      }
        </div>
        </div>
        
        
      );
    }
  }

export default App;
