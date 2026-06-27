'use client';

import { useState } from 'react';
import { Navigation, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';
import {
  useMyDeliveries,
  useResendDeliveryOtp,
  useToggleAvailability,
  useUpdateMyLocation,
  useVerifyDeliveryOtp,
} from '@/hooks/use-deliveries';

export default function DeliveriesPage() {
  const { data, isLoading } = useMyDeliveries();
  const toggleAvailability = useToggleAvailability();
  const updateLocation = useUpdateMyLocation();
  const verifyOtp = useVerifyDeliveryOtp();
  const resendOtp = useResendDeliveryOtp();
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [isAvailable, setIsAvailable] = useState(true);

  function shareLocation() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      updateLocation.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Deliveries</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={shareLocation}>
            <Navigation className="h-4 w-4" /> Share Location
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm">Available</span>
            <Switch
              checked={isAvailable}
              onCheckedChange={(v) => {
                setIsAvailable(v);
                toggleAvailability.mutate(v);
              }}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders assigned to you right now.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.items.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">#{order.orderNumber}</span>
                  <Badge variant="warning">{order.status.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{order.items.length} item(s) · {formatCurrency(order.totalAmount)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{order.paymentMethod === 'cod' ? 'Collect cash on delivery' : 'Paid online'}</p>

                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Delivery OTP"
                    value={otpInputs[order.id] ?? ''}
                    onChange={(e) => setOtpInputs({ ...otpInputs, [order.id]: e.target.value })}
                    maxLength={6}
                  />
                  <Button
                    size="sm"
                    onClick={() => verifyOtp.mutate({ orderId: order.id, otp: otpInputs[order.id] ?? '' })}
                    disabled={verifyOtp.isPending}
                  >
                    Confirm
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => resendOtp.mutate(order.id)} title="Resend OTP">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
