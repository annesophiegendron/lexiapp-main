// context/LexiconContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LexiconContext = createContext();

export const LexiconProvider = ({ children }) => {
  const [lexicon, setLexicon] = useState([]);

  const categoryColors = {
    'Daily Life': 'rgba(242, 143, 140, 0.4)',
    'Social Interactions': 'rgba(161, 193, 247, 0.4)',
    'Work and School': 'rgba(169, 214, 120, 0.4)',
    'Weather and Nature': 'rgba(161, 198, 182, 0.4)',
    'Emotions and Feelings': 'rgba(242, 143, 119, 0.4)',
    'Common Phrases': 'rgba(212, 159, 192, 0.4)',
    'Numbers and Time': 'rgba(193, 163, 217, 0.4)',
    'Legal Matters': 'rgba(128, 196, 180, 0.4)',
    'Cultural Context': 'rgba(234, 200, 106, 0.4)',
    'Technology and Media': 'rgba(147, 184, 226, 0.4)',
    'Travel and Transportation': 'rgba(180, 213, 137, 0.4)',
  };

  // Load lexicon from AsyncStorage on mount
  useEffect(() => {
    const loadLexicon = async () => {
      const savedLexicon = await AsyncStorage.getItem('lexicon');
      if (savedLexicon) {
        setLexicon(JSON.parse(savedLexicon));
      }
    };

    loadLexicon();
  }, []);

  // Add a word to the lexicon
  const addWord = async (original, translation, categories) => {
    const newWord = {
      original,
      translation,
      categories,
      addedDate: new Date().toISOString(), // Store date as ISO string
    };
  
    const updatedLexicon = [...lexicon, newWord];
    setLexicon(updatedLexicon);
    await AsyncStorage.setItem('lexicon', JSON.stringify(updatedLexicon));
  };
  
  // Remove a word from the lexicon
  const removeWord = async index => {
    const updatedLexicon = lexicon.filter((_, i) => i !== index);
    setLexicon(updatedLexicon);
    await AsyncStorage.setItem('lexicon', JSON.stringify(updatedLexicon));
  };

  // Update a word in the lexicon
  const updateWord = async (index, updatedWord) => {
    const updatedLexicon = lexicon.map((word, i) =>
      i === index ? updatedWord : word,
    );
    setLexicon(updatedLexicon);
    await AsyncStorage.setItem('lexicon', JSON.stringify(updatedLexicon));
  };

  // Reset the lexicon to an empty state
  const resetLexicon = async () => {
    setLexicon([]);
    await AsyncStorage.removeItem('lexicon');
  };

  return (
    <LexiconContext.Provider
      value={{ lexicon, addWord, removeWord, updateWord, resetLexicon, categoryColors }}
    >
      {children}
    </LexiconContext.Provider>
  );
};

export const useLexicon = () => {
  return useContext(LexiconContext);
};
