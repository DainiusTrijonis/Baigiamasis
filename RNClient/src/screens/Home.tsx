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
};

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
    interval: 2000,
  };
  componentDidMount() {

  }

  render() {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <View style={styles.container}>
          <InstantSearch
            searchClient={searchClient}
            indexName="product"
            
          >
            <SearchBox />
            <InfiniteHits navigation = {this.props.navigation} />
          </InstantSearch>
          
        </View>
      </SafeAreaView>
    );
  }
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
export default Home;