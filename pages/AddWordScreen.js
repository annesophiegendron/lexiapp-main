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

  const saveWord = () => {
    if (!original || !translation) {
      setError(true);
      setErrorMessage('All fields are required.');
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

    // Assign to "Wild card" if user picked no tag
    const finalCategories =
      selectedCategories.length === 0 ? ['Wild Card'] : selectedCategories;

    addWord(original, translation, finalCategories);

    setOriginal('');
    setTranslation('');
    setSelectedCategories([]);
    setError(false);
    setErrorMessage('');
    onClose();
  };

  const toggleCategory = category => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category],
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
            <Text style={styles.title}>Add a New Translation</Text>
            <Text style={styles.subtitle}>
              Pick a tag, or it will automatically go to the "Wild card"
              category!
            </Text>

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
              <View
                style={[
                  styles.inputWrapper,
                  error && !original && styles.errorInput,
                ]}>
                <Ionicons
                  name="create-outline"
                  size={20}
                  color="#999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Add a word or phrase"
                  value={original}
                  onChangeText={text =>
                    setOriginal(text.slice(0, MAX_CHARACTERS))
                  }
                  maxLength={MAX_CHARACTERS}
                />
              </View>
              <Text style={styles.charCount}>
                {original.length}/{MAX_CHARACTERS}
              </Text>
            </View>

            <View>
              <View
                style={[
                  styles.inputWrapper,
                  error && !translation && styles.errorInput,
                ]}>
                <Ionicons
                  name="language-outline"
                  size={20}
                  color="#999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Add its translation or meaning"
                  value={translation}
                  onChangeText={text =>
                    setTranslation(text.slice(0, MAX_CHARACTERS))
                  }
                  maxLength={MAX_CHARACTERS}
                />
              </View>
              <Text style={styles.charCount}>
                {translation.length}/{MAX_CHARACTERS}
              </Text>
            </View>

            {error && <Text style={styles.errorMessage}>{errorMessage}</Text>}

            <TouchableOpacity style={styles.saveButton} onPress={saveWord}>
              <Text style={styles.saveButtonText}>Save to list</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#f7f7f9',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D0D0D',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#242540',
    marginBottom: 16,
    fontWeight: 'normal',
    textAlign: 'center',
    marginTop: 16,
  },
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
  categoryButtonText: {
    fontSize: 13,
    color: '#262626',
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#D7D7D9',
    borderWidth: 2,
    borderRadius: 50,
    paddingHorizontal: 10,
    height: 55,
    marginBottom: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 10,
    color: '#000',
  },
  inputIcon: {
    marginLeft: 2,
  },
  charCount: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    marginBottom: 10,
  },
  errorInput: {
    borderColor: 'red',
    backgroundColor: '#ffe6e6',
  },
  errorMessage: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 45,
    backgroundColor: '#0D0D0D',
    borderRadius: 30,
    elevation: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddWordScreen;
