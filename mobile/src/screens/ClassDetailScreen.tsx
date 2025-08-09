import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Chip, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { classesApi, venuesApi } from '../services/api';
import { theme, spacing } from '../theme/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = {
  params: {
    classId: string;
  };
};

const ClassDetailScreen = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { classId } = route.params;

  const { data: classData, isLoading } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => classesApi.getClass(classId),
    select: (response) => response.data,
  });

  const { data: venues } = useQuery({
    queryKey: ['venues'],
    queryFn: () => venuesApi.getVenues(),
    select: (response) => response.data,
  });

  if (isLoading || !classData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Loading class details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const venue = venues?.find((v: any) => v.id === classData.venueId);
  const availableSpots = classData.maxCapacity - (classData.currentEnrollment || 0);

  const sportTypeLabels = {
    foundation_prep_year2: 'Foundation - Prep - Year 2',
    emerging_year3_6: 'Emerging - Year 3 - 6',
    academy_year7_above: 'Academy - Year 7 & Above',
    team_sport_speed: 'Team Sport Speed',
    senior_squad: 'Senior Squad',
    empowered_athlete_program: 'The Empowered Athlete Program',
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek - 1] || '';
  };

  const handleEnroll = () => {
    navigation.navigate('Enrollment', { classId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="headlineMedium" style={styles.className}>
                {classData.name}
              </Text>
              <Chip mode="outlined">
                {sportTypeLabels[classData.sportType as keyof typeof sportTypeLabels] || classData.sportType}
              </Chip>
            </View>
            
            {classData.description && (
              <Text variant="bodyLarge" style={styles.description}>
                {classData.description}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Schedule & Location */}
        <Card style={styles.infoCard}>
          <Card.Title title="Schedule & Location" />
          <Card.Content>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.infoText}>
                {getDayName(classData.dayOfWeek)}s, {formatTime(classData.startTime)} - {formatTime(classData.endTime)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <View style={styles.locationInfo}>
                <Text variant="bodyLarge" style={styles.infoText}>
                  {venue?.name || 'Unknown Venue'}
                </Text>
                {venue?.address && (
                  <Text variant="bodyMedium" style={styles.address}>
                    {venue.address}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.infoText}>
                {classData.term} {classData.year}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Class Details */}
        <Card style={styles.infoCard}>
          <Card.Title title="Class Details" />
          <Card.Content>
            <View style={styles.infoRow}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.infoText}>
                Ages {classData.minAge} - {classData.maxAge}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person-add" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.infoText}>
                {classData.currentEnrollment || 0} / {classData.maxCapacity} enrolled
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color={availableSpots > 0 ? theme.colors.secondary : theme.colors.error} />
              <Text variant="bodyLarge" style={[styles.infoText, { color: availableSpots > 0 ? theme.colors.secondary : theme.colors.error }]}>
                {availableSpots > 0 ? `${availableSpots} spots available` : 'Class is full'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="cash" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.infoText}>
                ${classData.pricePerTerm} per term
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Coach Information */}
        {classData.coach && (
          <Card style={styles.infoCard}>
            <Card.Title title="Your Coach" />
            <Card.Content>
              <View style={styles.coachInfo}>
                <Avatar.Text 
                  size={48} 
                  label={`${classData.coach.firstName?.[0]}${classData.coach.lastName?.[0]}`}
                  style={styles.coachAvatar}
                />
                <View style={styles.coachDetails}>
                  <Text variant="titleMedium" style={styles.coachName}>
                    {classData.coach.firstName} {classData.coach.lastName}
                  </Text>
                  {classData.coach.bio && (
                    <Text variant="bodyMedium" style={styles.coachBio}>
                      {classData.coach.bio}
                    </Text>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Enrollment Action */}
        <View style={styles.enrollmentSection}>
          <Button
            mode="contained"
            onPress={handleEnroll}
            disabled={availableSpots <= 0}
            style={styles.enrollButton}
            contentStyle={styles.enrollButtonContent}
          >
            {availableSpots > 0 ? 'Enroll Now' : 'Class Full - Join Waitlist'}
          </Button>
          
          {availableSpots <= 0 && (
            <Text variant="bodySmall" style={styles.waitlistText}>
              You'll be notified if a spot becomes available
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  className: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  description: {
    opacity: 0.8,
    lineHeight: 24,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  locationInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  address: {
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  coachAvatar: {
    backgroundColor: theme.colors.primary,
  },
  coachDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  coachName: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  coachBio: {
    opacity: 0.8,
    lineHeight: 20,
  },
  enrollmentSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  enrollButton: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  enrollButtonContent: {
    paddingVertical: spacing.sm,
  },
  waitlistText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default ClassDetailScreen;