import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { notificationsApi } from '../services/api';
import { theme, spacing } from '../theme/theme';

const NotificationsScreen = () => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(),
    select: (response) => response.data,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'enrollment_reminder':
        return 'calendar';
      case 'payment_due':
        return 'cash';
      case 'class_update':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'enrollment_reminder':
        return theme.colors.primary;
      case 'payment_due':
        return theme.colors.error;
      case 'class_update':
        return theme.colors.secondary;
      default:
        return theme.colors.outline;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadNotifications = notifications?.filter((n: any) => !n.read) || [];
  const readNotifications = notifications?.filter((n: any) => n.read) || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Notifications
        </Text>
        {unreadNotifications.length > 0 && (
          <Chip mode="outlined" compact>
            {unreadNotifications.length} new
          </Chip>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Unread Notifications */}
        {unreadNotifications.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              New Notifications
            </Text>
            {unreadNotifications.map((notification: any) => (
              <Card key={notification.id} style={styles.unreadCard}>
                <Card.Content>
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationIcon}>
                      <Ionicons
                        name={getNotificationIcon(notification.type)}
                        size={24}
                        color={getNotificationColor(notification.type)}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text variant="titleMedium" style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      <Text variant="bodyMedium" style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      <Text variant="bodySmall" style={styles.notificationDate}>
                        {formatDate(notification.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.unreadIndicator} />
                  </View>
                  
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => handleMarkAsRead(notification.id)}
                    style={styles.markReadButton}
                  >
                    Mark as Read
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Read Notifications */}
        {readNotifications.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Earlier
            </Text>
            {readNotifications.map((notification: any) => (
              <Card key={notification.id} style={styles.readCard}>
                <Card.Content>
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationIcon}>
                      <Ionicons
                        name={getNotificationIcon(notification.type)}
                        size={24}
                        color={theme.colors.outline}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text variant="titleMedium" style={styles.readNotificationTitle}>
                        {notification.title}
                      </Text>
                      <Text variant="bodyMedium" style={styles.readNotificationMessage}>
                        {notification.message}
                      </Text>
                      <Text variant="bodySmall" style={styles.notificationDate}>
                        {formatDate(notification.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!notifications || notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color={theme.colors.outline} />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No notifications
            </Text>
            <Text variant="bodyMedium" style={styles.emptyMessage}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        ) : null}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    color: theme.colors.onBackground,
  },
  unreadCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: theme.colors.primaryContainer,
  },
  readCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    opacity: 0.8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  notificationIcon: {
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  readNotificationTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    opacity: 0.7,
  },
  notificationMessage: {
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  readNotificationMessage: {
    marginBottom: spacing.xs,
    lineHeight: 20,
    opacity: 0.7,
  },
  notificationDate: {
    opacity: 0.6,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: spacing.sm,
    marginTop: spacing.sm,
  },
  markReadButton: {
    alignSelf: 'flex-start',
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
    paddingHorizontal: spacing.xl,
  },
});

export default NotificationsScreen;