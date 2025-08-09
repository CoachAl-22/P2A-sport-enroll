import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Text,
  Avatar,
  Chip,
  Divider
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';

export default function ClassDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { classId } = route.params as { classId: string };
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassDetails();
  }, [classId]);

  const loadClassDetails = async () => {
    try {
      const data = await apiService.getClassDetails(classId);
      setClassData(data);
    } catch (error) {
      console.error('Failed to load class details:', error);
      Alert.alert('Error', 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = () => {
    navigation.navigate('Enrollment' as never, { classData } as never);
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading class details...</Text>
      </View>
    );
  }

  if (!classData) {
    return (
      <View style={styles.errorContainer}>
        <Text>Class not found</Text>
      </View>
    );
  }

  const isClassFull = classData.currentEnrollments >= classData.maxStudents;

  return (
    <ScrollView style={styles.container}>
      {/* Class Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.className}>{classData.name}</Title>
          
          <View style={styles.metadata}>
            <Chip mode="outlined" style={styles.chip}>
              {classData.sportType}
            </Chip>
            <Chip mode="outlined" style={styles.chip}>
              Ages {classData.minAge}-{classData.maxAge}
            </Chip>
            <Chip 
              mode="outlined" 
              style={[styles.chip, isClassFull && styles.fullChip]}
            >
              {classData.currentEnrollments}/{classData.maxStudents} spots
            </Chip>
          </View>

          <Paragraph style={styles.description}>
            {classData.description}
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Schedule Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Schedule</Title>
          <View style={styles.scheduleInfo}>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>Day:</Text>
              <Text style={styles.scheduleValue}>
                {getDayName(classData.dayOfWeek)}
              </Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>Time:</Text>
              <Text style={styles.scheduleValue}>
                {formatTime(classData.startTime)} - {formatTime(classData.endTime)}
              </Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>Duration:</Text>
              <Text style={styles.scheduleValue}>
                {classData.duration || '60'} minutes
              </Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>Term:</Text>
              <Text style={styles.scheduleValue}>
                {classData.term} {classData.year}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Venue Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Venue</Title>
          <Text style={styles.venueName}>{classData.venueName}</Text>
          <Text style={styles.venueAddress}>{classData.venueAddress}</Text>
        </Card.Content>
      </Card>

      {/* Coach Card */}
      {classData.coachName && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Coach</Title>
            <View style={styles.coachInfo}>
              <Avatar.Text 
                size={50} 
                label={classData.coachName.split(' ').map((n: string) => n[0]).join('')} 
                style={styles.coachAvatar}
              />
              <View style={styles.coachDetails}>
                <Text style={styles.coachName}>{classData.coachName}</Text>
                <Text style={styles.coachTitle}>Head Coach</Text>
                <Text style={styles.coachBio}>
                  {classData.coachBio || 'Experienced coach with years of training athletes of all levels.'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Pricing Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Pricing</Title>
          <View style={styles.pricingInfo}>
            <Text style={styles.price}>${classData.price}</Text>
            <Text style={styles.priceLabel}>per term</Text>
          </View>
          <Text style={styles.priceNote}>
            Full term payment required at enrollment. Includes all sessions and equipment usage.
          </Text>
        </Card.Content>
      </Card>

      {/* Enrollment Button */}
      <View style={styles.enrollmentSection}>
        <Button
          mode="contained"
          onPress={handleEnroll}
          disabled={isClassFull}
          style={[styles.enrollButton, isClassFull && styles.disabledButton]}
          labelStyle={styles.enrollButtonText}
        >
          {isClassFull ? 'Class Full - Join Waitlist' : 'Enroll Now'}
        </Button>
        
        {isClassFull && (
          <Text style={styles.waitlistNote}>
            This class is currently full. You can join the waitlist to be notified if a spot becomes available.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  className: {
    fontSize: 24,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  fullChip: {
    backgroundColor: '#ffebee',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  scheduleInfo: {
    paddingVertical: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  scheduleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  scheduleValue: {
    fontSize: 16,
    color: '#333',
  },
  venueName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    color: '#666',
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  coachAvatar: {
    marginRight: 16,
  },
  coachDetails: {
    flex: 1,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 2,
  },
  coachTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  coachBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  pricingInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  enrollmentSection: {
    margin: 16,
    marginTop: 8,
  },
  enrollButton: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  enrollButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  waitlistNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});