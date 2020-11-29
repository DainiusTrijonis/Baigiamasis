import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeStackNavigator, WishListStackNavigator, ProfileStackNavigator  } from "./StackNavigation";
import Icon from 'react-native-vector-icons/FontAwesome';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home" 
        component={HomeStackNavigator}
        options= {{ 
          title: 'Home',
          tabBarIcon:({color:tintColor})=>(  
            <Icon name="home" color={tintColor} size={25}/>  
          )
        }}
      />
      <Tab.Screen 
        name="Wish List" 
        component={WishListStackNavigator} 
        options= {{ 
        title: 'Wish List', 
        tabBarIcon:({color:tintColor})=>(  
          <Icon name="list-alt" color={tintColor} size={25}/>  
        )  
        }}
      />
      <Tab.Screen
        name="Profile" 
        component={ProfileStackNavigator} 
        options= {{ 
          title: 'Profile',
          tabBarIcon:({color:tintColor})=>(  
            <Icon name="user" color={tintColor} size={25}/>  
          )
        }}  
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;