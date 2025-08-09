import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Avatar, List, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme, spacing } from '../theme/theme';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    Alert.alert('Edit Profile', 'Profile editing will be available in a future update.');
  };

  const handleChangePassword = () => {
    // TODO: Navigate to change password screen
    Alert.alert('Change Password', 'Password change will be available in a future update.');
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'For support, please contact your program administrator or email support@power2adapt.com'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={64} 
                label={`${user?.firstName?.[0]}${user?.lastName?.[0]}`}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.userName}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text variant="bodyMedium" style={styles.userEmail}>
                  {user?.email}
                </Text>
                <Text variant="bodySmall" style={styles.userRole}>
                  {user?.role === 'parent' ? 'Parent Account' : user?.role}
                </Text>
              </View>
            </View>
            
            <Button 
              mode="outlined" 
              onPress={handleEditProfile}
              style={styles.editButton}
            >
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={styles.settingsCard}>
          <Card.Title title="Account Settings" />
          <Card.Content>
            <List.Item
              title="Change Password"
              description="Update your account password"
              left={() => <List.Icon icon="lock" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={handleChangePassword}
            />
            
            <List.Item
              title="Notification Settings"
              description="Manage your notification preferences"
              left={() => <List.Icon icon="notifications" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available in a future update.')}
            />
            
            <List.Item
              title="Auto-Renewal"
              description="Automatically re-enroll for future terms"
              left={() => <List.Icon icon="refresh" />}
              right={() => <Switch value={true} onValueChange={() => {}} />}
            />
          </Card.Content>
        </Card>

        {/* App Information */}
        <Card style={styles.settingsCard}>
          <Card.Title title="App Information" />
          <Card.Content>
            <List.Item
              title="Help & Support"
              description="Get help with your account"
              left={() => <List.Icon icon="help-circle" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={handleSupport}
            />
            
            <List.Item
              title="Terms & Conditions"
              description="Read our terms and conditions"
              left={() => <List.Icon icon="file-document" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => Alert.alert('Terms & Conditions', 'Terms will be available in a future update.')}
            />
            
            <List.Item
              title="Privacy Policy"
              description="Learn about your privacy"
              left={() => <List.Icon icon="shield-check" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => Alert.alert('Privacy Policy', 'Privacy policy will be available in a future update.')}
            />
            
            <List.Item
              title="App Version"
              description="Version 1.0.0"
              left={() => <List.Icon icon="information" />}
            />
          </Card.Content>
        </Card>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.signOutButton}
            buttonColor={theme.colors.error}
          >
            Sign Out
          </Button>
        </View>

        <Text variant="bodySmall" style={styles.footer}>
          Power2ADAPT Mobile App
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  userEmail: {
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  userRole: {
    opacity: 0.6,
    textTransform: 'capitalize',
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  settingsCard: {
    marginBottom: spacing.lg,
  },
  signOutSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  signOutButton: {
    width: '100%',
  },
  footer: {
    textAlign: 'center',
    opacity: 0.5,
    marginBottom: spacing.xl,
  },
});

export default ProfileScreen;