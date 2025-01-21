import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Text,
  Image,
  StyleSheet,KeyboardAvoidingView,Platform
} from 'react-native';

import PenImage from '../assets/images/pen.png';

import { categoryColors, categories } from '../constants.js';

const EditWordScreen = ({ isVisible, onClose, word, onUpdateWord }) => {
  const [original, setOriginal] = useState(word?.original || '');
  const [translation, setTranslation] = useState(word?.translation || '');
  const [selectedCategories, setSelectedCategories] = useState(
    word?.categories || [],
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const MAX_CHARACTERS = {
    original: 200,
    translation: 200,
  };

  useEffect(() => {
    if (word) {
      setOriginal(word.original || '');
      setTranslation(word.translation || '');
      setSelectedCategories(word.categories || []);
      setError('');
      setSuccess(false);
    }
  }, [word]);

  const saveWord = () => {
    if (!original) {
      setError('Original word is required.');
      return;
    }
    if (!translation) {
      setError('Translation is required.');
      return;
    }
    if (selectedCategories.length === 0) {
      setError('At least one category must be selected.');
      return;
    }

    const updatedWord = {
      ...word,
      original,
      translation,
      categories: selectedCategories,
    };

    onUpdateWord(updatedWord);
    setSuccess(true); // Show success feedback
    setTimeout(() => {
      setSuccess(false); // Hide after a brief delay
      onClose(); // Close modal
    }, 1500);
  };

  const toggleCategory = category => {
    setSelectedCategories(prevCategories =>
      prevCategories.includes(category)
        ? prevCategories.filter(cat => cat !== category)
        : [...prevCategories, category],
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
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  >
        <View style={styles.modalContent} onTouchEnd={e => e.stopPropagation()}>
          <View style={styles.imagePlaceholder}>
            <Image source={PenImage} style={styles.image} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Edit Word</Text>
          <Text style={styles.description}>
            Update the details of your word
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

          {/* Original Word Input */}
          <TextInput
            style={[
              styles.input,
              error.includes('Original') ? styles.errorInput : null,
            ]}
            placeholder="Original Word"
            value={original}
            onChangeText={text =>
              text.length <= MAX_CHARACTERS.original && setOriginal(text)
            }
          />
          <Text
            style={[
              styles.charCount,
              original.length >= MAX_CHARACTERS.original
                ? styles.charCountError
                : null,
            ]}>
            {original.length}/{MAX_CHARACTERS.original}
          </Text>

          {/* Translation Input */}
          <TextInput
            style={[
              styles.input,
              error.includes('Translation') ? styles.errorInput : null,
            ]}
            placeholder="Translation"
            value={translation}
            onChangeText={text =>
              text.length <= MAX_CHARACTERS.translation && setTranslation(text)
            }
          />
          <Text
            style={[
              styles.charCount,
              translation.length >= MAX_CHARACTERS.translation
                ? styles.charCountError
                : null,
            ]}>
            {translation.length}/{MAX_CHARACTERS.translation}
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {success && (
            <Text style={styles.successText}>Word updated successfully!</Text>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={saveWord}>
            <Text style={styles.saveButtonText}>Save</Text>
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
    backgroundColor: '#262526',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  imagePlaceholder: {
    height: 70,
    borderRadius: 12,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 95,
    height: 95,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#000',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  categoryButton: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 12,
    marginBottom: 8,
    minWidth: '30%',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#9babff',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  errorInput: {
    borderColor: 'red',
    backgroundColor: '#ffe6e6',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    color: 'green',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  charCount: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    marginBottom: 8,
  },
  charCountError: {
    color: 'red',
  },
});

export default EditWordScreen;
