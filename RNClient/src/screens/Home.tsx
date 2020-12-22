import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import algoliasearch from 'algoliasearch';
import { InstantSearch } from 'react-instantsearch-native';
import SearchBox from '../SearchBox';
import InfiniteHits from '../InfiniteHits';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import Ionicons from 'react-native-vector-icons/Ionicons';

const searchClient = algoliasearch(
  'FAGJI8FK54',
  'd99eaa4522c1f0c40c66103290c40318'
);

interface Props {
  navigation: any,
}
export type AppState = {
  initializing: boolean;
  interval: number;
  time:Date;
  focusListener?:any;
  blurListener?:any;
  user?: any;
};
let unsubscribeTime:any;
let unsubscribe:any;
class Home extends React.Component<Props> {
  root = {
    Root: View,

    props: {
      style: {
        flex: 1,
      },
    },
  };
  state: AppState = {
    initializing: true,
    time: new Date(),
    interval: 60000,
  };
  componentDidMount() {
    
    this.state.focusListener = this.props.navigation.addListener("focus",() => {
      // Update your data
      this.updateData();
    });
    this.state.blurListener = this.props.navigation.addListener("blur",() => {
      unsubscribe();
      if(this.state.user)
      unsubscribe();
    });
    unsubscribeTime = setInterval(() => {
      this.setState({
        time : new Date()
      })
    }, 10000)
  }

  componentWillUnmount() {
    clearInterval(unsubscribeTime);
    this.state.focusListener();
    this.state.blurListener();
  }


  updateData = () => {
    unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        this.props.navigation.setOptions({
          headerRight: () => (
            <TouchableOpacity onPress={this.onClickAddProduct}>
              <Ionicons name="ios-add-circle"
                  size={45} color="gray" 
              />
            </TouchableOpacity>
          )
        });
        this.setState({
          user: user,
          initializing: false,
        });
      } 
      else {
        this.props.navigation.setOptions({
          headerRight: () => (
            <TouchableOpacity onPress={this.onClickNavigateProfile}>
              <Ionicons name="ios-add-circle"
                  size={45} color="gray" 
              />
            </TouchableOpacity>
          )
        });
        this.setState({
          initializing: false,
        });
      }
    })
  }


  onClickNavigateProfile = () => {
    this.props.navigation.navigate("Profile")
  }
  onClickAddProduct = () => {
    this.props.navigation.navigate("AddProduct")
  }
  render() {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <View style={styles.container}>
          <InstantSearch
            refresh={true}
            searchClient={searchClient}
            indexName="product"
            
          >
            <SearchBox />

            <InfiniteHits navigation = {this.props.navigation} time = {this.state.time}/>
          </InstantSearch>
          
        </View>
      </SafeAreaView>
    );
  }
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
export default Home;