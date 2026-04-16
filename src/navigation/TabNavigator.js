// src/navigation/TabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabBar from '../components/BottomTabBar';
import FeedScreen from '../screens/FeedScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import PostsScreen from '../screens/PostsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Feed"
    >
      <Tab.Screen name="Feed"          component={FeedScreen} />
      <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
      <Tab.Screen name="Projects"      component={ProjectsScreen} />
      <Tab.Screen name="Posts"         component={PostsScreen} />
      <Tab.Screen name="Messages"      component={MessagesScreen} />
      <Tab.Screen name="Profile"       component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
