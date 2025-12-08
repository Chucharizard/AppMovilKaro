import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../UI';
import { useTheme } from '../../context/ThemeContext';

export default function ScheduleCard({ schedule } = {}) {
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
    dayCard: {
      marginBottom: theme.spacing.md,
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    dayTitle: {
      fontSize: theme.fonts.lg,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.textPrimary,
    },
    dayCount: {
      fontSize: theme.fonts.sm,
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeights.medium,
    },
    classItem: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceDark,
    },
    timeContainer: {
      width: 90,
      paddingRight: theme.spacing.sm,
    },
    timeText: {
      fontSize: theme.fonts.sm,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.primary,
    },
    subjectContainer: {
      flex: 1,
    },
    subjectText: {
      fontSize: theme.fonts.md,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    roomText: {
      fontSize: theme.fonts.xs,
      color: theme.colors.textSecondary,
    },
    teacherText: {
      fontSize: theme.fonts.xs,
      color: theme.colors.textSecondary,
    },
    noClassesText: {
      fontSize: theme.fonts.sm,
      color: theme.colors.textLight,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: theme.spacing.md,
    },
  }), [theme]);
  
  // schedule expected as array of { day, items: [{ time, subject }] }
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
    return (
      <View style={styles.container}>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No hay horario disponible</Text>
          <Text style={styles.emptyMessage}>
            Tu horario aparecerá aquí cuando se agregue
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {schedule.map((d, idx) => (
        <Card key={idx} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>{d.day}</Text>
            {Array.isArray(d.items) && (
              <Text style={styles.dayCount}>{d.items.length} clases</Text>
            )}
          </View>
          {Array.isArray(d.items) && d.items.length > 0 ? (
            d.items.map((it, i) => (
              <View key={i} style={styles.classItem}>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{it.time}</Text>
                </View>
                <View style={styles.subjectContainer}>
                  <Text style={styles.subjectText}>{it.subject}</Text>
                  {it.room && <Text style={styles.roomText}>Sala: {it.room}</Text>}
                  {it.teacher && <Text style={styles.teacherText}>Prof: {it.teacher}</Text>}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noClassesText}>Sin clases programadas</Text>
          )}
        </Card>
      ))}
    </View>
  );
}
