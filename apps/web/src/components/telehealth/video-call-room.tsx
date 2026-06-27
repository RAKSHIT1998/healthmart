'use client';

import { useEffect, useRef, useState } from 'react';
import type { ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCClient, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVideoToken } from '@/hooks/use-telehealth';

interface VideoCallRoomProps {
  appointmentId: string;
  callType: 'video' | 'audio';
  onLeave: () => void;
}

export function VideoCallRoom({ appointmentId, callType, onLeave }: VideoCallRoomProps) {
  const { data: tokenData, isLoading, error } = useVideoToken(appointmentId);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const tracksRef = useRef<{ audio?: IMicrophoneAudioTrack; video?: ICameraVideoTrack }>({});
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType === 'video');
  const [remoteJoined, setRemoteJoined] = useState(false);

  useEffect(() => {
    if (!tokenData) return;
    let cancelled = false;

    async function join() {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      if (cancelled) return;

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType) => {
        await client.subscribe(user, mediaType);
        setRemoteJoined(true);
        if (mediaType === 'video' && remoteVideoRef.current) {
          user.videoTrack?.play(remoteVideoRef.current);
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });
      client.on('user-unpublished', () => setRemoteJoined(false));

      await client.join(tokenData.appId, tokenData.channelName, tokenData.token, tokenData.uid);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      tracksRef.current.audio = audioTrack;
      const tracksToPublish: Array<IMicrophoneAudioTrack | ICameraVideoTrack> = [audioTrack];

      if (callType === 'video') {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        tracksRef.current.video = videoTrack;
        if (localVideoRef.current) videoTrack.play(localVideoRef.current);
        tracksToPublish.push(videoTrack);
      }

      await client.publish(tracksToPublish);
      if (!cancelled) setJoined(true);
    }

    join().catch(() => {
      // Surfaced via the `error` from useVideoToken / join failures below; nothing further to do here.
    });

    return () => {
      cancelled = true;
      tracksRef.current.audio?.close();
      tracksRef.current.video?.close();
      clientRef.current?.leave().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenData]);

  function toggleMic() {
    tracksRef.current.audio?.setEnabled(!micOn);
    setMicOn((v) => !v);
  }

  function toggleCam() {
    tracksRef.current.video?.setEnabled(!camOn);
    setCamOn((v) => !v);
  }

  async function leave() {
    tracksRef.current.audio?.close();
    tracksRef.current.video?.close();
    await clientRef.current?.leave().catch(() => {});
    onLeave();
  }

  if (isLoading) return <div className="flex h-96 items-center justify-center text-muted-foreground">Connecting...</div>;
  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <p>Unable to join the call. {(error as Error).message}</p>
        <Button variant="outline" onClick={onLeave}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-black">
      <div className="relative aspect-video w-full bg-neutral-900">
        <div ref={remoteVideoRef} className="h-full w-full" />
        {!remoteJoined && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Waiting for the other participant to join...
          </div>
        )}
        {callType === 'video' && (
          <div ref={localVideoRef} className="absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-lg border-2 border-white/30 bg-neutral-800" />
        )}
      </div>
      <div className="flex items-center justify-center gap-3 bg-neutral-950 p-4">
        <Button size="icon" variant={micOn ? 'secondary' : 'destructive'} onClick={toggleMic} disabled={!joined}>
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        {callType === 'video' && (
          <Button size="icon" variant={camOn ? 'secondary' : 'destructive'} onClick={toggleCam} disabled={!joined}>
            {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
        )}
        <Button size="icon" variant="destructive" onClick={leave}>
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
