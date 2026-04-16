import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import {Search} from 'lucide-react-native';
const colors = {
  primary: '#2BBFAA', primaryLight: '#E8F8F6', background: '#F7F9FB',
  white: '#FFFFFF', text: '#1A2233', textSecondary: '#6B7A99',
  textMuted: '#A0AABF', border: '#E8EDF5', cardBackground: '#FFFFFF',
  inputBackground: '#F0F4FA', divider: '#EEF1F8',
};

const TABS = ['All', 'Groups', 'Direct'];
const MESSAGES = [
  { id: '1', initials: 'SK', name: 'Sarah Kim', preview: 'Hey! Are you joining the hackathon this weekend?', timeAgo: '15m ago', unread: 2, type: 'direct' },
  { id: '2', initials: 'PA', name: 'Project Alpha Team', preview: 'Meeting moved to Thursday at 3pm.', timeAgo: '45m ago', unread: 5, type: 'group' },
  { id: '3', initials: 'LC', name: 'Liam Chen', preview: 'Thanks for the code review, really helpful!', timeAgo: '1h ago', unread: 0, type: 'direct' },
];

const Avatar = ({ initials, size = 44 }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: size * 0.34 }}>{initials}</Text>
  </View>
);

const MessageItem = ({ item }) => (
  <TouchableOpacity style={styles.msgRow} activeOpacity={0.85}>
    <View style={{ position: 'relative' }}>
      <Avatar initials={item.initials} />
      {item.unread > 0 && (
        <View style={styles.badge}><Text style={styles.badgeText}>{item.unread}</Text></View>
      )}
    </View>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={styles.senderName}>{item.name}</Text>
        <Text style={styles.time}>{item.timeAgo}</Text>
      </View>
      <Text style={styles.preview} numberOfLines={2}>{item.preview}</Text>
    </View>
  </TouchableOpacity>
);

const MessagesScreen = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const filtered = MESSAGES.filter(m => activeTab === 'All' || (activeTab === 'Groups' ? m.type === 'group' : m.type === 'direct'));

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput style={styles.searchInput} placeholder="Search" placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />
        </View>
      </View>
      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered} keyExtractor={i => i.id}
        renderItem={({ item }) => <MessageItem item={item} />}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 80, backgroundColor: colors.white }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.divider },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.primary,marginTop:20 },
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.inputBackground },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.white, fontWeight: '700' },
  msgRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.white },
  badge: { position: 'absolute', top: -4, right: 10, backgroundColor: colors.primary, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: colors.white },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  senderName: { fontSize: 14, fontWeight: '700', color: colors.text },
  time: { fontSize: 11, color: colors.textMuted },
  preview: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  separator: { height: 1, backgroundColor: colors.divider, marginLeft: 74 },
});

export default MessagesScreen;
