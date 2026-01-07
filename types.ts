export type UserTier = 'FREE' | 'SILVER' | 'GOLD';

export interface User {
  id: string;
  name: string;
  email: string;
  tier: UserTier;
  isAdmin: boolean;
  credits: number;
}

export type ScannerType = 'FOOD' | 'VEHICLE' | 'DOCUMENT' | 'OBJECT';

export interface ScanResult {
  id: string;
  date: string;
  type: ScannerType;
  imageUrl: string;
  summary: string;
  details: any; // Flexible for JSON content from AI
}

export interface SupportTicket {
  id: string;
  user: string;
  subject: string;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
}
