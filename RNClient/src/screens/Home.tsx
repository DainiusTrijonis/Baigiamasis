import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import algoliasearch from 'algoliasearch';
import { InstantSearch } from 'react-instantsearch-native';
import SearchBox from '../SearchBox';
import InfiniteHits from '../InfiniteHits';

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
  time:Date
};
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
    unsubscribe = setInterval(() => {
      this.setState({
        time : new Date()
      })
    }, 10000)
  }
  componentWillUnmount() {
    clearInterval(unsubscribe);
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