import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getWebRTCManager } from "@/lib/webrtc";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Monitor, 
  MessageCircle,
  X 
} from "lucide-react";

interface Participant {
  id: string;
  user: {
    id: string;
    fullName: string;
    role: string;
    profileImage?: string;
  };
}

interface VideoCallProps {
  noteId: string;
  participants: Participant[];
  onClose: () => void;
}

export default function VideoCall({ noteId, participants, onClose }: VideoCallProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManager = useRef(getWebRTCManager());
  const { toast } = useToast();

  useEffect(() => {
    initializeCall();
    
    return () => {
      webrtcManager.current.stopCall();
    };
  }, []);

  const initializeCall = async () => {
    try {
      setIsLoading(true);
      
      // Initialize local stream
      const stream = await webrtcManager.current.initializeLocalStream();
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Setup remote stream handlers
      webrtcManager.current.onRemoteStream((userId: string, stream: MediaStream) => {
        setRemoteStreams(prev => new Map(prev.set(userId, stream)));
      });

      webrtcManager.current.onRemoteStreamEnded((userId: string) => {
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      });

      toast({
        title: "Video call started",
        description: "You're now connected to the video discussion",
      });
    } catch (error: any) {
      toast({
        title: "Failed to start video call",
        description: error.message,
        variant: "destructive",
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAudio = () => {
    webrtcManager.current.toggleAudio();
    setIsAudioEnabled(!isAudioEnabled);
    
    toast({
      title: isAudioEnabled ? "Microphone muted" : "Microphone unmuted",
      description: `Your microphone is now ${isAudioEnabled ? 'off' : 'on'}`,
    });
  };

  const toggleVideo = () => {
    webrtcManager.current.toggleVideo();
    setIsVideoEnabled(!isVideoEnabled);
    
    toast({
      title: isVideoEnabled ? "Camera turned off" : "Camera turned on",
      description: `Your camera is now ${isVideoEnabled ? 'off' : 'on'}`,
    });
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await webrtcManager.current.startScreenShare();
      setIsScreenSharing(true);
      
      toast({
        title: "Screen sharing started",
        description: "Your screen is now being shared",
      });

      // Stop screen sharing when the stream ends
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        setIsScreenSharing(false);
        toast({
          title: "Screen sharing ended",
          description: "You've stopped sharing your screen",
        });
      });
    } catch (error: any) {
      toast({
        title: "Failed to share screen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const endCall = () => {
    webrtcManager.current.stopCall();
    toast({
      title: "Call ended",
      description: "You've left the video discussion",
    });
    onClose();
  };

  const RemoteVideo = ({ userId, stream }: { userId: string; stream: MediaStream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const participant = participants.find(p => p.user.id === userId);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    return (
      <div className="relative bg-gray-800 rounded-lg overflow-hidden video-participant">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {participant?.user.fullName || 'Unknown User'}
        </div>
        <div className="absolute top-2 right-2">
          <Mic className="text-white h-4 w-4" />
        </div>
        {participant?.user.role === 'teacher' && (
          <Badge className="absolute top-2 left-2 bg-primary text-white text-xs">
            Teacher
          </Badge>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Starting video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Video Call Header */}
        <CardHeader className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-heading text-lg font-bold text-edu-text-primary">
                Video Discussion
              </CardTitle>
              <p className="text-sm text-edu-text-secondary">
                Study Session • {participants.length + 1} participants
              </p>
            </div>
            <Button onClick={endCall} className="bg-red-500 text-white hover:bg-red-600">
              <PhoneOff className="mr-2 h-4 w-4" />
              End Call
            </Button>
          </div>
        </CardHeader>
        
        {/* Video Grid */}
        <CardContent className="p-4 bg-gray-900">
          <div className="video-grid h-96">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden video-participant">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-2xl">
                      {participants[0]?.user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You {isScreenSharing && '(Screen)'}
              </div>
              <div className="absolute top-2 right-2">
                {isAudioEnabled ? (
                  <Mic className="text-white h-4 w-4" />
                ) : (
                  <MicOff className="text-red-500 h-4 w-4" />
                )}
              </div>
            </div>
            
            {/* Remote Videos */}
            {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
              <RemoteVideo key={userId} userId={userId} stream={stream} />
            ))}
            
            {/* Placeholder for participants without video streams */}
            {participants.slice(0, 5).map((participant, index) => (
              <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden video-participant">
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={participant.user.profileImage} />
                    <AvatarFallback className="text-2xl">
                      {participant.user.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {participant.user.fullName}
                </div>
                <div className="absolute top-2 right-2">
                  <Mic className="text-white h-4 w-4" />
                </div>
                {participant.user.role === 'teacher' && (
                  <Badge className="absolute top-2 left-2 bg-primary text-white text-xs">
                    Teacher
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        
        {/* Video Controls */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-center space-x-4">
            <Button
              onClick={toggleAudio}
              variant={isAudioEnabled ? "default" : "destructive"}
              className="rounded-full p-3"
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            <Button
              onClick={toggleVideo}
              variant={isVideoEnabled ? "default" : "destructive"}
              className="rounded-full p-3"
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            
            <Button
              onClick={startScreenShare}
              variant={isScreenSharing ? "secondary" : "outline"}
              className="rounded-full p-3"
              disabled={isScreenSharing}
            >
              <Monitor className="h-5 w-5" />
            </Button>
            
            <Button variant="outline" className="rounded-full p-3">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
