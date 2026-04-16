// src/components/BottomTabBar.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Home,
  Megaphone,
  Folder,
  FileText,
  MessageCircle,
  UserCircle,
} from 'lucide-react-native';
import colors from '../styles/colors';

const TAB_ICONS = {
  Feed:          Home,
  Announcements: Megaphone,
  Projects:      Folder,
  Posts:         FileText,
  Messages:      MessageCircle,
  Profile:       UserCircle,
};

const BottomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;
        const IconComponent = TAB_ICONS[route.name];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            activeOpacity={0.75}
          >
            {IconComponent && (
              <IconComponent
                size={22}
                color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
                strokeWidth={isFocused ? 2.2 : 1.8}
              />
            )}
            <Text style={[styles.label, isFocused && styles.activeLabel]}>
              {label}
            </Text>
            {isFocused && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 2,
  },
  label: {
    fontSize: 10,
    color: colors.tabBarInactive,
    fontWeight: '500',
    letterSpacing: 0.1,
    marginTop: 3,
  },
  activeLabel: {
    color: colors.tabBarActive,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});

export default BottomTabBar;
