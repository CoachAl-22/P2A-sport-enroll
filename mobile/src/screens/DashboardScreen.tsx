import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { enrollmentsApi, notificationsApi } from '../services/api';
import { theme, spacing } from '../theme/theme';

const DashboardScreen = () => {
  const { user } = useAuth();
  
  const { data: enrollments, isLoading: enrollmentsLoading, refetch: refetchEnrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => enrollmentsApi.getEnrollments(),
    select: (response) => response.data,
  });

  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(),
    select: (response) => response.data,
  });

  const onRefresh = React.useCallback(() => {
    refetchEnrollments();
    refetchNotifications();
  }, [refetchEnrollments, refetchNotifications]);

  const activeEnrollments = enrollments?.filter((e: any) => e.enrollment.status === 'active') || [];
  const unreadNotifications = notifications?.filter((n: any) => !n.read) || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={enrollmentsLoading || notificationsLoading}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Avatar.Text 
              size={48} 
              label={`${user?.firstName?.[0]}${user?.lastName?.[0]}`}
              style={styles.avatar}
            />
            <View style={styles.welcomeText}>
              <Text variant="headlineSmall" style={styles.welcomeTitle}>
                Welcome back, {user?.firstName}!
              </Text>
              <Text variant="bodyMedium" style={styles.welcomeSubtitle}>
                Ready for today's training?
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="fitness" size={24} color={theme.colors.primary} />
              <Text variant="headlineMedium" style={styles.statNumber}>
                {activeEnrollments.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Active Classes
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="notifications" size={24} color={theme.colors.secondary} />
              <Text variant="headlineMedium" style={styles.statNumber}>
                {unreadNotifications.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                New Notifications
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Active Enrollments */}
        <Card style={styles.sectionCard}>
          <Card.Title title="Your Active Classes" />
          <Card.Content>
            {activeEnrollments.length > 0 ? (
              activeEnrollments.slice(0, 3).map((enrollment: any) => (
                <View key={enrollment.enrollment.id} style={styles.enrollmentItem}>
                  <View style={styles.enrollmentContent}>
                    <Text variant="titleMedium" style={styles.className}>
                      {enrollment.class.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.classDetails}>
                      {enrollment.venue.name} • {enrollment.class.schedule}
                    </Text>
                    <Text variant="bodySmall" style={styles.classStatus}>
                      Status: {enrollment.enrollment.status}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.outline} />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="fitness-outline" size={48} color={theme.colors.outline} />
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No active enrollments
                </Text>
                <Text variant="bodySmall" style={styles.emptySubtext}>
                  Browse classes to get started
                </Text>
                <Button mode="contained" style={styles.browseButton}>
                  Browse Classes
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Recent Notifications */}
        <Card style={styles.sectionCard}>
          <Card.Title title="Recent Notifications" />
          <Card.Content>
            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 3).map((notification: any) => (
                <View key={notification.id} style={styles.notificationItem}>
                  <View style={styles.notificationContent}>
                    <Text variant="titleMedium" style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    <Text variant="bodyMedium" style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text variant="bodySmall" style={styles.notificationDate}>
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {!notification.read && (
                    <View style={styles.unreadIndicator} />
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-outline" size={48} color={theme.colors.outline} />
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No notifications
                </Text>
                <Text variant="bodySmall" style={styles.emptySubtext}>
                  You're all caught up!
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  welcomeText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  welcomeTitle: {
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statNumber: {
    fontWeight: 'bold',
    marginVertical: spacing.sm,
  },
  statLabel: {
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionCard: {
    margin: spacing.lg,
    marginTop: 0,
  },
  enrollmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  enrollmentContent: {
    flex: 1,
  },
  className: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  classDetails: {
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  classStatus: {
    color: theme.colors.secondary,
    textTransform: 'capitalize',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  notificationMessage: {
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  notificationDate: {
    opacity: 0.5,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: spacing.sm,
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontWeight: 'bold',
  },
  emptySubtext: {
    opacity: 0.7,
    marginBottom: spacing.lg,
  },
  browseButton: {
    marginTop: spacing.sm,
  },
});

export default DashboardScreen;