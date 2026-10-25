'use client';

import React, { useState, useEffect } from 'react';
import api from '@/app/utils/api';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import {
  MessageSquare, Clock, CheckCircle2, Search, Filter,
  Trash2, Send, Eye, X, Edit3, Building, User, Mail, Phone,
  ChevronRight, Calendar, AlertCircle
} from 'lucide-react';

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
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [responseText, setResponseText] = useState('');
  const [editingId, setEditingId] = useState('');
  const [viewingGroup, setViewingGroup] = useState<MessageGroup | null>(null);
  const [submittingResponse, setSubmittingResponse] = useState(false);
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
      const groupKey = `${msg.houseId?._id || 'unknown'}_${contact}`;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          id: groupKey,
          houseId: msg.houseId?._id || '',
          houseTitle: msg.houseId?.title || (isAmharic ? 'ያልተገለጸ ንብረት' : 'General Property'),
          houseType: msg.houseId?.propertyType || '',
          houseLocation: `${msg.houseId?.location?.city || ''}${msg.houseId?.location?.state ? `, ${msg.houseId.location.state}` : ''}`,
          contact,
          name: msg.name || (isAmharic ? 'ስም ያልታወቀ' : 'Anonymous'),
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
  }, [messages, selectedSubject, selectedStatus, searchQuery, isAmharic]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/messages');
      setMessages(response.data || []);
      setError('');
    } catch (err: any) {
      setError(isAmharic ? 'መልእክቶችን መጫን አልተቻለም' : 'Error fetching messages');
      console.error('Fetch messages error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseSubmit = async (id: string) => {
    if (!responseText.trim()) {
      setError(isAmharic ? 'እባክዎ ምላሽዎን ያስገቡ' : 'Please enter a response');
      return;
    }
    
    try {
      setSubmittingResponse(true);
      await api.patch(`/messages/${id}/response`, { 
        response: responseText 
      });
      setResponseText('');
      setEditingId('');
      setSuccessMessage(isAmharic ? 'ምላሹ በተሳካ ሁኔታ ተልኳል' : 'Response submitted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchMessages();
      setError('');
    } catch (err: any) {
      setError(isAmharic ? 'ምላሹን መላክ አልተቻለም' : 'Error submitting response');
      console.error('Submit response error:', err);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmText = t('messages.delete_confirm', 'Are you sure you want to delete this message?');
    if (!confirm(confirmText)) return;
    
    try {
      await api.delete(`/messages/${id}`);
      setSuccessMessage(isAmharic ? 'መልእክቱ ተሰርዟል' : 'Message deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchMessages();
      setError('');
    } catch (err: any) {
      setError(isAmharic ? 'መልእክቱን መሰረዝ አልተቻለም' : 'Error deleting message');
      console.error('Delete message error:', err);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(isAmharic ? 'am-ET' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getSubjectLabel = (subject: string) => {
    switch (subject) {
      case 'general':
        return t('messages.subject_general', 'General');
      case 'property-inquiry':
        return t('messages.subject_property_inquiry', 'Property Inquiry');
      case 'booking-request':
        return t('messages.subject_booking_request', 'Booking Request');
      case 'payment-issue':
        return t('messages.subject_payment_issue', 'Payment Issue');
      case 'support':
        return t('messages.subject_support', 'Support');
      case 'other':
        return t('messages.subject_other', 'Other');
      default:
        return subject;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full transition-colors duration-200">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          {t('messages.title', 'Message Management')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('messages.subtitle', 'Review and respond to client inquiries and property messages')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Total Messages */}
        <div className="bg-white dark:bg-[#112240] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {t('messages.total', 'Total Messages')}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>

        {/* Pending Responses */}
        <div className="bg-white dark:bg-[#112240] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {t('messages.pending', 'Pending Responses')}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {stats.pending}
            </p>
          </div>
        </div>

        {/* Responded */}
        <div className="bg-white dark:bg-[#112240] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {t('messages.responded', 'Responded')}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.responded}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Container */}
      <div className="bg-white dark:bg-[#112240] rounded-2xl border border-gray-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('messages.search_placeholder', 'Search by name, email, property, subject, or message...')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-gray-900 dark:text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs font-semibold"
          >
            <Filter className="w-4 h-4" />
            <span>{t('action.filter', 'Filter')}</span>
          </button>
        </div>

        {/* Filters Grid */}
        <div className={`${showFilters ? 'grid' : 'hidden sm:grid'} grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-slate-800/80`}>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
              {t('messages.filter_subject', 'Filter by Subject')}
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0a192f] text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('messages.all_subjects', 'All Subjects')}</option>
              <option value="general">{t('messages.subject_general', 'General')}</option>
              <option value="property-inquiry">{t('messages.subject_property_inquiry', 'Property Inquiry')}</option>
              <option value="booking-request">{t('messages.subject_booking_request', 'Booking Request')}</option>
              <option value="payment-issue">{t('messages.subject_payment_issue', 'Payment Issue')}</option>
              <option value="support">{t('messages.subject_support', 'Support')}</option>
              <option value="other">{t('messages.subject_other', 'Other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
              {t('messages.filter_status', 'Filter by Status')}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0a192f] text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('messages.all_statuses', 'All Statuses')}</option>
              <option value="pending">{t('status.pending', 'Pending')}</option>
              <option value="responded">{t('messages.responded', 'Responded')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages Listing */}
      <div className="bg-white dark:bg-[#112240] rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Mobile View - Rich Cards */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-800">
          {messageGroups.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('messages.no_messages', 'No messages found')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('messages.no_messages_desc', 'Try adjusting your search or filters to see more results.')}
              </p>
            </div>
          ) : (
            messageGroups.map((group) => (
              <div key={group.id} className="p-4 space-y-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {group.houseTitle}
                      </h3>
                    </div>
                    {group.houseLocation && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {group.houseLocation}
                      </p>
                    )}
                  </div>

                  {group.pendingCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      <Clock className="w-3 h-3" />
                      {group.pendingCount} {t('messages.pending_badge', 'pending')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('messages.all_responded', 'Responded')}
                    </span>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">{group.name}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {group.messages.length} {t('messages.count', 'messages')}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {group.contact}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(group.messages[group.messages.length - 1].createdAt)}
                  </span>

                  <button
                    onClick={() => setViewingGroup(group)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('action.view', 'View')}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View - Full Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-500 dark:text-gray-400 uppercase text-[11px] font-semibold tracking-wider border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">{t('messages.property', 'Property')}</th>
                <th className="px-5 py-3.5">{t('messages.customer', 'Customer')}</th>
                <th className="px-5 py-3.5">{t('messages.contact', 'Contact')}</th>
                <th className="px-5 py-3.5">{t('messages.count', 'Messages')}</th>
                <th className="px-5 py-3.5">{t('status.pending', 'Pending')}</th>
                <th className="px-5 py-3.5">{t('messages.last_activity', 'Last Activity')}</th>
                <th className="px-5 py-3.5 text-right">{t('messages.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {messageGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t('messages.no_messages', 'No messages found')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('messages.no_messages_desc', 'Try adjusting your search or filters to see more results.')}
                    </p>
                  </td>
                </tr>
              ) : (
                messageGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{group.houseTitle}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{group.houseLocation}</div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                      {group.name}
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      {group.contact}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-200">
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 font-semibold text-xs">
                        {group.messages.length}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {group.pendingCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                          <Clock className="w-3 h-3" />
                          {group.pendingCount} {t('messages.pending_badge', 'pending')}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {t('messages.all_responded', 'All responded')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(group.messages[group.messages.length - 1].createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setViewingGroup(group)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        title={t('messages.view_messages', 'View All Messages')}
                      >
                        <Eye className="w-4 h-4" />
                        <span>{t('action.view', 'View')}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Group Detail Modal */}
      {viewingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#112240] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700 shadow-2xl flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-800">
              <div className="min-w-0 pr-4">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {t('messages.conversation_with', 'Messages:')} {viewingGroup.houseTitle}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {t('messages.from', 'From:')} {viewingGroup.name} ({viewingGroup.contact})
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingGroup(null);
                  setEditingId('');
                  setResponseText('');
                }}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {/* Context Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                    {t('messages.property_info', 'Property Information')}
                  </span>
                  <p className="font-bold text-gray-900 dark:text-white">{viewingGroup.houseTitle}</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-0.5">{viewingGroup.houseLocation}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                    {t('messages.customer_info', 'Customer Information')}
                  </span>
                  <p className="font-bold text-gray-900 dark:text-white">{viewingGroup.name}</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-0.5">{viewingGroup.contact}</p>
                </div>
              </div>

              {/* Message List */}
              <div className="space-y-4">
                {viewingGroup.messages.map((message) => (
                  <div
                    key={message._id}
                    className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 space-y-3 relative transition-all"
                  >
                    {/* Delete Icon */}
                    <button
                      onClick={() => handleDelete(message._id)}
                      className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title={t('action.delete', 'Delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Customer Message Bubble */}
                    <div className="w-full sm:max-w-[85%] rounded-2xl bg-gray-50 dark:bg-slate-800/60 p-4 border border-gray-100 dark:border-slate-700/60 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {getSubjectLabel(message.subject)}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {message.message}
                      </p>
                      <div className="pt-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          message.status === 'pending'
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {message.status === 'pending' ? t('status.pending', 'Pending') : t('messages.responded', 'Responded')}
                        </span>
                      </div>
                    </div>

                    {/* Manager / Admin Response Section */}
                    {message.response ? (
                      <div className="w-full sm:max-w-[85%] ml-auto rounded-2xl bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-900/40 space-y-2">
                        {editingId === message._id ? (
                          <div className="space-y-3">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block">
                              {t('messages.edit_response', 'Edit Response')}
                            </span>
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                              className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={t('messages.type_response', 'Type your response here...')}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleResponseSubmit(message._id)}
                                disabled={submittingResponse}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                {t('action.save', 'Save')}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId('');
                                  setResponseText('');
                                }}
                                className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                {t('action.cancel', 'Cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t('messages.response', 'Response')}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400">
                                  {message.respondedAt && formatDate(message.respondedAt)}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingId(message._id);
                                    setResponseText(message.response || '');
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:opacity-80 p-1"
                                  title={t('messages.edit_response', 'Edit Response')}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                              {message.response}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full sm:max-w-[85%] ml-auto rounded-2xl p-4 border border-dashed border-gray-300 dark:border-slate-700">
                        {editingId === message._id ? (
                          <div className="space-y-3">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block">
                              {t('messages.add_response', 'Add Response')}
                            </span>
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                              className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={t('messages.type_response', 'Type your response here...')}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleResponseSubmit(message._id)}
                                disabled={submittingResponse}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                {t('action.submit', 'Submit')}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId('');
                                  setResponseText('');
                                }}
                                className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                {t('action.cancel', 'Cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-1">
                            <button
                              onClick={() => {
                                setEditingId(message._id);
                                setResponseText('');
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{t('messages.add_response', 'Add Response')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setViewingGroup(null);
                  setEditingId('');
                  setResponseText('');
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t('action.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Alerts */}
      {error && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-semibold shadow-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AdminMessagesPage;