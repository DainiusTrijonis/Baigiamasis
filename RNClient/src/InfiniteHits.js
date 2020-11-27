import React from 'react';
import { StyleSheet, Text, View, FlatList,Image } from 'react-native';
import PropTypes from 'prop-types';
import { connectInfiniteHits } from 'react-instantsearch-native';
import {Product} from '../src/api/products'
import { TouchableOpacity } from 'react-native-gesture-handler';
const styles = StyleSheet.create({
  separator: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  item: {
    padding: 10,
    flexDirection: 'column',
  },
  titleText: {
    fontWeight: 'bold',
  },
});

const InfiniteHits = ({ hits, hasMore, refine }) => (
  <FlatList
    data={hits}
    keyExtractor={(item) => item.objectID}
    ItemSeparatorComponent={() => <View style={styles.separator} />}
    onEndReached={() => hasMore && refine()}
    renderItem={({ item }) => (
      <TouchableOpacity style={styles.item}>
        <Image
          style={{width: '50%', height: 100,resizeMode : 'stretch' }}
          source={{uri: item.photoURL}} 
        /> 
        <Text>{item.name}</Text>
      </TouchableOpacity>
    )}
  />
);

InfiniteHits.propTypes = {
  hits: PropTypes.arrayOf(PropTypes.object).isRequired,
  hasMore: PropTypes.bool.isRequired,
  refine: PropTypes.func.isRequired,
};

export default connectInfiniteHits(InfiniteHits);
