'use client';

import React, { useState, useEffect } from 'react';
import api from '@/app/utils/api';

interface Message {
  _id: string;
  orderId?: { _id: string; orderType: string; status: string };
  houseId: { _id: string; title: string; location: any; propertyType: string };
  phone?: string;
  email?: string;
  name?: string;
  subject: string;
  message: string;
  response?: string;
  status: 'pending' | 'responded';
  createdAt: string;
  respondedAt?: string;
}

interface MessageGroup {
  id: string; // houseId + contact
  houseId: string;
  houseTitle: string;
  houseType: string;
  houseLocation: string;
  contact: string;
  name: string;
  email?: string;
  phone?: string;
  messages: Message[];
  pendingCount: number;
}

const AdminMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [responseText, setResponseText] = useState('');
  const [editingId, setEditingId] = useState('');
  const [viewingGroup, setViewingGroup] = useState<MessageGroup | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    responded: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    let filtered = messages;
    
    // Apply subject filter
    if (selectedSubject) {
      filtered = filtered.filter(msg => msg.subject === selectedSubject);
    }
    
    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(msg => msg.status === selectedStatus);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.name?.toLowerCase().includes(query) ||
        (msg.email && msg.email.toLowerCase().includes(query)) ||
        (msg.phone && msg.phone.includes(query)) ||
        msg.subject.toLowerCase().includes(query) ||
        msg.message.toLowerCase().includes(query) ||
        (msg.houseId?.title?.toLowerCase().includes(query)) ||
        (msg.response && msg.response.toLowerCase().includes(query))
      );
    }
    
    setFilteredMessages(filtered);
    
    // Group messages by house + contact
    const grouped: Record<string, MessageGroup> = {};
    
    filtered.forEach(msg => {
      const contact = msg.email || msg.phone || 'anonymous';
      const groupKey = `${msg.houseId._id}_${contact}`;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          id: groupKey,
          houseId: msg.houseId._id,
          houseTitle: msg.houseId.title,
          houseType: msg.houseId.propertyType,
          houseLocation: `${msg.houseId.location?.city || ''}, ${msg.houseId.location?.state || ''}`,
          contact,
          name: msg.name || 'Anonymous',
          email: msg.email,
          phone: msg.phone,
          messages: [],
          pendingCount: 0
        };
      }
      
      grouped[groupKey].messages.push(msg);
      if (msg.status === 'pending') {
        grouped[groupKey].pendingCount++;
      }
    });
    
    // Convert to array and sort by most recent message
    const groupedArray = Object.values(grouped).map(group => ({
      ...group,
      messages: group.messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }));
    
    setMessageGroups(groupedArray);
    
    // Update stats
    const total = messages.length;
    const pending = messages.filter(msg => msg.status === 'pending').length;
    const responded = messages.filter(msg => msg.status === 'responded').length;
    
    setStats({ total, pending, responded });
  }, [messages, selectedSubject, selectedStatus, searchQuery]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/messages');
      setMessages(response.data);
      setError('');
    } catch (error: any) {
      setError('Error fetching messages');
      console.error('Fetch messages error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseSubmit = async (id: string) => {
    if (!responseText.trim()) {
      setError('Please enter a response');
      return;
    }
    
    try {
      await api.patch(`/messages/${id}/response`, { 
        response: responseText 
      });
      setResponseText('');
      setEditingId('');
      fetchMessages();
      setError('');
    } catch (error: any) {
      setError('Error submitting response');
      console.error('Submit response error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await api.delete(`/messages/${id}`);
      fetchMessages();
      setError('');
    } catch (error: any) {
      setError('Error deleting message');
      console.error('Delete message error:', error);
    }
  };

  const getMessageGroup = (groupId: string) => {
    return messageGroups.find(group => group.id === groupId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubjectLabel = (subject: string) => {
    const labels: Record<string, string> = {
      'general': 'General',
      'property-inquiry': 'Property Inquiry',
      'booking-request': 'Booking Request',
      'payment-issue': 'Payment Issue',
      'support': 'Support',
      'other': 'Other'
    };
    return labels[subject] || subject;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6 md:mb-8">Message Management</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-2 md:p-3 mr-3 md:mr-4">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-xl md:text-2xl font-bold text-purple-700">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-2 md:p-3 mr-3 md:mr-4">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Pending Responses</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-2 md:p-3 mr-3 md:mr-4">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Responded</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{stats.responded}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-4 md:mb-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-purple-700">Search & Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mb-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Messages
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, property, subject, or message..."
                className="block w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
              />
            </div>
          </div>
          
          {/* Filters - Hidden on mobile by default */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label htmlFor="subjectFilter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Subject
                </label>
                <select
                  id="subjectFilter"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 text-sm md:text-base"
                >
                  <option value="">All Subjects</option>
                  <option value="general">General</option>
                  <option value="property-inquiry">Property Inquiry</option>
                  <option value="booking-request">Booking Request</option>
                  <option value="payment-issue">Payment Issue</option>
                  <option value="support">Support</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  id="statusFilter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 text-sm md:text-base"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="responded">Responded</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Messages Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
          {/* Mobile View - Cards */}
          <div className="md:hidden">
            {messageGroups.length === 0 ? (
              <div className="text-center py-8 px-4">
                <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filters to see more results.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {messageGroups.map((group) => (
                  <div key={group.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900">{group.houseTitle}</h3>
                          <span className="text-xs text-gray-500">{group.houseType}</span>
                        </div>
                        <p className="text-xs text-gray-500">{group.houseLocation}</p>
                        <p className="text-sm font-medium text-gray-800 mt-2">{group.name}</p>
                        <p className="text-xs text-gray-500">{group.contact}</p>
                      </div>
                      <button
                        onClick={() => setViewingGroup(group)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-100 relative"
                        title="View all messages"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {group.pendingCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                            {group.pendingCount}
                          </span>
                        )}
                      </button>
                    </div>
                    
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {group.messages.length} message{group.messages.length !== 1 ? 's' : ''}
                      </div>
                      {group.pendingCount > 0 ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {group.pendingCount} pending
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">All responded</span>
                      )}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Last activity: {new Date(group.messages[group.messages.length - 1].createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Messages
                  </th>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messageGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{group.houseTitle}</div>
                      <div className="text-xs text-gray-500">{group.houseType} • {group.houseLocation}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-sm text-gray-900">{group.name}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-sm text-gray-900">{group.contact}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-sm text-gray-900">{group.messages.length}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      {group.pendingCount > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {group.pendingCount} pending
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">All responded</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(group.messages[group.messages.length - 1].createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setViewingGroup(group)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-100 relative"
                          title="View all messages"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {group.pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                              {group.pendingCount}
                            </span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {messageGroups.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filters to see more results.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Message Group Modal */}
        {viewingGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-purple-700">
                    Messages: {viewingGroup.houseTitle}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    From: {viewingGroup.name} ({viewingGroup.contact})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewingGroup(null);
                    setEditingId('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Property Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Property</p>
                    <p className="text-sm font-medium">{viewingGroup.houseTitle}</p>
                    <p className="text-xs text-gray-500 mt-1">{viewingGroup.houseType}</p>
                    <p className="text-xs text-gray-500">{viewingGroup.houseLocation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="text-sm font-medium">{viewingGroup.name}</p>
                    {viewingGroup.email && <p className="text-xs text-gray-500">{viewingGroup.email}</p>}
                    {viewingGroup.phone && <p className="text-xs text-gray-500">{viewingGroup.phone}</p>}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 md:space-y-6">
                {viewingGroup.messages.map((message) => (
                  <div key={message._id} className="border border-gray-200 rounded-lg p-3 md:p-4 relative">
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(message._id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      title="Delete message"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    {/* Message content */}
                    <div className="w-full md:w-3/4 bg-gray-50 p-3 md:p-4 rounded-lg mb-3 md:mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs md:text-sm font-medium text-purple-700 capitalize">
                          {getSubjectLabel(message.subject)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{message.message}</p>
                      <div className="text-xs text-gray-500">
                        Status: 
                        <span className={`ml-1 px-2 py-1 rounded-full ${
                          message.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {message.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Response content */}
                    {message.response ? (
                      <div className="w-full md:w-3/4 ml-auto p-3 md:p-4 bg-blue-50 rounded-lg border border-gray-200">
                        {editingId === message._id ? (
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs md:text-sm font-medium text-green-700">Response</span>
                              <span className="text-xs text-gray-500">
                                {message.respondedAt && formatDate(message.respondedAt)}
                              </span>
                            </div>
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2 text-sm"
                              placeholder="Type your response here..."
                            ></textarea>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleResponseSubmit(message._id)}
                                className="px-3 py-1 bg-purple-600 text-white text-xs md:text-sm rounded hover:bg-purple-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId('');
                                  setResponseText('');
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs md:text-sm rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs md:text-sm font-medium text-green-700">Response</span>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500 mr-2">
                                  {message.respondedAt && formatDate(message.respondedAt)}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingId(message._id);
                                    setResponseText(message.response || '');
                                  }}
                                  className="text-xs text-purple-600 hover:text-purple-800 flex items-center"
                                  title="Edit response"
                                >
                                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.response}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full md:w-3/4 ml-auto p-3 md:p-4 rounded-lg border border-gray-200">
                        {editingId === message._id ? (
                          <div>
                            <span className="text-xs md:text-sm font-medium text-green-700 mb-2 block">Add Response</span>
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2 text-sm"
                              placeholder="Type your response here..."
                            ></textarea>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleResponseSubmit(message._id)}
                                className="px-3 py-1 bg-purple-600 text-white text-xs md:text-sm rounded hover:bg-purple-700"
                              >
                                Submit
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId('');
                                  setResponseText('');
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs md:text-sm rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <button
                              onClick={() => setEditingId(message._id)}
                              className="px-3 py-1 md:px-4 md:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs md:text-sm"
                            >
                              Add Response
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg text-sm">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessagesPage;