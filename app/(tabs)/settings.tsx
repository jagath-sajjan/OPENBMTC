import { View, Text, StyleSheet, useWindowDimensions, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const isSmallPhone = width < 375;
    const isTablet = width >= 768;
    const isLargeTablet = width >= 1024;

    const horizontalPadding = isLargeTablet ? 48 : isTablet ? 32 : isSmallPhone ? 16 : 20;
    const titleSize = isTablet ? 44 : isSmallPhone ? 32 : 38;

    const handleGitHub = async () => {
        await Linking.openURL('https://github.com/jagath-sajjan/OPENBMTC.git');
    };

    const handleIssues = async () => {
        await Linking.openURL('https://github.com/jagath-sajjan/OPENBMTC/issues');
    };

    const handleLicense = async () => {
        await Linking.openURL('https://github.com/jagath-sajjan/OPENBMTC/blob/main/LICENSE');
    };

    const handleTheme = () => {
        // Theme page navigation - to be implemented later
        console.log('Theme settings - Coming soon');
    };

    const handleResetOnboarding = async () => {
        Alert.alert(
            'Reset Onboarding',
            'This will clear your onboarding status and location permissions. You will see the welcome screens again. Continue?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('onboarding_completed');
                        // Note: Location permissions are system-level and will be re-requested on onboarding
                        router.replace('/onboarding');
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Decorative shapes */}
            <View style={[styles.floatingShape, styles.shape1]} />
            <View style={[styles.floatingShape, styles.shape2]} />

            <SafeAreaView edges={['top'] as Edge[]} style={styles.safeArea}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: (Platform.OS === 'ios' ? 90 : 85) + insets.bottom }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
                        <Text style={[styles.title, { fontSize: titleSize }]}>Settings</Text>
                        <Text style={styles.subtitle}>Customize your experience</Text>
                    </View>

                    <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
                        {/* App Version Card */}
                        <View style={styles.settingCard}>
                            <View style={[styles.iconContainer, { backgroundColor: '#C7ADEB' }]}>
                                <Ionicons name="information-circle" size={24} color="#1F2937" />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={styles.settingTitle}>App Version</Text>
                                <Text style={styles.settingDescription}>Alpha 0.1.0v</Text>
                            </View>
                        </View>

                        {/* GitHub Repository Card */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.settingCard,
                                pressed && styles.settingCardPressed
                            ]}
                            onPress={handleGitHub}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#A8E5BC' }]}>
                                <Ionicons name="logo-github" size={24} color="#1F2937" />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={styles.settingTitle}>GitHub Repository</Text>
                                <Text style={styles.settingDescription}>View source code</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </Pressable>

                        {/* License Card */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.settingCard,
                                pressed && styles.settingCardPressed
                            ]}
                            onPress={handleLicense}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#FFE89A' }]}>
                                <Ionicons name="document-text" size={24} color="#1F2937" />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={styles.settingTitle}>License</Text>
                                <Text style={styles.settingDescription}>View license details</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </Pressable>

                        {/* Theme Settings Card */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.settingCard,
                                pressed && styles.settingCardPressed
                            ]}
                            onPress={handleTheme}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#FFA776' }]}>
                                <Ionicons name="color-palette" size={24} color="#1F2937" />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={styles.settingTitle}>Theme</Text>
                                <Text style={styles.settingDescription}>Coming soon</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </Pressable>

                        {/* Issues & Feedback Card */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.settingCard,
                                pressed && styles.settingCardPressed
                            ]}
                            onPress={handleIssues}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#FFA89A' }]}>
                                <Ionicons name="bug" size={24} color="#1F2937" />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={styles.settingTitle}>Report Issues</Text>
                                <Text style={styles.settingDescription}>Help us improve</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </Pressable>

                        {/* Reset Onboarding Card (Developer Option) */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.settingCard,
                                pressed && styles.settingCardPressed
                            ]}
                            onPress={handleResetOnboarding}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#B8A4F5' }]}>
                                <Ionicons name="refresh" size={24} color="#1F2937" />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={styles.settingTitle}>Reset Onboarding</Text>
                                <Text style={styles.settingDescription}>View welcome screens again</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </Pressable>

                        {/* About Section */}
                        <View style={styles.aboutSection}>
                            <Text style={styles.aboutTitle}>About OpenBMTC</Text>
                            <Text style={styles.aboutText}>
                                An open source application for Bangalore Public Transport.
                                Built with ❤️ for the community.
                            </Text>
                            <View style={styles.creditContainer}>
                                <Text style={styles.creditText}>created by jagath-sajjan </Text>
                                <Text style={styles.creditHeart}>♥</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F4EF',
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    floatingShape: {
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.04,
    },
    shape1: {
        width: 160,
        height: 160,
        backgroundColor: '#ec4899',
        top: '25%',
        left: -50,
    },
    shape2: {
        width: 130,
        height: 130,
        backgroundColor: '#34d399',
        bottom: '25%',
        right: -40,
    },
    header: {
        paddingTop: 16,
        paddingBottom: 24,
    },
    title: {
        color: '#1F2937',
        fontFamily: 'Poppins_700Bold',
        marginBottom: 2,
        letterSpacing: -0.8,
    },
    subtitle: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'Poppins_400Regular',
    },
    content: {
        flex: 1,
        gap: 16,
    },
    settingCard: {
        backgroundColor: '#FAF8F5',
        borderRadius: 20,
        borderWidth: 2.5,
        borderColor: '#2D3748',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    settingCardPressed: {
        backgroundColor: '#E5E7EB',
        transform: [{ scale: 0.98 }],
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: '#2D3748',
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 18,
        color: '#1F2937',
        fontFamily: 'Poppins_600SemiBold',
        marginBottom: 2,
        letterSpacing: -0.3,
    },
    settingDescription: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'Poppins_400Regular',
    },
    aboutSection: {
        marginTop: 16,
        backgroundColor: '#FAF8F5',
        borderRadius: 20,
        borderWidth: 2.5,
        borderColor: '#2D3748',
        padding: 24,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    aboutTitle: {
        fontSize: 20,
        color: '#1F2937',
        fontFamily: 'Poppins_700Bold',
        marginBottom: 12,
        letterSpacing: -0.4,
    },
    aboutText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'Poppins_400Regular',
        lineHeight: 22,
        marginBottom: 16,
    },
    creditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    creditText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'Poppins_400Regular',
    },
    creditHeart: {
        fontSize: 12,
        color: '#EF4444',
    },
});
