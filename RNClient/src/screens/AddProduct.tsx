import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  Image,
  TextInput,
  ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import {createApiClient,Product,ECommerce} from '../api/products'

const api = createApiClient();
interface Props {
    navigation: any;
  }
  export type AppState = {
    user: any;
    initializing: boolean;
    waitingForSubmit: boolean
    text:string;
    searchingValue:string;
    eCommerceArray:ECommerce[][]; 
    selectedEcommerceArray:ECommerce[];
  };

export default class AddProduct extends React.Component<Props> {
  state: AppState = {
      user: null,
      initializing: false,
      waitingForSubmit: true,
      text: '',
      searchingValue:'',
      eCommerceArray:new Array<ECommerce[]>(),
      selectedEcommerceArray: new Array<ECommerce>(),  

  };
  
  componentDidMount = () => {

  };
  componentWillUnmount = () => {

  }

  renderActivityIndicator = () => {
    return (
      <View style={{flexGrow:1,padding:15,justifyContent:'center', alignContent:'center',alignSelf:'center'}}>
        <Text>
          {this.state.searchingValue}
        </Text>
        <ActivityIndicator style={{paddingTop:25}} size="large" color="#00ff00" />
      </View>
    )
  }
  handleText = (text:string) => {
    this.setState({text:text})
  }
  handleSubmit = async () => {
    Keyboard.dismiss();
    this.setState({
      initializing: true,
      waitingForSubmit: true,
      searchingValue: this.state.text,
      text: '',
      selectedEcommerceArray: new Array<ECommerce>(),
    })
    const eComerces = await api.getEcommercesOnKeyword(this.state.text);
    this.setState({
      eCommerceArray: eComerces,
      initializing:false,
    })
  }
  SearchBox = () => (
    <View style={{flexGrow:1}}>
      <TextInput
        style={styles.input}
        onChangeText = {this.handleText} 
        value={this.state.text}
        placeholder="enter product keyword"
        onSubmitEditing = {this.handleSubmit}
      />
    </View>
  );
  renderEmpty = () => {
    return (
      <View>
        <Text>No result for given keyword</Text>
      </View>
    )
  }
  ifArrayValid = () => {
    let x:boolean = false;
    for(const element of this.state.eCommerceArray) {
      if(element.length>0) {
        x = true;
        break;
      }
    }
    return x
  }
  renderSearch = (eCommerceArray:ECommerce[][]) => {
    return (
      <View>
        <View style={{flexGrow:1,padding:15,justifyContent:'center', alignContent:'center',alignSelf:'center'}}>
          <Text>
            {this.state.searchingValue}
          </Text>
        </View>
        { this.ifArrayValid()?  this.renderECommerces2(eCommerceArray): this.renderEmpty()}
      </View>

    )
  }

  addToECommerceSelectedArray = (eCommerce:ECommerce) => {
    let foundSame = false;
    let array = this.state.selectedEcommerceArray;
    for(let i=array.length-1; i>=0; i--) {
      if(array[i].href === eCommerce.href) {
        array.splice(i,1);
        foundSame=true;
        break;
      }
    }


    if(!foundSame) {
      this.setState({
        selectedEcommerceArray: [
          ...array,
          eCommerce
        ] 
      })
    } else {
      this.setState({
        selectedEcommerceArray: array,
      })
    }

  }
  ifItemPressed = (eCommerce:ECommerce) => {
    let selected = false;
    for(let i=0; i<this.state.selectedEcommerceArray.length; i++) {
      if(this.state.selectedEcommerceArray[i].href === eCommerce.href) {
        selected = true;
        break;
      }
    }
    return selected;
  }
  submitSelectedECommerces = () => {
    if(this.state.selectedEcommerceArray.length>0) {
      api.addProductToSystem(this.state.selectedEcommerceArray);
      this.props.navigation.navigate("Search product");
    }
    else {
      //execute alert that noone was selected 
    }

  }
  renderECommerces2 = (eCommerceArray:ECommerce[][]) => {
    return (
      <View>
        <View style = {{ opacity : this.state.selectedEcommerceArray.length>0? 1:0, alignItems:'center', alignContent:"center",justifyContent:'center'}}>
          <TouchableOpacity 
              style={styles.touchableOpacitySubmit}
              onPress={() => {this.submitSelectedECommerces()}}
            >
              <Text>
                Click to submit
              </Text>

          </TouchableOpacity>
          <Text>
              {"Currently selected: " +this.state.selectedEcommerceArray.length}
          </Text>
        </View>


        <ScrollView
          contentContainerStyle={{ paddingBottom:420}}
        style={{}}>
          { 
            eCommerceArray.map((eCommerceArray,indexArray) => {
              if(eCommerceArray.length>0 )
              return (
                <View key={"s"+indexArray}>
                  <View key={indexArray} style={{alignItems:'center', padding:10}}>
                    <Image 
                      style={{width: 40, height: 30,resizeMode : 'stretch' }}
                      source={{uri:eCommerceArray[0].shopLogoURL}} 
                    />
                  </View>
                  {
                    eCommerceArray.map((eCommerce,index) => {
                      if(eCommerce.photoURL!='' && eCommerce.productName!='')
                      return(
                          <TouchableOpacity onPress={() => { this.addToECommerceSelectedArray(eCommerce)}} key={indexArray + " "+ index} style = {this.ifItemPressed(eCommerce)? styles.itemPressed:styles.item}>
                            <View style = {{ flexDirection:'row', alignItems:'center'}}>
                              <View style={{padding:10}}>                
                                <Image
                                  style={{width: 60, height: 40,resizeMode : 'stretch' }}
                                  source = {{uri: eCommerce.photoURL}}
                                />
                              </View>
                              <View  style={{ padding:5,flex:1 }}>
                                  <Text numberOfLines={2}>{eCommerce.productName}</Text>
                              </View>
                              <View style={{  flexDirection:'column', alignItems:'center',}}>
                                <View style={{paddingBottom:3}}>
                                  <Text style={{textAlign: 'right',color:'#AB2D2D'}}>{eCommerce.lowestPrice!=0? eCommerce.lowestPrice + " €":"Out of stock"}</Text>
                                </View>
                              </View>
                            </View>
                          </TouchableOpacity>
                      )
                    })
                  }
                </View>
              )
            })
          }
        </ScrollView>

      </View>
    )
  }

  render() {
    const {eCommerceArray} = this.state;
    return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
            <View style ={{flexDirection:'row'}}>
              <this.SearchBox/>
              <TouchableOpacity style={styles.button} onPress={this.handleSubmit}>
                <Text>
                  Search
                </Text>
              </TouchableOpacity>
            </View>
            {this.state.waitingForSubmit && !this.state.initializing ? this.renderSearch(eCommerceArray):this.renderActivityIndicator()}
          </View>
        </SafeAreaView>
    )
  }
  }
const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  touchableOpacitySubmit:{
    width: '100%', 
    height: 50, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor:'#65a422',
    borderRadius:2, 
  },
  container: {
    padding:12,
    backgroundColor: 'white',
  },
  item: {
    flex:1,
    padding: 10,
    borderBottomWidth: 1,
    width: '100%',
    borderColor: '#ddd',
    flexDirection: 'column',
  },
  itemPressed: {
    padding: 10,
    borderBottomWidth: 1,
    width: '100%',
    borderColor: '#ddd',
    flexDirection: 'column',
    backgroundColor:'gray',
  },
  input: {
    height: 48,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  button: {
    backgroundColor:'#65a422',
    borderRadius:2, 
    minWidth:90, 
    alignItems:'center',
    justifyContent: 'center',
  }
});

