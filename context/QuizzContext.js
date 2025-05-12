import React, {createContext, useContext, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QuizContext = createContext();

export const useQuiz = () => {
  return useContext(QuizContext);
};

export const QuizProvider = ({children}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [pastResults, setPastResults] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);


  const submitQuiz = finalScore => {
    setPastResults(prevResults => [
      ...prevResults,
      {score: finalScore, timestamp: new Date().toISOString()},
    ]);
  };

  return (
    <QuizContext.Provider
      value={{
     currentQuestionIndex,
    setCurrentQuestionIndex,
    score,
    setScore,
    totalQuestions,
    setTotalQuestions,
    pastResults,
    setPastResults,
    submitQuiz,
      }}>
      {children}
    </QuizContext.Provider>
  );
};
