'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Stethoscope, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useDoctors } from '@/hooks/use-telehealth';

const SPECIALIZATIONS = ['All', 'General Physician', 'Pediatrician', 'Dermatologist', 'Gynecologist', 'Psychiatrist'];

export function DoctorsListClient() {
  const [specialization, setSpecialization] = useState('All');
  const { data: doctors, isLoading } = useDoctors(specialization === 'All' ? undefined : specialization);

  return (
    <div>
      <div className="mt-6 flex flex-wrap gap-2">
        {SPECIALIZATIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSpecialization(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              specialization === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading doctors...</p>
      ) : !doctors || doctors.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No doctors available right now. Please check back soon.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <Link key={doctor.id} href={`/doctors/${doctor.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                      {doctor.profileImage ? (
                        <Image src={doctor.profileImage} alt="" fill className="object-cover" />
                      ) : (
                        <Stethoscope className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        Dr. {typeof doctor.userId === 'object' ? doctor.userId.name : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{doctor.qualification} · {doctor.experienceYears} yrs experience</p>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {doctor.rating.toFixed(1)}
                    <span className="text-muted-foreground">· {doctor.totalConsultations} consultations</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="secondary">
                      <Video className="mr-1 h-3 w-3" /> {formatCurrency(doctor.consultationFee)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
