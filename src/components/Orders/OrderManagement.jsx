import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  Truck,
  CreditCard,
  Edit,
  Calendar,
  User,
  MapPin,
} from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { mockApi } from '../../services/mockApi';
import OrderViewModal from './OrderViewModal';
import OrderStatusModal from './OrderStatusModal';
import ShippingModal from './ShippingModal';
import PaymentModal from './PaymentModal';
import OrderDeliveryModal from './OrderDeliveryModal';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, paymentStatusFilter, dateFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentStatusFilter !== 'all' && { paymentStatus: paymentStatusFilter }),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const response = await ordersAPI.getAll(params);
      // Handle both API response structures
      const ordersData = response.data.data || response.data;
      const pagination = response.data.pagination;
      
      setOrders(ordersData || []);
      setTotalPages(pagination?.totalPages || 1);
      setTotalOrders(pagination?.totalOrders || 0);
    } catch (error) {
      console.error('Error fetching orders from API, using mock data:', error);
      try {
        const params = {
          page: currentPage,
          limit: 20,
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(paymentStatusFilter !== 'all' && { paymentStatus: paymentStatusFilter }),
          sortBy: 'createdAt',
          sortOrder: 'desc',
        };
        
        const mockResponse = await mockApi.getOrders(params);
        const { orders: ordersData, pagination } = mockResponse.data.data;
        
        setOrders(ordersData || []);
        setTotalPages(pagination?.totalPages || 1);
        setTotalOrders(pagination?.totalOrders || 0);
      } catch (mockError) {
        console.error('Error with mock data:', mockError);
        toast.error('Failed to fetch orders');
        setOrders([]);
        setTotalPages(1);
        setTotalOrders(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await ordersAPI.getStats();
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Error fetching order stats:', error);
      // Use mock stats as fallback
      try {
        const mockResponse = await mockApi.getStats();
        setStats(mockResponse.data.data.stats);
      } catch (mockError) {
        console.error('Error with mock stats:', mockError);
        setStats(null);
      }
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleUpdateShipping = (order) => {
    setSelectedOrder(order);
    setShowShippingModal(true);
  };

  const handleUpdatePayment = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleAssignDelivery = (order) => {
    setSelectedOrder(order);
    setShowDeliveryModal(true);
  };

  const handleOrderUpdated = () => {
    fetchOrders();
    fetchStats();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-orange-100 text-orange-800', label: 'Pending' },
      confirmed: { color: 'bg-purple-100 text-purple-800', label: 'Confirmed' },
      assigned: { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      out_for_delivery: { color: 'bg-yellow-100 text-yellow-800', label: 'Out for Delivery' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-warning-100 text-warning-800', label: 'Pending' },
      paid: { color: 'bg-success-100 text-success-800', label: 'Paid' },
      failed: { color: 'bg-danger-100 text-danger-800', label: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDateFilterOptions = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    return [
      { value: 'all', label: 'All Time' },
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: 'lastWeek', label: 'Last 7 Days' },
      { value: 'lastMonth', label: 'Last 30 Days' },
    ];
  };

  const generateOrdersPDF = () => {
    if (!orders || orders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    // Helper function to add text with word wrap
    const addText = (text, x, y, maxWidth = 170) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace = 20) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('Order Management Report', margin, yPosition);
    yPosition += 10;

    // Report generation date and filters
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Generated on: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, margin, yPosition);
    
    // Add filter information
    if (searchTerm) {
      yPosition = addText(`Search Filter: "${searchTerm}"`, margin, yPosition);
    }
    if (statusFilter !== 'all') {
      yPosition = addText(`Status Filter: ${statusFilter.replace('_', ' ').toUpperCase()}`, margin, yPosition);
    }
    if (paymentStatusFilter !== 'all') {
      yPosition = addText(`Payment Filter: ${paymentStatusFilter.toUpperCase()}`, margin, yPosition);
    }
    if (dateFilter !== 'all') {
      const dateFilterLabel = getDateFilterOptions().find(opt => opt.value === dateFilter)?.label || dateFilter;
      yPosition = addText(`Date Filter: ${dateFilterLabel}`, margin, yPosition);
    }
    
    yPosition += 15;

    // Summary section
    if (stats) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('Summary Statistics', margin, yPosition);
      yPosition += 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      yPosition = addText(`Total Orders: ${stats.totalOrders}`, margin, yPosition);
      yPosition = addText(`Pending Orders: ${stats.pendingOrders}`, margin, yPosition);
      yPosition = addText(`Completed Orders: ${stats.completedOrders}`, margin, yPosition);
      yPosition = addText(`Total Revenue: ${formatPrice(stats.totalRevenue)}`, margin, yPosition);
      yPosition += 15;
    }

    // Current page summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    yPosition = addText(`Current Page: ${orders.length} orders (Page ${currentPage} of ${totalPages})`, margin, yPosition);
    yPosition += 10;

    // Orders details
    orders.forEach((order, index) => {
      checkNewPage(60);
      
      // Order header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      yPosition = addText(`Order #${order.orderNumber}`, margin, yPosition);
      yPosition += 5;

      // Order details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      yPosition = addText(`Order ID: ${order._id}`, margin, yPosition);
      yPosition = addText(`Status: ${order.status.replace('_', ' ').toUpperCase()}`, margin, yPosition);
      yPosition = addText(`Payment Status: ${(order.payment?.status || order.paymentStatus || 'pending').toUpperCase()}`, margin, yPosition);
      yPosition = addText(`Total Amount: ${formatPrice(order.totalAmount)}`, margin, yPosition);
      yPosition = addText(`Created Date: ${formatDate(order.createdAt)}`, margin, yPosition);
      yPosition += 5;

      // Customer information
      doc.setFont('helvetica', 'bold');
      yPosition = addText('Customer Information:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const customer = order.customer || order.user;
      yPosition = addText(`Name: ${customer?.firstName} ${customer?.lastName}`, margin, yPosition);
      yPosition = addText(`Email: ${customer?.email}`, margin, yPosition);
      if (customer?.phone) {
        yPosition = addText(`Phone: ${customer.phone}`, margin, yPosition);
      }
      yPosition += 5;

      // Delivery address
      if (order.deliveryAddress) {
        doc.setFont('helvetica', 'bold');
        yPosition = addText('Delivery Address:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition = addText(`${order.deliveryAddress.street}`, margin, yPosition);
        yPosition = addText(`${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}`, margin, yPosition);
        if (order.deliveryAddress.country) {
          yPosition = addText(`${order.deliveryAddress.country}`, margin, yPosition);
        }
        yPosition += 5;
      }

      // Order items
      if (order.items && order.items.length > 0) {
        doc.setFont('helvetica', 'bold');
        yPosition = addText('Order Items:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        
        order.items.forEach((item) => {
          checkNewPage(20);
          yPosition = addText(`• ${item.product?.name || 'Unknown Product'}`, margin + 5, yPosition);
          if (item.variant) {
            yPosition = addText(`  Variant: ${item.variant.size || 'N/A'} - ${item.variant.color?.name || 'N/A'}`, margin + 5, yPosition);
          }
          yPosition = addText(`  Quantity: ${item.quantity} | Unit Price: ${formatPrice(item.unitPrice || 0)} | Total: ${formatPrice(item.totalPrice || 0)}`, margin + 5, yPosition);
        });
        yPosition += 5;
      }

      // Payment information
      if (order.payment) {
        doc.setFont('helvetica', 'bold');
        yPosition = addText('Payment Information:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition = addText(`Method: ${order.payment.method || 'N/A'}`, margin, yPosition);
        yPosition = addText(`Status: ${order.payment.status || 'N/A'}`, margin, yPosition);
        if (order.payment.transactionId) {
          yPosition = addText(`Transaction ID: ${order.payment.transactionId}`, margin, yPosition);
        }
        yPosition += 5;
      }

      // Shipping information
      if (order.shipping) {
        doc.setFont('helvetica', 'bold');
        yPosition = addText('Shipping Information:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        if (order.shipping.trackingNumber) {
          yPosition = addText(`Tracking Number: ${order.shipping.trackingNumber}`, margin, yPosition);
        }
        if (order.shipping.carrier) {
          yPosition = addText(`Carrier: ${order.shipping.carrier}`, margin, yPosition);
        }
        if (order.shipping.estimatedDeliveryDate) {
          yPosition = addText(`Estimated Delivery: ${formatDate(order.shipping.estimatedDeliveryDate)}`, margin, yPosition);
        }
        yPosition += 5;
      }

      // Delivery person information
      if (order.deliveryPerson) {
        doc.setFont('helvetica', 'bold');
        yPosition = addText('Delivery Person:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition = addText(`Name: ${order.deliveryPerson.firstName} ${order.deliveryPerson.lastName}`, margin, yPosition);
        if (order.deliveryPerson.phone) {
          yPosition = addText(`Phone: ${order.deliveryPerson.phone}`, margin, yPosition);
        }
        yPosition += 5;
      }

      // Discount information
      if (order.discount) {
        doc.setFont('helvetica', 'bold');
        yPosition = addText('Discount Applied:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition = addText(`Type: ${order.discount.type || 'N/A'}`, margin, yPosition);
        yPosition = addText(`Amount: ${formatPrice(order.discount.amount || 0)}`, margin, yPosition);
        if (order.discount.code) {
          yPosition = addText(`Code: ${order.discount.code}`, margin, yPosition);
        }
        yPosition += 5;
      }

      yPosition += 10;

      // Add separator line between orders (except for the last one)
      if (index < orders.length - 1) {
        checkNewPage(10);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, 190, yPosition);
        yPosition += 10;
      }
    });

    // Footer with pagination info
    checkNewPage(20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    yPosition = addText(`This report shows ${orders.length} orders from page ${currentPage} of ${totalPages}.`, margin, yPosition);
    yPosition = addText(`Total orders in system: ${totalOrders}`, margin, yPosition);

    // Save the PDF
    const fileName = `orders-report-${new Date().toISOString().split('T')[0]}-page-${currentPage}.pdf`;
    doc.save(fileName);
    toast.success('Orders report downloaded successfully');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Manage customer orders and fulfillment</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchOrders}
            className="btn btn-secondary btn-md"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button 
            onClick={generateOrdersPDF}
            disabled={!orders || orders.length === 0}
            className="btn btn-secondary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-warning-100 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-warning-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-success-100 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-success-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-info-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-info-600">$</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-content mt-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {getDateFilterOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-content p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(!orders || orders.length === 0) ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                          <p className="text-gray-500">No orders match your current filters.</p>
                        </td>
                      </tr>
                    ) : (
                      (orders || []).map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.orderNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {order._id.slice(-8)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary-600" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.customer?.firstName || order.user?.firstName} {order.customer?.lastName || order.user?.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {order.customer?.email || order.user?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.items?.[0]?.product?.name}
                              {order.items?.length > 1 && ` +${order.items.length - 1} more`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(order.totalAmount)}
                            </div>
                            {order.discount && (
                              <div className="text-sm text-success-600">
                                -{formatPrice(order.discount.amount)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPaymentStatusBadge(order.payment?.status || order.paymentStatus)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewOrder(order)}
                                className="text-primary-600 hover:text-primary-900"
                                title="View order"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(order)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Update status"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateShipping(order)}
                                className="text-green-600 hover:text-green-900"
                                title="Update shipping"
                              >
                                <Truck className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUpdatePayment(order)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Update payment"
                              >
                                <CreditCard className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleAssignDelivery(order)}
                                className="text-blue-600 hover:text-blue-900"
                                title={order.deliveryPerson ? "Reassign delivery person" : "Assign delivery person"}
                              >
                                <User className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {orders && orders.length > 0 && (
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
                        <span className="font-medium">{(currentPage - 1) * 20 + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * 20, totalOrders)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{totalOrders}</span>
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

      {/* Order View Modal */}
      <OrderViewModal
        order={selectedOrder}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedOrder(null);
        }}
        onUpdateStatus={handleUpdateStatus}
        onUpdateShipping={handleUpdateShipping}
        onUpdatePayment={handleUpdatePayment}
      />

      {/* Order Status Modal */}
      <OrderStatusModal
        order={selectedOrder}
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedOrder(null);
        }}
        onSuccess={handleOrderUpdated}
      />

      {/* Shipping Modal */}
      <ShippingModal
        order={selectedOrder}
        isOpen={showShippingModal}
        onClose={() => {
          setShowShippingModal(false);
          setSelectedOrder(null);
        }}
        onSuccess={handleOrderUpdated}
      />

      {/* Payment Modal */}
      <PaymentModal
        order={selectedOrder}
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedOrder(null);
        }}
        onSuccess={handleOrderUpdated}
      />

      {/* Delivery Assignment Modal */}
      <OrderDeliveryModal
        order={selectedOrder}
        isOpen={showDeliveryModal}
        onClose={() => {
          setShowDeliveryModal(false);
          setSelectedOrder(null);
        }}
        onSuccess={handleOrderUpdated}
      />
    </div>
  );
};

export default OrderManagement;
