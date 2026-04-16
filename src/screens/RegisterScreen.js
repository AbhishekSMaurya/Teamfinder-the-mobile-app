// RegisterScreen.js
// Place this file at: src/screens/RegisterScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import colors from '../styles/colors';

// ── Field component is OUTSIDE RegisterScreen to prevent remount on every keystroke ──
const Field = ({ label, icon: Icon, value, onChange, placeholder, secure, keyboardType, autoCapitalize }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        {Icon && <Icon size={16} color={colors.textMuted} style={styles.inputIcon} />}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure && !visible}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={false}
        />
        {secure && (
          <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.eyeBtn} activeOpacity={0.7}>
            {visible
              ? <EyeOff size={18} color={colors.textMuted} />
              : <Eye size={18} color={colors.textMuted} />
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Username, email and password are required.');
      return;
    }
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        username: username.trim(),
        email: email.trim(),
        password,
        password2,
      });
    } catch (e) {
      setError(e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>TF</Text>
          </View>
          <Text style={styles.appName}>TeamFinder</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign Up</Text>
          <Text style={styles.cardSubtitle}>Join TeamFinder and start collaborating</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* First / Last name row — plain TextInputs, no Field wrapper needed */}
          <View style={styles.nameRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { paddingLeft: 4 }]}
                  placeholder="First"
                  placeholderTextColor={colors.textMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { paddingLeft: 4 }]}
                  placeholder="Last"
                  placeholderTextColor={colors.textMuted}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>

          <Field
            label="Username"
            icon={User}
            value={username}
            onChange={setUsername}
            placeholder="Choose a username"
          />
          <Field
            label="Email"
            icon={Mail}
            value={email}
            onChange={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
          />
          <Field
            label="Password"
            icon={Lock}
            value={password}
            onChange={setPassword}
            placeholder="Create a password"
            secure
          />
          <Field
            label="Confirm Password"
            icon={Lock}
            value={password2}
            onChange={setPassword2}
            placeholder="Repeat password"
            secure
          />

          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={styles.registerBtnText}>Create Account</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },

  brandSection: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  logoText: { color: colors.white, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  appName: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3, marginBottom: 4 },
  tagline: { fontSize: 13, color: colors.textSecondary },

  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18, padding: 24,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
    marginBottom: 24,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },

  errorBanner: {
    backgroundColor: '#FFF0F1', borderRadius: 10,
    borderWidth: 1, borderColor: colors.danger,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '500' },

  nameRow: { flexDirection: 'row' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 7 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
  eyeBtn: { paddingLeft: 8, paddingVertical: 2 },

  registerBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 5,
  },
  btnDisabled: { opacity: 0.65 },
  registerBtnText: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginPrompt: { fontSize: 14, color: colors.textSecondary },
  loginLink: { fontSize: 14, color: colors.primary, fontWeight: '700' },
});

export default RegisterScreen;
