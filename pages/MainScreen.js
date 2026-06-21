import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import QuizImage from '../assets/images/brazuca.png';
import {useLexicon} from '../context/LexiconContext';
import {useTheme} from '../context/ThemeContext';
import {useCaptures} from '../context/CaptureContext';
import AddWordScreen from './AddWordScreen';
import CaptureMomentScreen from './CaptureMomentScreen';

import {designSystem} from '../design';
import {categoryIcons, categoryColorsLight} from '../constants.js';

const lireResumeEtapeIa = etapeIa => {
  if (!etapeIa) {
    return 'etat inconnu';
  }

  const detail = etapeIa.detail ? ` - ${etapeIa.detail}` : '';

  if (etapeIa.statut === 'fallback') {
    return `fallback${etapeIa.modele ? ` via ${etapeIa.modele}` : ''}${detail}`;
  }

  return `${etapeIa.statut}${etapeIa.modele ? ` via ${etapeIa.modele}` : ''}${detail}`;
};

const lireCouleurAnalyse = (isDarkMode, statutAnalyse) => {
  if (statutAnalyse === 'fallback') {
    return isDarkMode ? '#f7c97a' : '#8a5400';
  }

  if (statutAnalyse === 'ok') {
    return isDarkMode ? '#c7f0c2' : '#1d5f2f';
  }

  return isDarkMode ? '#d8d8d8' : '#4d5e4d';
};

const lireCouleurBackend = (isDarkMode, status) => {
  if (status === 'ok') {
    return isDarkMode ? '#c7f0c2' : '#1d5f2f';
  }

  if (status === 'warning' || status === 'degraded') {
    return isDarkMode ? '#f7c97a' : '#8a5400';
  }

  return isDarkMode ? '#f2b8b5' : '#a12622';
};

const MainScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [captureModalVisible, setCaptureModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();
  const {lexicon} = useLexicon();
  const {captures, isLoading, refreshCaptures, backendStatus, refreshBackendStatus} = useCaptures();
  const {isDarkMode} = useTheme();
  const {
    backgroundLight,
    backgroundDark,
    cardBackgroundLight,
    cardBackgroundDark,
    textLight,
    textDark,
  } = designSystem.colors;

  const fermerModal = () => setModalVisible(false);
  const fermerModalCapture = () => setCaptureModalVisible(false);

  const filteredItems = lexicon.filter(item => {
    const matchesSearch =
      item.original.toLowerCase().includes(searchText.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const allerVersMotsCategorie = category => {
    const filteredWords = lexicon.filter(word =>
      Array.isArray(word.categories) && word.categories.includes(category),
    );
    navigation.navigate('CategoryWords', {category, words: filteredWords});
  };

  const allerVersQuiz = () => {
    navigation.navigate('QuizzScreen');
  };

  const latestCapture = captures[0];
  const statutAnalyse = latestCapture?.pipelineIa?.analyse?.statut;
  const couleurAnalyse = lireCouleurAnalyse(isDarkMode, statutAnalyse);
  const couleurBackend = lireCouleurBackend(isDarkMode, backendStatus.health.status);
  const nombreChecksEnErreur = backendStatus.preflight.checks.filter(
    check => check.statut === 'FAIL',
  ).length;

  return (
    <ScrollView
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? backgroundDark : backgroundLight},
      ]}
      contentContainerStyle={{paddingBottom: 40}}>
      {/* Date Header */}
      <View style={styles.dateContainer}>
        <Text style={[styles.dateText, {color: isDarkMode ? '#AAA' : '#666'}]}>
          {new Date().getDate()}{' '}
          {new Date().toLocaleString('en-US', {month: 'long'})}
        </Text>
        <Text
          style={[
            styles.weekdayText,
            {color: isDarkMode ? textLight : textDark},
          ]}>
          {new Date().toLocaleString('en-US', {weekday: 'long'})}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: isDarkMode ? '#333' : '#F0F0F0',
            },
          ]}>
          <Ionicons
            name="search"
            size={20}
            color={isDarkMode ? '#aaa' : '#666'}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchBar,
              {
                color: isDarkMode ? textLight : textDark,
              },
            ]}
            placeholder="Search a word or phrase"
            placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {searchText.length > 0 && (
          <View
            style={[
              styles.dropdown,
              {backgroundColor: isDarkMode ? cardBackgroundDark : '#fff'},
            ]}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() =>
                    navigation.navigate('WordDetail', {word: item})
                  }>
                  <Text style={{color: isDarkMode ? textLight : textDark}}>
                    {item.original} -> {item.translation}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text
                style={{padding: 10, color: isDarkMode ? textLight : textDark}}>
                No results found.
              </Text>
            )}
          </View>
        )}
      </View>
      {/* Quiz Section */}
      <TouchableOpacity
        style={[
          styles.captureCard,
          {backgroundColor: isDarkMode ? '#1f2520' : '#edf5ea'},
        ]}
        onPress={() => setCaptureModalVisible(true)}>
        <View style={styles.captureCardHeader}>
          <View>
            <Text
              style={[
                styles.captureCardTitle,
                {color: isDarkMode ? textLight : '#172217'},
              ]}>
              Voice Capture Pipeline
            </Text>
            <Text
              style={[
                styles.captureCardSubtitle,
                {color: isDarkMode ? '#b9c7b7' : '#466046'},
              ]}>
              Record, upload, transcribe and classify a phrase locally.
            </Text>
          </View>
          <Ionicons
            name="mic-circle-outline"
            size={34}
            color={isDarkMode ? '#d7f5d3' : '#234223'}
          />
        </View>

        <View style={styles.captureMetaRow}>
          <Text style={[styles.captureMetaText, {color: isDarkMode ? '#fff' : '#172217'}]}>
            {isLoading ? 'Loading backend captures...' : `${captures.length} capture(s) synced`}
          </Text>
          <TouchableOpacity
            onPress={() => {
              refreshCaptures();
              refreshBackendStatus();
            }}>
            <Text style={[styles.captureRefreshText, {color: isDarkMode ? '#d7f5d3' : '#234223'}]}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.backendStatusCard}>
          <View style={styles.pipelineRow}>
            <View style={[styles.pipelineBadge, {borderColor: couleurBackend}]}>
              <Text style={[styles.pipelineBadgeText, {color: couleurBackend}]}>
                Backend: {backendStatus.health.status}
              </Text>
            </View>
            <View style={styles.pipelineBadgeSecondary}>
              <Text style={styles.pipelineBadgeSecondaryText}>
                Preflight: {backendStatus.preflight.status}
              </Text>
            </View>
          </View>
          <Text style={[styles.backendStatusText, {color: isDarkMode ? '#d8e1d8' : '#314231'}]}>
            {backendStatus.health.message}
          </Text>
          <Text style={[styles.backendStatusMeta, {color: isDarkMode ? '#b9c7b7' : '#4d5e4d'}]}>
            {backendStatus.preflight.message}
          </Text>
          <Text style={[styles.backendStatusMeta, {color: isDarkMode ? '#b9c7b7' : '#4d5e4d'}]}>
            {nombreChecksEnErreur > 0
              ? `${nombreChecksEnErreur} preflight check(s) en echec`
              : 'Aucun echec preflight bloquant'}
          </Text>
        </View>

        {latestCapture ? (
          <View style={styles.latestCaptureCard}>
            <Text style={[styles.latestCaptureTitle, {color: isDarkMode ? textLight : textDark}]}>
              Latest result
            </Text>
            <Text style={[styles.latestCaptureText, {color: isDarkMode ? '#d8d8d8' : '#2e2e2e'}]}>
              {latestCapture.original}
            </Text>
            <Text style={[styles.latestCaptureMeta, {color: isDarkMode ? '#aab7aa' : '#4d5e4d'}]}>
              {latestCapture.translation || 'No translation yet'} - {latestCapture.formality}
            </Text>
            <View style={styles.pipelineRow}>
              <View style={[styles.pipelineBadge, {borderColor: couleurAnalyse}]}>
                <Text style={[styles.pipelineBadgeText, {color: couleurAnalyse}]}>
                  Analyse: {lireResumeEtapeIa(latestCapture.pipelineIa?.analyse)}
                </Text>
              </View>
              <View style={styles.pipelineBadgeSecondary}>
                <Text style={styles.pipelineBadgeSecondaryText}>
                  Transcription: {lireResumeEtapeIa(latestCapture.pipelineIa?.transcription)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.quizCard,
          {backgroundColor: isDarkMode ? '#2a2a2a' : '#f4f4f4'},
        ]}
        onPress={allerVersQuiz}>
        <Image
          source={QuizImage}
          style={styles.quizImage}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.quizTitle,
              {color: isDarkMode ? textLight : '#1a1a1a'},
            ]}>
            Daily Challenge
          </Text>
          <Text
            style={[
              styles.quizSubtitle,
              {color: isDarkMode ? '#bbb' : '#555'},
            ]}>
            Test your memory and track your progress.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Categories */}
      <Text
        style={[
          styles.sectionTitle,
          {color: isDarkMode ? textLight : textDark},
        ]}>
        Browse by Category
      </Text>
      <View style={styles.categoriesContainer}>
        {Object.keys(categoryIcons).map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryCard,
              {
                backgroundColor:
                  categoryColorsLight[category] ||
                  (isDarkMode ? cardBackgroundDark : cardBackgroundLight),
              },
            ]}
            onPress={() => allerVersMotsCategorie(category)}>
            <Ionicons
              name={categoryIcons[category]}
              size={34}
              color={isDarkMode ? textLight : '#444'}
            />
            <Text
              style={[
                styles.categoryText,
                {color: isDarkMode ? textLight : textDark},
              ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Word Modal */}
      <AddWordScreen isVisible={modalVisible} onClose={fermerModal} />
      <CaptureMomentScreen
        isVisible={captureModalVisible}
        onClose={fermerModalCapture}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  weekdayText: {
    fontSize: 28,
    fontWeight: '600',
  },
  searchWrapper: {
    marginBottom: 20,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    elevation: 2,
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    elevation: 4,
    padding: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  captureCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    gap: 14,
  },
  captureCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  captureCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  captureCardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 250,
  },
  captureMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  captureMetaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  captureRefreshText: {
    fontSize: 13,
    fontWeight: '700',
  },
  latestCaptureCard: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 16,
    padding: 14,
  },
  backendStatusCard: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  latestCaptureTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  latestCaptureText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  latestCaptureMeta: {
    fontSize: 13,
  },
  backendStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backendStatusMeta: {
    fontSize: 13,
  },
  pipelineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  pipelineBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  pipelineBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pipelineBadgeSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(23,34,23,0.16)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  pipelineBadgeSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334133',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryCard: {
    width: '30%',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  quizCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
    minHeight: 180,
    marginBottom: 20,
  },

  quizImage: {
    width: 160,
    height: 160,
  },

  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  quizTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
    flexWrap: 'wrap',
  },

  quizSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
});

export default MainScreen;
