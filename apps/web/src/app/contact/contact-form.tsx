'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Thanks for reaching out! We'll get back to you within 24 hours.");
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
              <Input required />
            </div>
            <div>
              <Label>Email or Phone</Label>
              <Input required />
            </div>
            <div>
              <Label>Message</Label>
              <textarea required className="w-full rounded-lg border border-input bg-background p-3 text-sm" rows={4} />
            </div>
            <Button type="submit" className="w-full">
              Send Message
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
