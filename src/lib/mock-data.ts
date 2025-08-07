

import type { User, Product, Service, Transaction, Conversation, AgreementProposal } from './types';
import { add } from 'date-fns';

export const users: User[] = [
  { id: 'corabo-admin', name: 'CorabO Admin', type: 'client', role: 'admin', reputation: 5, profileImage: 'https://i.postimg.cc/Wz1MTvWK/lg.png', email: 'admin@corabo.app', phone: '0', emailValidated: true, phoneValidated: true, isGpsActive: false, gallery: [] },
];

export const products: Product[] = [];

export const services: Service[] = [];

export const initialTransactions: Transaction[] = [];

export const initialConversations: Conversation[] = [];
