import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Button, 
  ActivityIndicator
} from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import Ionicons from 'react-native-vector-icons/Ionicons';

let unsubscribe: any;
interface Props {
    navigation: any;
  }
export type AppState = {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
};


export default class Profile extends React.Component<Props> {
  state: AppState = {
    user: null,
    initializing: true,
  };
  componentDidMount = () => {
    unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          user: user,
          initializing: false,
        });
      } 
      else {
        this.setState({
          initializing: false,
        });
      }
    })
    console.log(this.state.user);
  };
  componentWillUnmount = () => {
    unsubscribe;
  }
  
  logOut() {
    auth().signOut().then(()=>{
      this.setState({
        user: null
      });
    });
    //this.componentDidMount();
  }
  logIn() {
    this.props.navigation.navigate('Login')
  }
  register() {
    this.props.navigation.navigate('Register')
  }

  render() {
    if (!this.state.initializing) {
      if(this.state.user) {
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.layout}>
              <View>
                <Text> {this.state.user.email} </Text>
              </View>
              <TouchableOpacity
                style={styles.button}
                onPress={() => this.logOut()}>
                <Text>Atsijungti</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )
      }
      else {
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.layout}>
              <View>
                <Text> Not logged in </Text>
              </View>
              <TouchableOpacity
                style={styles.button}
                onPress={() => this.logIn()}>
                <Text> Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => this.register()}>
                <Text> Register</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )

      }
    }
    else {
      return (
        <SafeAreaView style={styles.container}>
        <View style={styles.layout}>
          <ActivityIndicator size='large'/>
        </View>
      </SafeAreaView>
      )
    }
  }
  }
const styles = StyleSheet.create({
  container: {
      flex: 1,
  },
  layout: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    paddingBottom: '40%',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    width: 300,
    marginTop: 16,
  },
});
