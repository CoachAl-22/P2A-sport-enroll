import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

export default function HighPerformanceScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.gradientOverlay} />
        <View style={styles.heroContent}>
          <MaterialIcons name="emoji-events" size={48} color="white" />
          <Title style={styles.heroTitle}>High Performance Coaching</Title>
          <Paragraph style={styles.heroSubtitle}>
            Elite coaching services for dedicated athletes seeking peak performance
          </Paragraph>
        </View>
      </View>

      <View style={styles.content}>
        <Card style={styles.serviceCard}>
          <Card.Content>
            <View style={styles.serviceHeader}>
              <MaterialIcons name="person" size={24} color="#6366f1" />
              <Title style={styles.serviceTitle}>1-on-1 Coaching</Title>
            </View>
            <Paragraph style={styles.serviceDescription}>
              Personalized training sessions tailored to your specific goals and athletic development needs.
            </Paragraph>
            <View style={styles.features}>
              <Chip style={styles.feature} textStyle={styles.featureText}>Individual Attention</Chip>
              <Chip style={styles.feature} textStyle={styles.featureText}>Custom Programs</Chip>
              <Chip style={styles.feature} textStyle={styles.featureText}>Performance Analysis</Chip>
            </View>
            <Button mode="contained" style={styles.applyButton}>
              Apply Now
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.serviceCard}>
          <Card.Content>
            <View style={styles.serviceHeader}>
              <MaterialIcons name="groups" size={24} color="#6366f1" />
              <Title style={styles.serviceTitle}>Team Consulting</Title>
            </View>
            <Paragraph style={styles.serviceDescription}>
              Strategic coaching consultancy for school teams and sporting organizations.
            </Paragraph>
            <View style={styles.features}>
              <Chip style={styles.feature} textStyle={styles.featureText}>Team Strategy</Chip>
              <Chip style={styles.feature} textStyle={styles.featureText}>Coach Development</Chip>
              <Chip style={styles.feature} textStyle={styles.featureText}>Program Design</Chip>
            </View>
            <Button mode="contained" style={styles.applyButton}>
              Enquire Now
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.serviceCard}>
          <Card.Content>
            <View style={styles.serviceHeader}>
              <MaterialIcons name="videocam" size={24} color="#6366f1" />
              <Title style={styles.serviceTitle}>Remote Coaching</Title>
            </View>
            <Paragraph style={styles.serviceDescription}>
              Professional coaching support via video analysis and online program delivery.
            </Paragraph>
            <View style={styles.features}>
              <Chip style={styles.feature} textStyle={styles.featureText}>Video Analysis</Chip>
              <Chip style={styles.feature} textStyle={styles.featureText}>Online Programs</Chip>
              <Chip style={styles.feature} textStyle={styles.featureText}>Flexible Schedule</Chip>
            </View>
            <Button mode="contained" style={styles.applyButton}>
              Get Started
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.eliteCard}>
          <Card.Content>
            <View style={styles.eliteHeader}>
              <MaterialIcons name="military-tech" size={32} color="#fbbf24" />
              <Title style={styles.eliteTitle}>Senior Squad Program</Title>
              <Chip mode="outlined" style={styles.applicationBadge} textStyle={styles.badgeText}>
                By Application
              </Chip>
            </View>
            <Paragraph style={styles.eliteDescription}>
              Our most exclusive program for serious athletes committed to excellence and competitive success.
            </Paragraph>
            <Button mode="contained" style={[styles.applyButton, styles.eliteButton]}>
              Apply for Senior Squad
            </Button>
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
  hero: {
    height: 200,
    backgroundColor: '#1e293b',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroContent: {
    alignItems: 'center',
    padding: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#e2e8f0',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    padding: 16,
  },
  serviceCard: {
    marginBottom: 16,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  serviceDescription: {
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 22,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  feature: {
    backgroundColor: '#f1f5f9',
  },
  featureText: {
    color: '#475569',
    fontSize: 12,
  },
  applyButton: {
    backgroundColor: '#6366f1',
  },
  eliteCard: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
    marginBottom: 16,
    elevation: 3,
  },
  eliteHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  eliteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#92400e',
    marginTop: 8,
    textAlign: 'center',
  },
  applicationBadge: {
    backgroundColor: '#7c2d12',
    borderColor: '#7c2d12',
    marginTop: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
  },
  eliteDescription: {
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  eliteButton: {
    backgroundColor: '#dc2626',
  },
});