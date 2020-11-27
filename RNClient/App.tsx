import * as React from 'react';
import { Button } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

import HomeScreen from './src/screens/Home'
import WishListScreen from './src/screens/WishList'
import ProfileScreen from './src/screens/Profile'

import Icon from 'react-native-vector-icons/FontAwesome';

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="Home">
          <Tab.Screen 
              name="Home" 
              component={HomeScreen}
              options= {{ 
                title: 'Home',
                tabBarIcon:({color:tintColor})=>(  
                  <Icon name="home" color={tintColor} size={25}/>  
                )
              }}
          />
          <Tab.Screen 
              name="Login" 
              component={WishListScreen} 
              options= {{ 
                  title: 'Wish List', 
                  tabBarIcon:({color:tintColor})=>(  
                    <Icon name="list-alt" color={tintColor} size={25}/>  
                  )  
              }}

          />
          <Tab.Screen 
              name="Register" 
              component={ProfileScreen} 
              options= {{ 
                title: 'Profile',
                tabBarIcon:({color:tintColor})=>(  
                  <Icon name="user" color={tintColor} size={25}/>  
                )
              }}  
          />
      </Tab.Navigator>
    </NavigationContainer>
  );
}