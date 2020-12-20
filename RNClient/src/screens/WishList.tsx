import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TextInput,
  FlatList
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import {createApiClient,Product} from '../api/products'
import { Container, Header, Content, Card, CardItem, Thumbnail, Text, Button, Icon, Left, Body, Right,Input, Spinner, List, ListItem } from 'native-base';

const api = createApiClient();
let unsubscribe:any;
let unsubscribeUser:any;
interface Props {
    navigation: any;
  }
  export type AppState = {
    user: any;
    initializing: boolean;
    dialogVisible: boolean;
    products: Product[];
    focusListener?:any;
    blurListener?:any;
  };

export default class WishList extends React.Component<Props> {
  state: AppState = {
      user: null,
      initializing: true,
      dialogVisible: false,
      products: new Array<Product>(),
  };
  
  componentDidMount = () => {
    this.state.focusListener = this.props.navigation.addListener("focus",() => {
      // Update your data
      this.updateData();
    });
    this.state.blurListener = this.props.navigation.addListener("blur",() => {
      unsubscribeUser();
      if(this.state.user)
      unsubscribe();
    });

  };
  updateData = () => {
    unsubscribeUser = auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          user: user,
          initializing: false,
        });
        unsubscribe = api.getWishListRealtime(this.onUpdateProducts,user.uid)
      } 
      else {
        this.setState({
          initializing: false,
        });
        this.props.navigation.navigate("Profile")
      }
    })
  }
  componentWillUnmount = () => {
    this.state.focusListener();
    this.state.blurListener();
    // unsubscribeUser();
    // if(this.state.user)
    // unsubscribe();
  }
  onUpdateProducts = (products:Product[]) => {
    this.setState({
      products: products,
      isLoading: false,
    });
  }

  renderActivityIndicator = () => {
    return (
      <View style={styles.layout}>
        <ActivityIndicator size='large'/>
      </View>
    )
  }
  renderWishList2 = (products:Product[]) => {
    return (
        <FlatList
          data = {products}
          keyExtractor = {(item) => item.id}
          renderItem={({ item }) => ( 
            <View key={item.id} style = {styles.item}>
              <View style = {{ flexDirection:'row', alignItems:'center'}}>
                <View style={{padding:10}}>                
                  <Image
                    style={{width: 60, height: 40,resizeMode : 'stretch' }}
                    source = {{uri: item.photoURL}}
                  />
                </View>
                <View  style={{ padding:5,flex:1 }}>
                    <Text numberOfLines={3}>{item.name}</Text>
                </View>
                  <View style={{paddingBottom:3, alignItems:'center',alignContent:'center',padding:5, flexDirection:'column', flex:1}}>
                    <Text style={{color:'#AB2D2D'}}>{item.lowestPrice!=0? item.lowestPrice + " €":"Out of stock"}</Text>
                    <Input />
                  </View>
              </View>
            </View>
          )}
        />
    )
  }
  goToProductPage = (product:Product) => {
    this.props.navigation.navigate('Product',{
      'product':product,
    })
  }
  renderWishList = (products:Product[]) => {
    return (
      
      <FlatList
        data = {products}
        keyExtractor = {(item:Product) => item.id}
        renderItem={({ item }) => ( 
          <View key={item.id} style = {styles.item}>
            <View style = {{ flexDirection:'row', alignItems:'center'}}>
              <View style={{padding:10}}>                
                <Image
                  style={{width: 60, height: 40,resizeMode : 'stretch' }}
                  source = {{uri: item.photoURL}}
                />
              </View>
              <TouchableOpacity onPress={() => { this.goToProductPage(item)}}  style={{ padding:5,flex:1 }}>
                  <Text numberOfLines={3}>{item.name}</Text>
              </TouchableOpacity>
              <View style={{paddingBottom:3, alignItems:'center',alignContent:'center',padding:5, flexDirection:'column', flex:1}}>
                <Text style={{color:'#AB2D2D'}}>{item.lowestPrice!=0? item.lowestPrice + " €":"Out of stock"}</Text>
                <Text>Notify me when</Text>
                <TextInput
                  value = {item.wish?.priceWhenToNotify.toString()}
                  style={styles.input} 
                />
              </View>
            </View>
          </View>
        )}
      />
    )
  }
  
  // renderWishList = () => {

  // }
  render() {
    const {products} = this.state;
    if (this.state.initializing) {
    return (
      <Container>
        <Header />
        <Content>
          <Spinner />
        </Content>
      </Container>
    );
    } else {
      return (
        <SafeAreaView>
          <View>
            {this.state.products? this.renderWishList(products):<Spinner/>}
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
  input: {
    textAlign:'center',
    height: 24,
    width:'40%',
    padding: 2,
    fontSize: 12,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  layout: {
    flex: 1,
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
  item: {
    flex:1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'column',
  },
  itemRow: {
    flexDirection:'row',
  },
});

