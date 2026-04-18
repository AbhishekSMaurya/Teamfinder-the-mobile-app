// src/screens/MessagesScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, X, Users, MessageCircle, ChevronLeft, Send, UserPlus } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import colors from '../styles/colors';

// ── Helpers ────────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const getInitials = (user) => {
  if (!user) return '??';
  if (user.initials) return user.initials;
  const name = user.full_name || user.username || '';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// ── Avatar ─────────────────────────────────────────────────────────────────
const Avatar = ({ user, name, size = 44, color = colors.primary }) => {
  const initials = user ? getInitials(user) : (name || '?').slice(0, 2).toUpperCase();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.primaryLight,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color, fontWeight: '700', fontSize: size * 0.34 }}>{initials}</Text>
    </View>
  );
};

// ── Tab Bar ────────────────────────────────────────────────────────────────
const TABS = ['Direct', 'Groups'];

// ══════════════════════════════════════════════════════════════════════════════
// CREATE GROUP MODAL
// ══════════════════════════════════════════════════════════════════════════════
const CreateGroupModal = ({ visible, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setName(''); setDescription(''); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Group name is required.'); return; }
    setSaving(true); setError('');
    try {
      const group = await api.createGroupChat({ name: name.trim(), description: description.trim() });
      reset();
      onCreated(group);
    } catch (e) {
      setError(e.message || 'Failed to create group.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Group</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>
          ) : null}

          <Text style={styles.fieldLabel}>Group Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. React Native Dev Team"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.fieldLabel}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What is this group about?"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.65 }]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={styles.primaryBtnText}>Create Group</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// NEW DM MODAL — search users
// ══════════════════════════════════════════════════════════════════════════════
const NewDMModal = ({ visible, onClose, onSelect }) => {
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (!visible) { setQuery(''); setResults([]); }
  }, [visible]);

  const handleSearch = (text) => {
    setQuery(text);
    clearTimeout(searchTimer.current);
    if (text.length < 2) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchUsers(text);
        setResults(data);
      } catch (_) {}
      finally { setLoading(false); }
    }, 300);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '70%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Message</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or username..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={handleSearch}
              autoFocus
            />
            {loading && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          <FlatList
            data={results}
            keyExtractor={u => String(u.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userRow}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.8}
              >
                <Avatar user={item} size={40} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.userName}>{item.full_name || item.username}</Text>
                  <Text style={styles.userHandle}>@{item.username}</Text>
                </View>
                <MessageCircle size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              query.length >= 2 && !loading ? (
                <Text style={styles.emptyNote}>No users found for "{query}"</Text>
              ) : null
            }
            style={{ maxHeight: 320 }}
          />
        </View>
      </View>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CHAT SCREEN (DM or Group)
