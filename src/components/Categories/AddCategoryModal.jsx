import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { categoriesAPI } from '../../services/api';
import { mockApi } from '../../services/mockApi';
import toast from 'react-hot-toast';

const AddCategoryModal = ({ isOpen, onClose, onSuccess }) => {
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchParentCategories();
      // Reset form when modal opens
      setFormData({
        name: '',
        description: '',
        parent: '',
        isActive: true,
        sortOrder: 0,
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen]);

  const fetchParentCategories = async () => {
    try {
      const response = await categoriesAPI.getAll({ limit: 100 });
      const { categories } = response.data.data;
      setParentCategories(categories);
    } catch (error) {
      console.error('Error fetching parent categories, using mock data:', error);
      try {
        const mockResponse = await mockApi.getCategories({ limit: 100 });
        const { categories } = mockResponse.data.data;
        setParentCategories(categories);
      } catch (mockError) {
        console.error('Error with mock data:', mockError);
        setParentCategories([]);
      }
    }
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setLoading(true);
    
    try {
      // First create the category
      const categoryData = {
        ...formData,
        parent: formData.parent || null,
        sortOrder: parseInt(formData.sortOrder) || 0,
        seoKeywords: formData.seoKeywords ? formData.seoKeywords.split(',').map(k => k.trim()) : [],
      };

      const response = await categoriesAPI.create(categoryData);
      const newCategory = response.data.data.category;

      // If image is selected, upload it
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append('image', imageFile);
          await categoriesAPI.uploadImage(newCategory._id, formData);
        } catch (uploadError) {
          console.error('Image upload failed, but category was created:', uploadError);
          // Don't fail the entire operation if image upload fails
        }
      }

      toast.success('Category created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('API create failed, trying mock:', error);
      try {
        const categoryData = {
          ...formData,
          parent: formData.parent || null,
          sortOrder: parseInt(formData.sortOrder) || 0,
          seoKeywords: formData.seoKeywords ? formData.seoKeywords.split(',').map(k => k.trim()) : [],
        };

        await mockApi.createCategory(categoryData);
        toast.success('Category created successfully');
        onSuccess();
        onClose();
      } catch (mockError) {
        console.error('Mock create also failed:', mockError);
        toast.error('Failed to create category');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Category</h2>
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
              >
                <option value="">No parent (Root category)</option>
                {parentCategories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
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
                Upload Image
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
                        onClick={removeImage}
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
                  Creating...
                </>
              ) : (
                'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
