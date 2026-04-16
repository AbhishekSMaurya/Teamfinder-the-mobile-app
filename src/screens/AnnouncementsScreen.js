// src/screens/AnnouncementsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
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

// ── Sub-components ─────────────────────────────────────────────────────────
const TagChip = ({ label }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

const Card = ({ item }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.92}>
    <View style={styles.cardHeader}>
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      {item.attachment_url ? <Text style={styles.attachIcon}>🔗</Text> : null}
    </View>
    <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
    {item.tags?.length > 0 && (
      <View style={styles.tagsRow}>
        {item.tags.map((t, i) => <TagChip key={i} label={t} />)}
      </View>
    )}
    <View style={styles.cardFooter}>
      <Text style={styles.author}>
        {item.author?.full_name || item.author?.username || 'Unknown'}
      </Text>
      <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
    </View>
  </TouchableOpacity>
);

// ── Create Modal ───────────────────────────────────────────────────────────
const CreateModal = ({ visible, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle(''); setDescription('');
    setTagsInput(''); setAttachmentUrl('');
    setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Parse comma-separated tags into array
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => t.startsWith('#') ? t : `#${t}`);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        tags,
        ...(attachmentUrl.trim() ? { attachment_url: attachmentUrl.trim() } : {}),
      };

      const created = await api.createAnnouncement(payload);
      reset();
      onCreated(created);
    } catch (e) {
      setError(e.message || 'Failed to create announcement.');
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
            <Text style={styles.modalTitle}>New Announcement</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Hackathon Team Needed!"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what you're looking for..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="React, Node.js, Python"
              placeholderTextColor={colors.textMuted}
              value={tagsInput}
              onChangeText={setTagsInput}
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Attachment URL (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              value={attachmentUrl}
              onChangeText={setAttachmentUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.65 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={styles.submitBtnText}>Post Announcement</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────
const AnnouncementsScreen = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchAnnouncements = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await api.getAnnouncements();
      // DRF pagination returns { results: [...] }, handle both
      setAnnouncements(data.results ?? data);
    } catch (e) {
      setError(e.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleCreated = (newItem) => {
    setAnnouncements(prev => [newItem, ...prev]);
    setShowCreate(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={{ width: 30 }} />
        <Text style={styles.headerTitle}>Announcements</Text>
        <TouchableOpacity style={styles.plusBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={announcements}
        keyExtractor={i => String(i.id)}
        renderItem={({ item }) => <Card item={item} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAnnouncements(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No announcements yet.</Text>
            <Text style={styles.emptySubText}>Tap + to post one!</Text>
          </View>
        }
      />

      {/* FAB */}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.primary, marginTop: 20 },
  plusBtn: {
    backgroundColor: colors.primary, width: 30, height: 30,
    borderRadius: 15, alignItems: 'center', justifyContent: 'center',
  },
  plusText: { color: colors.white, fontSize: 22, fontWeight: '300', lineHeight: 28 },

  errorBanner: {
    backgroundColor: '#FFF0F1', borderRadius: 10, borderWidth: 1,
    borderColor: colors.danger, margin: 16,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '500' },

  card: {
    backgroundColor: colors.cardBackground, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, paddingRight: 8, lineHeight: 21 },
  attachIcon: { fontSize: 16, marginTop: 1 },
  desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  tag: { backgroundColor: colors.tagBackground, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 4 },
  tagText: { color: colors.tagText, fontSize: 12, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  time: { fontSize: 11, color: colors.textMuted },

  fab: {
    position: 'absolute', bottom: 28, right: 20,
    backgroundColor: colors.primary, width: 52, height: 52,
    borderRadius: 26, alignItems: 'center', justifyContent: 'center',
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
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 7, marginTop: 14 },
  input: {
    backgroundColor: colors.inputBackground, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 14, color: colors.text,
  },
  textArea: { minHeight: 100, paddingTop: 12 },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 8,
  },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

export default AnnouncementsScreen;
