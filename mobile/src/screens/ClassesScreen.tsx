import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, Button, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { classesApi, venuesApi } from '../services/api';
import { theme, spacing } from '../theme/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ClassesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportType, setSelectedSportType] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

  const { data: classes, isLoading: classesLoading, refetch: refetchClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.getClasses(),
    select: (response) => response.data,
  });

  const { data: venues, isLoading: venuesLoading, refetch: refetchVenues } = useQuery({
    queryKey: ['venues'],
    queryFn: () => venuesApi.getVenues(),
    select: (response) => response.data,
  });

  const onRefresh = React.useCallback(() => {
    refetchClasses();
    refetchVenues();
  }, [refetchClasses, refetchVenues]);

  const sportTypes = [
    { key: 'foundation_prep_year2', label: 'Foundation' },
    { key: 'emerging_year3_6', label: 'Emerging' },
    { key: 'academy_year7_above', label: 'Academy' },
    { key: 'team_sport_speed', label: 'Team Sport Speed' },
    { key: 'senior_squad', label: 'Senior Squad' },
  ];

  const filteredClasses = classes?.filter((cls: any) => {
    const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cls.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSportType = !selectedSportType || cls.sportType === selectedSportType;
    return matchesSearch && matchesSportType;
  }) || [];

  const getVenueName = (venueId: string) => {
    const venue = venues?.find((v: any) => v.id === venueId);
    return venue?.name || 'Unknown Venue';
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

  const handleClassPress = (classId: string) => {
    navigation.navigate('ClassDetail', { classId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Available Classes
        </Text>
        
        <Searchbar
          placeholder="Search classes..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <Chip
            selected={selectedSportType === null}
            onPress={() => setSelectedSportType(null)}
            style={styles.filterChip}
          >
            All
          </Chip>
          {sportTypes.map((type) => (
            <Chip
              key={type.key}
              selected={selectedSportType === type.key}
              onPress={() => setSelectedSportType(selectedSportType === type.key ? null : type.key)}
              style={styles.filterChip}
            >
              {type.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={classesLoading || venuesLoading}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {filteredClasses.length > 0 ? (
          filteredClasses.map((cls: any) => (
            <Card key={cls.id} style={styles.classCard} onPress={() => handleClassPress(cls.id)}>
              <Card.Content>
                <View style={styles.classHeader}>
                  <Text variant="titleLarge" style={styles.className}>
                    {cls.name}
                  </Text>
                  <Chip mode="outlined" compact>
                    {sportTypes.find(type => type.key === cls.sportType)?.label || cls.sportType}
                  </Chip>
                </View>

                {cls.description && (
                  <Text variant="bodyMedium" style={styles.classDescription}>
                    {cls.description}
                  </Text>
                )}

                <View style={styles.classDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      {getVenueName(cls.venueId)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      {getDayName(cls.dayOfWeek)} {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="people" size={16} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      Ages {cls.minAge}-{cls.maxAge} • Max {cls.maxCapacity} students
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="cash" size={16} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      ${cls.pricePerTerm} per term
                    </Text>
                  </View>
                </View>

                <View style={styles.classFooter}>
                  <Text variant="bodySmall" style={styles.availabilityText}>
                    {cls.currentEnrollment || 0} / {cls.maxCapacity} enrolled
                  </Text>
                  <Button 
                    mode="contained" 
                    compact
                    onPress={() => handleClassPress(cls.id)}
                  >
                    View Details
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color={theme.colors.outline} />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No classes found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyMessage}>
              {searchQuery || selectedSportType 
                ? 'Try adjusting your search or filters'
                : 'No classes are currently available'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: theme.colors.onSurface,
  },
  searchbar: {
    marginBottom: spacing.md,
  },
  filtersContainer: {
    marginBottom: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  classCard: {
    marginBottom: spacing.md,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  className: {
    flex: 1,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  classDescription: {
    opacity: 0.7,
    marginBottom: spacing.md,
  },
  classDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityText: {
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default ClassesScreen;