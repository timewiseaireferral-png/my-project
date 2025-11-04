/**
 * Debug component to verify Coach in Writing buddy events are working
 * Copy to: src/components/CoachDebugger.tsx
 */
import React, { useState, useEffect } from 'react';
import { eventBus } from '../lib/eventBus';

export function CoachDebugger() {
  const [events, setEvents] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (data: any) => {
      console.log("Debug: paragraph.ready event received:", data);
      setEvents(prev => [...prev.slice(-4), { // Keep last 5 events
        timestamp: new Date().toLocaleTimeString(),
        data
      }]);
    };

    eventBus.on("paragraph.ready", handler);
    return () => eventBus.off("paragraph.ready", handler);
  }, []);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-xs z-50"
      >
        Debug Coach
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-3 shadow-lg max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Coach Events</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-gray-500">No events yet... Start typing!</div>
        ) : (
          events.map((event, i) => (
            <div key={i} className="border-b pb-1">
              <div className="font-mono text-gray-600">{event.timestamp}</div>
              <div className="text-gray-800">
                Words: {event.data.wordCount || 'N/A'} | 
                Trigger: {event.data.trigger || 'default'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                "{event.data.paragraph?.slice(0, 30)}..."
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-2 pt-2 border-t text-xs text-gray-500">
        Total events: {events.length}
      </div>
    </div>
  );
}
