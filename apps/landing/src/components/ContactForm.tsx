import React, { useState } from 'react';
import { supabase } from '@tripslip/database';

interface ContactFormData {
  name: string;
  email: string;
  organization: string;
  message: string;
}

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    organization: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'contact@tripslip.com',
          subject: `Contact Form: ${formData.name} from ${formData.organization}`,
          template: 'contact-form',
          data: formData,
        },
      });

      if (error) throw error;

      setStatus({ type: 'success', message: 'Thank you! We\'ll get back to you soon.' });
      setFormData({ name: '', email: '', organization: '', message: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <label htmlFor="name" className="block text-sm font-jakarta font-medium text-gray-700 mb-2">
          Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tripslip-blue focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-jakarta font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tripslip-blue focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="organization" className="block text-sm font-jakarta font-medium text-gray-700 mb-2">
          Organization *
        </label>
        <input
          type="text"
          id="organization"
          required
          value={formData.organization}
          onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tripslip-blue focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-jakarta font-medium text-gray-700 mb-2">
          Message *
        </label>
        <textarea
          id="message"
          required
          rows={6}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tripslip-blue focus:border-transparent"
        />
      </div>

      {status && (
        <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {status.message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-8 py-4 bg-tripslip-yellow text-black rounded-lg hover:bg-yellow-400 transition-all shadow-offset hover:shadow-offset-lg disabled:opacity-50 disabled:cursor-not-allowed font-jakarta font-semibold text-lg"
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
};
