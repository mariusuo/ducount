export interface Member {
  id: string;
  name: string;
  claimedBy?: string; // User ID if member is claimed by a signed-in user
}

export interface Split {
  memberId: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string; // member id
  splitBetween: Split[];
  date: string; // ISO string
  createdAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  from: string; // member id
  to: string; // member id
  amount: number;
  date: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  currency: string;
  members: Member[];
  createdAt: string;
  createdBy?: string; // User ID if created by signed-in user
  userIds?: string[]; // Array of user IDs associated with this group (for querying)
}

export interface Balance {
  from: string; // member id
  to: string; // member id
  amount: number;
}

// For balance calculations
export interface MemberBalance {
  memberId: string;
  balance: number; // positive = owed money, negative = owes money
}

