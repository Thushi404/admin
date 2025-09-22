import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { categoriesAPI } from '../../services/api';
import { mockApi } from '../../services/mockApi';
import toast from 'react-hot-toast';

const EditCategoryModal = ({ isOpen, onClose, onSuccess, category }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent: '',
    isActive: true,
    sortOrder: 0,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });
  const [loading, setLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState([]);
  const [loadingParentCategories, setLoadingParentCategories] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    if (isOpen && category) {
      fetchParentCategories();
      // Populate form with category data
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parent: category.parent?._id || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
        sortOrder: category.sortOrder || 0,
        seoTitle: category.seoTitle || '',
        seoDescription: category.seoDescription || '',
        seoKeywords: category.seoKeywords ? category.seoKeywords.join(', ') : '',
      });
      setCurrentImage(category.image);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen, category]);

  const fetchParentCategories = async () => {
    setLoadingParentCategories(true);
    try {
      const response = await categoriesAPI.getAll({ limit: 100 });
      console.log('API Response for parent categories:', response.data);
      
      // Handle different response structures
      const categories = response.data.data?.categories || response.data.data || [];
      console.log('Categories extracted:', categories);
      
      // Filter out the current category and its children to prevent circular references
      const filteredCategories = categories.filter(cat => 
        cat._id !== category._id && 
        !isChildCategory(cat, category._id)
      );
      console.log('Filtered parent categories:', filteredCategories);
      setParentCategories(filteredCategories);
    } catch (error) {
      console.error('Error fetching parent categories, using mock data:', error);
      try {
        const mockResponse = await mockApi.getCategories({ limit: 100 });
        console.log('Mock Response for parent categories:', mockResponse.data);
        
        const categories = mockResponse.data.data?.categories || mockResponse.data.data || [];
        console.log('Mock categories extracted:', categories);
        
        const filteredCategories = categories.filter(cat => 
          cat._id !== category._id && 
          !isChildCategory(cat, category._id)
        );
        console.log('Filtered mock parent categories:', filteredCategories);
        setParentCategories(filteredCategories);
      } catch (mockError) {
        console.error('Error with mock data:', mockError);
        setParentCategories([]);
      }
    } finally {
      setLoadingParentCategories(false);
    }
  };

  const isChildCategory = (category, parentId) => {
    if (!category.children) return false;
    return category.children.some(child => 
      child._id === parentId || isChildCategory(child, parentId)
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCurrentImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setLoading(true);
    
    try {
      // Update the category
      const categoryData = {
        ...formData,
        parent: formData.parent || null,
        sortOrder: parseInt(formData.sortOrder) || 0,
        seoKeywords: formData.seoKeywords ? formData.seoKeywords.split(',').map(k => k.trim()) : [],
      };

      const response = await categoriesAPI.update(category._id, categoryData);

      // If new image is selected, upload it
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append('image', imageFile);
          await categoriesAPI.uploadImage(category._id, formData);
        } catch (uploadError) {
          console.error('Image upload failed, but category was updated:', uploadError);
          // Don't fail the entire operation if image upload fails
        }
      }

      toast.success('Category updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('API update failed, trying mock:', error);
      try {
        const categoryData = {
          ...formData,
          parent: formData.parent || null,
          sortOrder: parseInt(formData.sortOrder) || 0,
          seoKeywords: formData.seoKeywords ? formData.seoKeywords.split(',').map(k => k.trim()) : [],
        };

        await mockApi.updateCategory(category._id, categoryData);
        toast.success('Category updated successfully');
        onSuccess();
        onClose();
      } catch (mockError) {
        console.error('Mock update also failed:', mockError);
        toast.error('Failed to update category');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Category</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleInputChange}
                  className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter category description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Category
              </label>
              <select
                name="parent"
                value={formData.parent}
                onChange={handleInputChange}
                className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={loadingParentCategories}
              >
                <option value="">No parent (Root category)</option>
                {loadingParentCategories ? (
                  <option value="" disabled>Loading categories...</option>
                ) : parentCategories && parentCategories.length > 0 ? (
                  parentCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No categories available</option>
                )}
              </select>
              {!loadingParentCategories && parentCategories && parentCategories.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No parent categories available (excluding current category and its children)
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active category
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Category Image</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Image
              </label>
              {(currentImage && currentImage.url) || imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview || currentImage?.url}
                    alt="Current"
                    className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-32 w-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {(currentImage && currentImage.url) ? 'Replace Image' : 'Upload Image'}
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="image-upload"
                            name="image"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SEO Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">SEO Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Title
              </label>
              <input
                type="text"
                name="seoTitle"
                value={formData.seoTitle}
                onChange={handleInputChange}
                className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter SEO title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Description
              </label>
              <textarea
                name="seoDescription"
                value={formData.seoDescription}
                onChange={handleInputChange}
                rows={3}
                className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter SEO description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Keywords
              </label>
              <input
                type="text"
                name="seoKeywords"
                value={formData.seoKeywords}
                onChange={handleInputChange}
                className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter keywords separated by commas"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate keywords with commas (e.g., clothing, fashion, style)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-md"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-md"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;
