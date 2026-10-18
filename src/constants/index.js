// Momentum 2.0 constants: storage key, priorities, colors, reminder options.
export const KEY = 'momentum:v1';
export const PRI = {
  1: { label: 'P1', name: 'Urgent', color: '#E5484D' },
  2: { label: 'P2', name: 'High', color: '#F76B15' },
  3: { label: 'P3', name: 'Medium', color: '#3E63DD' },
  4: { label: 'P4', name: 'Low', color: '#8B8D98' },
};
export const PROJECT_COLORS = ['#5B50E6', '#E5484D', '#F76B15', '#30A46C', '#0091FF', '#D6409F', '#8B8D98'];
export const LIGHT = { bg: '#F7F6F3', card: '#FFFFFF', text: '#1F1F24', sub: '#6B6B76', border: '#E8E6E1', accent: '#5B50E6', soft: '#ECEAFD', danger: '#E5484D', onAccent: '#FFFFFF' };
export const DARK = { bg: '#121214', card: '#1C1C20', text: '#F2F2F4', sub: '#9A9AA5', border: '#2B2B31', accent: '#8B82FF', soft: '#2A2750', danger: '#FF6369', onAccent: '#121214' };
export const VERSION = '2.0';
export const OFFSETS = [[0, 'At due time'], [5, '5 min before'], [10, '10 min before'], [15, '15 min before'], [30, '30 min before'], [60, '1 hour before'], [1440, '1 day before']];
export const DEMO_TITLES = ['Review project brief', 'Reply to design feedback', 'Go for a 20 minute walk', 'Plan next week', 'Book dentist appointment', 'Read about React Native animations', 'Pick a birthday gift idea'];
