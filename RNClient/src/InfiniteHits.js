import React, {useEffect,useState} from 'react';
import { StyleSheet, Text, View, FlatList,Image } from 'react-native';
import PropTypes from 'prop-types';
import { connectInfiniteHits } from 'react-instantsearch-native';
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
  itemRow: {
    flexDirection:'row',
  },
  titleText: {
    fontWeight: 'bold',
  },
});



const InfiniteHits = ({ hits, hasMore, refine, navigation, time }) => (

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
          <View style={{flexDirection:'column',flexShrink: 1}}>
            <Text numberOfLines={3} style={{flex: 1, flexWrap: 'wrap',paddingLeft:20, fontWeight: 'bold'}}>{item.name}</Text>
            <Text numberOfLines={3} style={{flex: 1, flexWrap: 'wrap',paddingLeft:20, fontWeight: 'bold'}}>{((time.getTime()/1000 -parseFloat(item.date) )/ 60 ).valueOf().toFixed(1).toString() + " minutes ago"}</Text>
            <View style ={{ paddingLeft:20, flexDirection:'row',flexShrink: 1 }}>
              <Text style={{color:'#AB2D2D'}}>{item.lowestPrice+ " €"}</Text>
              <Text>{" - "}</Text>
              <Text style={{color:'#AB2D2D'}}>{item.highestPrice+ " €"}</Text>
            </View>
          </View>
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
