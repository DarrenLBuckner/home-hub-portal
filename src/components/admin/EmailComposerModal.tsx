'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { replacePlaceholders, AVAILABLE_PLACEHOLDERS, UserContext } from '@/lib/email/templateReplacer';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  account_code?: string;
  user_type?: string;
  company?: string;
  phone?: string;
  country_id?: string;
  subscription_status?: string;
  property_count?: number;
  created_at?: string;
}

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: User;
  adminEmail: string;
}

const EmailComposerModal: React.FC<EmailComposerModalProps> = ({
  isOpen,
  onClose,
  recipient,
  adminEmail,
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Convert user to context for placeholder replacement
  const userContext: UserContext = {
    firstName: recipient.first_name || '',
    lastName: recipient.last_name || '',
    email: recipient.email || '',
    accountCode: recipient.account_code || '',
    userType: recipient.user_type || '',
    company: recipient.company || '',
    phone: recipient.phone || '',
    countryId: recipient.country_id || '',
    subscriptionStatus: recipient.subscription_status || '',
    propertyCount: recipient.property_count ?? 0,
    createdAt: recipient.created_at || '',
  };

  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      // Reset state when opening
      setSubject('');
      setBody('');
      setSelectedTemplateId('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await fetch('/api/admin/email-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        console.error('Failed to load templates');
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [templates]);

  const getPreviewText = (text: string) => {
    return replacePlaceholders(text, userContext);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          recipientName: `${recipient.first_name} ${recipient.last_name}`.trim(),
          subject: getPreviewText(subject),
          body: getPreviewText(body),
          templateId: selectedTemplateId || null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to send email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    // Insert at cursor position or append to body
    setBody(prev => prev + placeholder);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Compose Email</h2>
            <p className="text-sm text-gray-600 mt-1">
              To: <span className="font-medium">{recipient.first_name} {recipient.last_name}</span> ({recipient.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={sending}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">Email Sent Successfully!</h3>
              <p className="text-gray-600">
                Your email to {recipient.first_name} {recipient.last_name} has been sent.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template (Optional)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingTemplates}
                >
                  <option value="">
                    {loadingTemplates ? 'Loading templates...' : '-- Select a template or write custom --'}
                  </option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      [{template.category}] {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message here... You can use placeholders like {{first_name}}"
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Placeholder Reference */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Available Placeholders</h4>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PLACEHOLDERS.map(({ placeholder, description }) => (
                    <button
                      key={placeholder}
                      type="button"
                      onClick={() => insertPlaceholder(placeholder)}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      title={description}
                    >
                      {placeholder}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-100 border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-1">Preview</h4>
                <p className="text-xs text-gray-500 mb-3">This is what the recipient will see:</p>
                <hr className="border-gray-300 mb-3" />

                {!subject.trim() && !body.trim() ? (
                  <p className="text-sm text-gray-400 italic">Enter a subject and message to see preview</p>
                ) : (
                  <div className="space-y-3">
                    {/* Subject Preview */}
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject:</span>
                      {subject.trim() ? (
                        <p className="text-sm text-gray-800 mt-1">{getPreviewText(subject)}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic mt-1">Enter a subject to see preview</p>
                      )}
                    </div>

                    {/* Body Preview */}
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message:</span>
                      {body.trim() ? (
                        <div className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{getPreviewText(body)}</div>
                      ) : (
                        <p className="text-sm text-gray-400 italic mt-1">Enter a message to see preview</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Sending from: info@portalhomehub.com
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !subject.trim() || !body.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📧</span>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailComposerModal;
