import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useLexicon} from '../context/LexiconContext';
import {categoryColors, categories} from '../constants.js';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MAX_CHARACTERS = 80;

const AddWordScreen = ({isVisible, onClose, selectedCategory}) => {
  const [original, setOriginal] = useState('');
  const [category, setCategory] = useState(selectedCategory);

  const [translation, setTranslation] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const {addWord, lexicon} = useLexicon();

  const [selectedCategories, setSelectedCategories] = useState(
    Array.isArray(selectedCategory) && selectedCategory.length > 0
      ? selectedCategory
      : [],
  );

  useEffect(() => {
    setSelectedCategories(
      Array.isArray(selectedCategory) && selectedCategory.length > 0
        ? selectedCategory
        : [],
    );
  }, [selectedCategory]);

  useEffect(() => {
    console.log('Selected category updated:', selectedCategory);
    setCategory(selectedCategory);
  }, [selectedCategory]);
  const saveWord = () => {
    if (!original || !translation || selectedCategories.length === 0) {
      setError(true);
      setErrorMessage(
        selectedCategories.length === 0
          ? 'Please add at least one tag.'
          : 'All fields are required.',
      );
      return;
    }

    const isDuplicate = lexicon.some(
      word => word.original.toLowerCase() === original.toLowerCase(),
    );

    if (isDuplicate) {
      Alert.alert(
        'Duplicate Word',
        'This word already exists in your lexicon.',
      );
      return;
    }

    const validCategories = selectedCategories.filter(cat => cat);
    addWord(original, translation, validCategories);
    setOriginal('');
    setTranslation('');
    setSelectedCategories([]);
    setError(false);
    setErrorMessage('');
    onClose();
  };

  const toggleCategory = category => {
    setSelectedCategories(
      prevCategories =>
        prevCategories.includes(category)
          ? prevCategories.filter(cat => cat !== category) // Remove category if already selected
          : [...prevCategories, category], // Add category if not already selected
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalContainer}
        activeOpacity={1}
        onPress={onClose}>
        <KeyboardAvoidingView
          style={styles.modalContent}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View
            style={styles.modalContent}
            onTouchEnd={e => e.stopPropagation()}>
            <View style={styles.imagePlaceholder}>
              <Ionicons name="create-outline" size={80} color="#fff" />
            </View>

            <Text style={styles.title}>Add Translation</Text>
            <Text style={styles.subtitle}>Pick at least one tag</Text>

            <View style={styles.buttonGrid}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: selectedCategories.includes(cat)
                        ? categoryColors[cat]
                        : '#ddd',
                    },
                  ]}
                  onPress={() => toggleCategory(cat)}>
                  <Text style={styles.categoryButtonText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View>
              <TextInput
                style={[
                  styles.input,
                  error && !original ? styles.errorInput : null,
                ]}
                placeholder="Enter word"
                value={original}
                onChangeText={text =>
                  setOriginal(text.slice(0, MAX_CHARACTERS))
                }
                maxLength={MAX_CHARACTERS}
              />
              <Text style={styles.charCount}>
                {original.length}/{MAX_CHARACTERS}
              </Text>
            </View>

            <View>
              <TextInput
                style={[
                  styles.input,
                  error && !translation ? styles.errorInput : null,
                ]}
                placeholder="Enter translation"
                value={translation}
                onChangeText={text =>
                  setTranslation(text.slice(0, MAX_CHARACTERS))
                }
                maxLength={MAX_CHARACTERS}
              />
              <Text style={styles.charCount}>
                {translation.length}/{MAX_CHARACTERS}
              </Text>
            </View>

            {error && selectedCategories.length === 0 && (
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={saveWord}>
              <Text style={styles.saveButtonText}>Save to my lexicon</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#262526',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },

  // Image styles
  imagePlaceholder: {
    height: 70,
    borderRadius: 12,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Text styles
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  categoryButtonText: {
    fontSize: 13,
    color: '#262626',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Button styles
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 17,
    borderRadius: 50,
    marginBottom: 8,
    minWidth: '30%',
    alignItems: 'center',
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 45,
    backgroundColor: '#6200EE',
    borderRadius: 30,
    elevation: 5,
    alignItems: 'center',
    shadowColor: '#6200EE',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: 15,
  },

  // Input styles
  input: {
    height: 55,
    borderColor: '#262626',
    borderWidth: 2,
    marginBottom: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    fontSize: 18,
  },
  errorInput: {
    borderColor: 'red',
    backgroundColor: '#ffe6e6',
  },

  // Error message styles
  errorMessage: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  charCount: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    marginBottom: 10,
  },
});

export default AddWordScreen;
