import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getShoppingListById,
  addItem,
  updateItem,
  toggleItemChecked,
  removeItem,
  compareStores,
  addMember,
  removeMember,
} from '../../services/shoppingListService';
import { getStores, getProducts } from '../../services/productService';
import { getErrorMessage } from '../../services/api';
import type {
  ShoppingList,
  ShoppingListItem,
  ShoppingListItemCreateRequest,
  Store,
  ProductList,
  StoreComparison,
} from '../../types';

const ShoppingListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('shopping');

  const [list, setList] = useState<ShoppingList | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Add item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'product' | 'custom'>('product');
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ProductList[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductList | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [isAdding, setIsAdding] = useState(false);

  // Store comparison
  const [showComparison, setShowComparison] = useState(false);
  const [selectedStores, setSelectedStores] = useState<Store[]>([]);
  const [comparison, setComparison] = useState<StoreComparison | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [storeSearchResults, setStoreSearchResults] = useState<Store[]>([]);
  const [isSearchingStores, setIsSearchingStores] = useState(false);

  // Member management
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [listData, storesData] = await Promise.all([
        getShoppingListById(parseInt(id)),
        getStores(),
      ]);
      setList(listData);
      setStores(storesData.results);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setProductSearch(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await getProducts({ search: query });
      setSearchResults(results.results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: ProductList) => {
    setSelectedProduct(product);
    setSearchResults([]);
    setProductSearch('');
  };

  const handleAddItem = async () => {
    if (!list) return;

    // Validate quantity
    const quantityNum = typeof quantity === 'string' ? parseInt(quantity) : quantity;
    if (!quantityNum || quantityNum <= 0 || isNaN(quantityNum)) {
      alert('Please enter a valid quantity (must be greater than 0)');
      return;
    }

    const data: ShoppingListItemCreateRequest = { quantity: quantityNum };

    if (addMode === 'custom') {
      if (!customItemName.trim()) {
        alert('Please enter an item name');
        return;
      }
      data.custom_name = customItemName.trim();

      // Check if custom item with same name already exists
      const existingItem = list.items.find(
        item => item.custom_name && item.custom_name.toLowerCase() === customItemName.trim().toLowerCase()
      );
      if (existingItem) {
        // Increment quantity for existing custom item
        setIsAdding(true);
        try {
          const newQuantity = existingItem.quantity + quantityNum;
          const updatedItem = await updateItem(list.id, existingItem.id, { quantity: newQuantity });
          setList({
            ...list,
            items: list.items.map(i => i.id === existingItem.id ? updatedItem : i),
          });
          setShowAddModal(false);
          resetAddModal();
        } catch (err) {
          alert(getErrorMessage(err));
        } finally {
          setIsAdding(false);
        }
        return;
      }
    } else {
      if (!selectedProduct) {
        alert('Please select a product from search results');
        return;
      }
      data.product_id = selectedProduct.id;

      // Check if product already exists in list
      const existingItem = list.items.find(item => item.product === selectedProduct.id);
      if (existingItem) {
        // Increment quantity for existing product
        setIsAdding(true);
        try {
          const newQuantity = existingItem.quantity + quantityNum;
          const updatedItem = await updateItem(list.id, existingItem.id, { quantity: newQuantity });
          setList({
            ...list,
            items: list.items.map(i => i.id === existingItem.id ? updatedItem : i),
          });
          setShowAddModal(false);
          resetAddModal();
        } catch (err) {
          alert(getErrorMessage(err));
        } finally {
          setIsAdding(false);
        }
        return;
      }
    }

    setIsAdding(true);
    try {
      const newItem = await addItem(list.id, data);
      setList({
        ...list,
        items: [...list.items, newItem],
        item_count: list.item_count + 1,
      });
      setShowAddModal(false);
      resetAddModal();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsAdding(false);
    }
  };

  const resetAddModal = () => {
    setAddMode('product');
    setProductSearch('');
    setSearchResults([]);
    setSelectedProduct(null);
    setCustomItemName('');
    setQuantity(1);
  };

  const handleToggleChecked = async (item: ShoppingListItem) => {
    if (!list) return;
    try {
      await toggleItemChecked(list.id, item.id, !item.checked);
      setList({
        ...list,
        items: list.items.map(i =>
          i.id === item.id ? { ...i, checked: !i.checked } : i
        ),
        checked_count: item.checked ? list.checked_count - 1 : list.checked_count + 1,
      });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!list) return;
    if (!confirm('Remove this item from the list?')) return;

    try {
      await removeItem(list.id, itemId);
      const removedItem = list.items.find(i => i.id === itemId);
      setList({
        ...list,
        items: list.items.filter(i => i.id !== itemId),
        item_count: list.item_count - 1,
        checked_count: removedItem?.checked ? list.checked_count - 1 : list.checked_count,
      });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleCompareStores = async () => {
    if (!list || selectedStores.length < 2) {
      alert('Please select at least 2 stores to compare');
      return;
    }

    if (selectedStores.length > 3) {
      alert('Please select a maximum of 3 stores to compare');
      return;
    }

    setIsComparing(true);
    try {
      const storeIds = selectedStores.map(s => s.id);
      const result = await compareStores(list.id, storeIds);
      setComparison(result);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsComparing(false);
    }
  };

  // Helper to check if store is selected
  const isStoreSelected = (storeId: number) => selectedStores.some(s => s.id === storeId);

  // Helper to toggle store selection
  const toggleStoreSelection = (store: Store) => {
    if (isStoreSelected(store.id)) {
      setSelectedStores(selectedStores.filter(s => s.id !== store.id));
    } else if (selectedStores.length < 3) {
      setSelectedStores([...selectedStores, store]);
    } else {
      alert('Maximum 3 stores can be selected');
    }
  };

  // Search stores with debounce
  const handleStoreSearch = async (query: string) => {
    setStoreSearch(query);

    if (!query.trim()) {
      setStoreSearchResults([]);
      return;
    }

    setIsSearchingStores(true);
    try {
      const results = await getStores();
      const filtered = results.results.filter(store => {
        const q = query.toLowerCase();
        return (
          store.name.toLowerCase().includes(q) ||
          store.chain.toLowerCase().includes(q) ||
          store.city?.toLowerCase().includes(q) ||
          store.address?.toLowerCase().includes(q)
        );
      });
      setStoreSearchResults(filtered.slice(0, 20)); // Limit to 20 results
    } catch (err) {
      console.error('Error searching stores:', err);
    } finally {
      setIsSearchingStores(false);
    }
  };

  // Get chain stores (popular chains) for suggestions
  const chainStores = stores.filter(store =>
    ['Kaufland', 'Lidl', 'Billa', 'Fantastico', 'T-Market', 'Metro'].some(chain =>
      store.chain.toLowerCase().includes(chain.toLowerCase())
    )
  );

  // Calculate percentage savings - only based on items available in ALL stores
  const calculateSavings = (storeData: StoreComparison['stores'], items?: StoreComparison['items']) => {
    if (storeData.length < 2) return [];

    let maxPrice = 0;
    let validStoreData = storeData;

    // If we have item-level data, recalculate totals based on items available in ALL stores
    if (items && items.length > 0) {
      const storeIds = storeData.map(s => s.store_id);

      // Filter to only products that have prices in ALL compared stores
      const commonItems = items.filter(item => {
        if (item.is_custom) return false;
        return storeIds.every(storeId => item.store_prices[storeId] !== null);
      });

      // Recalculate totals based on common items only
      validStoreData = storeData.map(store => {
        const commonTotal = commonItems.reduce((sum, item) => {
          const price = item.store_prices[store.store_id];
          return sum + (price ? price * item.quantity : 0);
        }, 0);

        return {
          ...store,
          total_price_eur: commonTotal,
          total_price_bgn: commonTotal * 1.95583,
          items_with_prices: commonItems.length,
        };
      });

      maxPrice = Math.max(...validStoreData.map(s => s.total_price_eur));
    } else {
      maxPrice = Math.max(...validStoreData.map(s => s.total_price_eur));
    }

    return validStoreData.map(store => {
      const savingsAmount = maxPrice - store.total_price_eur;
      const savingsPercent = maxPrice > 0 ? (savingsAmount / maxPrice) * 100 : 0;
      return {
        ...store,
        savingsAmount,
        savingsPercent,
        isExpensive: store.total_price_eur === maxPrice,
      };
    }).sort((a, b) => a.total_price_eur - b.total_price_eur);
  };

  const handleAddMember = async () => {
    if (!list || !memberEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    setIsAddingMember(true);
    try {
      const newMember = await addMember(list.id, memberEmail.trim(), 'editor');
      setList({
        ...list,
        members: [...list.members, newMember],
      });
      setShowAddMemberModal(false);
      setMemberEmail('');
      alert('Member added successfully!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!list) return;
    if (!confirm('Remove this member from the list?')) return;

    try {
      await removeMember(list.id, userId);
      setList({
        ...list,
        members: list.members.filter(m => m.user.id !== userId),
      });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading list...</p>
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('listNotFound')}</h2>
          <p className="text-gray-600 mb-6">{error || t('listNotFoundDesc')}</p>
          <button
            onClick={() => navigate('/shopping-lists')}
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-6 rounded-lg transition-all"
          >
            {t('backToLists')}
          </button>
        </div>
      </div>
    );
  }

  const progress = list.item_count > 0 ? Math.round((list.checked_count / list.item_count) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/shopping-lists')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('backToLists')}
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{list.name}</h1>
              <p className="text-gray-500 mt-1">
                {t('itemsCount', { count: list.item_count })} • {list.checked_count} {t('completedText')}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowMembersModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {t('membersButton', { count: list.members.length })}
              </button>
              <button
                onClick={() => setShowComparison(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {t('compareStoresButton')}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('addItemButton')}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {list.item_count > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Items List */}
        {list.items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Items Yet</h3>
            <p className="text-gray-500 mb-6">Start adding items to your shopping list</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add First Item
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {list.items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                    item.checked ? 'opacity-60' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleChecked(item)}
                    className="flex-shrink-0"
                  >
                    {item.checked ? (
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </button>

                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-gray-900 ${item.checked ? 'line-through' : ''}`}>
                      {item.name}
                    </h4>
                    {item.product_details && (
                      <p className="text-sm text-gray-500">{item.product_details.brand}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="flex-shrink-0">
                    <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('addItemModal.title')}</h3>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAddMode('product')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  addMode === 'product'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('addItemModal.fromProducts')}
              </button>
              <button
                onClick={() => setAddMode('custom')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  addMode === 'custom'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('addItemModal.customItem')}
              </button>
            </div>

            <div className="space-y-4">
              {addMode === 'product' ? (
                <>
                  {/* Product Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('addItemModal.searchLabel')}
                    </label>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder={t('addItemModal.searchPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Selected Product Display */}
                  {selectedProduct && !productSearch && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-green-600 font-medium mb-1">{t('addItemModal.selectedProduct')}</p>
                          <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                          <p className="text-sm text-gray-500">{selectedProduct.brand}</p>
                        </div>
                        <button
                          onClick={() => setSelectedProduct(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {isSearching ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500">{t('addItemModal.searching')}</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                      {searchResults.slice(0, 5).map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors ${
                            selectedProduct?.id === product.id ? 'bg-primary-50 border-l-4 border-l-primary' : ''
                          }`}
                        >
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-500">{product.brand}</p>
                          {selectedProduct?.id === product.id && (
                            <p className="text-xs text-primary mt-1 font-medium">{t('addItemModal.selected')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : productSearch && (
                    <p className="text-sm text-gray-500 text-center py-4">{t('addItemModal.noProducts')}</p>
                  )}
                </>
              ) : (
                /* Custom Item Input */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('addItemModal.itemNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder={t('addItemModal.itemNamePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('addItemModal.quantityLabel')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder={t('addItemModal.quantityPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddModal();
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-all"
                  disabled={isAdding}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={isAdding}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {isAdding ? t('addItemModal.adding') : t('addItemModal.addItem')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Comparison Modal */}
      {showComparison && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{t('compareStores.title')}</h3>
              <button
                onClick={() => {
                  setShowComparison(false);
                  setSelectedStores([]);
                  setComparison(null);
                  setStoreSearch('');
                  setStoreSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!comparison ? (
              <>
                <p className="text-gray-600 mb-4">{t('compareStores.selectPrompt')}</p>

                {/* Selected stores summary */}
                {selectedStores.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      {t('compareStores.selectedStores', { count: selectedStores.length })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedStores.map(store => (
                        <span key={store.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                          {store.name} {store.city && `(${store.city})`}
                          <button
                            onClick={() => setSelectedStores(selectedStores.filter(s => s.id !== store.id))}
                            className="ml-1 hover:text-blue-900"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular chain stores suggestions */}
                {!storeSearch && chainStores.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">{t('compareStores.popularChains')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {chainStores.slice(0, 6).map((store) => (
                        <button
                          key={store.id}
                          onClick={() => toggleStoreSelection(store)}
                          disabled={selectedStores.length >= 3 && !isStoreSelected(store.id)}
                          className={`p-3 border-2 rounded-lg transition-all text-left ${
                            isStoreSelected(store.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          <p className="font-medium text-gray-900">{store.name}</p>
                          {store.city && <p className="text-xs text-gray-500">{store.city}</p>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search bar */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={storeSearch}
                      onChange={(e) => handleStoreSearch(e.target.value)}
                      placeholder={t('compareStores.searchPlaceholder')}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {isSearchingStores && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search results */}
                {storeSearch && storeSearchResults.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {t('compareStores.searchResults', { count: storeSearchResults.length })}
                    </p>
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                      {storeSearchResults.map((store) => (
                        <button
                          key={store.id}
                          onClick={() => toggleStoreSelection(store)}
                          disabled={selectedStores.length >= 3 && !isStoreSelected(store.id)}
                          className={`w-full p-3 border-b border-gray-100 hover:bg-gray-50 transition-all text-left flex items-center justify-between ${
                            isStoreSelected(store.id) ? 'bg-primary/5' : ''
                          } ${selectedStores.length >= 3 && !isStoreSelected(store.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{store.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {store.chain && (
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                  {store.chain}
                                </span>
                              )}
                              {store.city && (
                                <span className="text-xs text-gray-500">{store.city}</span>
                              )}
                            </div>
                            {store.address && (
                              <p className="text-xs text-gray-400 mt-1">{store.address}</p>
                            )}
                          </div>
                          {isStoreSelected(store.id) && (
                            <svg className="w-5 h-5 text-primary flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {storeSearch && !isSearchingStores && storeSearchResults.length === 0 && (
                  <div className="mb-6 text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p>{t('compareStores.noStoresFound', { query: storeSearch })}</p>
                    <p className="text-sm mt-1">{t('compareStores.tryDifferent')}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowComparison(false);
                      setSelectedStores([]);
                      setComparison(null);
                      setStoreSearch('');
                      setStoreSearchResults([]);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompareStores}
                    disabled={selectedStores.length < 2 || isComparing}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                  >
                    {isComparing ? 'Comparing...' : `Compare ${selectedStores.length} ${selectedStores.length === 1 ? 'Store' : 'Stores'}`}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Comparison Results */}
                <div className="mb-6">
                  {/* Summary Cards with Percentage Savings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {calculateSavings(comparison.stores, comparison.items).map((store, index) => (
                      <div
                        key={store.store_id}
                        className={`p-4 rounded-lg border-2 ${
                          index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {index === 0 && <span className="text-lg">🏆</span>}
                              <h4 className="font-semibold text-gray-900">{store.store_name}</h4>
                            </div>
                            {(store.store_city || store.store_address) && (
                              <p className="text-xs text-gray-500">
                                {store.store_city}
                                {store.store_address && ` • ${store.store_address.substring(0, 30)}${store.store_address.length > 30 ? '...' : ''}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-2xl font-bold text-gray-900">
                            {store.total_price_bgn.toFixed(2)} лв
                          </p>
                          <p className="text-sm text-gray-500">
                            {store.total_price_eur.toFixed(2)} €
                          </p>
                        </div>

                        {/* Percentage comparison */}
                        {store.isExpensive ? (
                          <div className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded">
                            {t('mostExpensive')}
                          </div>
                        ) : store.savingsPercent > 0 ? (
                          <div className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                            {t('cheaperBy', { percent: store.savingsPercent.toFixed(1), amount: store.savingsAmount.toFixed(2) })}
                          </div>
                        ) : null}

                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                          <span>{t('itemsWithPrices', { available: store.items_with_prices, total: comparison.total_items })}</span>
                          <span>•</span>
                          <span>{t('coveragePercent', { percent: store.coverage_percent })}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Info banner about comparison methodology */}
                  {comparison.items && comparison.items.length > 0 && (() => {
                    const storeIds = comparison.stores.map(s => s.store_id);
                    const commonItems = comparison.items.filter(item => {
                      if (item.is_custom) return false;
                      return storeIds.every(storeId => item.store_prices[storeId] !== null);
                    });
                    const missingItemsCount = comparison.items.filter(item => !item.is_custom).length - commonItems.length;

                    return missingItemsCount > 0 ? (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">Comparison based on common items</p>
                            <p className="text-xs text-blue-700 mt-1">
                              Savings percentages calculated using {commonItems.length} {commonItems.length === 1 ? 'item' : 'items'} available in all stores.
                              {missingItemsCount > 0 && ` ${missingItemsCount} ${missingItemsCount === 1 ? 'item' : 'items'} excluded due to missing prices.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Detailed Item-by-Item Comparison Table */}
                  {comparison.items && comparison.items.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-900">Item-by-Item Price Comparison</h4>
                        <p className="text-sm text-gray-500 mt-1">Detailed breakdown of prices at each store</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                                Product
                              </th>
                              {comparison.stores.map(store => (
                                <th key={store.store_id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  <div className="font-semibold text-gray-900">{store.store_name}</div>
                                  {store.store_city && <div className="text-xs text-gray-400 font-normal normal-case">{store.store_city}</div>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {comparison.items.filter(item => !item.is_custom).map((item) => {
                              const prices = comparison.stores.map(store => item.store_prices[store.store_id]);
                              const validPrices = prices.filter(p => p !== null) as number[];
                              const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

                              return (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 sticky left-0 bg-white z-10">
                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                    {item.brand && <div className="text-xs text-gray-500">{item.brand}</div>}
                                    <div className="text-xs text-gray-400">Qty: {item.quantity}</div>
                                  </td>
                                  {comparison.stores.map(store => {
                                    const priceEur = item.store_prices[store.store_id];
                                    const priceBgn = priceEur ? priceEur * 1.95583 : null;
                                    const totalPriceEur = priceEur ? priceEur * item.quantity : null;
                                    const totalPriceBgn = totalPriceEur ? totalPriceEur * 1.95583 : null;
                                    const isBestPrice = priceEur !== null && minPrice !== null && priceEur === minPrice;

                                    return (
                                      <td key={store.store_id} className={`px-4 py-3 text-center ${isBestPrice ? 'bg-green-50' : ''}`}>
                                        {priceEur !== null ? (
                                          <div>
                                            <div className={`text-sm font-semibold ${isBestPrice ? 'text-green-700' : 'text-gray-900'}`}>
                                              {totalPriceBgn!.toFixed(2)} лв
                                              {isBestPrice && ' ✓'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {priceBgn!.toFixed(2)} лв ea.
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-sm text-gray-400 italic">N/A</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}

                            {/* Custom items notice */}
                            {comparison.items.some(item => item.is_custom) && (
                              <tr>
                                <td colSpan={comparison.stores.length + 1} className="px-4 py-3 bg-yellow-50 border-t-2 border-yellow-200">
                                  <div className="flex items-center gap-2 text-sm text-yellow-800">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">
                                      {comparison.items.filter(item => item.is_custom).length} custom {comparison.items.filter(item => item.is_custom).length === 1 ? 'item' : 'items'} not included in comparison
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )}

                            {/* Total row */}
                            <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                              <td className="px-4 py-3 sticky left-0 bg-gray-100 z-10 text-gray-900">
                                TOTAL
                              </td>
                              {comparison.stores.map(store => {
                                return (
                                  <td key={store.store_id} className="px-4 py-3 text-center">
                                    <div className="text-lg text-gray-900">
                                      {store.total_price_bgn.toFixed(2)} лв
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {store.total_price_eur.toFixed(2)} €
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setComparison(null);
                      setStoreSearch('');
                      setStoreSearchResults([]);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-all"
                  >
                    Compare Different Stores
                  </button>
                  <button
                    onClick={() => {
                      setShowComparison(false);
                      setSelectedStores([]);
                      setComparison(null);
                      setStoreSearch('');
                      setStoreSearchResults([]);
                    }}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{t('membersModal.title')}</h3>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Owner */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">{t('membersModal.owner')}</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {list.owner.first_name || list.owner.username}
                  </p>
                  <p className="text-sm text-gray-500">{list.owner.email}</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                  {t('membersModal.owner')}
                </span>
              </div>
            </div>

            {/* Members */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-500">{t('membersModal.sharedWith')}</h4>
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    setShowAddMemberModal(true);
                  }}
                  className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('membersModal.addMemberButton')}
                </button>
              </div>

              {list.members.filter(m => m.user.id !== list.owner.id).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>{t('membersModal.noMembers')}</p>
                  <p className="text-sm mt-1">{t('membersModal.noMembersDesc')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {list.members.filter(m => m.user.id !== list.owner.id).map((member) => (
                    <div
                      key={member.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.user.first_name || member.user.username}
                        </p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.user.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowMembersModal(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-all"
            >
              {t('membersModal.close')}
            </button>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('membersModal.addMemberTitle')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('membersModal.emailLabel')}
                </label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder={t('membersModal.emailPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('membersModal.emailHelper')}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setMemberEmail('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-all"
                  disabled={isAddingMember}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={isAddingMember || !memberEmail.trim()}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {isAddingMember ? t('membersModal.adding') : t('membersModal.addMember')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListDetail;
