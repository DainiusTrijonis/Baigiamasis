import React from "react";
import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator();
import HomeScreen from '../Home'
import WishListScreen from '..//WishList'
import ProfileScreen from '../Profile'
import LoginScreen from '../Authentication/Login'
import RegisterScreen from '../Authentication/Register'
import ProductScreen from '../ProductScreen'
import AddProductScreen from '../AddProduct'

const screenOptionStyle = {
    headerStyle: {
      backgroundColor: "#9AC4F8",
    },
    headerTintColor: "white",
    cardStyle: { backgroundColor: '#FFFFFF' },
    headerBackTitle: "Back",
  };
  
  const HomeStackNavigator = () => {
    return (
      <Stack.Navigator screenOptions={screenOptionStyle}>
        <Stack.Screen name="Search product" component={HomeScreen} />
        <Stack.Screen name="Product" component={ProductScreen}  />
        <Stack.Screen name="AddProduct" component={AddProductScreen} options={{title:'Search Product'}} />
      </Stack.Navigator>
    );
  }
  
  const WishListStackNavigator = () => {
    return (
      <Stack.Navigator screenOptions={screenOptionStyle}>
        <Stack.Screen name="Wish List" component={WishListScreen} />
        <Stack.Screen name="Product" component={ProductScreen}  />
      </Stack.Navigator>
    );
  }
  const ProfileStackNavigator = () => {
    return (
      <Stack.Navigator screenOptions={screenOptionStyle}>
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  
  export { HomeStackNavigator, WishListStackNavigator, ProfileStackNavigator };