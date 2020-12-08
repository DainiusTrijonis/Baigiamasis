import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import {createApiClient,Product} from '../api/products'
const api = createApiClient();
let unsubscribe:any;
let unsubscribe2:any;
interface Props {
    navigation: any;
  }
  export type AppState = {
    user: any;
    initializing: boolean;
    dialogVisible: boolean;
    products: Product[];
  };

export default class WishList extends React.Component<Props> {
  state: AppState = {
      user: null,
      initializing: true,
      dialogVisible: false,
      products: new Array<Product>(),
  };
  
  componentDidMount = () => {
    auth().onAuthStateChanged((user) => {
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
        unsubscribe = api.getWishListRealtime2(this.onUpdateProducts,user.uid)
        this.setState({
          user: user,
          initializing: false,
        });

      } 
      else {
        this.setState({
          initializing: false,
        });
        this.props.navigation.navigate("Profile")
      }
    })


  };

  componentWillUnmount = () => {
    unsubscribe();
  }
  onUpdateProducts = (products:Product[]) => {
    this.setState({
      products: products,
      isLoading: false,
    });
    console.log(products);
  }
  onClickAddProduct = () => {
    this.props.navigation.navigate("AddProduct")
  }

  renderActivityIndicator = () => {
    return (
      <View style={styles.layout}>
        <ActivityIndicator size='large'/>
      </View>
    )
  }
  render() {
    if (this.state.initializing) {
    return (
       <SafeAreaView style={styles.container}>
          <View>
            {this.renderActivityIndicator()}
          </View>
        </SafeAreaView>
    );
    } else {
      return (
        <SafeAreaView style={styles.container}>
          <View>
            
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

