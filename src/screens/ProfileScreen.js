// src/screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
  StatusBar, Platform,
} from 'react-native';
import { LogOut, Mail, MapPin, Link, User, Shield } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import colors from '../styles/colors';

// ── Avatar ─────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 72 }) => {
  const initials = user?.initials || user?.username?.slice(0, 2).toUpperCase() || '??';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
};

// ── Info row ───────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Icon size={15} color={colors.textMuted} style={{ marginRight: 10 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
};

// ── Tag chip ───────────────────────────────────────────────────────────────
const TagChip = ({ label }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

// ── Main Screen ────────────────────────────────────────────────────────────
const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
              // Navigation resets automatically because AuthContext
              // sets user to null, which triggers the RootNavigator
              // to switch to the Login stack.
            } catch (_) {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <Avatar user={user} size={76} />

          <Text style={styles.fullName}>
            {user.full_name || user.username}
          </Text>

          {user.full_name && user.username ? (
            <Text style={styles.username}>@{user.username}</Text>
          ) : null}

          {user.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : (
            <Text style={styles.bioEmpty}>No bio yet.</Text>
          )}
        </View>

        {/* ── Details card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          <InfoRow icon={Mail}    label="Email"     value={user.email} />
          <InfoRow icon={MapPin}  label="Location"  value={user.location} />
          <InfoRow icon={Link}    label="Portfolio" value={user.portfolio_url} />
          <InfoRow icon={Shield}  label="Joined"    value={
            user.date_joined
              ? new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
              : null
          } />
        </View>

        {/* ── Skills card ── */}
        {user.skills?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.tagsRow}>
              {user.skills.map((skill, i) => (
                <TagChip key={i} label={skill} />
              ))}
            </View>
          </View>
        )}

        {/* ── Account card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <LogOut size={18} color={colors.white} style={{ marginRight: 10 }} />
                <Text style={styles.logoutBtnText}>Log out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  header: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.primary },

  scroll: { padding: 16 },

  profileCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18, padding: 24,
    alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    marginBottom: 14,
  },
  avatar: {
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  avatarText: { color: colors.white, fontWeight: '800', letterSpacing: 1 },
  fullName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 3 },
  username: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  bio: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  bioEmpty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },

  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  infoLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', width: 72 },
  infoValue: { flex: 1, fontSize: 13, color: colors.text },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: {
    backgroundColor: colors.tagBackground, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    marginRight: 8, marginBottom: 8,
  },
  tagText: { color: colors.tagText, fontSize: 13, fontWeight: '600' },

  logoutBtn: {
    backgroundColor: colors.danger,
    borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  logoutBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

export default ProfileScreen;
