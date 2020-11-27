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



class Home extends React.Component {
  root = {
    Root: View,
    props: {
      style: {
        flex: 1,
      },
    },
  };

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
            <InfiniteHits />
          </InstantSearch>
        </View>
      </SafeAreaView>
    );
  }
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'grey',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
export default Home;