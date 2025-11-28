import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Group, Expense, Settlement, Member } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Groups
export function useGroup(groupId: string | undefined) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'groups', groupId),
      (snapshot) => {
        if (snapshot.exists()) {
          setGroup({ id: snapshot.id, ...snapshot.data() } as Group);
        } else {
          setError('Group not found');
          setGroup(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching group:', err);
        setError('Failed to load group');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { group, loading, error };
}

export async function createGroup(
  name: string, 
  currency: string, 
  memberNames: string[],
  userId?: string // Optional: signed-in user's ID
): Promise<string> {
  const members: Member[] = memberNames.map(name => ({
    id: uuidv4(),
    name: name.trim(),
  }));

  const groupData: Record<string, unknown> = {
    name,
    currency,
    members,
    createdAt: new Date().toISOString(),
  };

  // If user is signed in, track who created the group
  if (userId) {
    groupData.createdBy = userId;
    groupData.userIds = [userId]; // Add to userIds array for querying
  }

  const docRef = await addDoc(collection(db, 'groups'), groupData);
  return docRef.id;
}

// Fetch groups created by a specific user
export function useUserGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Query groups where user is in the userIds array
    // This includes groups created by the user AND groups where they claimed a member
    const q = query(
      collection(db, 'groups'),
      where('userIds', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groupList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Group[];
        // Sort by createdAt descending (newest first)
        groupList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setGroups(groupList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching user groups:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { groups, loading };
}

export async function updateGroupMembers(groupId: string, members: Member[]): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), { members });
}

export async function updateGroupName(groupId: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), { name });
}

// Claim a member as the current user
export async function claimMember(groupId: string, members: Member[], memberId: string, userId: string): Promise<void> {
  const updatedMembers = members.map(m => {
    if (m.id === memberId) {
      return { ...m, claimedBy: userId };
    }
    // Remove claim from any other member claimed by this user
    if (m.claimedBy === userId) {
      const { claimedBy, ...rest } = m;
      return rest;
    }
    return m;
  });
  await updateDoc(doc(db, 'groups', groupId), { 
    members: updatedMembers,
    userIds: arrayUnion(userId) // Add user to group's userIds for querying
  });
}

// Add a new member and claim them
export async function addAndClaimMember(groupId: string, members: Member[], name: string, userId: string): Promise<void> {
  // Remove any existing claim by this user
  const clearedMembers = members.map(m => {
    if (m.claimedBy === userId) {
      const { claimedBy, ...rest } = m;
      return rest;
    }
    return m;
  });
  
  const newMember: Member = {
    id: uuidv4(),
    name: name.trim(),
    claimedBy: userId,
  };
  
  await updateDoc(doc(db, 'groups', groupId), { 
    members: [...clearedMembers, newMember],
    userIds: arrayUnion(userId) // Add user to group's userIds for querying
  });
}

// Expenses
export function useExpenses(groupId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    // Query without orderBy to avoid needing composite index
    // Sort client-side instead
    const q = query(
      collection(db, 'expenses'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const expenseList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Expense[];
        // Sort by createdAt descending (newest first)
        expenseList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setExpenses(expenseList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching expenses:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { expenses, loading };
}

export async function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<string> {
  const expenseData = {
    ...expense,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'expenses'), expenseData);
  return docRef.id;
}

export async function updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
  await updateDoc(doc(db, 'expenses', expenseId), updates);
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, 'expenses', expenseId));
}

// Settlements
export function useSettlements(groupId: string | undefined) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    // Query without orderBy to avoid needing composite index
    // Sort client-side instead
    const q = query(
      collection(db, 'settlements'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const settlementList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Settlement[];
        // Sort by createdAt descending (newest first)
        settlementList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSettlements(settlementList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching settlements:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { settlements, loading };
}

export async function addSettlement(settlement: Omit<Settlement, 'id' | 'createdAt'>): Promise<string> {
  const settlementData = {
    ...settlement,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'settlements'), settlementData);
  return docRef.id;
}

export async function deleteSettlement(settlementId: string): Promise<void> {
  await deleteDoc(doc(db, 'settlements', settlementId));
}

// Delete a group and optionally its associated expenses and settlements
export async function deleteGroup(groupId: string, deleteAssociated: boolean = true): Promise<void> {
  if (deleteAssociated) {
    // Delete all expenses for this group
    const expensesQuery = query(collection(db, 'expenses'), where('groupId', '==', groupId));
    const expensesSnapshot = await getDocs(expensesQuery);
    for (const expenseDoc of expensesSnapshot.docs) {
      await deleteDoc(doc(db, 'expenses', expenseDoc.id));
    }

    // Delete all settlements for this group
    const settlementsQuery = query(collection(db, 'settlements'), where('groupId', '==', groupId));
    const settlementsSnapshot = await getDocs(settlementsQuery);
    for (const settlementDoc of settlementsSnapshot.docs) {
      await deleteDoc(doc(db, 'settlements', settlementDoc.id));
    }
  }

  // Delete the group itself
  await deleteDoc(doc(db, 'groups', groupId));
}

