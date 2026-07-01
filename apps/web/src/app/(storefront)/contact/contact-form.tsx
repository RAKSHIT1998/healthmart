'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api, ApiClientError } from '@/lib/api';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');

  const sendMessage = useMutation({
    mutationFn: () => api.post('/contact', { name, contact, message }, { auth: false }),
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Thanks for reaching out! We'll get back to you within 24 hours.");
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage.mutate();
  }

  return (
    <Card>
      <CardContent className="p-5">
        {submitted ? (
          <p className="text-sm text-muted-foreground">
            Thanks for reaching out! Our support team will respond within 24 hours.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email or Phone</Label>
              <Input required value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm"
                rows={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={sendMessage.isPending}>
              Send Message
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
