import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { productsAPI, categoriesAPI } from '../../services/api';
import { mockApi } from '../../services/mockApi';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import ProductViewModal from './ProductViewModal';
import toast from 'react-hot-toast';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      };

      const response = await productsAPI.getAll(params);
      const { products: productsData, pagination } = response.data.data;
      
      setProducts(productsData);
      setTotalPages(pagination.totalPages);
      setTotalProducts(pagination.totalProducts);
    } catch (error) {
      console.error('Error fetching products from API, using mock data:', error);
      // Use mock data when API fails
      try {
        const mockResponse = await mockApi.getProducts(params);
        const { products: productsData, pagination } = mockResponse.data.data;
        
        setProducts(productsData);
        setTotalPages(pagination.totalPages);
        setTotalProducts(pagination.totalProducts);
      } catch (mockError) {
        console.error('Error with mock data:', mockError);
        toast.error('Failed to fetch products');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoriesAPI.getAll({ limit: 100 });
      
      // Handle different response structures
      if (response.data && response.data.data) {
        const { categories: categoriesData } = response.data.data;
        
        // Check if we have categories data
        if (categoriesData && Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          // If categories is not an array, use the data directly
          setCategories(response.data.data.categories || []);
        }
      } else if (response.data && response.data.categories) {
        // Handle direct categories response
        setCategories(response.data.categories || []);
      } else if (response.data && response.data.data && response.data.data.categories) {
        // Handle nested categories response
        setCategories(response.data.data.categories || []);
      } else {
        throw new Error('Unexpected API response structure');
      }
    } catch (error) {
      console.error('Error fetching categories from API, using mock data:', error);
      try {
        const mockResponse = await mockApi.getCategories({ limit: 100 });
        setCategories(mockResponse.data.data.categories || []);
      } catch (mockError) {
        console.error('Error with mock data:', mockError);
        toast.error('Failed to fetch categories');
        setCategories([]);
      }
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleDeleteProduct = (productId) => {
    const product = products.find(p => p._id === productId);
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await productsAPI.delete(productToDelete._id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('API delete failed, trying mock:', error);
      try {
        await mockApi.deleteProduct(productToDelete._id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (mockError) {
        console.error('Mock delete also failed:', mockError);
        toast.error('Failed to delete product');
      }
    } finally {
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const handleProductCreated = () => {
    fetchProducts(); // Refresh the products list
  };

  const handleProductUpdated = () => {
    fetchProducts(); // Refresh the products list
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { color: 'bg-success-100 text-success-800', label: 'Published' },
      draft: { color: 'bg-warning-100 text-warning-800', label: 'Draft' },
      archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived' },
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-md w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content mt-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, brand, or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={categoriesLoading}
              >
                <option value="all">
                  {categoriesLoading ? 'Loading categories...' : 'All Categories'}
                </option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="card">
        <div className="card-content p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="p-6">
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first product.</p>
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="btn btn-primary btn-md w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <div key={product._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-medium transition-shadow">
                      {/* Product Image */}
                      <div className="aspect-square bg-gray-100 relative">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          {getStatusBadge(product.status)}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div>
                            {product.variants && product.variants.length > 0 && (
                              <div className="text-sm">
                                <span className="text-gray-500">From </span>
                                <span className="font-medium text-gray-900">
                                  {formatPrice(product.variants[0].price.regular)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => handleViewProduct(product)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="View product"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Edit product"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product._id)}
                              className="p-1 text-gray-400 hover:text-danger-600"
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Stock Status */}
                        <div className="mt-2">
                          {product.variants && product.variants.some(v => v.stockQuantity <= 10) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                              In Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {products.length > 0 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * 12 + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * 12, totalProducts)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalProducts}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleProductCreated}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        onSuccess={handleProductUpdated}
        product={selectedProduct}
      />

      {/* Product View Modal */}
      <ProductViewModal
        product={selectedProduct}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedProduct(null);
        }}
        onDelete={handleDeleteProduct}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Delete Product
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <strong>{productToDelete.name}</strong>? This action cannot be undone and will permanently remove the product and all its data.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(null);
                }}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="btn btn-danger btn-sm"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
