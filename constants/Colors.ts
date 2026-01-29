/**
 * Below are the colors that are used in the app.
 */

const tintColorLight = '#5E7CE2'; // Primary Blue from screenshot
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F8F9FA', // Light grey background
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#5E7CE2', // The main button/border color
    secondary: '#EBF1FF', // Light blue background for selected items
    border: '#E6E8EB',
    card: '#FFFFFF',
    textSecondary: '#687076', // Muted text
    success: '#3FB950', // For "Open" status
    warning: '#F5A623', // For "Pending" / "Held"
    error: '#D32F2F', // For "Booked" or Closed
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#5E7CE2',
    secondary: '#2C3550',
    border: '#3E4451',
    card: '#24272e',
    textSecondary: '#9BA1A6',
    success: '#3FB950',
    warning: '#F5A623',
    error: '#EF5350',
  },
};
