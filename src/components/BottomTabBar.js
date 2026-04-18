// src/components/BottomTabBar.js
import React from 'react';
import {
  View,
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
            {/* Active pill behind icon */}
            {isFocused && <View style={styles.activePill} />}

            {IconComponent && (
              <IconComponent
                size={24}
                color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
                strokeWidth={isFocused ? 2.3 : 1.7}
              />
            )}

            {/* Small dot below icon when active */}
            <View style={styles.dot}>
              {isFocused && <View style={styles.dotFilled} />}
            </View>
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
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 10,
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
    paddingVertical: 2,
  },
  activePill: {
    position: 'absolute',
    top: -2,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
  },
  dot: {
    height: 4,
    marginTop: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.tabBarActive,
  },
});

export default BottomTabBar;

