import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../UI';
import { useTheme } from '../../context/ThemeContext';

export default function GradesCard({ grades } = {}) {
  const { theme } = useTheme();
  
  const styles = useMemo(() => StyleSheet.create({
    container: {
      padding: theme.spacing.md,
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: theme.spacing.md,
    },
    emptyTitle: {
      fontSize: theme.fonts.lg,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    emptyMessage: {
      fontSize: theme.fonts.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    summaryCard: {
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
    },
    summaryLabel: {
      fontSize: theme.fonts.sm,
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeights.medium,
      marginBottom: theme.spacing.xs,
    },
    summaryValue: {
      fontSize: theme.fonts.xxxl,
      fontWeight: theme.fontWeights.bold,
    },
    gradeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceDark,
    },
    gradeRowLast: {
      borderBottomWidth: 0,
    },
    subjectContainer: {
      flex: 1,
    },
    subjectText: {
      fontSize: theme.fonts.md,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.textPrimary,
    },
    gradeContainer: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      minWidth: 60,
      alignItems: 'center',
    },
    gradeText: {
      fontSize: theme.fonts.lg,
      fontWeight: theme.fontWeights.bold,
    },
  }), [theme]);
  
  // grades expected as array of { subject, grade }
  if (!grades || !Array.isArray(grades) || grades.length === 0) {
    return (
      <View style={styles.container}>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No hay notas disponibles</Text>
          <Text style={styles.emptyMessage}>
            Tus calificaciones aparecerán aquí cuando se agreguen
          </Text>
        </Card>
      </View>
    );
  }

  // Calcular promedio
  const average = grades.reduce((sum, g) => {
    const grade = parseFloat(g.grade);
    return sum + (isNaN(grade) ? 0 : grade);
  }, 0) / grades.length;

  const getGradeColor = (grade) => {
    const numGrade = parseFloat(grade);
    if (isNaN(numGrade)) return theme.colors.textPrimary;
    if (numGrade >= 4.5) return theme.colors.success;
    if (numGrade >= 4.0) return theme.colors.primary;
    if (numGrade >= 3.5) return theme.colors.warning;
    return theme.colors.error;
  };

  return (
    <View style={styles.container}>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Promedio General</Text>
        <Text style={[styles.summaryValue, { color: getGradeColor(average) }]}>
          {average.toFixed(2)}
        </Text>
      </Card>

      <Card>
        {grades.map((g, i) => (
          <View
            key={i}
            style={[
              styles.gradeRow,
              i === grades.length - 1 && styles.gradeRowLast,
            ]}
          >
            <View style={styles.subjectContainer}>
              <Text style={styles.subjectText}>{g.subject}</Text>
            </View>
            <View style={[styles.gradeContainer, { backgroundColor: `${getGradeColor(g.grade)}15` }]}>
              <Text style={[styles.gradeText, { color: getGradeColor(g.grade) }]}>
                {String(g.grade)}
              </Text>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}
