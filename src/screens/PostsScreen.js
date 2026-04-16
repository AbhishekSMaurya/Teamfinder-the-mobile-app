// src/screens/PostsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import api from '../services/api';
import colors from '../styles/colors';

// ── Helpers ────────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const getInitials = (user) => {
  if (!user) return '??';
  if (user.initials) return user.initials;
  const name = user.full_name || user.username || '';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const FILTERS = ['All Posts', 'My Posts', 'Drafts'];
const POST_TYPES = ['discussion', 'article', 'question', 'update'];

// ── Sub-components ─────────────────────────────────────────────────────────
const Avatar = ({ user, size = 36 }) => (
  <View style={{
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  }}>
    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: size * 0.36 }}>
      {getInitials(user)}
    </Text>
  </View>
);

const TagChip = ({ label }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

const PostCard = ({ post, currentUserId, onLikeToggle }) => {
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : c - 1);
    try {
      await api.likePost(post.id);
    } catch (_) {
      // Revert on failure
      setLiked(!newLiked);
      setLikeCount(c => newLiked ? c - 1 : c + 1);
    } finally {
      setLiking(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar user={post.author} />
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>
            {post.author?.full_name || post.author?.username || 'Unknown'}
          </Text>
          <Text style={styles.timeAgo}>{timeAgo(post.created_at)}</Text>
        </View>
        {post.post_type !== 'discussion' && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{post.post_type}</Text>
          </View>
        )}
      </View>

      <Text style={styles.content} numberOfLines={3}>{post.content}</Text>

      {post.tags?.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.map((tag, i) => <TagChip key={i} label={tag} />)}
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} disabled={liking}>
          <Text style={styles.actionIcon}>{liked ? '❤️' : '🤍'}</Text>
          <Text style={styles.actionText}>{likeCount} likes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{post.comment_count} comments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Create Modal ───────────────────────────────────────────────────────────
const CreateModal = ({ visible, onClose, onCreated }) => {
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [postType, setPostType] = useState('discussion');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setContent(''); setTagsInput(''); setPostType('discussion'); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!content.trim()) { setError('Post content is required.'); return; }
    setSaving(true); setError('');
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
        .map(t => t.startsWith('#') ? t : `#${t}`);
      const created = await api.createPost({ content: content.trim(), tags, post_type: postType });
      reset();
      onCreated(created);
    } catch (e) {
      setError(e.message || 'Failed to create post.');
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
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {POST_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, postType === t && styles.typeChipActive]}
                  onPress={() => setPostType(t)}
                >
                  <Text style={[styles.typeChipText, postType === t && styles.typeChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>What's on your mind? *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share something with the community..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="React, Python, Design"
              placeholderTextColor={colors.textMuted}
              value={tagsInput}
              onChangeText={setTagsInput}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.65 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={styles.submitBtnText}>Publish Post</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────
const PostsScreen = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All Posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [all, mine] = await Promise.all([
        api.getPosts(),
        api.getMyPosts(),
      ]);
      setAllPosts(all.results ?? all);
      setMyPosts(mine.results ?? mine);
    } catch (e) {
      setError(e.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleCreated = (newPost) => {
    setAllPosts(prev => [newPost, ...prev]);
    setMyPosts(prev => [newPost, ...prev]);
    setShowCreate(false);
  };

  const displayData = () => {
    if (activeFilter === 'My Posts') return myPosts;
    if (activeFilter === 'Drafts') return allPosts.filter(p => p.is_draft);
    return allPosts;
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Posts</Text>
        <TouchableOpacity style={styles.headerPlus} onPress={() => setShowCreate(true)}>
          <Text style={styles.headerPlusText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

      <FlatList
        data={displayData()}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPosts(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts yet.</Text>
            <Text style={styles.emptySubText}>Tap + to write the first one!</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <CreateModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.primary, marginTop: 20 },
  headerPlus: {
    position: 'absolute', right: 16,
    backgroundColor: colors.primary, width: 30, height: 30,
    borderRadius: 15, alignItems: 'center', justifyContent: 'center',
  },
  headerPlusText: { color: colors.white, fontSize: 22, fontWeight: '300', lineHeight: 28 },

  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 8,
  },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.inputBackground },
  filterTabActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: colors.white, fontWeight: '700' },

  errorBanner: {
    backgroundColor: '#FFF0F1', borderRadius: 10, borderWidth: 1,
    borderColor: colors.danger, margin: 16, paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '500' },

  card: {
    backgroundColor: colors.cardBackground, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  authorName: { fontSize: 14, fontWeight: '700', color: colors.text },
  timeAgo: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  typeBadge: {
    backgroundColor: colors.primaryLight, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 10, color: colors.primary, fontWeight: '700', textTransform: 'capitalize' },
  content: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  tag: { backgroundColor: colors.tagBackground, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 4 },
  tagText: { color: colors.tagText, fontSize: 12, fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 10, gap: 16,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 15 },
  actionText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

  fab: {
    position: 'absolute', bottom: 28, right: 20,
    backgroundColor: colors.primary, width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: colors.white, fontSize: 26, fontWeight: '400', lineHeight: 30, marginTop: -2 },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptySubText: { fontSize: 13, color: colors.textMuted, marginTop: 6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 16, color: colors.textMuted },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.inputBackground },
  typeChipActive: { backgroundColor: colors.primary },
  typeChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', textTransform: 'capitalize' },
  typeChipTextActive: { color: colors.white, fontWeight: '700' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 7, marginTop: 14 },
  input: {
    backgroundColor: colors.inputBackground, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 14, color: colors.text,
  },
  textArea: { minHeight: 120, paddingTop: 12 },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 8,
  },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

export default PostsScreen;
