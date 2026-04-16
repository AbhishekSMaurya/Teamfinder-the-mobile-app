import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Tag from './Tag';
import colors from '../styles/colors';

const AnnouncementCard = ({ announcement, onPress }) => {
  const { title, description, tags = [], timeAgo, hasAttachment } = announcement;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {hasAttachment && (
          <Text style={styles.attachmentIcon}>🔗</Text>
        )}
      </View>

      <Text style={styles.description} numberOfLines={2}>{description}</Text>

      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag, index) => (
            <Tag key={index} label={tag} />
          ))}
        </View>
      )}

      <Text style={styles.timeAgo}>{timeAgo}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    paddingRight: 8,
    lineHeight: 21,
  },
  attachmentIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  timeAgo: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
  },
});

export default AnnouncementCard;
