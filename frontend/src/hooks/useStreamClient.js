import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { initializeStreamClient, disconnectStreamClient } from "../lib/stream";
import { sessionApi } from "../api/sessions";

function useStreamClient(session, loadingSession, isHost, isParticipant) {
  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isInitializingCall, setIsInitializingCall] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);

  const enableMedia = async () => {
    if (!call) return;

    try {
      // Test permissions first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      stream.getTracks().forEach(track => track.stop());

      // Enable in call
      let cameraSuccess = false;
      let micSuccess = false;

      try {
        await call.camera.enable();
        cameraSuccess = true;
      } catch (cameraErr) {
        console.warn("Camera enable failed:", cameraErr);
      }

      try {
        await call.microphone.enable();
        micSuccess = true;
      } catch (micErr) {
        console.warn("Microphone enable failed:", micErr);
      }

      setCameraEnabled(cameraSuccess);
      setMicEnabled(micSuccess);

      if (cameraSuccess && micSuccess) {
        toast.success("Camera and microphone enabled!");
      } else if (cameraSuccess) {
        toast.success("Camera enabled (microphone unavailable)");
      } else if (micSuccess) {
        toast.success("Microphone enabled (camera unavailable)");
      }
    } catch (error) {
      console.error("Failed to enable media:", error);
      if (error.name === 'NotFoundError') {
        toast.error("No camera or microphone found.");
      } else if (error.name === 'NotAllowedError') {
        toast.error("Camera/microphone access denied. Please allow permissions.");
      } else if (error.name === 'NotReadableError') {
        toast.error("Camera/microphone in use by another app. Close other apps and try again.");
      } else {
        toast.error("Failed to enable camera/microphone.");
      }
    }
  };

  useEffect(() => {
    let videoCall = null;
    let chatClientInstance = null;

    const initCall = async () => {
      console.log("initCall called with session:", session, "isHost:", isHost, "isParticipant:", isParticipant);
      if (!session?.callId) {
        console.log("No callId, exiting");
        setIsInitializingCall(false);
        return;
      }
      if (!isHost && !isParticipant) {
        console.log("Not host or participant, exiting");
        setIsInitializingCall(false);
        return;
      }
      if (session.status === "completed") {
        console.log("Session completed, exiting");
        setIsInitializingCall(false);
        return;
      }

      try {
        const { token, userId, userName, userImage } = await sessionApi.getStreamToken();
        console.log("Stream token received:", { token: token.substring(0, 10) + "...", userId, userName });

        const client = await initializeStreamClient(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        );

        setStreamClient(client);
        console.log("Stream client initialized successfully");

        videoCall = client.call("default", session.callId);

        // Check available devices before trying to use them
        let hasAudio = false;
        let hasVideo = false;

        try {
          // First, enumerate available devices
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasAudioDevice = devices.some(device => device.kind === 'audioinput');
          const hasVideoDevice = devices.some(device => device.kind === 'videoinput');

          console.log("Available devices:", { hasAudioDevice, hasVideoDevice });

          // Try to request user media only if devices are available
          if (hasVideoDevice && hasAudioDevice) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
              });
              stream.getTracks().forEach(track => track.stop());
              hasVideo = true;
              hasAudio = true;
            } catch (error) {
              console.warn("getUserMedia failed even with devices available:", error);
              // Devices exist but getUserMedia failed - might be permission issue
              // Try audio only
              if (hasAudioDevice) {
                try {
                  const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  audioStream.getTracks().forEach(track => track.stop());
                  hasAudio = true;
                } catch (e) {
                  console.warn("Audio getUserMedia also failed:", e);
                }
              }
            }
          } else if (hasAudioDevice) {
            // Only audio device available
            try {
              const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              audioStream.getTracks().forEach(track => track.stop());
              hasAudio = true;
            } catch (error) {
              console.warn("Audio getUserMedia failed:", error);
            }
          }

          // Only enable devices if we successfully got access to them
          if (hasVideo) {
            try {
              await videoCall.camera.enable();
              setCameraEnabled(true);
              console.log("Camera enabled");
            } catch (cameraError) {
              console.warn("Failed to enable camera:", cameraError);
              setCameraEnabled(false);
            }
          } else {
            // Disable camera in the call if not available
            try {
              await videoCall.camera.disable();
              setCameraEnabled(false);
            } catch (e) {
              console.warn("Failed to disable camera:", e);
            }
          }

          if (hasAudio) {
            try {
              await videoCall.microphone.enable();
              setMicEnabled(true);
              console.log("Microphone enabled");
            } catch (micError) {
              console.warn("Failed to enable microphone:", micError);
              setMicEnabled(false);
            }
          } else {
            // Disable microphone in the call if not available
            try {
              await videoCall.microphone.disable();
              setMicEnabled(false);
            } catch (e) {
              console.warn("Failed to disable microphone:", e);
            }
          }

          if (!hasVideo && !hasAudio) {
            toast.error("No audio or video devices found. You will join without media.");
          } else if (!hasVideo) {
            toast("📹 Camera not found - joining with audio only");
          } else if (!hasAudio) {
            toast("🎤 Microphone not found - joining with video only");
          }
        } catch (error) {
          console.error("Device enumeration or setup failed:", error);
          toast.error("Could not setup media devices. Joining without audio/video.");
          // Disable both devices if enumeration fails
          try {
            await videoCall.camera.disable();
            await videoCall.microphone.disable();
            setCameraEnabled(false);
            setMicEnabled(false);
          } catch (e) {
            console.warn("Error disabling devices:", e);
          }
        }

        console.log("Joining call with callId:", session.callId);
        await videoCall.join();
        console.log("Successfully joined call");
        setCall(videoCall);

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        chatClientInstance = StreamChat.getInstance(apiKey);

        await chatClientInstance.connectUser(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        );
        setChatClient(chatClientInstance);

        const chatChannel = chatClientInstance.channel("messaging", session.callId);
        await chatChannel.watch();
        setChannel(chatChannel);
      } catch (error) {
        console.error("Error init call:", error);
        toast.error("Failed to join video call");
      } finally {
        setIsInitializingCall(false);
      }
    };

    if (session && !loadingSession) {
      setIsInitializingCall(true);
      initCall();
    }

    // cleanup - performance reasons
    return () => {
      // iife
      (async () => {
        try {
          if (videoCall) await videoCall.leave();
          if (chatClientInstance) await chatClientInstance.disconnectUser();
          await disconnectStreamClient();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      })();
    };
  }, [session, loadingSession, isHost, isParticipant]);

  return {
    streamClient,
    call,
    chatClient,
    channel,
    isInitializingCall,
    cameraEnabled,
    micEnabled,
    enableMedia,
  };
}

export default useStreamClient;