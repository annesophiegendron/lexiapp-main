import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {useCaptures} from '../context/CaptureContext';
import {useTheme} from '../context/ThemeContext';

const REVIEW_ACTIONS = [
  {label: 'Again', quality: 1, icon: 'refresh-circle-outline'},
  {label: 'Hard', quality: 3, icon: 'flash-outline'},
  {label: 'Good', quality: 4, icon: 'checkmark-circle-outline'},
  {label: 'Easy', quality: 5, icon: 'rocket-outline'},
];

const formatRelativeReview = isoDate => {
  if (!isoDate) {
    return 'not scheduled';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'invalid date';
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DashboardScreen = () => {
  const {isDarkMode} = useTheme();
  const {
    dueRevisions,
    error,
    isRefreshingRevisions,
    isSubmitting,
    refreshRevisionData,
    reviewCapture,
    revisionStats,
  } = useCaptures();

  const surface = isDarkMode ? '#1b1f1d' : '#f4f1e8';
  const card = isDarkMode ? '#232826' : '#fffdf6';
  const border = isDarkMode ? '#334039' : '#d8cfbb';
  const text = isDarkMode ? '#f4f0e6' : '#1e241f';
  const muted = isDarkMode ? '#aeb9b0' : '#617064';
  const accent = isDarkMode ? '#d8c18d' : '#9a6a18';

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: surface}]}
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, {backgroundColor: card, borderColor: border}]}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={[styles.eyebrow, {color: accent}]}>PHASE 3</Text>
            <Text style={[styles.title, {color: text}]}>Revision cockpit</Text>
            <Text style={[styles.subtitle, {color: muted}]}>
              Follow due reviews, tag density, languages and formality distribution from backend captures.
            </Text>
          </View>
          <TouchableOpacity
            onPress={refreshRevisionData}
            disabled={isRefreshingRevisions}
            style={[styles.refreshButton, {borderColor: border}]}>
            {isRefreshingRevisions ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Ionicons name="sync-outline" size={18} color={accent} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          <MetricCard
            label="Captures"
            value={revisionStats.totalCaptures}
            icon="albums-outline"
            card={surface}
            text={text}
            muted={muted}
          />
          <MetricCard
            label="Reviewed"
            value={revisionStats.totalReviewedPhrases}
            icon="checkbox-outline"
            card={surface}
            text={text}
            muted={muted}
          />
          <MetricCard
            label="Due now"
            value={revisionStats.totalDueRevisions}
            icon="alarm-outline"
            card={surface}
            text={text}
            muted={muted}
          />
          <MetricCard
            label="Scheduled"
            value={revisionStats.totalScheduledRevisions}
            icon="calendar-outline"
            card={surface}
            text={text}
            muted={muted}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: text}]}>Due revisions</Text>
        {dueRevisions.length === 0 ? (
          <EmptyState
            card={card}
            border={border}
            text={text}
            muted={muted}
            message="No capture is due right now."
          />
        ) : (
          dueRevisions.map(capture => (
            <View
              key={capture.id}
              style={[styles.reviewCard, {backgroundColor: card, borderColor: border}]}>
              <Text style={[styles.reviewOriginal, {color: text}]}>
                {capture.original}
              </Text>
              <Text style={[styles.reviewMeta, {color: muted}]}>
                {capture.translation || 'No translation'} • {capture.formality} • {capture.language}
              </Text>
              <Text style={[styles.reviewMeta, {color: muted}]}>
                Tags: {capture.tags.length > 0 ? capture.tags.join(', ') : 'none'}
              </Text>
              <Text style={[styles.reviewMeta, {color: muted}]}>
                Last review: {formatRelativeReview(capture.reviewSrs.lastReviewAt)}
              </Text>
              <View style={styles.actionsRow}>
                {REVIEW_ACTIONS.map(action => (
                  <TouchableOpacity
                    key={action.label}
                    disabled={isSubmitting}
                    onPress={() => reviewCapture(capture.id, action.quality)}
                    style={[styles.actionButton, {borderColor: border}]}>
                    <Ionicons name={action.icon} size={16} color={accent} />
                    <Text style={[styles.actionLabel, {color: text}]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: text}]}>Signals</Text>
        <View style={styles.signalGrid}>
          <BreakdownCard
            title="Top tags"
            items={revisionStats.topTags.map(item => ({
              label: item.tag,
              value: item.total,
            }))}
            card={card}
            border={border}
            text={text}
            muted={muted}
          />
          <BreakdownCard
            title="Languages"
            items={revisionStats.languageBreakdown.map(item => ({
              label: item.key,
              value: item.total,
            }))}
            card={card}
            border={border}
            text={text}
            muted={muted}
          />
          <BreakdownCard
            title="Formalities"
            items={revisionStats.formalityBreakdown.map(item => ({
              label: item.key,
              value: item.total,
            }))}
            card={card}
            border={border}
            text={text}
            muted={muted}
          />
        </View>
      </View>

      {error ? (
        <Text style={[styles.errorText, {color: '#b43f2f'}]}>{error}</Text>
      ) : null}
    </ScrollView>
  );
};

const MetricCard = ({label, value, icon, card, text, muted}) => (
  <View style={[styles.metricCard, {backgroundColor: card}]}>
    <Ionicons name={icon} size={18} color={muted} />
    <Text style={[styles.metricValue, {color: text}]}>{value}</Text>
    <Text style={[styles.metricLabel, {color: muted}]}>{label}</Text>
  </View>
);

const BreakdownCard = ({title, items, card, border, text, muted}) => (
  <View style={[styles.breakdownCard, {backgroundColor: card, borderColor: border}]}>
    <Text style={[styles.breakdownTitle, {color: text}]}>{title}</Text>
    {items.length === 0 ? (
      <Text style={[styles.breakdownItemLabel, {color: muted}]}>No data yet</Text>
    ) : (
      items.map(item => (
        <View key={`${title}-${item.label}`} style={styles.breakdownRow}>
          <Text style={[styles.breakdownItemLabel, {color: muted}]}>
            {item.label}
          </Text>
          <Text style={[styles.breakdownItemValue, {color: text}]}>
            {item.value}
          </Text>
        </View>
      ))
    )}
  </View>
);

const EmptyState = ({card, border, text, muted, message}) => (
  <View style={[styles.emptyCard, {backgroundColor: card, borderColor: border}]}>
    <Ionicons name="leaf-outline" size={22} color={muted} />
    <Text style={[styles.emptyText, {color: text}]}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 18,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    minWidth: '47%',
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    gap: 6,
  },
  reviewOriginal: {
    fontSize: 18,
    fontWeight: '700',
  },
  reviewMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  signalGrid: {
    gap: 10,
  },
  breakdownCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  breakdownItemLabel: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  breakdownItemValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default DashboardScreen;
