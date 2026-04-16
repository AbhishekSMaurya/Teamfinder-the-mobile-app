import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import {Search} from 'lucide-react-native';

const colors = {
  primary: '#2BBFAA', primaryLight: '#E8F8F6', background: '#F7F9FB',
  white: '#FFFFFF', text: '#1A2233', textSecondary: '#6B7A99',
  textMuted: '#A0AABF', border: '#E8EDF5', cardBackground: '#FFFFFF',
  inputBackground: '#F0F4FA', divider: '#EEF1F8',
};

const FEED = [
  { id: '1', initials: 'ME', user: 'You', action: 'Joined a group:', target: 'AI Ethicists', timeAgo: '2h ago' },
  { id: '2', initials: 'SK', user: 'Sarah Kim', action: 'shared an article:', target: '"The Future of Remote Collaboration"', link: 'https://source.com/article', timeAgo: '3h ago' },
  { id: '3', initials: 'LC', user: 'Liam Chen', action: 'is now on', target: 'Project Alpha', timeAgo: '5h ago' },
];

const Avatar = ({ initials, size = 40 }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
  </View>
);

const FeedCard = ({ item }) => (
  <View style={styles.card}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <Avatar initials={item.initials} />
      <View style={{ flex: 1 }}>
        <Text style={styles.user}>{item.user}</Text>
        <Text style={styles.action}>{item.action} <Text style={styles.target}>{item.target}</Text></Text>
        {item.link ? <Text style={styles.link} numberOfLines={1}>{item.link}</Text> : null}
        <Text style={styles.time}>{item.timeAgo}</Text>
      </View>
    </View>
  </View>
);

const FeedScreen = () => {
  const [search, setSearch] = useState('');
  return (
    <View style={styles.screen}>
      <View style={styles.header}><Text style={styles.headerTitle}>Feed</Text></View>
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          {/* <Text style={{ fontSize: 15, marginRight: 8 }}>Home</Text> */}
          <Search size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput style={styles.searchInput} placeholder="Search" placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />
        </View>
      </View>
      <FlatList data={FEED} keyExtractor={i => i.id} renderItem={({ item }) => <FeedCard item={item} />} contentContainerStyle={{ paddingTop: 12, paddingBottom: 80 }} showsVerticalScrollIndicator={false} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.divider },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.primary,marginTop:20 },
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.divider },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
  card: { backgroundColor: colors.cardBackground, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  user: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  action: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  target: { fontWeight: '600', color: colors.text },
  link: { fontSize: 12, color: colors.primary, marginTop: 4, textDecorationLine: 'underline' },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
});

export default FeedScreen;
