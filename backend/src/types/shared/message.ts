export type MessageType = 'text' | 'file';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  fileURL: string | null;
  fileType: string | null;
  readAt: Date | null;
  createdAt: Date;
}
