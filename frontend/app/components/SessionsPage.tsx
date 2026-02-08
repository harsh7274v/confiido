"use client";

import React from "react";
import { Calendar, Clock, User, Star } from "lucide-react";

const mockSessions = [
  {
    id: "1",
    title: "Career Guidance Session",
    date: "2026-02-01",
    time: "10:00 AM",
    expert: "John Doe",
    status: "Completed",
    pointsEarned: 50,
  },
  {
    id: "2",
    title: "Resume Review",
    date: "2026-01-25",
    time: "2:00 PM",
    expert: "Jane Smith",
    status: "Upcoming",
    pointsEarned: 0,
  },
];

export default function SessionsPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-blue-600" />
            Sessions
          </h1>
          <p className="text-gray-600">View your upcoming and completed sessions. Earn points for every session!</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 flex flex-col gap-2 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-gray-900">{session.title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {session.date} at {session.time}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  Expert: {session.expert}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={session.status === "Completed" ? "text-green-600" : "text-blue-600"}>{session.status}</span>
                  {session.status === "Completed" && (
                    <span className="flex items-center gap-1 text-yellow-600">
                      <Star className="h-4 w-4" />
                      +{session.pointsEarned} points
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