// ══════════════════════════════════════════════════════════════════════════════
const ChatScreen = ({ type, target, currentUser, onBack }) => {
  // type: 'dm' | 'group'
  // target: user object (DM) or group object (group)
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const flatRef                   = useRef(null);
  const lastIdRef                 = useRef(0);
  const pollTimer                 = useRef(null);

  const isDM    = type === 'dm';
  const title   = isDM ? (target.full_name || target.username) : target.name;

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const data = isDM
        ? await api.getDMThread(target.id)
        : await api.getGroupMessages(target.id);
      setMessages(data);
      if (data.length > 0) lastIdRef.current = data[data.length - 1].id;
    } catch (_) {}
    finally { setLoading(false); }
  }, [isDM, target.id]);

  const poll = useCallback(async () => {
    try {
      const data = isDM
        ? await api.pollDM(target.id, lastIdRef.current)
        : await api.pollGroupMessages(target.id, lastIdRef.current);
      if (data.length > 0) {
        setMessages(prev => [...prev, ...data]);
        lastIdRef.current = data[data.length - 1].id;
      }
    } catch (_) {}
  }, [isDM, target.id]);

  useEffect(() => {
    fetchInitial();
    return () => clearInterval(pollTimer.current);
  }, [fetchInitial]);

  useEffect(() => {
    if (!loading) {
      // Start polling every 2.5 seconds
      pollTimer.current = setInterval(poll, 2500);
      return () => clearInterval(pollTimer.current);
    }
  }, [loading, poll]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatRef.current) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText('');
    setSending(true);

    // Optimistic message
    const optimistic = {
      id: `tmp_${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      sender:    isDM ? currentUser : undefined,
      author:    isDM ? undefined   : currentUser,
      is_read:   false,
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const saved = isDM
        ? await api.sendDM(target.id, content)
        : await api.sendGroupMessage(target.id, content);

      setMessages(prev => prev.map(m =>
        m.id === optimistic.id ? saved : m
      ));
      lastIdRef.current = saved.id;
    } catch (e) {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      Alert.alert('Failed to send', e.message);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = isDM
      ? item.sender?.id === currentUser.id
      : item.author?.id === currentUser.id;

    const msgUser = isDM ? item.sender : item.author;

    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <Avatar user={msgUser} size={28} />
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && !isDM && (
            <Text style={styles.bubbleSender}>
              {msgUser?.full_name || msgUser?.username}
            </Text>
          )}
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
            {timeAgo(item.created_at)}
            {item._optimistic ? ' · sending…' : ''}
          </Text>
        </View>
        {isMe && <View style={{ width: 28 }} />}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Avatar user={isDM ? target : null} name={isDM ? null : target.name} size={36} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.chatTitle} numberOfLines={1}>{title}</Text>
          {!isDM && (
            <Text style={styles.chatSubtitle}>{target.member_count || '?'} members</Text>
          )}
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => String(m.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>No messages yet.</Text>
              <Text style={styles.emptyChatSub}>Say hello! 👋</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Send size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN MESSAGES SCREEN
// ══════════════════════════════════════════════════════════════════════════════
const MessagesScreen = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab]         = useState('Direct');
  const [conversations, setConversations] = useState([]);
  const [myGroups, setMyGroups]           = useState([]);
  const [recommended, setRecommended]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [search, setSearch]               = useState('');

  // Navigation state — null means list, object means open chat
  const [openChat, setOpenChat]   = useState(null);  // { type, target }
  const [showNewDM, setShowNewDM] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [convos, groups] = await Promise.all([
        api.getDMConversations(),
        api.getMyGroupChats(),
      ]);
      setConversations(convos);
      setMyGroups(groups);

      // Fetch recommended if user has < 2 groups
      if (groups.length < 2) {
        const rec = await api.getRecommendedGroups();
        setRecommended(rec);
      } else {
        setRecommended([]);
      }
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Joining a recommended group ──────────────────────────────────────────
  const handleJoinGroup = async (group) => {
    try {
      await api.joinGroupChat(group.id);
      // Refresh lists
      fetchAll();
    } catch (e) {
      Alert.alert('Could not join', e.message);
    }
  };

  // ── Render DM row ────────────────────────────────────────────────────────
  const renderConversation = (item) => {
    const peer   = item.other_user;
    const isMe   = item.is_mine;
    return (
      <TouchableOpacity
        key={String(peer.id)}
        style={styles.convRow}
        activeOpacity={0.85}
        onPress={() => setOpenChat({ type: 'dm', target: peer })}
      >
        <View style={{ position: 'relative', marginRight: 14 }}>
          <Avatar user={peer} size={48} />
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.convTopRow}>
            <Text style={styles.convName}>{peer.full_name || peer.username}</Text>
            <Text style={styles.convTime}>{timeAgo(item.last_message_at)}</Text>
          </View>
          <Text style={styles.convPreview} numberOfLines={1}>
            {isMe ? 'You: ' : ''}{item.last_message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render Group row ─────────────────────────────────────────────────────
  const renderGroup = (item) => {
    const lastMsg = item.last_message;
    return (
      <TouchableOpacity
        key={String(item.id)}
        style={styles.convRow}
        activeOpacity={0.85}
        onPress={() => setOpenChat({ type: 'group', target: item })}
      >
        <View style={{ position: 'relative', marginRight: 14 }}>
          <View style={[styles.groupAvatar]}>
            <Text style={styles.groupAvatarText}>{item.name.slice(0, 2).toUpperCase()}</Text>
          </View>
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.convTopRow}>
            <Text style={styles.convName}>{item.name}</Text>
            <Text style={styles.convTime}>
              {lastMsg ? timeAgo(lastMsg.created_at) : ''}
            </Text>
          </View>
          <Text style={styles.convPreview} numberOfLines={1}>
            {lastMsg
              ? `${lastMsg.author}: ${lastMsg.content}`
              : `${item.member_count} members`
            }
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render Recommended Group card ────────────────────────────────────────
  const renderRecommended = (group) => (
    <View key={group.id} style={styles.recCard}>
      <View style={styles.recCardLeft}>
        <View style={styles.recAvatar}>
          <Text style={styles.recAvatarText}>{group.name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.recName} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.recDesc} numberOfLines={2}>{group.description || `${group.member_count} members`}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.joinBtn}
        onPress={() => handleJoinGroup(group)}
        activeOpacity={0.8}
      >
        <UserPlus size={14} color={colors.white} />
        <Text style={styles.joinBtnText}>Join</Text>
      </TouchableOpacity>
    </View>
  );

  // ── If a chat is open, render ChatScreen instead ─────────────────────────
  if (openChat) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <ChatScreen
          type={openChat.type}
          target={openChat.target}
          currentUser={currentUser}
          onBack={() => { setOpenChat(null); fetchAll(); }}
        />
      </SafeAreaView>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  const showRecommended = activeTab === 'Groups' && recommended.length > 0 && myGroups.length < 2;
  const isGroupsEmpty   = activeTab === 'Groups' && myGroups.length === 0;
  const isDMEmpty       = activeTab === 'Direct' && conversations.length === 0;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => activeTab === 'Direct' ? setShowNewDM(true) : setShowCreateGroup(true)}
        >
          <Plus size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBoxContainer}>
          <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            {t === 'Direct'
              ? <MessageCircle size={14} color={activeTab === t ? colors.white : colors.textSecondary} style={{ marginRight: 5 }} />
              : <Users size={14} color={activeTab === t ? colors.white : colors.textSecondary} style={{ marginRight: 5 }} />
            }
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAll(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* ── Recommended groups banner ── */}
          {showRecommended && (
            <View style={styles.recSection}>
              <View style={styles.recHeader}>
                <Users size={16} color={colors.primary} />
                <Text style={styles.recTitle}>Recommended Groups</Text>
              </View>
              <Text style={styles.recSubtitle}>Groups you might like — tap to join</Text>
              {recommended.map(renderRecommended)}
            </View>
          )}

          {/* ── Direct Messages list ── */}
          {activeTab === 'Direct' && (
            isDMEmpty ? (
              <View style={styles.emptyState}>
                <MessageCircle size={44} color={colors.primaryLight} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySub}>Tap + to start a conversation</Text>
              </View>
            ) : (
              conversations
              .filter(item => !search || (item.other_user.full_name || item.other_user.username || '').toLowerCase().includes(search.toLowerCase()))
              .map(item => renderConversation(item))
            )
          )}

          {/* ── Groups list ── */}
          {activeTab === 'Groups' && (
            isGroupsEmpty && !showRecommended ? (
              <View style={styles.emptyState}>
                <Users size={44} color={colors.primaryLight} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No groups yet</Text>
                <Text style={styles.emptySub}>Tap + to create one</Text>
              </View>
            ) : myGroups.length > 0 ? (
              <>
                {myGroups.length > 0 && (
                  <Text style={styles.sectionLabel}>My Groups</Text>
                )}
                {myGroups
                .filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()))
                .map(item => renderGroup(item))}
              </>
            ) : null
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <NewDMModal
        visible={showNewDM}
        onClose={() => setShowNewDM(false)}
        onSelect={(user) => setOpenChat({ type: 'dm', target: user })}
      />
      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(group) => {
          setMyGroups(prev => [group, ...prev]);
          setShowCreateGroup(false);
          setOpenChat({ type: 'group', target: group });
        }}
      />
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, paddingTop: 54,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  newBtn: {
    backgroundColor: colors.primary, width: 34, height: 34,
    borderRadius: 17, alignItems: 'center', justifyContent: 'center',
  },

  // Search
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.white },
  searchBoxContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBackground, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },

  // Tabs
  tabsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 8,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.inputBackground,
  },
  tabActive:     { backgroundColor: colors.primary },
  tabText:       { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.white, fontWeight: '700' },

  // Conversation rows
  convRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convName:    { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  convTime:    { fontSize: 11, color: colors.textMuted },
  convPreview: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  // Badge
  badge: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: colors.primary, minWidth: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: colors.white,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },

  // Group avatar
  groupAvatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  groupAvatarText: { color: colors.primary, fontWeight: '800', fontSize: 16 },

  // Section label
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.background,
  },

  // Recommended
  recSection: {
    margin: 16, backgroundColor: colors.white,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  recHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  recTitle:    { fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 7 },
  recSubtitle: { fontSize: 12, color: colors.textMuted, marginBottom: 14 },
  recCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  recCardLeft:   { flex: 1, flexDirection: 'row', alignItems: 'center' },
  recAvatar: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  recAvatarText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  recName:       { fontSize: 14, fontWeight: '700', color: colors.text },
  recDesc:       { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  joinBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },

  // Empty states
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textSecondary, marginTop: 14 },
  emptySub:   { fontSize: 13, color: colors.textMuted, marginTop: 6 },

  // ── Chat screen ──────────────────────────────────────────────────────────
  chatHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12, paddingTop: 54,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  backBtn:     { marginRight: 8, padding: 4 },
  chatTitle:   { fontSize: 16, fontWeight: '700', color: colors.text },
  chatSubtitle: { fontSize: 12, color: colors.textMuted },

  messageList: { padding: 16, paddingBottom: 20 },

  msgRow:   { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  msgRowMe: { justifyContent: 'flex-end' },

  bubble: {
    maxWidth: '72%', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 6,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem:    { borderBottomLeftRadius: 4 },
  bubbleSender:  { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  bubbleText:    { fontSize: 14, color: colors.text, lineHeight: 20 },
  bubbleTextMe:  { color: colors.white },
  bubbleTime:    { fontSize: 10, color: colors.textMuted, marginTop: 3, alignSelf: 'flex-end' },
  bubbleTimeMe:  { color: 'rgba(255,255,255,0.65)' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.divider,
    gap: 8,
  },
  chatInput: {
    flex: 1, backgroundColor: colors.inputBackground,
    borderRadius: 22, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 14, color: colors.text, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.textMuted },

  emptyChat:    { alignItems: 'center', paddingTop: 80 },
  emptyChatText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptyChatSub:  { fontSize: 13, color: colors.textMuted, marginTop: 6 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: colors.text },
  closeBtn:    { padding: 4 },
  fieldLabel:  { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 7, marginTop: 14 },
  input: {
    backgroundColor: colors.inputBackground, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 14, color: colors.text,
  },
  textArea:    { minHeight: 80, paddingTop: 12 },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 22,
  },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  errorBanner: {
    backgroundColor: '#FFF0F1', borderRadius: 10, borderWidth: 1,
    borderColor: colors.danger, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '500' },

  // User search rows
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBackground, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  userName:   { fontSize: 14, fontWeight: '700', color: colors.text },
  userHandle: { fontSize: 12, color: colors.textMuted },
  emptyNote:  { textAlign: 'center', color: colors.textMuted, paddingTop: 24, fontSize: 13 },
});

export default MessagesScreen;
