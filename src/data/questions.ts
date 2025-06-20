import { Question } from '../types/quiz';

export const questionBank: Question[] = [
  {
    id: '1',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2,
    explanation: 'Paris is the capital and largest city of France.',
    difficulty: 'easy',
    category: 'Geography'
  },
  {
    id: '2',
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    explanation: 'Mars is called the Red Planet due to its reddish appearance caused by iron oxide on its surface.',
    difficulty: 'easy',
    category: 'Science'
  },
  {
    id: '3',
    question: 'What is the largest mammal in the world?',
    options: ['African Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
    correctAnswer: 1,
    explanation: 'The Blue Whale is the largest mammal and the largest animal ever known to have lived on Earth.',
    difficulty: 'medium',
    category: 'Biology'
  },
  {
    id: '4',
    question: 'Who painted the Mona Lisa?',
    options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
    correctAnswer: 2,
    explanation: 'The Mona Lisa was painted by Leonardo da Vinci between 1503 and 1519.',
    difficulty: 'medium',
    category: 'Art'
  },
  {
    id: '5',
    question: 'What is the chemical symbol for gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correctAnswer: 2,
    explanation: 'Au is the chemical symbol for gold, derived from the Latin word "aurum".',
    difficulty: 'medium',
    category: 'Chemistry'
  },
  {
    id: '6',
    question: 'Which programming language was created by Guido van Rossum?',
    options: ['Java', 'Python', 'C++', 'JavaScript'],
    correctAnswer: 1,
    explanation: 'Python was created by Guido van Rossum and first released in 1991.',
    difficulty: 'medium',
    category: 'Technology'
  },
  {
    id: '7',
    question: 'What is the square root of 144?',
    options: ['10', '11', '12', '13'],
    correctAnswer: 2,
    explanation: '12 × 12 = 144, so the square root of 144 is 12.',
    difficulty: 'easy',
    category: 'Mathematics'
  },
  {
    id: '8',
    question: 'Which ocean is the largest?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctAnswer: 3,
    explanation: 'The Pacific Ocean is the largest ocean, covering about 46% of the water surface and 32% of the total surface area.',
    difficulty: 'easy',
    category: 'Geography'
  },
  {
    id: '9',
    question: 'What year did World War II end?',
    options: ['1944', '1945', '1946', '1947'],
    correctAnswer: 1,
    explanation: 'World War II ended in 1945 with the surrender of Japan in September.',
    difficulty: 'medium',
    category: 'History'
  },
  {
    id: '10',
    question: 'Which element has the atomic number 1?',
    options: ['Helium', 'Hydrogen', 'Lithium', 'Carbon'],
    correctAnswer: 1,
    explanation: 'Hydrogen has the atomic number 1, making it the simplest and most abundant element.',
    difficulty: 'hard',
    category: 'Chemistry'
  }
];

export const getRandomQuestions = (count: number = 5): Question[] => {
  const shuffled = [...questionBank].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, questionBank.length));
};