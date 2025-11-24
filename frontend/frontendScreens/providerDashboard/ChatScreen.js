import React from 'react';
import ChatThread from '../../components/chat/ChatThread';

export default function ChatScreen({ route }) {
  return (
    <ChatThread
      title="Chat"
      backTo="ProviderDashboard"
      defaultTestUid="firebase-uid-provider1"
      defaultTestRole="provider"
      route={route}
    />
  );
}