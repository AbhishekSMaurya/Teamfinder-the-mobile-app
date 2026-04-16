// src/screens/ProjectsScreen.js
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

const STATUS_LABELS = { active: 'Active', open: 'Open', completed: 'Done', archived: 'Archived' };
const STATUS_COLORS = {
  active: colors.primary,
  open: colors.success,
  completed: colors.textMuted,
  archived: colors.textMuted,
};

const FILTERS = ['My Projects', 'All Projects'];

// ── Sub-components ─────────────────────────────────────────────────────────
const TagChip = ({ label }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

const ProjectCard = ({ project }) => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <Text style={styles.projectName}>{project.name}</Text>
      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[project.status] + '22' }]}>
        <Text style={[styles.statusText, { color: STATUS_COLORS[project.status] }]}>
          {STATUS_LABELS[project.status] || project.status}
        </Text>
      </View>
    </View>

    {project.description ? (
      <Text style={styles.projectDesc} numberOfLines={2}>{project.description}</Text>
    ) : null}

    <View style={styles.progressRow}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{project.progress}%</Text>
    </View>

    <View style={styles.cardFooter}>
      <Text style={styles.teamText}>
        👥 {project.team_name || 'No team'} · {project.team_member_count ?? 0} members
      </Text>
      <Text style={styles.timeText}>{timeAgo(project.created_at)}</Text>
    </View>

    {project.tags?.length > 0 && (
      <View style={styles.tagsRow}>
        {project.tags.map((t, i) => <TagChip key={i} label={t} />)}
      </View>
    )}
  </View>
);

