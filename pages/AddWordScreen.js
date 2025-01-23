import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Modal, Text, Image, StyleSheet,KeyboardAvoidingView,Platform } from 'react-native';
import PenImage from '../assets/images/pen.png';
import { useLexicon } from '../context/LexiconContext';
import { categoryColors, categories } from '../constants.js';

const MAX_CHARACTERS = 200;

const AddWordScreen = ({ isVisible, onClose }) => {
  const [original, setOriginal] = useState('');
  const [translation, setTranslation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { addWord } = useLexicon();

  const saveWord = () => {
    if (original && translation && selectedCategories.length > 0) {
      console.log('Saving word:', { original, translation, selectedCategories });
      addWord(original, translation, selectedCategories);
      setOriginal('');
      setTranslation('');
      setSelectedCategories([]);
      setError(false);
      setErrorMessage('');
      onClose();
    } else {
      setError(true);
      if (selectedCategories.length === 0) {
        setErrorMessage('Please add at least one tag.');
      } else {
        setErrorMessage('All fields are required.');
      }
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prevCategories) =>
      prevCategories.includes(category)
        ? prevCategories.filter((cat) => cat !== category) // Remove category if already selected
        : [...prevCategories, category] // Add category if not already selected
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={onClose}>
      <KeyboardAvoidingView
          style={styles.modalContent}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <View style={styles.modalContent} onTouchEnd={(e) => e.stopPropagation()}>
          <View style={styles.imagePlaceholder}>
            <Image source={PenImage} style={styles.image} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Add a New Word</Text>
          <Text style={styles.description}>Add a new translation to your lexicon</Text>
          <Text style={styles.subtitle}>Add tag(s) to categorize this word</Text>

          <View style={styles.buttonGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selectedCategories.includes(cat)
                      ? categoryColors[cat]
                      : '#ddd', // Highlight selected categories
                  },
                ]}
                onPress={() => toggleCategory(cat)}
              >
                <Text style={styles.categoryButtonText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View>
            <TextInput
              style={[styles.input, error && !original ? styles.errorInput : null]}
              placeholder="New word"
              placeholderTextColor="#404040" 
              value={original}
              onChangeText={(text) => setOriginal(text.slice(0, MAX_CHARACTERS))}
              maxLength={MAX_CHARACTERS}
            />
            <Text style={styles.characterCount}>
              {original.length}/{MAX_CHARACTERS}
            </Text>
          </View>

          <View>
            <TextInput
              style={[styles.input, error && !translation ? styles.errorInput : null]}
              placeholder="Translation"
              placeholderTextColor="#404040" 
              value={translation}
              onChangeText={(text) => setTranslation(text.slice(0, MAX_CHARACTERS))}
              maxLength={MAX_CHARACTERS}
            />
            <Text style={styles.characterCount}>
              {translation.length}/{MAX_CHARACTERS}
            </Text>
          </View>

          {/* Error message for missing categories */}
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
  image: {
    width: 95,
    height: 95,
  },

  // Text styles
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
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
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 7,
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

  // Input styles
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  errorInput: {
    borderColor: 'red',
    backgroundColor: '#ffe6e6',
  },

  // Character count styles
  characterCount: {
    fontSize: 12,
    color: '#aaa',
    alignSelf: 'flex-end',
    marginBottom: 15,
  },

  // Error message styles
  errorMessage: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default AddWordScreen;
