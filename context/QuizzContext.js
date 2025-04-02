import React, {createContext, useContext, useState, useEffect} from 'react';
import {supabase} from '../supabase';

const QuizContext = createContext();

export const useQuiz = () => {
  return useContext(QuizContext);
};

export const QuizProvider = ({children}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [pastResults, setPastResults] = useState([]);

  const fetchPastResults = async () => {
    const {data, error} = await supabase
      .from('quiz_results')
      .select('*')
      .order('timestamp', {ascending: false});

    if (error) {
      console.error('Error fetching past results:', error.message);
    } else {
      setPastResults(data);
    }
  };

  const submitQuiz = async finalScore => {
    const {user} = await supabase.auth.getUser();

    const {data, error} = await supabase.from('quiz_results').insert([
      {
        score: finalScore,
        timestamp: new Date().toISOString(),
        user_id: user?.id,
      },
    ]);

    if (error) {
      console.error('Error submitting quiz:', error.message);
    } else {
      setPastResults(prevResults => [
        ...prevResults,
        {score: finalScore, timestamp: new Date().toISOString()},
      ]);
    }
  };

  useEffect(() => {
    fetchPastResults();
  }, []);

  return (
    <QuizContext.Provider
      value={{
        currentQuestionIndex,
        setCurrentQuestionIndex,
        score,
        setScore,
        pastResults,
        setPastResults,
        submitQuiz,
      }}>
      {children}
    </QuizContext.Provider>
  );
};
