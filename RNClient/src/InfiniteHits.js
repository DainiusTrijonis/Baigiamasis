import React from 'react';
import { StyleSheet, Text, View, FlatList,Image } from 'react-native';
import PropTypes from 'prop-types';
import { connectInfiniteHits } from 'react-instantsearch-native';
import {Product} from '../src/api/products'
import { TouchableOpacity } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
const styles = StyleSheet.create({
  separator: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  item: {
    padding: 10,
    flexDirection: 'column',
  },
  itemRow: {
    flexDirection:'row',
  },
  titleText: {
    fontWeight: 'bold',
  },
});


const InfiniteHits = ({ hits, hasMore, refine, navigation }) => (
  
  <FlatList
    data={hits}
    keyExtractor={(item) => item.objectID}
    ItemSeparatorComponent={() => <View style={styles.separator} />}
    onEndReached={() => hasMore && refine()}
    renderItem={({ item }) => (
      <TouchableOpacity style={styles.item}   onPress={() => { navigation.navigate('Product', {
        'product':item,
      })}}>
        <View style={styles.itemRow}>
          <Image
            style={{width: '30%', height: 100,resizeMode : 'stretch' }}
            source={{uri: item.photoURL}} 
          />
          
          <Text style={{flex: 1, flexWrap: 'wrap',paddingLeft:20, fontWeight: 'bold'}}>{item.name}</Text>
        </View>
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
