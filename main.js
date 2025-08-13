import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Download, Chrome, Eye, MessageSquare } from "lucide-react";

export default function ExtensionGuide() {
  const extensionManifest = {
    "manifest_version": 3,
    "name": "ZoomWatch Camera Monitor",
    "version": "1.0",
    "description": "Monitor camera status in Zoom meetings",
    "permissions": [
      "activeTab",
      "storage",
      "tabs"
    ],
    "host_permissions": [
      "https://*.zoom.us/*"
    ],
    "content_scripts": [{
      "matches": ["https://*.zoom.us/*"],
      "js": ["content.js"],
      "css": ["styles.css"]
    }],
    "background": {
      "service_worker": "background.js"
    },
    "action": {
      "default_popup": "popup.html"
    }
  };

  const contentScript = `
// This script runs inside the Zoom web client
(function() {
    let lastParticipantState = {};
    
    function monitorParticipants() {
        // Find participant list in Zoom's DOM
        const participantElements = document.querySelectorAll('[data-testid="participant-item"]');
        const currentState = {};
        
        participantElements.forEach(participant => {
            const nameEl = participant.querySelector('[data-testid="participant-name"]');
            const videoEl = participant.querySelector('[data-testid="video-avatar"]');
            
            if (nameEl) {
                const name = nameEl.textContent.trim();
                const hasCamera = !participant.querySelector('.video-avatar--off');
                
                currentState[name] = {
                    name: name,
                    camera: hasCamera ? 'on' : 'off',
                    timestamp: Date.now()
                };
                
                // Detect camera status change
                if (lastParticipantState[name] && 
                    lastParticipantState[name].camera !== currentState[name].camera) {
                    
                    // Send data to our app
                    window.postMessage({
                        type: 'ZOOM_PARTICIPANT_UPDATE',
                        data: currentState[name]
                    }, '*');
                    
                    // If camera went off, prepare to send message
                    if (currentState[name].camera === 'off') {
                        setTimeout(() => sendCameraReminder(name), 45000);
                    }
                }
            }
        });
        
        lastParticipantState = currentState;
    }
    
    function sendCameraReminder(participantName) {
        // Find chat input and send message
        const chatInput = document.querySelector('[data-testid="chat-input"]');
        if (chatInput) {
            const message = \`@\${participantName} Please turn your camera on for better engagement! 📹\`;
            chatInput.value = message;
            
            // Trigger send button
            const sendBtn = document.querySelector('[data-testid="chat-send-button"]');
            if (sendBtn) {
                sendBtn.click();
            }
        }
    }
    
    // Monitor every 3 seconds
    setInterval(monitorParticipants, 3000);
    
    // Initial scan
    setTimeout(monitorParticipants, 5000);
})();`;

  return (
    <div className="space-y-6">
      <Alert className="border-green-200 bg-green-50">
        <Chrome className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Real Solution Found!</strong> Browser extension can actually monitor and interact with live Zoom meetings.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Chrome className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">1. Browser Extension</h3>
              <p className="text-sm text-slate-600">Runs inside Zoom web client</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Eye className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold">2. DOM Monitoring</h3>
              <p className="text-sm text-slate-600">Watches participant camera status</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-semibold">3. Auto Messages</h3>
              <p className="text-sm text-slate-600">Sends reminders via Zoom chat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extension Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">manifest.json</h4>
              <pre className="bg-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
{JSON.stringify(extensionManifest, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">content.js</h4>
              <pre className="bg-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
{contentScript}
              </pre>
            </div>
          </div>
          <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Download Extension Files
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}