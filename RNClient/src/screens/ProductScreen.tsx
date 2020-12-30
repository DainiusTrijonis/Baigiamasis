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
  FlatList, 
  TextInput,
  Keyboard,
} from 'react-native';
import {createApiClient,Product, ECommerce, History, Review, Wish} from '../api/products'
import {
  LineChart,
} from "react-native-chart-kit";
import Icon from 'react-native-vector-icons/FontAwesome';
import Stars from 'react-native-stars';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import { ConfirmDialog, Dialog, ProgressDialog } from 'react-native-simple-dialogs';



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
  wished?:Wish,
  ownProduct:boolean,
  dialogVisible:boolean,
  progressVisible:boolean,
  urlInput:string,
  errorVisible:boolean,
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
let unsubscribe7:any;

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
      ownProduct:false,
      dialogVisible:false,
      progressVisible:false,
      urlInput:'',
      errorVisible:false,
  };
  componentDidMount = () => {
    let product:Product;
    if(this.props.route.params.product['objectID']) {
      product = new Product(this.props.route.params.product['objectID'],this.props.route.params.product['name'],this.props.route.params.product['photoURL'],parseFloat(this.props.route.params.product['date']),parseFloat(this.props.route.params.product['lowestPrice']), parseFloat(this.props.route.params.product['highestPrice']),parseFloat(this.props.route.params.product['createdAt']),this.props.route.params.product['createdByUID'])
    } else {
      product = new Product(this.props.route.params.product['id'],this.props.route.params.product['name'],this.props.route.params.product['photoURL'],parseFloat(this.props.route.params.product['date']),parseFloat(this.props.route.params.product['lowestPrice']), parseFloat(this.props.route.params.product['highestPrice']),parseFloat(this.props.route.params.product['createdAt']),this.props.route.params.product['createdByUID'],this.props.route.params.product['wish'])
    }
    this.setState({
      product: product
    })
    unsubscribe6 = auth().onAuthStateChanged((user) => {
      if (user) {
        let ownProduct:boolean = false;
        if(this.state.product?.createdByUID == user.uid) {
          ownProduct = true;
        }
        this.setState({
          user: user,
          initializing: false,
          ownProduct: ownProduct
        });
        console.log(ownProduct);
        if(this.state.product && this.state.user)
        unsubscribe7 = api.getWishedRealTime(this.onUpdateWish,this.state.product,user.uid)
      }
      else {
        this.setState({
          initializing: false,
        });
      }
    })
    unsubscribe = api.getProductRealtime(this.onUpdateProduct, product.id);
    unsubscribe2 = api.getECommerceRealtime(this.onUpdateECommerceArray, product.id)
    unsubscribe4 = api.getHistoryRealtime(this.onUpdateHistoryArray, product.id)
    unsubscribe5 = api.getReviewsRealTime(this.onUpdateReviewArray,product.id)
    unsubscribe3 = setInterval(() => {
      this.setState({
        time : new Date()
      })
    }, 60000)



  }; 

  componentWillUnmount = () => {
    unsubscribe();
    unsubscribe2(); 
    clearInterval(unsubscribe3);
    unsubscribe4();
    unsubscribe5();
    unsubscribe6();
    if(this.state.user)
    unsubscribe7();
  }
  onUpdateWish = (wish:Wish) => {

    if(wish.id === ""){
      this.setState({
        wished: undefined,
      });
    }
    else {
      this.setState({
        wished: wish,
      });
    }
  }
  onPressWish = () => {
    let time:number = new Date().getTime()/1000
    time =parseInt( time.toFixed(0));
    if(this.state.wished) {
      if(this.state.product && this.state.user)
        firestore().collection('product').doc(this.state.product.id).collection("wished").doc(this.state.wished.id).delete()
    }
    else {
      if(this.state.product && this.state.user)
        firestore().collection('product').doc(this.state.product.id).collection("wished").add({toNotify:true,lastNotified:time,priceWhenToNotify:parseFloat((this.state.product.lowestPrice-0.1).toFixed(2)),uid:this.state.user.uid})
    }
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
          <View style={{flexDirection:'column',flex:1}}>
            <Text numberOfLines={2} style={{flex: 1, flexWrap: 'wrap',paddingLeft:20, fontWeight: 'bold', fontFamily:'sans-serif'}}>{product.name}</Text>
            <Text numberOfLines={3} style={{flex: 1, flexWrap: 'wrap',paddingLeft:20, fontWeight: 'normal', opacity:0.3}}>{"Price updated "+((this.state.time.getTime()/1000 -product.date )/ 60 ).valueOf().toFixed(1).toString() + " minutes ago"}</Text>
            {this.state.user? 
              <TouchableOpacity onPress={()=>{this.onPressWish()}} style={{bottom:0,alignSelf:'flex-end',position:'absolute'}}>
                <Icon name={this.state.wished? "heart":"heart-o"}
                      size={25} color="red" 
                />
              </TouchableOpacity>
            :<View/>}


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
  renderDeleteECommerce = (eCommerce:ECommerce) => {
    return(
      <TouchableOpacity onPress={()=>{this.deleteECommerce(eCommerce)}} style={{padding:5}}>
        <Icon name={"trash-o"}
              size={25} color="gray" 
        />
      </TouchableOpacity>
    )
  }
  deleteECommerce = (eCommerce:ECommerce) => {
    if(this.state.product) {
      api.deleteECommerce(this.state.product,eCommerce);
    }
  }
  renderAddECommerce = () => {
    return (
      <TouchableOpacity onPress={()=>{this.showAddECommerceDialog()}} style={{padding:10,alignItems:'center'}}>
        <Icon name={"plus-circle"}
              size={25} color="gray" 
        />
      </TouchableOpacity>
    )
  }
  showAddECommerceDialog = () => {
    this.setState({
      dialogVisible:true
    })
  }
  addECommerce = async () => {
    this.setState({
      progressVisible:true,
      dialogVisible:false,
    })
    await api.addECommerce(this.state.product?.id ?? "",this.state.urlInput).then((res) => {
      this.setState({
        progressVisible:false,
      })
      if(res === false) {
        this.setState({
          errorVisible: true,
        })
        setTimeout(() => {
          this.setState({
            errorVisible: false,
          })
        }, 2000);
      }

    }).catch((error) => {
      console.log(error);
      this.setState({
        progressVisible:false,
        urlInput:'',
      })
    })
  }
  renderECommerceArray = (eCommerceArray:ECommerce[]) => {
    const {ownProduct} = this.state
    return (
      <View>
        <ConfirmDialog
            visible={this.state.dialogVisible}
            title="Ecommerce product URL link:"
            positiveButton= {{
              title: "CONFIRM",
              onPress: () => {this.addECommerce()}
            }}
            negativeButton={{
              title: "CANCEL",
              onPress: () => {this.setState({urlInput:'', dialogVisible:false,})}
            }}
            onTouchOutside={() => this.setState({dialogVisible: false})} >
            <View>
              <View style={{ backgroundColor:'white', borderWidth:1,borderColor: '#ddd',}} >
                <TextInput
                  placeholder={"Enter URL"}
                  onChangeText={(text) => {this.setState({urlInput:text})}}
                  value={this.state.urlInput}
                  style={{}}
                />
              </View>
              <View style={{padding:5}}>
                <Text style={{opacity:0.3}}>
                  Example:
                </Text>
                <View style = {{padding:5}}>
                  <Text style={{opacity:0.3}}>
                    https://www.senukai.lt/p/productLink
                  </Text>
                  <Text style={{opacity:0.3}}>
                    https://www.amazon.de/-/en/productLink
                  </Text>
                </View>

              </View>

            </View>
            
        </ConfirmDialog>
        <ProgressDialog
            visible={this.state.progressVisible}
            title="Progress Dialog"
            message="Please, wait..."
        />
        <ProgressDialog
            visible={this.state.errorVisible}
            title="Error"
            message="Wrong url or services are inacessible"
        />
        {ownProduct ? this.renderAddECommerce() : null}
        <FlatList
          contentContainerStyle={{ paddingBottom:300}}
          data = {eCommerceArray}
          keyExtractor = {(item) => item.id}
          renderItem={({ item }) => (
            <View key={item.id} style = {styles.item}>
            <View style = {{ flexDirection:'row', alignItems:'center'}}>
              <View style={{padding:10}}>                
                <Image
                  style={{width: 60, height: 40,resizeMode : 'stretch' }}
                  source = {{uri: item.shopLogoURL}}
                />
              </View>
              <View  style={{ padding:5,flex:1 }}>
                  <Text numberOfLines={3}>{item.productName}</Text>
              </View>
              <View style={{flexDirection:'column', alignItems:'center'}}>
                <View style={{paddingBottom:3}}>
                  <Text style={{color:'#AB2D2D'}}>{item.lowestPrice!=0? item.lowestPrice + " €":"Out of stock"}</Text>
                </View>
                <TouchableOpacity onPress={() => { this.goToHref(item.href)}} style={{backgroundColor:'green'}}>
                  <Text> {"Go to shop"} </Text>
                </TouchableOpacity>
                {ownProduct ? this.renderDeleteECommerce(item) : null}
              </View>
            </View>
          </View>
          )}
        />
      </View>
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
            xAxisLabel={"h"}
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
  renderReviewPage = (reviewArray:Review[]) => {
    return (
      <View style ={{}}>
        <View style={{ padding:5, borderBottomWidth: 1, borderColor: '#ddd',}}>
          <Text numberOfLines={1} style={{ flexWrap: 'wrap',padding:5, fontWeight: 'bold', fontFamily:'sans-serif'}}> {"Reviews about - "+ this.state.product?.name} </Text>
        </View>
        {this.state.user? this.renderSendReview(): <View></View>}
        <View style={{flexGrow:1, width:'100%'}}>
          <FlatList
            contentContainerStyle={{ paddingBottom:300}}
            data = {reviewArray}
            keyExtractor = {(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style = {{ flexDirection:'row'}}>
                  <View style ={{paddingRight:5,flexDirection:'column',alignItems:'center'}}>
                    <Text style={{fontSize:9,fontWeight: 'bold', fontFamily:'sans-serif'}}>{item.ownerEmail}</Text>
                    <Text style={{fontSize:8}}>{item.date.toDate().toDateString()+" " + item.date.toDate().toLocaleTimeString('lt-LT')}</Text>
                    <View style={{alignItems:'center'}}>
                      <Stars
                        display={item.stars}
                        spacing={8}
                        count={5}
                        starSize={40}
                        fullStar={<Icon name={'star'} style={[styles.myStarStyle]}/>}
                        emptyStar={<Icon name={'star-o'} style={[styles.myStarStyle, styles.myEmptyStarStyle]}/>}
                        halfStar={<Icon name={'star-half'} style={[styles.myStarStyle]}/>}
                      />
                    </View>
                  </View>
                  <View>
                    <Text style={{fontSize:9}}>{item.comment}</Text>
                  </View>
                </View>
              </View>
            )}
          />
        </View>

      </View>
    )
  }
  


  handleText = (text:string) => {
    this.setState({reviewText:text})
  }
  onPressSendReview = () => {
    Keyboard.dismiss();
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
              emptyStar={<Icon name={'star-o'} style={[styles.myStarStyle, styles.myEmptyStarStyle]}/>}
              halfStar={<Icon name={'star-half'} style={[styles.myStarStyle]}/>}
            />
          </View>
        </View>
        <View style={{padding:10,flexDirection:'column'}}>
          <Text style={{fontWeight: 'bold', fontFamily:'sans-serif'}} >comment, opinion</Text>
          <View style={{width:260, height:85, backgroundColor:'white', borderWidth:1,borderColor: '#ddd',}}>
            <TextInput 
              onChangeText = {this.handleText} 
              value = {this.state.reviewText}  
              style={{fontSize:10}} 
              multiline={true}
            />
          </View>
          <View style={{paddingTop:5,flexDirection:'row'}}>
            <TouchableOpacity onPress = {this.onPressSendReview}   style={{backgroundColor:'#65a422',borderRadius:2, minWidth:90, alignItems:'center'}}>
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
        this.renderReviewPage(reviewArray)
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
        <View style={{flexDirection:'column', flex:1}}>
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
  
