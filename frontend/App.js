import React from 'react';
import { registerRootComponent } from 'expo';
import './styles.css';
import SkillSyncApp from './components/SkillSyncApp';

function App() {
	return <SkillSyncApp />;
}

// Expo-friendly entry that works on native and web
registerRootComponent(App);
