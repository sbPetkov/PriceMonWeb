import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getShoppingLists, createShoppingList, deleteShoppingList } from '../../services/shoppingListService';
import { getErrorMessage } from '../../services/api';
import type { ShoppingListListItem } from '../../types';

const ShoppingLists = () => {
  const { t } = useTranslation('shopping');
  const navigate = useNavigate();
  const [lists, setLists] = useState<ShoppingListListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      setIsLoading(true);
      const data = await getShoppingLists();
      console.log('Shopping lists data:', data);
      setLists(data);
    } catch (err) {
      console.error('Error loading shopping lists:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) {
      setCreateError(t('messages.enterListName'));
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      const newList = await createShoppingList({ name: newListName.trim() });
      setShowCreateModal(false);
      setNewListName('');
      // Reload lists to get the correct format
      await loadLists();
      // Navigate to the new list
      navigate(`/shopping-lists/${newList.id}`);
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteList = async (listId: number, listName: string) => {
    if (!confirm(t('deleteConfirm', { name: listName }))) {
      return;
    }

    try {
      await deleteShoppingList(listId);
      setLists(lists.filter(l => l.id !== listId));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const getProgressPercent = (list: ShoppingListListItem) => {
    if (list.item_count === 0) return 0;
    return Math.round((list.checked_count / list.item_count) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-500 mt-1">{t('subtitle')}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">{t('newList')}</span>
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noLists')}</h3>
            <p className="text-gray-500 mb-6">{t('noListsDesc')}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('createList')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {lists.map((list) => {
              const progress = getProgressPercent(list);
              return (
                <div
                  key={list.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                          {list.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {t('by')} {list.owner?.first_name || list.owner?.username || 'Unknown'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id, list.name);
                        }}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title={t('deleteTitle')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span>{t('totalItems', { count: list.item_count })}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>
                          {list.member_count === 0 ? t('justYou') : `${list.member_count + 1} ${list.member_count + 1 === 1 ? t('member') : t('members')}`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {list.item_count > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">{t('progress')}</span>
                          <span className="font-medium text-gray-900">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {t('completed', { checked: list.checked_count, total: list.item_count })}
                        </p>
                      </div>
                    )}

                    {/* View Button */}
                    <button
                      onClick={() => navigate(`/shopping-lists/${list.id}`)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {t('viewList')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('createList')}</h3>

            <form onSubmit={handleCreateList} className="space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div>
                <label htmlFor="list-name" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('listName')}
                </label>
                <input
                  id="list-name"
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder={t('listNamePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isCreating}
                  autoFocus
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewListName('');
                    setCreateError('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-all"
                  disabled={isCreating}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newListName.trim()}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? t('creating') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingLists;
