import React from 'react';
import ChatThread from '../../components/chat/ChatThread';

export default function ChatScreen({ route }) {
  return (
    <ChatThread
      title="Messages"
      backTo="StudentDashboard"
      defaultTestUid="firebase-uid-student1"
      defaultTestRole="student"
      route={route}
    />
  );
}