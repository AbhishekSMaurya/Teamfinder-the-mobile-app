import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Header from '../components/Header';
import Tag from '../components/Tag';
import { exploreGroups, exploreSkills, exploreTopics } from '../data/announcements';
import colors from '../styles/colors';

const CATEGORY_TABS = ['Groups', 'Skills', 'Topics'];

const GroupCard = ({ group }) => {
  const [joined, setJoined] = useState(false);

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupCardHeader}>
        <View>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupDesc} numberOfLines={3}>{group.description}</Text>
        </View>
      </View>

      <View style={styles.groupCardFooter}>
        <View style={styles.memberRow}>
          <View style={styles.memberAvatars}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.memberAvatar, { marginLeft: i === 1 ? 0 : -8 }]}>
                <Text style={{ fontSize: 10 }}>👤</Text>
              </View>
            ))}
          </View>
          <Text style={styles.memberCount}>{group.memberCount} members</Text>
        </View>

        <TouchableOpacity
          style={[styles.joinBtn, joined && styles.joinedBtn]}
          onPress={() => setJoined(!joined)}
          activeOpacity={0.8}
        >
          <Text style={[styles.joinBtnText, joined && styles.joinedBtnText]}>
            {joined ? 'Joined ✓' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ExploreScreen = () => {
  const [activeTab, setActiveTab] = useState('Groups');
  const [search, setSearch] = useState('');

  return (
    <View style={styles.screen}>
      <Header title="Explore" />

      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.tabsRow}>
        {CATEGORY_TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Groups' && (
          <View>
            <Text style={styles.sectionTitle}>Groups to Join</Text>
            {exploreGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </View>
        )}

        {activeTab === 'Skills' && (
          <View>
            <Text style={styles.sectionTitle}>Recommended Skills</Text>
            <View style={styles.tagCloud}>
              {exploreSkills.map((skill, i) => (
                <Tag key={i} label={skill} style={styles.bigTag} />
              ))}
            </View>
          </View>
        )}

        {activeTab === 'Topics' && (
          <View>
            <Text style={styles.sectionTitle}>Trending Topics</Text>
            <View style={styles.tagCloud}>
              {exploreTopics.map((topic, i) => (
                <Tag key={i} label={topic} style={styles.bigTag} />
              ))}
            </View>
          </View>
        )}

        {activeTab === 'Groups' && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Recommended Skills</Text>
            <View style={styles.tagCloud}>
              {exploreSkills.slice(0, 4).map((skill, i) => (
                <Tag key={i} label={skill} />
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Trending Topics</Text>
            <View style={styles.tagCloud}>
              {exploreTopics.slice(0, 3).map((topic, i) => (
                <Tag key={i} label={topic} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  scroll: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  groupCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  groupCardHeader: {
    marginBottom: 12,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 5,
  },
  groupDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  groupCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberAvatars: {
    flexDirection: 'row',
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  memberCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  joinBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 20,
  },
  joinedBtn: {
    backgroundColor: colors.primaryLight,
  },
  joinBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  joinedBtnText: {
    color: colors.primary,
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  bigTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});

export default ExploreScreen;
