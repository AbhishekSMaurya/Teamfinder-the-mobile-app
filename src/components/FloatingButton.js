import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import colors from '../styles/colors';

const FloatingButton = ({ onPress, icon = '+', label }) => {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.icon}>{icon}</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    backgroundColor: colors.primary,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'row',
    gap: 6,
  },
  icon: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 30,
    marginTop: -2,
  },
  label: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default FloatingButton;
