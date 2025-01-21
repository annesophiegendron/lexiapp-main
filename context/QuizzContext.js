import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a context for the quiz state
const QuizContext = createContext();

// Custom hook to use the quiz context in components
export const useQuiz = () => {
  return useContext(QuizContext);
};

// Provider component to wrap the application and provide quiz state
export const QuizProvider = ({ children }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);  // Tracks the current question index
  const [score, setScore] = useState(0);  // Tracks the user's score
  const [pastResults, setPastResults] = useState([]);  // Stores previous quiz results

  // Function to submit the quiz and store the result
  const submitQuiz = (finalScore) => {
    setPastResults((prevResults) => [
      ...prevResults,
      { score: finalScore, timestamp: new Date().toISOString() },
    ]);
  };

  // Value provided to children components
  return (
    <QuizContext.Provider
      value={{
        currentQuestionIndex,
        setCurrentQuestionIndex,
        score,
        setScore,
        pastResults,
        setPastResults,
        submitQuiz,  // Pass submitQuiz function to the context
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
