import { useState, useEffect, useCallback, useRef } from 'react';
import { QuizState, Question, QuizResult } from '../types/quiz';
import { dataService } from '../services/dataService';
import { settingsService } from '../services/settingsService';
import { userManagementService } from '../services/userManagementService';
import { realtimeService } from '../services/realtimeService';

const QUIZ_STORAGE_KEY = 'shreyan_quiz_state';

const getRandomQuestions = (count: number = 5): Question[] => {
  const questions = dataService.getQuestions();
  if (questions.length === 0) {
    return [];
  }
  
  const settings = settingsService.getSettings();
  let selectedQuestions = [...questions];
  
  // Shuffle if enabled
  if (settings.shuffleQuestions) {
    selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random());
  }
  
  return selectedQuestions.slice(0, Math.min(count, selectedQuestions.length));
};

export const useQuiz = (username: string) => {
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: 0,
    isCompleted: false,
    startTime: 0,
    score: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAttemptId = useRef<string | null>(null);

  const initializeQuiz = useCallback(() => {
    const settings = settingsService.getSettings();
    const questions = getRandomQuestions(settings.questionsPerQuiz);
    
    // Shuffle answers if enabled
    if (settings.shuffleAnswers) {
      questions.forEach(question => {
        const correctAnswer = question.options[question.correctAnswer];
        question.options = question.options.sort(() => 0.5 - Math.random());
        question.correctAnswer = question.options.indexOf(correctAnswer);
      });
    }
    
    const newState: QuizState = {
      questions,
      currentQuestionIndex: 0,
      answers: {},
      timeRemaining: settings.timeLimit,
      isCompleted: false,
      startTime: Date.now(),
      score: 0,
    };
    
    setQuizState(newState);
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(newState));
    
    // Start quiz attempt tracking
    try {
      const attempt = userManagementService.startQuizAttempt(username);
      currentAttemptId.current = attempt.id;
    } catch (error) {
      console.error('Failed to start quiz attempt tracking:', error);
    }
  }, [username]);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setQuizState(prev => {
        const newTimeRemaining = prev.timeRemaining - 1;
        
        if (newTimeRemaining <= 0) {
          const finalState = { ...prev, timeRemaining: 0, isCompleted: true };
          localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(finalState));
          return finalState;
        }
        
        const updatedState = { ...prev, timeRemaining: newTimeRemaining };
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(updatedState));
        return updatedState;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const answerQuestion = useCallback((questionId: string, answerIndex: number) => {
    setQuizState(prev => {
      const updatedAnswers = { ...prev.answers, [questionId]: answerIndex };
      const updatedState = { ...prev, answers: updatedAnswers };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(updatedState));
      
      // Update quiz attempt
      if (currentAttemptId.current) {
        userManagementService.updateQuizAttempt(username, currentAttemptId.current, {
          questionsAnswered: Object.keys(updatedAnswers).length
        });
      }
      
      return updatedState;
    });
  }, [username]);

  const nextQuestion = useCallback(() => {
    setQuizState(prev => {
      const nextIndex = prev.currentQuestionIndex + 1;
      const isLastQuestion = nextIndex >= prev.questions.length;
      
      const updatedState = {
        ...prev,
        currentQuestionIndex: nextIndex,
        isCompleted: isLastQuestion ? true : prev.isCompleted,
      };
      
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(updatedState));
      return updatedState;
    });
  }, []);

  const previousQuestion = useCallback(() => {
    setQuizState(prev => {
      const prevIndex = Math.max(0, prev.currentQuestionIndex - 1);
      const updatedState = { ...prev, currentQuestionIndex: prevIndex };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(updatedState));
      return updatedState;
    });
  }, []);

  const calculateScore = useCallback((): QuizResult => {
    let correctAnswers = 0;
    
    quizState.questions.forEach(question => {
      const userAnswer = quizState.answers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = quizState.questions.length > 0 ? Math.round((correctAnswers / quizState.questions.length) * 100) : 0;
    const settings = settingsService.getSettings();
    const timeSpent = settings.timeLimit - quizState.timeRemaining;

    return {
      username,
      score,
      totalQuestions: quizState.questions.length,
      correctAnswers,
      timeSpent,
      completedAt: Date.now(),
      answers: quizState.answers,
    };
  }, [quizState, username]);

  const completeQuiz = useCallback(() => {
    stopTimer();
    setQuizState(prev => {
      const finalState = { ...prev, isCompleted: true };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(finalState));
      
      // Complete quiz attempt tracking
      if (currentAttemptId.current) {
        const result = calculateScore();
        userManagementService.completeQuizAttempt(
          username, 
          currentAttemptId.current, 
          result.score, 
          result.correctAnswers, 
          result.totalQuestions
        );
      }
      
      return finalState;
    });
  }, [stopTimer, calculateScore, username]);

  const resetQuiz = useCallback(() => {
    stopTimer();
    localStorage.removeItem(QUIZ_STORAGE_KEY);
    currentAttemptId.current = null;
    initializeQuiz();
  }, [stopTimer, initializeQuiz]);

  // Load saved quiz state on mount
  useEffect(() => {
    const savedQuiz = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (savedQuiz) {
      try {
        const parsedState = JSON.parse(savedQuiz);
        
        // Validate that questions still exist in the database
        const currentQuestions = dataService.getQuestions();
        const validQuestions = parsedState.questions.filter((q: Question) => 
          currentQuestions.some(cq => cq.id === q.id)
        );
        
        if (validQuestions.length !== parsedState.questions.length) {
          // Some questions were deleted, restart quiz
          initializeQuiz();
          return;
        }
        
        setQuizState(parsedState);
        
        if (!parsedState.isCompleted && parsedState.timeRemaining > 0) {
          startTimer();
        }
      } catch (error) {
        initializeQuiz();
      }
    } else {
      initializeQuiz();
    }

    return () => {
      stopTimer();
    };
  }, [initializeQuiz, startTimer, stopTimer]);

  // Listen for real-time updates
  useEffect(() => {
    const handleSettingsUpdate = () => {
      // If settings change during quiz, we might need to adjust
      console.log('Settings updated during quiz');
    };

    const handleQuestionsUpdate = (updatedQuestions: Question[]) => {
      // Check if current quiz questions are still valid
      const currentQuestionIds = quizState.questions.map(q => q.id);
      const stillValid = currentQuestionIds.every(id => 
        updatedQuestions.some(q => q.id === id)
      );
      
      if (!stillValid && !quizState.isCompleted) {
        console.warn('Questions updated during quiz, maintaining current state');
      }
    };
    
    realtimeService.addEventListener('settingsUpdated', handleSettingsUpdate);
    realtimeService.addEventListener('questionsUpdated', handleQuestionsUpdate);
    
    return () => {
      realtimeService.removeEventListener('settingsUpdated', handleSettingsUpdate);
      realtimeService.removeEventListener('questionsUpdated', handleQuestionsUpdate);
    };
  }, [quizState.questions, quizState.isCompleted]);

  // Auto-complete quiz when time runs out
  useEffect(() => {
    if (quizState.timeRemaining <= 0 && !quizState.isCompleted) {
      completeQuiz();
    }
  }, [quizState.timeRemaining, quizState.isCompleted, completeQuiz]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const addSecurityViolation = useCallback((type: string, details: string) => {
    if (currentAttemptId.current) {
      userManagementService.addSecurityViolation(username, currentAttemptId.current, {
        type: type as any,
        timestamp: Date.now(),
        details
      });
    }
  }, [username]);

  return {
    quizState,
    initializeQuiz,
    startTimer,
    stopTimer,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    calculateScore,
    completeQuiz,
    resetQuiz,
    formatTime,
    addSecurityViolation,
    isQuizActive: !quizState.isCompleted && quizState.timeRemaining > 0,
  };
};