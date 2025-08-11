import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Card, Title, Paragraph, Button, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

export default function EducationScreen() {
  const openSkoolCommunity = () => {
    Linking.openURL('https://www.skool.com/power2adapt');
  };

  const educationArticles = [
    {
      id: 1,
      title: "Building Athletic Confidence in Young Athletes",
      excerpt: "Discover key strategies to help young athletes develop self-confidence and mental resilience on and off the field.",
      readTime: "5 min read",
      category: "Mental Performance"
    },
    {
      id: 2,
      title: "The Language of Coaching: Communication Strategies",
      excerpt: "Learn effective communication techniques that inspire, motivate, and guide young athletes toward their potential.",
      readTime: "7 min read",
      category: "Coaching"
    },
    {
      id: 3,
      title: "Age-Appropriate Training: Foundation to Elite",
      excerpt: "Understanding the developmental stages and creating training programs that match athletes' physical and mental readiness.",
      readTime: "8 min read",
      category: "Development"
    },
    {
      id: 4,
      title: "Injury Prevention Through Movement Quality",
      excerpt: "Focus on movement mechanics and mobility work to keep young athletes healthy and performing at their best.",
      readTime: "6 min read",
      category: "Health & Safety"
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="school" size={32} color="#6366f1" />
        <Title style={styles.title}>Education Hub</Title>
        <Paragraph style={styles.subtitle}>
          Resources, insights, and community support for athletic development
        </Paragraph>
      </View>

      {/* Community Section */}
      <View style={styles.content}>
        <Card style={styles.communityCard}>
          <Card.Content>
            <View style={styles.communityHeader}>
              <MaterialIcons name="groups" size={28} color="#fbbf24" />
              <Title style={styles.communityTitle}>Join Our Community</Title>
            </View>
            <Paragraph style={styles.communityDescription}>
              Connect with other Power2ADAPT families, share experiences, and get expert advice in our exclusive Skool community.
            </Paragraph>
            <Button 
              mode="contained" 
              style={styles.communityButton}
              onPress={openSkoolCommunity}
            >
              Join Skool Community
            </Button>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        {/* Featured Articles */}
        <Title style={styles.sectionTitle}>Featured Training Insights</Title>
        
        {educationArticles.map((article) => (
          <Card key={article.id} style={styles.articleCard}>
            <Card.Content>
              <View style={styles.articleHeader}>
                <Text style={styles.category}>{article.category}</Text>
                <Text style={styles.readTime}>{article.readTime}</Text>
              </View>
              <Title style={styles.articleTitle}>{article.title}</Title>
              <Paragraph style={styles.articleExcerpt}>{article.excerpt}</Paragraph>
              <Button 
                mode="outlined" 
                style={styles.readButton}
                onPress={() => {
                  // In a real app, this would navigate to the full article
                }}
              >
                Read More
              </Button>
            </Card.Content>
          </Card>
        ))}

        {/* Quick Tips */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <View style={styles.tipsHeader}>
              <MaterialIcons name="lightbulb" size={24} color="#10b981" />
              <Title style={styles.tipsTitle}>Quick Tips</Title>
            </View>
            <View style={styles.tipsList}>
              <Text style={styles.tip}>💧 Hydration starts the day before training</Text>
              <Text style={styles.tip}>🏃‍♀️ Focus on form first, speed second</Text>
              <Text style={styles.tip}>😴 Quality sleep = better recovery</Text>
              <Text style={styles.tip}>🎯 Set process goals, not just outcome goals</Text>
              <Text style={styles.tip}>🍎 Nutrition fuels both body and mind</Text>
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
  communityCard: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
    marginBottom: 24,
    elevation: 3,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  communityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400e',
    marginLeft: 8,
  },
  communityDescription: {
    color: '#92400e',
    marginBottom: 16,
    lineHeight: 22,
  },
  communityButton: {
    backgroundColor: '#fbbf24',
  },
  divider: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  articleCard: {
    marginBottom: 16,
    elevation: 2,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  readTime: {
    fontSize: 12,
    color: '#64748b',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  articleExcerpt: {
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 22,
  },
  readButton: {
    borderColor: '#6366f1',
  },
  tipsCard: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    marginTop: 8,
    elevation: 2,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    marginLeft: 8,
  },
  tipsList: {
    gap: 12,
  },
  tip: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
});