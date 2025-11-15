import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createProduct, getCategoryTree } from '../../services/productService';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import type { ProductCreateRequest, CategoryTree, FieldErrors } from '../../types';

const AddProduct = () => {
  const { t } = useTranslation('products');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const barcodeFromUrl = searchParams.get('barcode') || '';

  const [formData, setFormData] = useState<ProductCreateRequest>({
    barcode: barcodeFromUrl,
    name: '',
    brand: '',
    description: '',
    category_id: undefined,
    image_url: '',
  });

  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ProductCreateRequest>>({});

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategoryTree();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'category_id' ? (value ? parseInt(value) : undefined) : value,
    }));
    // Clear field error when user types
    if (fieldErrors[name as keyof ProductCreateRequest]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const errors: FieldErrors<ProductCreateRequest> = {};

    if (!formData.barcode.trim()) {
      errors.barcode = t('addProduct.barcodeRequired');
    }

    if (!formData.name.trim()) {
      errors.name = t('addProduct.productNameRequired');
    }

    if (!formData.brand.trim()) {
      errors.brand = t('addProduct.brandRequired');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const product = await createProduct(formData);

      // Always redirect to product details page
      // Users can view and add prices to their own pending products
      if (product.is_pending) {
        // Show info message about pending approval
        alert(t('addProduct.successAlert'));
      }

      // Redirect to product details page (works for both pending and approved)
      navigate(`/products/${product.id}`);
    } catch (err) {
      const apiFieldErrors = getFieldErrors(err);
      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors(apiFieldErrors as FieldErrors<ProductCreateRequest>);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render category options (including subcategories)
  const renderCategoryOptions = (cats: CategoryTree[], level: number = 0): JSX.Element[] => {
    const options: JSX.Element[] = [];

    cats.forEach((cat) => {
      const indent = '\u00A0\u00A0'.repeat(level); // Non-breaking spaces for indentation
      options.push(
        <option key={cat.id} value={cat.id}>
          {indent}
          {cat.icon} {cat.name}
        </option>
      );

      if (cat.subcategories && cat.subcategories.length > 0) {
        options.push(...renderCategoryOptions(cat.subcategories, level + 1));
      }
    });

    return options;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('addProduct.title')}</h1>
          <p className="text-gray-600">
            {t('addProduct.subtitle')}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Barcode */}
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addProduct.barcodeLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                id="barcode"
                name="barcode"
                type="text"
                value={formData.barcode}
                onChange={handleChange}
                placeholder={t('addProduct.barcodePlaceholder')}
                className={`w-full px-4 py-3 border ${
                  fieldErrors.barcode ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono`}
                disabled={isLoading}
                required
              />
              {fieldErrors.barcode && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.barcode}</p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addProduct.productNameLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('addProduct.productNamePlaceholder')}
                className={`w-full px-4 py-3 border ${
                  fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                disabled={isLoading}
                required
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addProduct.brandLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                value={formData.brand}
                onChange={handleChange}
                placeholder={t('addProduct.brandPlaceholder')}
                className={`w-full px-4 py-3 border ${
                  fieldErrors.brand ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                disabled={isLoading}
                required
              />
              {fieldErrors.brand && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.brand}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addProduct.categoryLabel')}
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                disabled={isLoading || isLoadingCategories}
              >
                <option value="">{t('addProduct.categoryPlaceholder')}</option>
                {renderCategoryOptions(categories)}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addProduct.descriptionLabel')}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('addProduct.descriptionPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addProduct.imageUrlLabel')}
              </label>
              <input
                id="image_url"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder={t('addProduct.imageUrlPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('addProduct.imageUrlHelper')}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all"
                disabled={isLoading}
              >
                {t('addProduct.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t('addProduct.submitting')}
                  </>
                ) : (
                  t('addProduct.submit')
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <svg
                className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium text-gray-900 mb-1">{t('addProduct.reviewTitle')}</p>
                <p>
                  {t('addProduct.reviewDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
