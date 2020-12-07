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
import SelectMultiple from 'react-native-select-multiple'

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
  renderECommerces = (eCommerceArray:ECommerce[][]) => {
    return (
      <View style = {{flexDirection:'row', alignItems:'center'}}>
        { 
          eCommerceArray.map((eCommerce,index) => {
            if(eCommerce.length>0) {
              return (
                <View key={index} style={{padding:5}}>
                  <TouchableOpacity style = {{padding:15, borderWidth: 1, borderColor: '#ddd',}} key={index}>
                    <Image 
                      style={{width: 50, height: 40,resizeMode : 'stretch' }}
                      source={{uri:eCommerce[0].shopLogoURL}} 
                    />
                  </TouchableOpacity>
                </View>
              )
            }
          })
        }
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
  renderECommerces2 = (eCommerceArray:ECommerce[][]) => {
    return (
      <View>
          <TouchableOpacity style={{
            width: '100%', 
            height: 50, 
            backgroundColor: '#FF9800', 
            justifyContent: 'center', 
            alignItems: 'center',
          }}>
            <Text>
              {"Currently selected: " +this.state.selectedEcommerceArray.length}
            </Text>
          </TouchableOpacity>
        <ScrollView
          contentContainerStyle={{ paddingBottom:420}}
        style={{}}>
          { 
            eCommerceArray.map((eCommerceArray,indexArray) => {
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
                          <TouchableOpacity onPress={() => { this.addToECommerceSelectedArray(eCommerce)}} key={indexArray + " "+ index} style = {styles.item}>
                            <View style = {{ flexDirection:'row', alignItems:'center'}}>
                              <View style={{padding:10}}>                
                                <Image
                                  style={{width: 60, height: 40,resizeMode : 'stretch' }}
                                  source = {{uri: eCommerce.photoURL}}
                                />
                              </View>
                              <View  style={{ padding:5,flexShrink: 1 }}>
                                  <Text numberOfLines={2}>{eCommerce.productName}</Text>
                              </View>
                              <View style={{flexDirection:'column', flexGrow:1}}>
                                <View style={{paddingBottom:3}}>
                                  <Text style={{textAlign: 'right',color:'#AB2D2D', fontFamily:'sans-serif'}}>{eCommerce.lowestPrice!=0? eCommerce.lowestPrice + " €":"Out of stock"}</Text>
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
                  Submit
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
  container: {
    padding:12,
    backgroundColor: 'white',
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    width: '100%',
    borderColor: '#ddd',
    flexDirection: 'column',
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

