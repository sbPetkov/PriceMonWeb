import api from './api';
import type {
  ShoppingList,
  ShoppingListListItem,
  ShoppingListCreateRequest,
  ShoppingListItem,
  ShoppingListItemCreateRequest,
  ShoppingListMember,
  StoreComparison,
} from '../types';

// Shopping Lists
export const getShoppingLists = async (): Promise<ShoppingListListItem[]> => {
  const response = await api.get('/shopping/lists/');
  // Handle both paginated and non-paginated responses
  return Array.isArray(response.data) ? response.data : response.data.results || [];
};

export const getShoppingListById = async (id: number): Promise<ShoppingList> => {
  const response = await api.get(`/shopping/lists/${id}/`);
  return response.data;
};

export const createShoppingList = async (data: ShoppingListCreateRequest): Promise<ShoppingList> => {
  const response = await api.post('/shopping/lists/', data);
  return response.data;
};

export const updateShoppingList = async (id: number, data: Partial<ShoppingListCreateRequest>): Promise<ShoppingList> => {
  const response = await api.patch(`/shopping/lists/${id}/`, data);
  return response.data;
};

export const deleteShoppingList = async (id: number): Promise<void> => {
  await api.delete(`/shopping/lists/${id}/`);
};

// Members
export const addMember = async (
  listId: number,
  email: string,
  role: 'owner' | 'editor' = 'editor'
): Promise<ShoppingListMember> => {
  const response = await api.post(`/shopping/lists/${listId}/add_member/`, { email, role });
  return response.data;
};

export const removeMember = async (listId: number, userId: number): Promise<void> => {
  await api.delete(`/shopping/lists/${listId}/remove_member/`, { data: { user_id: userId } });
};

// Items
export const addItem = async (
  listId: number,
  data: ShoppingListItemCreateRequest
): Promise<ShoppingListItem> => {
  const response = await api.post(`/shopping/lists/${listId}/add_item/`, data);
  return response.data;
};

export const updateItem = async (
  listId: number,
  itemId: number,
  data: Partial<ShoppingListItemCreateRequest>
): Promise<ShoppingListItem> => {
  const response = await api.patch(`/shopping/lists/${listId}/update_item/`, {
    item_id: itemId,
    ...data,
  });
  return response.data;
};

export const toggleItemChecked = async (
  listId: number,
  itemId: number,
  checked: boolean
): Promise<ShoppingListItem> => {
  const response = await api.patch(`/shopping/lists/${listId}/update_item/`, {
    item_id: itemId,
    checked,
  });
  return response.data;
};

export const removeItem = async (listId: number, itemId: number): Promise<void> => {
  await api.delete(`/shopping/lists/${listId}/remove_item/`, { data: { item_id: itemId } });
};

// Store Comparison
export const compareStores = async (listId: number, storeIds: number[]): Promise<StoreComparison> => {
  const response = await api.post(`/shopping/lists/${listId}/compare_stores/`, { store_ids: storeIds });
  return response.data;
};
