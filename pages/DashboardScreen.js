import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useLexicon } from '../context/LexiconContext'; // Corrected import
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get("window").width;

const DashboardScreen = () => {
  const { lexicon } = useLexicon(); // Corrected context usage
  const { isDarkMode } = useTheme();

  if (!lexicon) return null; // Prevent crashes if context is undefined

  // Total words added
  const totalWords = lexicon.length;

  // Calculate how many words exist per category
  const categoryCounts = lexicon.reduce((acc, word) => {
    const category = word.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  // Prepare data for the PieChart
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
  const chartData = Object.keys(categoryCounts).map((category, index) => ({
    name: category,
    count: categoryCounts[category],
    color: colors[index % colors.length],
    legendFontColor: isDarkMode ? '#fff' : '#000',
    legendFontSize: 15,
  }));

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#121212' : '#ffffff' },
      ]}
    >
      <Text style={[styles.header, { color: isDarkMode ? '#fff' : '#000' }]}>
        Dashboard
      </Text>

      {/* Total Words Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: isDarkMode ? '#fff' : '#000' }]}>
          Total Words Added
        </Text>
        <Text style={[styles.sectionContent, { color: isDarkMode ? '#fff' : '#000' }]}>
          {totalWords}
        </Text>
      </View>

      {/* Category Breakdown Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: isDarkMode ? '#fff' : '#000' }]}>
          Words by Category
        </Text>
        {chartData.length > 0 ? (
          <PieChart
            data={chartData}
            width={screenWidth - 20}
            height={220}
            chartConfig={{
              backgroundColor: isDarkMode ? '#121212' : '#ffffff',
              backgroundGradientFrom: isDarkMode ? '#121212' : '#ffffff',
              backgroundGradientTo: isDarkMode ? '#121212' : '#ffffff',
              color: (opacity = 1) =>
                isDarkMode
                  ? `rgba(255, 255, 255, ${opacity})`
                  : `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        ) : (
          <Text style={[styles.sectionContent, { color: isDarkMode ? '#fff' : '#000' }]}>
            No category data available.
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 18,
  },
});

export default DashboardScreen;
