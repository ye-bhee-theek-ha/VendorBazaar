export interface ParticipantProfile {
  uid: string;
  fullName: string;
  photoURL?: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  participant_ids: string[];
  last_message_text?: string;
  last_message_at?: string;
  last_message_sender_id?: string;
  last_read_at?: string;
  otherParticipant?: ParticipantProfile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
