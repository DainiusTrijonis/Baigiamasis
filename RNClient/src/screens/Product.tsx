import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {createApiClient,Product, ECommerce} from '../api/products'


export type AppState = {
  product?: Product,
  isLoading:boolean,
}
interface Props {
  navigation: any
  route: any
}
let unsubscribe:any;

const api = createApiClient();

export default class WishList extends React.Component<Props> {
  state: AppState = {
      isLoading: true,
  };
  componentDidMount = () => {
    const product = new Product(this.props.route.params.product['name'],this.props.route.params.product['photoURL'],parseFloat(this.props.route.params.product['date']))
    this.setState({
      product: product
    })
    //console.log(this.state.product)
    unsubscribe = api.getProductRealtime(this.onUpdateProduct, this.props.route.params.product['objectID']);
  };
  componentWillUnmount = () => {
    unsubscribe
  }
  onUpdateProduct = (product:Product) => {
    this.setState({
      product: product,
      isLoading: false,
    });
  }
  renderProduct = (product:Product) => {
    return (
      <View style={styles.layout}>
        <Text>
          {product.name}
        </Text>
      </View>
    )
  }
  renderActivityIndicator = () => {
    return (
      <View style={styles.layout}>
        <ActivityIndicator size='large'/>
      </View>
    )

  }
  render() {
    const {product} = this.state;
    return (
      <SafeAreaView style={styles.container}>
        <View>
          
        </View>
        {product  ? this.renderProduct(product) : this.renderActivityIndicator()}
      </SafeAreaView>
    )
  }
  }
  const styles = StyleSheet.create({
    container: {
        flex: 1,
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
  });
  
