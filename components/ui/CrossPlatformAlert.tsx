import { Colors } from '@/constants/Colors';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Modal, Platform, Pressable, Alert as RNAlert, StyleSheet, Text, View } from 'react-native';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
    title: string;
    message?: string;
    buttons?: AlertButton[];
}

interface AlertContextType {
    showAlert: (config: AlertConfig) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}

interface AlertProviderProps {
    children: React.ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<AlertConfig | null>(null);

    const showAlert = useCallback((alertConfig: AlertConfig) => {
        // On native platforms, use the native Alert
        if (Platform.OS !== 'web') {
            RNAlert.alert(
                alertConfig.title,
                alertConfig.message,
                alertConfig.buttons as any
            );
            return;
        }

        // On web, use our custom modal
        setConfig(alertConfig);
        setVisible(true);
    }, []);

    const handleButtonPress = useCallback((button?: AlertButton) => {
        setVisible(false);
        if (button?.onPress) {
            // Small delay to let the modal close first
            setTimeout(() => {
                button.onPress?.();
            }, 100);
        }
    }, []);

    const getButtonStyle = (style?: string) => {
        switch (style) {
            case 'destructive':
                return { color: Colors.light.error };
            case 'cancel':
                return { fontWeight: '600' as const };
            default:
                return { color: Colors.light.primary };
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => handleButtonPress()}
            >
                <View style={styles.overlay}>
                    <View style={styles.alertContainer}>
                        <Text style={styles.title}>{config?.title}</Text>
                        {config?.message && (
                            <Text style={styles.message}>{config.message}</Text>
                        )}
                        <View style={styles.buttonContainer}>
                            {(config?.buttons || [{ text: 'OK' }]).map((button, index) => (
                                <Pressable
                                    key={index}
                                    style={({ pressed }) => [
                                        styles.button,
                                        pressed && styles.buttonPressed,
                                        button.style === 'destructive' && styles.destructiveButton,
                                    ]}
                                    onPress={() => handleButtonPress(button)}
                                >
                                    <Text style={[styles.buttonText, getButtonStyle(button.style)]}>
                                        {button.text}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertContainer: {
        backgroundColor: Colors.light.background,
        borderRadius: 16,
        padding: 24,
        maxWidth: 340,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        backgroundColor: Colors.light.secondary,
        minWidth: 80,
    },
    buttonPressed: {
        opacity: 0.7,
    },
    destructiveButton: {
        backgroundColor: '#FFEBEE',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
});
