import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';

const WordDetailScreen = ({route, navigation}) => {
  const {isDarkMode} = useTheme();
  const word = route?.params?.word;

  const backgroundColor = isDarkMode ? '#121212' : '#f6f3ea';
  const cardColor = isDarkMode ? '#1f1f1f' : '#ffffff';
  const textColor = isDarkMode ? '#f3f3f3' : '#1f1f1f';
  const mutedColor = isDarkMode ? '#b7b7b7' : '#5f5f5f';

  if (!word) {
    return (
      <View style={[styles.container, {backgroundColor}]}>
        <Text style={[styles.emptyTitle, {color: textColor}]}>
          Word not found
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, {backgroundColor}]}
      contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={[styles.backChip, {borderColor: mutedColor}]}
        onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color={textColor} />
        <Text style={[styles.backChipText, {color: textColor}]}>Back</Text>
      </TouchableOpacity>

      <View style={[styles.card, {backgroundColor: cardColor}]}>
        <Text style={[styles.label, {color: mutedColor}]}>Original</Text>
        <Text style={[styles.original, {color: textColor}]}>{word.original}</Text>

        <Text style={[styles.label, {color: mutedColor}]}>Translation</Text>
        <Text style={[styles.translation, {color: textColor}]}>
          {word.translation}
        </Text>

        <Text style={[styles.label, {color: mutedColor}]}>Categories</Text>
        <View style={styles.tagRow}>
          {(word.categories || ['Wild Card']).map(category => (
            <View key={category} style={styles.tag}>
              <Text style={styles.tagText}>{category}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  backChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  original: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  translation: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#d7d0fd',
  },
  tagText: {
    color: '#1f1f1f',
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default WordDetailScreen;
