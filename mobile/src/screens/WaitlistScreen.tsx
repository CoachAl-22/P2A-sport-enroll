import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

export default function WaitlistScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="schedule" size={32} color="#6366f1" />
        <Title style={styles.title}>Waitlists</Title>
        <Paragraph style={styles.subtitle}>
          View your children's waitlist positions and get notified when spots become available
        </Paragraph>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.emptyState}>
              <MaterialIcons name="event-available" size={48} color="#9ca3af" />
              <Title style={styles.emptyTitle}>No Waitlists Yet</Title>
              <Paragraph style={styles.emptyText}>
                When your children are added to waitlists for popular classes, they'll appear here. 
                You'll receive notifications when spots become available.
              </Paragraph>
              <Button 
                mode="contained" 
                style={styles.browseButton}
                onPress={() => {
                  // Navigation will be handled by the parent navigator
                }}
              >
                Browse Programs
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.card, styles.infoCard]}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <MaterialIcons name="info" size={24} color="#6366f1" />
              <Title style={styles.infoTitle}>How Waitlists Work</Title>
            </View>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>• Spots are offered on a first-come, first-served basis</Text>
              <Text style={styles.infoItem}>• You'll receive an SMS when a spot becomes available</Text>
              <Text style={styles.infoItem}>• You have 24 hours to accept the spot</Text>
              <Text style={styles.infoItem}>• Payment is due within 48 hours of acceptance</Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: '#6366f1',
  },
  infoCard: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});