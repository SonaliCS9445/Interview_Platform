import {
  CallControls,
  CallingState,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Loader2Icon, MessageSquareIcon, UsersIcon, XIcon, CameraIcon, MicIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Channel, Chat, MessageInput, MessageList, Thread, Window } from "stream-chat-react";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";

function VideoCallUI({ chatClient, channel, cameraEnabled, micEnabled, enableMedia }) {
  const navigate = useNavigate();
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (callingState === CallingState.JOINING) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
          <p className="text-lg">Joining call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-3 relative str-video">
      <div className="flex-1 flex flex-col gap-3">
        {/* Participants count badge and Chat Toggle */}
        <div className="flex items-center justify-between gap-2 bg-base-100 p-3 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary" />
            <span className="font-semibold">
              {participantCount} {participantCount === 1 ? "participant" : "participants"}
            </span>
          </div>
          {chatClient && channel && (
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`btn btn-sm gap-2 ${isChatOpen ? "btn-primary" : "btn-ghost"}`}
              title={isChatOpen ? "Hide chat" : "Show chat"}
            >
              <MessageSquareIcon className="size-4" />
              Chat
            </button>
          )}
        </div>

        <div className="flex-1 bg-base-300 rounded-lg overflow-hidden relative">
          <SpeakerLayout />
        </div>

        <div className="bg-base-100 p-3 rounded-lg shadow flex flex-col gap-2">
          {/* Media status and retry */}
          {(!cameraEnabled || !micEnabled) && (
            <div className="flex items-center justify-between bg-warning/10 p-2 rounded">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-warning">⚠️</span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <CameraIcon className="size-4" />
                    <span className={cameraEnabled ? 'text-success font-semibold' : 'text-error'}>
                      Camera: {cameraEnabled ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MicIcon className="size-4" />
                    <span className={micEnabled ? 'text-success font-semibold' : 'text-error'}>
                      Microphone: {micEnabled ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={enableMedia}
                className="btn btn-sm btn-warning gap-1"
                title="Try to enable camera and microphone"
              >
                <RefreshCwIcon className="size-3" />
                Retry
              </button>
            </div>
          )}

          {cameraEnabled && micEnabled && (
            <div className="text-xs text-success text-center py-1">
              ✓ Camera and microphone enabled
            </div>
          )}

          <div className="flex justify-center">
            <CallControls onLeave={() => navigate("/dashboard")} />
          </div>
        </div>
      </div>

      {/* CHAT SECTION */}

      {chatClient && channel && (
        <div
          className={`flex flex-col rounded-lg shadow overflow-hidden bg-[#272a30] transition-all duration-300 ease-in-out ${
            isChatOpen ? "w-80 opacity-100" : "w-0 opacity-0"
          }`}
        >
          {isChatOpen && (
            <>
              <div className="bg-[#1c1e22] p-3 border-b border-[#3a3d44] flex items-center justify-between">
                <h3 className="font-semibold text-white">Session Chat</h3>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Close chat"
                >
                  <XIcon className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden stream-chat-dark">
                <Chat client={chatClient} theme="str-chat__theme-dark">
                  <Channel channel={channel}>
                    <Window>
                      <MessageList />
                      <MessageInput />
                    </Window>
                    <Thread />
                  </Channel>
                </Chat>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
export default VideoCallUI;