import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Text,
  IconButton,
  Chip,
  Badge
} from 'react-native-paper';

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [notifications] = useState([
    {
      id: '1',
      title: 'Welcome to Power2ADAPT!',
      message: 'Your account has been successfully set up. Start browsing classes and enroll your children today.',
      type: 'welcome',
      timestamp: '2024-08-09T10:00:00Z',
      read: false,
    },
    {
      id: '2',
      title: 'Term 4 2024 Classes Now Available',
      message: 'New classes for Term 4 2024 are now open for enrollment. Popular classes fill up quickly!',
      type: 'announcement',
      timestamp: '2024-08-08T14:30:00Z',
      read: false,
    },
    {
      id: '3',
      title: 'Payment Confirmation',
      message: 'Your payment for Athletics Foundation Program has been processed successfully.',
      type: 'payment',
      timestamp: '2024-08-07T09:15:00Z',
      read: true,
    },
    {
      id: '4',
      title: 'Class Reminder',
      message: 'Your child has a basketball session tomorrow at 4:00 PM at Toorak College.',
      type: 'reminder',
      timestamp: '2024-08-06T18:00:00Z',
      read: true,
    },
    {
      id: '5',
      title: 'New Coach Introduction',
      message: 'We\'re excited to introduce Coach Sarah Johnson who will be leading our tennis programs.',
      type: 'announcement',
      timestamp: '2024-08-05T12:00:00Z',
      read: true,
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate loading
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome': return 'account-check';
      case 'announcement': return 'bullhorn';
      case 'payment': return 'credit-card';
      case 'reminder': return 'bell';
      default: return 'information';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'welcome': return '#4CAF50';
      case 'announcement': return '#2196F3';
      case 'payment': return '#FF9800';
      case 'reminder': return '#9C27B0';
      default: return '#666';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Notifications</Title>
        {unreadCount > 0 && (
          <Badge size={24} style={styles.badge}>
            {unreadCount}
          </Badge>
        )}
      </View>

      <ScrollView
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
            style={[
              styles.notificationCard,
              !notification.read && styles.unreadCard
            ]}
          >
            <Card.Content>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationTitleRow}>
                  <IconButton
                    icon={getNotificationIcon(notification.type)}
                    iconColor={getNotificationColor(notification.type)}
                    size={24}
                    style={styles.notificationIcon}
                  />
                  <View style={styles.titleContainer}>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.read && styles.unreadTitle
                    ]}>
                      {notification.title}
                    </Text>
                    <View style={styles.metadataRow}>
                      <Chip 
                        mode="outlined" 
                        compact 
                        style={[
                          styles.typeChip,
                          { borderColor: getNotificationColor(notification.type) }
                        ]}
                        textStyle={{ color: getNotificationColor(notification.type) }}
                      >
                        {notification.type}
                      </Chip>
                      <Text style={styles.timestamp}>
                        {formatTimestamp(notification.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
                {!notification.read && (
                  <View style={styles.unreadDot} />
                )}
              </View>
              
              <Paragraph style={styles.notificationMessage}>
                {notification.message}
              </Paragraph>
            </Card.Content>
          </Card>
        ))}

        {notifications.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <View style={styles.emptyContent}>
                <IconButton
                  icon="bell-outline"
                  size={48}
                  iconColor="#ccc"
                />
                <Title style={styles.emptyTitle}>No Notifications</Title>
                <Paragraph style={styles.emptyText}>
                  You're all caught up! New notifications will appear here.
                </Paragraph>
              </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#f44336',
  },
  notificationsList: {
    flex: 1,
  },
  notificationCard: {
    margin: 16,
    marginBottom: 8,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  notificationIcon: {
    margin: 0,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#000',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeChip: {
    marginRight: 8,
    height: 24,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginLeft: 8,
    marginTop: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyCard: {
    margin: 16,
    padding: 20,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
  },
});