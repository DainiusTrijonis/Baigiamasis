import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

interface Props {
    navigation: any;
  }
  export type AppState = {
    user: any;
    initializing: boolean;
  };

export default class Profile extends React.Component<Props> {
  state: AppState = {
      user: null,
      initializing: true,
  };
  componentDidMount = () => {
  };

  render() {
    if (this.state.initializing) {
    return (
        <SafeAreaView style={{backgroundColor: 'black'}}>
        <View />
        </SafeAreaView>
    );
    }
  }
  }
const styles = StyleSheet.create({
  container: {
      flex: 1,
  },
  layout: {
    flex: 2,
    alignContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    width: 300,
    marginTop: 16,
  },
});