// ── Create Project Modal ───────────────────────────────────────────────────
// Projects require a team_id. This modal lets the user either pick an
// existing team they belong to, or create a new team on the spot.
const CreateModal = ({ visible, onClose, onCreated }) => {
  const [step, setStep] = useState('project'); // 'project' | 'newteam'
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  // Project fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [progress, setProgress] = useState('0');
  const [status, setStatus] = useState('active');

  // New team fields
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStep('project'); setName(''); setDescription('');
    setTagsInput(''); setProgress('0'); setStatus('active');
    setSelectedTeamId(null); setTeamName(''); setTeamDesc('');
    setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  // Load user's teams when modal opens
  useEffect(() => {
    if (!visible) return;
    setLoadingTeams(true);
    api.getMyTeams()
      .then(data => {
        const list = data.results ?? data;
        setTeams(list);
        if (list.length > 0) setSelectedTeamId(list[0].id);
      })
      .catch(() => setTeams([]))
      .finally(() => setLoadingTeams(false));
  }, [visible]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) { setError('Team name is required.'); return; }
    setSaving(true); setError('');
    try {
      const newTeam = await api.createTeam({ name: teamName.trim(), description: teamDesc.trim() });
      setTeams(prev => [newTeam, ...prev]);
      setSelectedTeamId(newTeam.id);
      setStep('project');
      setTeamName(''); setTeamDesc('');
    } catch (e) {
      setError(e.message || 'Failed to create team.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Project name is required.'); return; }
    if (!selectedTeamId) { setError('Please select or create a team first.'); return; }
    const prog = parseInt(progress, 10);
    if (isNaN(prog) || prog < 0 || prog > 100) { setError('Progress must be 0–100.'); return; }

    setSaving(true); setError('');
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
        .map(t => t.startsWith('#') ? t : `#${t}`);
      const created = await api.createProject({
        name: name.trim(),
        description: description.trim(),
        team: selectedTeamId,
        progress: prog,
        status,
        tags,
      });
      reset();
      onCreated(created);
    } catch (e) {
      setError(e.message || 'Failed to create project.');
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
            <Text style={styles.modalTitle}>
              {step === 'newteam' ? 'Create a Team' : 'New Project'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

            {step === 'newteam' ? (
              // ── New Team form ──
              <>
                <Text style={styles.fieldLabel}>Team Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Alpha Squad"
                  placeholderTextColor={colors.textMuted}
                  value={teamName}
                  onChangeText={setTeamName}
                />
                <Text style={styles.fieldLabel}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What is this team working on?"
                  placeholderTextColor={colors.textMuted}
                  value={teamDesc}
                  onChangeText={setTeamDesc}
                  multiline
                  textAlignVertical="top"
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
                  <TouchableOpacity
                    style={[styles.submitBtn, { flex: 1, backgroundColor: colors.inputBackground }]}
                    onPress={() => { setStep('project'); setError(''); }}
                  >
                    <Text style={[styles.submitBtnText, { color: colors.textSecondary }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, { flex: 2 }, saving && { opacity: 0.65 }]}
                    onPress={handleCreateTeam}
                    disabled={saving}
                  >
                    {saving
                      ? <ActivityIndicator color={colors.white} size="small" />
                      : <Text style={styles.submitBtnText}>Create Team</Text>
                    }
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // ── Project form ──
              <>
                {/* Team picker */}
                <Text style={styles.fieldLabel}>Team *</Text>
                {loadingTeams ? (
                  <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
                ) : (
                  <>
                    {teams.length === 0 ? (
                      <Text style={styles.noTeamText}>You have no teams yet.</Text>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        {teams.map(t => (
                          <TouchableOpacity
                            key={t.id}
                            style={[styles.teamChip, selectedTeamId === t.id && styles.teamChipActive]}
                            onPress={() => setSelectedTeamId(t.id)}
                          >
                            <Text style={[styles.teamChipText, selectedTeamId === t.id && styles.teamChipTextActive]}>
                              {t.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                    <TouchableOpacity onPress={() => { setStep('newteam'); setError(''); }}>
                      <Text style={styles.createTeamLink}>+ Create new team</Text>
                    </TouchableOpacity>
                  </>
                )}

                <Text style={styles.fieldLabel}>Project Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Project Alpha: Sustainable Tech"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What is this project about?"
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />

                <Text style={styles.fieldLabel}>Tags (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="IoT, Python, React"
                  placeholderTextColor={colors.textMuted}
                  value={tagsInput}
                  onChangeText={setTagsInput}
                  autoCapitalize="none"
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Progress (0-100)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      value={progress}
                      onChangeText={setProgress}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Status</Text>
                    <View style={styles.statusRow}>
                      {['active', 'open'].map(s => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.statusChip, status === s && styles.statusChipActive]}
                          onPress={() => setStatus(s)}
                        >
                          <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>
                            {s}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, saving && { opacity: 0.65 }]}
                  onPress={handleSubmit}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color={colors.white} size="small" />
                    : <Text style={styles.submitBtnText}>Create Project</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────
const ProjectsScreen = () => {
  const [myProjects, setMyProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [activeFilter, setActiveFilter] = useState('My Projects');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [mine, all] = await Promise.all([
        api.getMyProjects(),
        api.getAllProjects(),
      ]);
      setMyProjects(mine.results ?? mine);
      setAllProjects(all.results ?? all);
    } catch (e) {
      setError(e.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreated = (newProject) => {
    setMyProjects(prev => [newProject, ...prev]);
    setAllProjects(prev => [newProject, ...prev]);
    setShowCreate(false);
  };

  const displayData = activeFilter === 'My Projects' ? myProjects : allProjects;

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <TouchableOpacity style={styles.plusBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.plusText}>+</Text>
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
        data={displayData}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <ProjectCard project={item} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProjects(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No projects yet.</Text>
            <Text style={styles.emptySubText}>Tap + to create one!</Text>
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
  plusBtn: {
    position: 'absolute', right: 16,
    backgroundColor: colors.primary, width: 30, height: 30,
    borderRadius: 15, alignItems: 'center', justifyContent: 'center',
  },
  plusText: { color: colors.white, fontSize: 22, fontWeight: '300', lineHeight: 28 },

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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  projectName: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, lineHeight: 21, paddingRight: 8 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  projectDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  progressTrack: { flex: 1, height: 6, backgroundColor: colors.progressBarBackground, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, minWidth: 36, textAlign: 'right' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  teamText: { fontSize: 12, color: colors.textSecondary },
  timeText: { fontSize: 11, color: colors.textMuted },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: colors.tagBackground, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 4 },
  tagText: { color: colors.tagText, fontSize: 12, fontWeight: '600' },

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
    padding: 24, maxHeight: '92%',
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
  textArea: { minHeight: 90, paddingTop: 12 },
  noTeamText: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  createTeamLink: { fontSize: 13, color: colors.primary, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  teamChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.inputBackground, marginRight: 8 },
  teamChipActive: { backgroundColor: colors.primary },
  teamChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  teamChipTextActive: { color: colors.white, fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 7 },
  statusChip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.inputBackground, alignItems: 'center' },
  statusChipActive: { backgroundColor: colors.primary },
  statusChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', textTransform: 'capitalize' },
  statusChipTextActive: { color: colors.white, fontWeight: '700' },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 8,
  },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

export default ProjectsScreen;
