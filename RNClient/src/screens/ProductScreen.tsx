import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Linking,
  Dimensions,
  ScrollView,
  RecyclerViewBackedScrollView,
} from 'react-native';
import {createApiClient,Product, ECommerce, History, Review} from '../api/products'
import {
  LineChart,
} from "react-native-chart-kit";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Stars from 'react-native-stars';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import { TextInput } from 'react-native-gesture-handler';
export type AppState = {
  product?: Product,
  eCommerceArray?: ECommerce[],
  historyArray?: History[] ,
  reviewArray?: Review[],
  isLoading:boolean,
  time:Date,
  whatToRender:string,
  user: FirebaseAuthTypes.User | null,
  reviewText:string,
  reviewStars:number,
}
interface Props {
  navigation: any
  route: any
}
let unsubscribe:any;
let unsubscribe2:any;
let unsubscribe3:any;
let unsubscribe4:any;
let unsubscribe5:any;
let unsubscribe6:any;
const api = createApiClient();
function prettyDate2(time:Date){
  return   time.toLocaleTimeString('lt-LT').slice(0, -6);
}
export default class ProductScreen extends React.Component<Props> {
  state: AppState = {
      user: null,
      isLoading: true,
      time: new Date(),
      whatToRender:'Sellers',
      reviewText:'',
      reviewStars:2.5,
  };
  componentDidMount = () => {
    const product = new Product(this.props.route.params.product['name'],this.props.route.params.product['photoURL'],parseFloat(this.props.route.params.product['date']),parseFloat(this.props.route.params.product['lowestPrice']), parseFloat(this.props.route.params.product['highestPrice']),parseFloat(this.props.route.params.product['createdAt']))
    this.setState({
      product: product
    })
    // this.props.navigation.setOptions({
    //   headerLeft: () => (
    //       <TouchableOpacity  style={{alignContent:'center',alignItems:'center', alignSelf:'center', marginBottom:8, marginRight:8}}>
    //         <Ionicons name="arrow-back"
    //             size={35} color="darkgray" 
    //         />        
    //       </TouchableOpacity>
    //   )
    // });
    unsubscribe6 = auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          user: user,
          initializing: false,
        });
      } 
      else {
        this.setState({
          initializing: false,
        });
      }
    })
    unsubscribe = api.getProductRealtime(this.onUpdateProduct, this.props.route.params.product['objectID']);
    unsubscribe2 = api.getECommerceRealtime(this.onUpdateECommerceArray, this.props.route.params.product['objectID'])
    unsubscribe4 = api.getHistoryRealtime(this.onUpdateHistoryArray, this.props.route.params.product['objectID'])
    unsubscribe5 = api.getReviewsRealTime(this.onUpdateReviewArray,this.props.route.params.product['objectID'])
    unsubscribe3 = setInterval(() => {
      this.setState({
        time : new Date()
      })
    }, 60000)
  };
  componentWillUnmount = () => {
    unsubscribe;
    unsubscribe2; 
    unsubscribe3;
    unsubscribe4;
    unsubscribe6;
  }
  onUpdateECommerceArray = (eCommerceArray:ECommerce[]) => {
    this.setState({
      eCommerceArray: eCommerceArray,
      isLoading: false,
    });
  }
  onUpdateHistoryArray = (historyArray:History[]) => {
    this.setState({
      historyArray: historyArray,
    });
  }
  onUpdateReviewArray = (reviewArray:Review[]) =>{
    this.setState({
      reviewArray: reviewArray,
    });
  }
  onUpdateProduct = (product:Product) => {
    this.setState({
      product: product,
      isLoading: false,
    });
  }
  renderProduct = (product:Product) => {
    return (
      <View style={styles.item}>
        <View style={styles.itemRow}>
          <Image
            style={{width: '30%', height: 100,resizeMode : 'stretch' }}
            source={{uri: product.photoURL}} 
          />
          <View style={{flexDirection:'column',flexShrink: 1}}>
            <Text numberOfLines={3} style={{flex: 1, flexWrap: 'wrap',paddingLeft:20, fontWeight: 'bold', fontFamily:'sans-serif'}}>{product.name}</Text>
            <Text numberOfLines={3} style={{flex: 1, flexWrap: 'wrap',paddingLeft:20, fontWeight: 'bold'}}>{((this.state.time.getTime()/1000 -product.date )/ 60 ).valueOf().toFixed(1).toString() + " minutes ago"}</Text>
            <View style ={{ paddingLeft:20, flexDirection:'row',flexShrink: 1 }}>
              <Text style={{color:'#AB2D2D'}}>{product.lowestPrice + " €"}</Text>
              <Text>{" - "}</Text>
              <Text style={{color:'#AB2D2D'}}>{product.highestPrice+ " €"}</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }
  renderECommerceArray = (eCommerceArray:ECommerce[]) => {
    return (
      <ScrollView>
        {eCommerceArray.map((eCommerce,index) => {
          return(
            <View key={index} style = {styles.item}>
              <View style = {{ flexDirection:'row', alignItems:'center'}}>
                <View style={{padding:10}}>                
                  <Image
                    style={{width: 60, height: 40,resizeMode : 'stretch' }}
                    source = {{uri: eCommerce.shopLogoURL}}
                  />
                </View>

                <View  style={{ padding:5,flexShrink: 1 }}>
                    <Text numberOfLines={2}>{eCommerce.productName}</Text>
                </View>
                <View style={{flexDirection:'column', alignItems:'center'}}>
                  <View style={{paddingBottom:3}}>
                    <Text style={{color:'#AB2D2D', fontFamily:'sans-serif'}}>{eCommerce.lowestPrice!=0? eCommerce.lowestPrice + " €":"Out of stock"}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { this.goToHref(eCommerce.href)}} style={{backgroundColor:'green'}}>
                    <Text> {"Go to shop"} </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )
        })}
      </ScrollView>
    )
  }
  renderHistory = (historyArray:History[]) => {
    const {product} = this.state;
    const x = historyArray.sort((a, b) => {
        if (true) return a.date > b.date ? 1 : -1;
        return a.date > b.date ? -1 : 1;
    })
    if(historyArray.length>3) {
      const labels = x.map(function(a) {return  prettyDate2(new Date(a.date*1000))});
      const datas = x.map(function(a) {return a.lowestPrice;});
      return (
        <View>
          <LineChart
            data={{
              labels: labels,
              datasets: [
                {
                  data: datas,
                },
              ],
            }}
            width={Dimensions.get('window').width - 16} // from react-native
            height={220}
            yAxisLabel={'€'}
            chartConfig={{
              backgroundColor: '#1cc910',
              backgroundGradientFrom: '#eff3ff',
              backgroundGradientTo: '#efefef',
              decimalPlaces: 1, // optional, defaults to 2dp
              color: (opacity = 255) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      )
    }
    else if (product) {
      return (
        <View>
          <LineChart
            data={{
              labels: [prettyDate2(new Date(product.date*1000))],
              datasets: [
                {
                  data: [product.lowestPrice],
                },
              ],
            }}
            width={Dimensions.get('window').width - 16} // from react-native
            height={220}
            yAxisLabel={'€'}
            chartConfig={{
              backgroundColor: '#1cc910',
              backgroundGradientFrom: '#eff3ff',
              backgroundGradientTo: '#efefef',
              decimalPlaces: 1, // optional, defaults to 2dp
              color: (opacity = 255) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      )
    }
    else {
      this.renderActivityIndicator();
    }

  }
  renderReview = (reviewArray:Review[]) => {
    return (
      <View>
        <View style={{flexShrink: 1, padding:5, borderBottomWidth: 1, borderColor: '#ddd',}}>
          <Text numberOfLines={1} style={{ flexWrap: 'wrap',padding:5, fontWeight: 'bold', fontFamily:'sans-serif'}}> {"Reviews about - "+ this.state.product?.name} </Text>
        </View>
        <ScrollView>
          {reviewArray.map((review,index)=>{
            return(
              <View style={styles.item} key={index}>
                <View style = {{ flexDirection:'row'}}>
                  <View style ={{paddingRight:5,flexDirection:'column',alignItems:'center'}}>
                    <Text style={{fontSize:9,fontWeight: 'bold', fontFamily:'sans-serif'}}>{review.ownerEmail}</Text>
                    <Text style={{fontSize:8}}>{review.date.toDate().toDateString()+" " + review.date.toDate().toLocaleTimeString('lt-LT')}</Text>
                    <View style={{alignItems:'center'}}>
                      <Stars
                        display={review.stars}
                        spacing={8}
                        count={5}
                        starSize={40}
                        fullStar={<Icon name={'star'} style={[styles.myStarStyle]}/>}
                        emptyStar={<Icon name={'star-outline'} style={[styles.myStarStyle, styles.myEmptyStarStyle]}/>}
                        halfStar={<Icon name={'star-half'} style={[styles.myStarStyle]}/>}
                      />
                    </View>
                  </View>
                  <View>
                    <Text style={{fontSize:9}}>{review.comment}</Text>
                  </View>
                </View>
              </View>
            )
          })}
        </ScrollView>
        {this.state.user? this.renderSendReview(): <View></View>}
      </View>


    )
  }
  handleText = (text:string) => {
    this.setState({reviewText:text})
  }
  onPressSendReview = () => {
    if(this.state.reviewText!='') {
      api.sendReview(this.state.reviewText,this.state.reviewStars, this.props.route.params.product['objectID']);
      this.handleText("")
    }
  }
  renderSendReview = () => {
    return (
      <View style={{padding:10,flexDirection:'row', backgroundColor:'#F2F3F4'}}>
        <View style={{padding:10,flexDirection:'column'}}>
          <Text style={{fontWeight: 'bold', fontFamily:'sans-serif'}}>Your evaluation</Text>
          <View style={{alignItems:'center'}}>
            <Stars
              default={2.5}
              count={5}
              update = {(val:number) => this.setState({reviewStars:val})}
              half={true}
              starSize={50}
              fullStar={<Icon name={'star'} style={[styles.myStarStyle]}/>}
              emptyStar={<Icon name={'star-outline'} style={[styles.myStarStyle, styles.myEmptyStarStyle]}/>}
              halfStar={<Icon name={'star-half'} style={[styles.myStarStyle]}/>}
            />
          </View>
        </View>
        <View style={{padding:10,flexDirection:'column'}}>
          <Text style={{fontWeight: 'bold', fontFamily:'sans-serif'}} >comment, opinion</Text>
          <View style={{width:260, height:85, backgroundColor:'white', borderWidth:1,borderColor: '#ddd',}}>
            <TextInput onChangeText = {this.handleText} value = {this.state.reviewText}  style={{fontSize:10}}  multiline={true}>

            </TextInput>
          </View>
          <View style={{paddingTop:5,flexDirection:'row'}}>
            <TouchableOpacity onPress = {this.onPressSendReview}  style={{backgroundColor:'#65a422',borderRadius:2, minWidth:90, alignItems:'center'}}>
              <Text style={{color:'white'}}>
                Send review
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    )
  }
  
  goToHref = (href:string) => {
    Linking.openURL(href)
  }

  renderActivityIndicator = () => {
    return (
      <View style={styles.layout}>
        <ActivityIndicator size='large'/>
      </View>
    )
  }
  renderConditional = (eCommerceArray:ECommerce[],historyArray:History[],reviewArray:Review[]) => {
    if(eCommerceArray && this.state.whatToRender==="Sellers"){
      return (
        this.renderECommerceArray(eCommerceArray)
      )
    } else if(historyArray && this.state.whatToRender==="History") {
      return (
        this.renderHistory(historyArray)
      )

    } else if (reviewArray && this.state.whatToRender==="Reviews") {
      return (
        this.renderReview(reviewArray)
      )
    }
    else {
      return (
        this.renderActivityIndicator()
      )
    }
  }
  renderWhat = (category:string) => {
    this.setState({
      whatToRender:category
    })
  }
  render() {
    const {product} = this.state;
    const {eCommerceArray} = this.state;
    const {historyArray} = this.state;
    const {reviewArray} = this.state
    return (
      <SafeAreaView style={styles.container}>
        <View style={{flexDirection:'column'}}>
          <View>
            {product ? this.renderProduct(product) : this.renderActivityIndicator()}
          </View>
          <View style={{flexDirection:'row', alignSelf:'center', padding: 10 }}>
            <TouchableOpacity onPress={() => { this.renderWhat("Sellers")}} >
              <Text style={this.state.whatToRender==="Sellers" ? styles.categories:styles.categories2}>{"Sellers"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { this.renderWhat("History")}} style={{paddingLeft:10,paddingRight:10}}>
              <Text style={this.state.whatToRender==="History" ? styles.categories:styles.categories2}>{"Price History"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { this.renderWhat("Reviews")}} >
              <Text style={this.state.whatToRender==="Reviews" ? styles.categories:styles.categories2}>{"Reviews"}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ borderTopWidth: 1, borderColor: '#ddd',}}>
            {eCommerceArray&&historyArray&&reviewArray? this.renderConditional(eCommerceArray,historyArray,reviewArray) : this.renderActivityIndicator()}
          </View>
        </View>
      </SafeAreaView>
    )
  }
  }
  const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    myStarStyle: {
      color:'#34785d', 
      textShadowRadius: 2,
    },
    myEmptyStarStyle: {
      color: '#66FF99',
    },
    categories:{
      color:'#34785d', 
      textDecorationLine:'underline',
      textShadowRadius: 5
    },
    categories2:{
      color:'#34785d',
    },
    body: {
      paddingTop: 20,
      padding: 20
    },
    layout: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      paddingBottom: '40%',
    },
    button: {
      alignItems: 'center',
      backgroundColor: '#DDDDDD',
      padding: 10,
      width: 300,
      marginTop: 16,
    },
    separator: {
      borderBottomWidth: 1,
      borderColor: '#ddd',
    },
    item: {
      padding: 10,
      borderBottomWidth: 1,
      borderColor: '#ddd',
      flexDirection: 'column',
    },
    itemRow: {
      flexDirection:'row',
    },
    titleText: {
      fontWeight: 'bold',
    },
  });
  
