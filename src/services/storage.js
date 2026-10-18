// Local persistence via AsyncStorage (device-only; nothing is synced to the cloud).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEY } from '../constants';

export const readRaw = () => AsyncStorage.getItem(KEY);
export const writeRaw = (value) => AsyncStorage.setItem(KEY, value);
