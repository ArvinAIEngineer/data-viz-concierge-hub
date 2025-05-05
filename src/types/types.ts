
export interface Customer {
  id: number;
  name: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  partnershipLevel: string;
}

export interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export interface DataCard {
  title: string;
  source: string;
  count: string;
  trend: string;
  newCount: string;
}
