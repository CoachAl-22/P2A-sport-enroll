import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Text,
  Searchbar,
  Chip,
  IconButton
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';

export default function ClassesScreen() {
  const navigation = useNavigation();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    sportType: '',
    venue: '',
    dayOfWeek: ''
  });

  const sportTypes = ['Athletics', 'Basketball', 'Football', 'Tennis', 'Swimming'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const loadClasses = async () => {
    try {
      const classData = await apiService.getClasses(selectedFilters);
      setClasses(classData);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [selectedFilters]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClasses();
  };

  const filteredClasses = classes.filter((classItem: any) =>
    classItem.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.sportType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClassPress = (classItem: any) => {
    navigation.navigate('ClassDetails' as never, { classId: classItem.id } as never);
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM format
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search classes..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {sportTypes.map((sport) => (
          <Chip
            key={sport}
            selected={selectedFilters.sportType === sport}
            onPress={() => setSelectedFilters(prev => ({
              ...prev,
              sportType: prev.sportType === sport ? '' : sport
            }))}
            style={styles.filterChip}
          >
            {sport}
          </Chip>
        ))}
      </ScrollView>

      {/* Classes List */}
      <ScrollView
        style={styles.classesContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredClasses.length > 0 ? (
          filteredClasses.map((classItem: any) => (
            <Card key={classItem.id} style={styles.classCard}>
              <Card.Content>
                <View style={styles.classHeader}>
                  <View style={styles.classInfo}>
                    <Title style={styles.className}>{classItem.name}</Title>
                    <View style={styles.classMetadata}>
                      <Chip 
                        mode="outlined" 
                        compact 
                        style={styles.sportChip}
                      >
                        {classItem.sportType}
                      </Chip>
                      <Text style={styles.ageRange}>
                        Ages {classItem.minAge}-{classItem.maxAge}
                      </Text>
                    </View>
                  </View>
                  <IconButton
                    icon="chevron-right"
                    onPress={() => handleClassPress(classItem)}
                  />
                </View>

                <Paragraph style={styles.description} numberOfLines={2}>
                  {classItem.description}
                </Paragraph>

                <View style={styles.classDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Schedule:</Text>
                    <Text style={styles.detailValue}>
                      {getDayName(classItem.dayOfWeek)} {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Venue:</Text>
                    <Text style={styles.detailValue}>{classItem.venueName}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Spots:</Text>
                    <Text style={styles.detailValue}>
                      {classItem.currentEnrollments || 0}/{classItem.maxStudents} enrolled
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={[styles.detailValue, styles.price]}>
                      ${classItem.price}/term
                    </Text>
                  </View>
                </View>

                <Button
                  mode="contained"
                  onPress={() => handleClassPress(classItem)}
                  style={styles.viewButton}
                  disabled={classItem.currentEnrollments >= classItem.maxStudents}
                >
                  {classItem.currentEnrollments >= classItem.maxStudents ? 'Class Full' : 'View Details'}
                </Button>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Title style={styles.emptyTitle}>No Classes Found</Title>
              <Paragraph style={styles.emptyText}>
                {searchQuery || Object.values(selectedFilters).some(f => f) 
                  ? 'Try adjusting your search or filters'
                  : 'Classes will appear here when they become available'
                }
              </Paragraph>
              {(searchQuery || Object.values(selectedFilters).some(f => f)) && (
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedFilters({ sportType: '', venue: '', dayOfWeek: '' });
                  }}
                  style={styles.clearButton}
                >
                  Clear Filters
                </Button>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  classesContainer: {
    flex: 1,
  },
  classCard: {
    margin: 16,
    marginTop: 8,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    marginBottom: 4,
  },
  classMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportChip: {
    marginRight: 8,
  },
  ageRange: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    marginBottom: 12,
    color: '#666',
  },
  classDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  price: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  viewButton: {
    marginTop: 8,
  },
  emptyCard: {
    margin: 16,
    padding: 20,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  clearButton: {
    alignSelf: 'center',
  },
});