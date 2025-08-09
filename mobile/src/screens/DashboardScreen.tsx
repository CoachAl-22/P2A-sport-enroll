import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Text,
  Avatar,
  Chip
} from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const userEnrollments = await apiService.getUserEnrollments();
      setEnrollments(userEnrollments);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Card */}
      <Card style={styles.welcomeCard}>
        <Card.Content style={styles.welcomeContent}>
          <Avatar.Text 
            size={60} 
            label={getInitials(user?.firstName || '', user?.lastName || '')} 
            style={styles.avatar}
          />
          <View style={styles.welcomeText}>
            <Title style={styles.welcomeTitle}>
              Welcome, {user?.firstName}!
            </Title>
            <Paragraph style={styles.welcomeSubtitle}>
              {user?.role === 'admin' ? 'Administrator' : 'Parent Dashboard'}
            </Paragraph>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Card style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{enrollments.length}</Text>
            <Text style={styles.statLabel}>Active Enrollments</Text>
          </Card.Content>
        </Card>
        
        <Card style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Notifications</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Recent Enrollments */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Recent Enrollments</Title>
          {enrollments.length > 0 ? (
            enrollments.slice(0, 3).map((enrollment: any, index) => (
              <View key={index} style={styles.enrollmentItem}>
                <View style={styles.enrollmentInfo}>
                  <Text style={styles.enrollmentClass}>
                    {enrollment.className || 'Class Name'}
                  </Text>
                  <Text style={styles.enrollmentChild}>
                    {enrollment.childName || 'Child Name'}
                  </Text>
                </View>
                <Chip 
                  mode="outlined" 
                  compact
                  style={styles.statusChip}
                >
                  {enrollment.status || 'Active'}
                </Chip>
              </View>
            ))
          ) : (
            <Paragraph style={styles.emptyText}>
              No active enrollments. Browse classes to get started!
            </Paragraph>
          )}
          <Button 
            mode="outlined" 
            style={styles.viewAllButton}
            onPress={() => {}}
          >
            View All Enrollments
          </Button>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Quick Actions</Title>
          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              style={styles.actionButton}
              onPress={() => {}}
            >
              Browse Classes
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              onPress={() => {}}
            >
              View Schedule
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Notifications Preview */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Recent Notifications</Title>
          <View style={styles.notificationItem}>
            <Text style={styles.notificationTitle}>
              Welcome to Power2ADAPT!
            </Text>
            <Text style={styles.notificationText}>
              Your account has been successfully set up.
            </Text>
          </View>
          <View style={styles.notificationItem}>
            <Text style={styles.notificationTitle}>
              Term 4 2024 Classes Available
            </Text>
            <Text style={styles.notificationText}>
              New classes are now open for enrollment.
            </Text>
          </View>
          <Button 
            mode="text" 
            style={styles.viewAllButton}
            onPress={() => {}}
          >
            View All Notifications
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: '#fff',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  enrollmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  enrollmentInfo: {
    flex: 1,
  },
  enrollmentClass: {
    fontSize: 16,
    fontWeight: '500',
  },
  enrollmentChild: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusChip: {
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  viewAllButton: {
    marginTop: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  notificationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 12,
    color: '#666',
  },
});