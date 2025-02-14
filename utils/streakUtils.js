import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_DATE_KEY = 'LAST_QUIZ_DATE';
const STREAK_KEY = 'DAILY_STREAK';

export const updateStreak = async () => {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
  let streak = parseInt(await AsyncStorage.getItem(STREAK_KEY)) || 0;

  if (lastDate === today) {
    return streak;
  }

  // Calculate the difference in days (if lastDate exists)
  const diffInDays =
    lastDate && (new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24);

  if (diffInDays === 1) {
    streak += 1;
  } else {
    streak = 1;
  }

  await AsyncStorage.setItem(LAST_DATE_KEY, today);
  await AsyncStorage.setItem(STREAK_KEY, streak.toString());
  return streak;
};

export const getStreak = async () => {
  return parseInt(await AsyncStorage.getItem(STREAK_KEY)) || 0;
};
